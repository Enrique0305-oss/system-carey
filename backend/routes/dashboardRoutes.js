const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/almacen/alerts', dashboardController.getAlmacenAlerts);
router.get('/gerencia', dashboardController.getGerenciaStats);

module.exports = router;
