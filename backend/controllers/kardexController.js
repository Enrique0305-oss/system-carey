const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getKardex = async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        product: {
          select: {
            description: true,
            sku: true,
            category: true,
            unit: true
          }
        },
        lot: {
          select: {
            lotCode: true
          }
        }
      }
    });

    res.json(movements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching kardex movements" });
  }
};

module.exports = {
  getKardex
};
