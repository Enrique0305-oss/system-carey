const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');

router.get('/', dispatchController.getDispatches);
router.post('/', dispatchController.createDispatch);

module.exports = router;
