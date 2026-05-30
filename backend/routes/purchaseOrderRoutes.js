const express = require('express');
const router = express.Router();
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  getStats
} = require('../controllers/purchaseOrderController');

router.get('/stats', getStats);
router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
