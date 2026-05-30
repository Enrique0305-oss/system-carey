const prisma = require('../database/connection');

const getAlmacenes = async (req, res) => {
  try {
    const almacenes = await prisma.warehouse.findMany();
    res.json(almacenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener almacenes' });
  }
};

module.exports = {
  getAlmacenes
};
