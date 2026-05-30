const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAlmacenAlerts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        lots: true
      }
    });

    let lowStockCount = 0;
    const lowStockProducts = [];

    products.forEach(prod => {
      const minStock = parseFloat(prod.minStock) || 0;
      if (minStock > 0) {
        const totalStock = prod.lots.reduce((sum, lot) => sum + parseFloat(lot.quantity || 0), 0);
        if (totalStock <= minStock) {
          lowStockCount++;
          lowStockProducts.push({
            id: prod.id,
            description: prod.description,
            category: prod.category,
            totalStock,
            minStock,
            status: totalStock < minStock ? 'CRITICO' : 'PRECAUCION'
          });
        }
      }
    });

    res.json({
      lowStockCount,
      lowStockProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching dashboard alerts" });
  }
};

module.exports = {
  getAlmacenAlerts
};
