const express        = require('express');
const router         = express.Router();
const recipeCtrl     = require('../controllers/recipeController');
const authMiddleware = require('../middleware/auth');

// Optional auth
const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch { /* ignore */ }
  }
  next();
};

// Public / optional-auth routes
router.get('/', optionalAuth, recipeCtrl.getAll);
router.get('/filter/by-ingredients', optionalAuth, recipeCtrl.getByIngredients)
router.get('/saved', authMiddleware, recipeCtrl.getSaved);
router.get('/:id', optionalAuth, recipeCtrl.getOne);

// Protected routes
router.post('/', authMiddleware, recipeCtrl.create);
router.put('/:id', authMiddleware, recipeCtrl.update);
router.delete('/:id', authMiddleware, recipeCtrl.remove);
router.post('/:id/save', authMiddleware, recipeCtrl.toggleSave);
router.post('/:id/reviews', authMiddleware, recipeCtrl.addReview);
router.post('/:id/like', authMiddleware, recipeCtrl.toggleLike);

module.exports = router;