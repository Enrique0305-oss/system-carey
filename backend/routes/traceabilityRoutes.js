const express = require('express');
const router = express.Router();
const traceabilityController = require('../controllers/traceabilityController');

router.get('/:lotCode', traceabilityController.getTraceability);

module.exports = router;
