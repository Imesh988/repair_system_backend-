// backend/routes/employeeRoutes.js
const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTechnicians
} = require('../controllers/employeeController');
const { protect, adminOnly, managerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, managerOrAdmin, getEmployees).post(protect, adminOnly, createEmployee);
router.get('/technicians', protect, getTechnicians);
router.route('/:id').get(protect, managerOrAdmin, getEmployeeById).put(protect, adminOnly, updateEmployee).delete(protect, adminOnly, deleteEmployee);

module.exports = router;