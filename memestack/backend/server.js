// 🚀 MemeStack Backend Server
// Entry point for local development (`npm run dev`) and the Vercel
// serverless handler alike. The Express app itself is exported so
// `api/index.js` (serverless entry) can wrap it without booting another
// HTTP listener on Vercel.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// ========================================
// ENV VALIDATION (fail-fast in production)
// ========================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// JWT_SECRET is load-bearing — without it tokens are forgeable.
if (!process.env.JWT_SECRET) {
    if (isProd) {
        console.error('❌ FATAL: JWT_SECRET is not set. Refusing to start in production.');
        process.exit(1);
    } else {
        console.warn('⚠️  JWT_SECRET is not set. Using an insecure dev fallback. Do NOT deploy without setting it.');
        process.env.JWT_SECRET = 'dev-only-insecure-secret-please-override-me';
    }
} else if (isProd && process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
}

// MONGODB_URI must exist in production — no in-memory fallback.
if (isProd && !process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is required in production. Refusing to start.');
    process.exit(1);
}

// Create Express application instance
const app = express();

// Get port from environment variables or default to 5000
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE SETUP
// ========================================

// Trust proxy (needed for accurate IPs on Vercel, Render, etc.)
app.set('trust proxy', 1);

// Security headers (applied in every env)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// CORS — accept a comma-separated list of allowed origins in prod.
// CLIENT_URL may be "https://a.com,https://b.com" for multi-origin setups.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // allow same-origin (no origin header) and explicit allowlist
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        // Allow *.vercel.app preview deployments if any allowed origin is vercel.app
        if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON + URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dev-only request logging
if (!isProd) {
    app.use((req, res, next) => {
        console.log(`🌐 ${req.method} ${req.originalUrl}`);
        next();
    });
}

// Serve static files from uploads directory (dev only — on Vercel this
// directory is ephemeral and all uploads should go to Cloudinary)
if (!isProd) {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ========================================
// DATABASE CONNECTION (serverless-safe)
// ========================================

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    // --- Atlas / hosted MongoDB ---
    if (process.env.MONGODB_URI) {
        console.log('🌐 Connecting to MongoDB via MONGODB_URI…');
        cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB connected: ${mongoose.connection.host} · db: ${mongoose.connection.name}`);
        return cachedConnection;
    }

    // --- In-memory fallback — DEVELOPMENT ONLY ---
    if (!isProd) {
        console.log('🧪 No MONGODB_URI found — spinning up an in-memory Mongo for local dev.');
        console.log('💡 Data will not persist between restarts.');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = new MongoMemoryServer({ instance: { dbName: 'memestack' } });
        await mongod.start();
        cachedConnection = await mongoose.connect(mongod.getUri());
        global.__mongodMemoryServer = mongod;

        // seed demo data so the UI isn't empty on first boot
        try {
            const { createTestData } = require('./utils/testData');
            await createTestData();
        } catch (err) {
            console.warn('⚠️  Demo-data seeding skipped:', err.message);
        }
        return cachedConnection;
    }

    // Should never reach here — env validation above would have exited.
    throw new Error('MONGODB_URI is required in production.');
};

// ========================================
// ROUTES SETUP
// ========================================

// Root + health check
app.get('/', (req, res) => {
    res.json({
        name: 'MemeStack API',
        status: 'ok',
        version: '1.1.0',
        docs: '/api/health',
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: '1.1.0',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        },
    });
});

// Mount feature routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/memes', require('./routes/memes'));
app.use('/api/upload', require('./routes/upload-simple-clean'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/follows', require('./routes/follows'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/collaborations', require('./routes/collaborations'));

// ========================================
// ERROR HANDLING
// ========================================

// 404 for unmatched paths
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// Global error handler
app.use((error, req, res, next) => {
    const status = error.status || error.statusCode || 500;

    if (!isProd) {
        console.error('❌ Error:', error.message);
        if (error.stack) console.error(error.stack);
    } else {
        console.error('Production error:', {
            message: error.message,
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
        });
    }

    res.status(status).json({
        success: false,
        message: isProd && status >= 500 ? 'Internal server error' : error.message,
        ...(isProd ? {} : { stack: error.stack }),
    });
});

// ========================================
// SERVERLESS-AWARE BOOT
// ========================================

// On Vercel / any FaaS, we do NOT call app.listen — the platform handles
// the HTTP socket for us. But we do need the DB connected before the
// first request. We kick off the connection eagerly and also gate every
// request on it completing (cached after the first call).

const connectionPromise = connectDB().catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    if (isProd) process.exit(1);
});

// Ensure DB is connected before each request (serverless-safe, cheap once cached)
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectionPromise;
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Only start an HTTP listener when run directly (`node server.js`).
// On Vercel, `api/index.js` imports this module and never triggers listen().
if (require.main === module) {
    connectionPromise.then(() => {
        const server = app.listen(PORT, () => {
            console.log('\n🎉 ===================================');
            console.log(`🚀 MemeStack server listening on :${PORT}`);
            console.log(`🌍 Environment: ${NODE_ENV}`);
            console.log(`📋 Health: http://localhost:${PORT}/api/health`);
            console.log('🎉 ===================================\n');
        });

        const shutdown = async () => {
            console.log('\n🔄 Shutting down gracefully…');
            server.close(() => console.log('✅ HTTP server closed'));
            try {
                await mongoose.connection.close();
                console.log('✅ Database connection closed');
            } catch (err) {
                console.error('⚠️  Error closing DB:', err.message);
            }
            if (global.__mongodMemoryServer) {
                await global.__mongodMemoryServer.stop();
                console.log('✅ In-memory Mongo stopped');
            }
            process.exit(0);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    });
}

module.exports = app;
