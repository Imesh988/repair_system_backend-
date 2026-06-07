// backend/routes/reportRoutes.js
const express = require('express');
const { getSalesReport, getInventoryReport, getRepairReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sales', protect, getSalesReport);
router.get('/inventory', protect, getInventoryReport);
router.get('/repairs', protect, getRepairReport);

module.exports = router;