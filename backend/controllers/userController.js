const prisma = require('../database/connection');
const bcrypt = require('bcryptjs');

// Listar todas las áreas
const getAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany();
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar áreas' });
  }
};

// Listar todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        area: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    // Ocultar contraseñas
    const usersSafe = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    res.json(usersSafe);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// Crear usuario
const createUser = async (req, res) => {
  try {
    const { name, email, password, areaId } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'El correo ya está en uso' });

    const hashedPassword = await bcrypt.hash(password || 'carey123', 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        areaId
      },
      include: { area: true }
    });

    const { password: _, ...safeUser } = newUser;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, areaId, status, newPassword } = req.body;

    const dataToUpdate = {
      name,
      email,
      areaId,
      status
    };

    if (newPassword && newPassword.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { area: true }
    });

    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar (Soft delete) usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVO' }
    });
    res.json({ message: 'Usuario desactivado', user });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};

module.exports = {
  getAreas,
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
