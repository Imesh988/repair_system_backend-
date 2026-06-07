// backend/routes/billRoutes.js
const express = require('express');
const {
  getBills,
  getBillById,
  generateBill,
  getOutstandingBills
} = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getBills).post(protect, generateBill);
router.get('/outstanding', protect, getOutstandingBills);
router.get('/:id', protect, getBillById);

module.exports = router;