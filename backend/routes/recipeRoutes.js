const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

router.get('/:productId/recipe', recipeController.getRecipe);
router.post('/:productId/recipe', recipeController.saveRecipe);

module.exports = router;
