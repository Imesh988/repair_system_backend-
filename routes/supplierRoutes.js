// backend/routes/supplierRoutes.js
const express = require('express');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getSuppliers).post(protect, createSupplier);
router.route('/:id').get(protect, getSupplierById).put(protect, updateSupplier).delete(protect, deleteSupplier);

module.exports = router;