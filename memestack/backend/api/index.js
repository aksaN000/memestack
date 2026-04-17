// Vercel serverless entry point.
// This file is picked up by Vercel's Node.js runtime (any file under /api
// becomes a serverless function). We re-export the Express app from
// ../server.js — crucially, server.js only calls app.listen() when run
// directly via `node server.js`, so importing it here does NOT boot a
// second HTTP listener.

module.exports = require('../server');
