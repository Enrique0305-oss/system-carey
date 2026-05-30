const express = require('express');
const router = express.Router();
const { getAjustes, createAjuste } = require('../controllers/ajustesController');

router.get('/', getAjustes);
router.post('/', createAjuste);

module.exports = router;
