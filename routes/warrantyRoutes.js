// backend/routes/warrantyRoutes.js
const express = require('express');
const router = express.Router();
const { generateWarrantyPDF } = require('../controllers/warrantyController');

router.get('/repair/:repairId/pdf', generateWarrantyPDF);

module.exports = router;