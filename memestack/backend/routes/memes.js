// 🛣️ Meme Routes
// All static / literal-path routes are declared before any /:id route so
// Express doesn't accidentally swallow them into the param route.

const express = require('express');
const router = express.Router();

const { protect, optionalAuth } = require('../middleware/auth');

const {
    // Gallery & Browsing
    getAllMemes,
    getTrendingMemes,
    getMemesByCategory,
    getMemeById,

    // CRUD
    createMeme,
    updateMeme,
    deleteMeme,

    // Social
    toggleLikeMeme,
    shareMeme,

    // Collections
    getMyMemes,
    getUserMemes,

    // Download
    downloadMeme,

    // Stats
    getMemeStats,
} = require('../controllers/memeController');

// ========================================
// PUBLIC — literal paths first
// ========================================

// GET /api/memes?page=…&limit=…&category=…&sortBy=…&sortOrder=…&search=…&tags=…
router.get('/', optionalAuth, getAllMemes);

// GET /api/memes/trending?limit=10
router.get('/trending', optionalAuth, getTrendingMemes);

// GET /api/memes/stats
router.get('/stats', getMemeStats);

// GET /api/memes/category/:category
router.get('/category/:category', optionalAuth, getMemesByCategory);

// GET /api/memes/user/:userId
router.get('/user/:userId', optionalAuth, getUserMemes);

// ========================================
// PROTECTED — literal paths
// ========================================

// GET /api/memes/my-memes?includePrivate=true
router.get('/my-memes', protect, getMyMemes);

// POST /api/memes — create a new meme
router.post('/', protect, createMeme);

// ========================================
// ROUTES WITH :id
// ========================================

// GET /api/memes/:id — fetch a single meme
router.get('/:id', optionalAuth, getMemeById);

// GET /api/memes/:id/download — download the image
router.get('/:id/download', optionalAuth, downloadMeme);

// POST /api/memes/:id/share — increment share count (auth required so
// anonymous bots can't inflate counters)
router.post('/:id/share', protect, shareMeme);

// POST /api/memes/:id/like — toggle like
router.post('/:id/like', protect, toggleLikeMeme);

// PUT /api/memes/:id — update (owner only, enforced in controller)
router.put('/:id', protect, updateMeme);

// DELETE /api/memes/:id — soft delete (owner only, enforced in controller)
router.delete('/:id', protect, deleteMeme);

module.exports = router;
