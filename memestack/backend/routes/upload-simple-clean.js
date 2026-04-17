// 📤 Upload routes
// Accepts image uploads (memes + avatars) and persists them to Cloudinary
// when the service is configured, falling back to local disk in dev so the
// site still works without Cloudinary creds.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { protect } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

// ---- multer (memory storage; we process buffers ourselves) ------------

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
        cb(ok ? null : new Error('Only JPEG, PNG, GIF, or WebP images are allowed.'), ok);
    },
});

// ---- shared upload pipeline -------------------------------------------

const isCloudinaryConfigured = () =>
    !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const localDiskFallback = async (buffer, { folder, filename }) => {
    // Only used in local development. Writes to backend/uploads/<folder>/<filename>
    // and returns a public URL relative to the running server.
    const dir = path.join(__dirname, '..', 'uploads', folder);
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    await fs.writeFile(fullPath, buffer);
    const host = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return {
        url: `${host}/uploads/${folder}/${filename}`,
        public_id: `local/${folder}/${filename}`,
        width: null,
        height: null,
        bytes: buffer.length,
        provider: 'local',
    };
};

/**
 * Process a raw image buffer: resize/optimize with sharp, then upload to
 * Cloudinary (or disk in dev).
 *
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {'memes'|'avatars'} opts.folder
 * @param {{width:number,height:number,fit?:string}} opts.resize
 * @returns {Promise<{url:string, public_id:string, width:number|null, height:number|null, bytes:number, provider:string}>}
 */
const processAndUpload = async (buffer, { folder, resize }) => {
    const processed = await sharp(buffer)
        .rotate() // honor EXIF orientation
        .resize(resize.width, resize.height, {
            fit: resize.fit || 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

    if (isCloudinaryConfigured()) {
        const result = await uploadToCloudinary(processed, {
            folder: `memestack/${folder}`,
            resource_type: 'image',
        });
        return {
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            provider: 'cloudinary',
        };
    }

    const filename = `${uuidv4()}.jpg`;
    return localDiskFallback(processed, { folder, filename });
};

// ---- routes -----------------------------------------------------------

// Health check for the upload subsystem (no auth needed)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            cloudinary: isCloudinaryConfigured() ? 'configured' : 'fallback-local-disk',
            maxFileSizeMB: 10,
            allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        },
    });
});

// Legacy compatibility: `/simple` is the same as `/meme` but echoes file metadata.
router.post('/simple', protect, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const result = await processAndUpload(req.file.buffer, {
            folder: 'memes',
            resize: { width: 1200, height: 1200, fit: 'inside' },
        });
        res.json({
            success: true,
            message: 'File uploaded',
            data: {
                ...result,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
            },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/upload/meme — simple liveness probe kept for legacy clients.
router.get('/meme', (req, res) => {
    res.json({ success: true, message: 'Meme upload endpoint ready' });
});

// POST /api/upload/meme — upload a meme image (field name: `meme` or `file`).
router.post(
    '/meme',
    protect,
    (req, res, next) => {
        // accept either field name — frontend versions differ
        const handler = upload.fields([{ name: 'meme', maxCount: 1 }, { name: 'file', maxCount: 1 }]);
        handler(req, res, next);
    },
    async (req, res, next) => {
        try {
            const file = (req.files?.meme?.[0]) || (req.files?.file?.[0]);
            if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

            const result = await processAndUpload(file.buffer, {
                folder: 'memes',
                resize: { width: 1200, height: 1200, fit: 'inside' },
            });

            res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                data: {
                    ...result,
                    originalName: file.originalname,
                    mimetype: file.mimetype,
                },
            });
        } catch (err) {
            next(err);
        }
    },
);

// POST /api/upload/avatar — upload a profile picture (square 256×256).
router.post('/avatar', protect, upload.single('avatar'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No avatar file uploaded' });

        const result = await processAndUpload(req.file.buffer, {
            folder: 'avatars',
            resize: { width: 256, height: 256, fit: 'cover' },
        });

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                ...result,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
            },
        });
    } catch (err) {
        next(err);
    }
});

// Multer errors turn into structured JSON responses instead of HTML
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err?.message?.includes('image')) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

module.exports = router;
