const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getRecipe = async (req, res) => {
  const { productId } = req.params;
  try {
    const recipe = await prisma.productRecipe.findUnique({
      where: { finalProductId: productId },
      include: {
        items: {
          include: {
            inputProduct: true
          }
        }
      }
    });
    res.json(recipe || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveRecipe = async (req, res) => {
  const { productId } = req.params;
  const { items } = req.body; // array of { inputId, quantity }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find existing recipe
      let recipe = await tx.productRecipe.findUnique({
        where: { finalProductId: productId }
      });

      if (!recipe) {
        recipe = await tx.productRecipe.create({
          data: { finalProductId: productId }
        });
      } else {
        // Delete old items
        await tx.productRecipeItem.deleteMany({
          where: { recipeId: recipe.id }
        });
      }

      // Insert new items
      if (items && items.length > 0) {
        await tx.productRecipeItem.createMany({
          data: items.map(item => ({
            recipeId: recipe.id,
            inputId: item.inputId,
            quantity: parseFloat(item.quantity)
          }))
        });
      }

      return recipe;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRecipe,
  saveRecipe
};
