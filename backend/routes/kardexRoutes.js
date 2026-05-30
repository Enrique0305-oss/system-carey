const express = require('express');
const router = express.Router();
const { getKardex } = require('../controllers/kardexController');

router.get('/', getKardex);

module.exports = router;
