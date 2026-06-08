const prisma = require('../database/connection');

const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

const createClient = async (req, res) => {
  try {
    const { razonSocial, ruc, direccion, telefono, email } = req.body;
    const client = await prisma.client.create({
      data: { razonSocial, ruc, direccion, telefono, email }
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const client = await prisma.client.update({
      where: { id },
      data
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

module.exports = {
  getClients,
  createClient,
  updateClient
};
