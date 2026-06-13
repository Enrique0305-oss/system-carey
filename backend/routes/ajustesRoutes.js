const express = require('express');
const router = express.Router();
const { getAjustes, createAjuste } = require('../controllers/ajustesController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getAjustes);
router.post('/', upload.single('image'), createAjuste);

module.exports = router;
