// backend/routes/inventoryRoutes.js
const express = require('express');
const {
  getInventory,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  getLowStock
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getInventory).post(protect, createPart);
router.get('/low-stock', protect, getLowStock);
router.route('/:id').get(protect, getPartById).put(protect, updatePart).delete(protect, deletePart);

module.exports = router;