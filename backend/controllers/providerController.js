const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { razonSocial: 'asc' }
    });
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching providers" });
  }
};

const createProvider = async (req, res) => {
  try {
    const data = req.body;
    const provider = await prisma.provider.create({ data });
    res.status(201).json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating provider" });
  }
};

const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const provider = await prisma.provider.update({
      where: { id },
      data
    });
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating provider" });
  }
};

const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.provider.update({
      where: { id },
      data: { estado: 'INACTIVO' }
    });
    res.json({ message: "Proveedor desactivado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting provider" });
  }
};

module.exports = {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider
};
