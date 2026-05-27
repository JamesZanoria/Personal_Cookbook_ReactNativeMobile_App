const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadCtrl = require('../controllers/uploadController');

// POST image
router.post('/image', authMiddleware, upload.single('image'), uploadCtrl.uploadImage);

module.exports = router;
