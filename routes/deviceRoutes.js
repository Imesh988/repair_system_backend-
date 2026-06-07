// backend/routes/deviceRoutes.js
const express = require('express');
const {
  getDevices,
  getDeviceById,
  getDevicesByCustomer,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getDevices).post(protect, createDevice);
router.get('/customer/:customerId', protect, getDevicesByCustomer);
router.route('/:id').get(protect, getDeviceById).put(protect, updateDevice).delete(protect, deleteDevice);

module.exports = router;