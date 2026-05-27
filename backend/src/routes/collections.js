const express = require('express');
const router = express.Router();
const collectionCtrl = require('../controllers/collectionController');
const authMiddleware = require('../middleware/auth');

router.get ('/', authMiddleware, collectionCtrl.getAll);
router.get('/:id', authMiddleware, collectionCtrl.getOne);
router.post ('/', authMiddleware, collectionCtrl.create);
router.put ('/:id', authMiddleware, collectionCtrl.update);
router.delete ('/:id', authMiddleware, collectionCtrl.remove);
router.post ('/:id/recipes/:recipeId', authMiddleware, collectionCtrl.addRecipe);
router.delete ('/:id/recipes/:recipeId', authMiddleware, collectionCtrl.removeRecipe);

module.exports = router;
