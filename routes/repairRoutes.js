// backend/routes/repairRoutes.js
const express = require('express');
const {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  updateRepairStatus,
  addRepairItem,
  removeRepairItem,
  getRepairItems,
  completeRepair,
  collectRepair
} = require('../controllers/repairController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getRepairs).post(protect, createRepair);
router.patch('/:id/status', protect, updateRepairStatus);
router.post('/:id/complete', protect, completeRepair);
router.post('/:id/collect', protect, collectRepair);
router.get('/:repairId/items', protect, getRepairItems);
router.post('/items', protect, addRepairItem);
router.delete('/items/:itemId', protect, removeRepairItem);
router.route('/:id').get(protect, getRepairById).put(protect, updateRepair);

module.exports = router;