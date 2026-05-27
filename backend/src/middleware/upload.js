const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination(_req, _file, cb){
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename(_req, file, cb){
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = crypto.randomBytes(16).toString('hex');
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if(allowed.includes(file.mimetype)){
        cb(null, true);
    } else{
        cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;