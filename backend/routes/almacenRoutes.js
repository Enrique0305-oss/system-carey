const express = require('express');
const router = express.Router();
const { getAlmacenes } = require('../controllers/almacenController');

router.get('/', getAlmacenes);

module.exports = router;
