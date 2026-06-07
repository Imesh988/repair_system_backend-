const express = require('express');
const router = express.Router();
const billGeneratedController = require('../controllers/billGeneratedController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, billGeneratedController.getAllGenerated);
router.get('/repair/:repairId', protect, billGeneratedController.hasGenerated);
router.post('/', protect, billGeneratedController.createGenerated);
router.delete('/repair/:repairId', protect, billGeneratedController.deleteGenerated);

module.exports = router;