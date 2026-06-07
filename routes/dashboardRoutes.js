// backend/routes/dashboardRoutes.js
const express = require('express');
const { getDashboardStats, getMonthlyRevenue } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/revenue', protect, getMonthlyRevenue);

module.exports = router;