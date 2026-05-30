const express = require('express');
const router = express.Router();
const { getAlmacenAlerts } = require('../controllers/dashboardController');

router.get('/almacen/alerts', getAlmacenAlerts);

module.exports = router;
