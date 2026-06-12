const express = require('express');
const router = express.Router();
const internalConsumptionController = require('../controllers/internalConsumptionController');

router.get('/', internalConsumptionController.getAllConsumptions);
router.post('/', internalConsumptionController.createConsumption);

module.exports = router;
