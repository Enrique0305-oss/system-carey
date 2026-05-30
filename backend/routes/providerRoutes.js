const express = require('express');
const router = express.Router();
const { getProviders, createProvider, updateProvider, deleteProvider } = require('../controllers/providerController');

// Todas las rutas de proveedores
router.get('/', getProviders);
router.post('/', createProvider);
router.put('/:id', updateProvider);
router.delete('/:id', deleteProvider);

module.exports = router;
