// backend/routes/paymentRoutes.js
const express = require('express');
const {
  getPayments,
  createPayment,
  getPaymentsByRepair
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getPayments).post(protect, createPayment);
router.get('/repair/:repairId', protect, getPaymentsByRepair);

module.exports = router;