// src/routes/search.js
const express = require('express');
const router  = express.Router();
const jwt = require('jsonwebtoken');
const { searchByIngredients } = require('../controllers/searchController');

// Optional auth: if a valid token is present attach req.user so
// is_saved flags work for logged-in users; non-authed requests still work.
const optionalAuth = (req, _res, next) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        try {
            const token = header.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Log the error for debugging, but do NOT send a 401.
            // Just treat the user as a guest.
            console.log('[OptionalAuth] Invalid or expired token, treating as guest');
        }
    }
    next();
};

// GET /api/search/by-ingredients?ingredients=chicken,garlic&page=1&limit=12
router.get('/by-ingredients', optionalAuth, searchByIngredients);

module.exports = router;