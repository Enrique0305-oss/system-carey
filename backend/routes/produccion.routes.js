const express = require('express');
const router = express.Router();
const { getProducciones, createProduccion } = require('../controllers/produccionController');

router.get('/', getProducciones);
router.post('/', createProduccion);

module.exports = router;
