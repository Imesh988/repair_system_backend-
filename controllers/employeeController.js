// backend/controllers/employeeController.js
const Employee = require('../models/Employee');

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const existing = await Employee.findByEmail(req.body.email);
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Employee.findById(id);
        if (!existing) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const allowedUpdates = ['full_name', 'role', 'phone', 'email', 'hire_date', 'salary', 'commission_rate', 'status', 'password'];
        const updateData = {};
        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updated = await Employee.update(id, updateData);
        if (!updated) {
            return res.status(500).json({ message: 'Update failed' });
        }
        res.json(updated);
    } catch (error) {
        if (error.message === 'Email already exists') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
const deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTechnicians = async (req, res) => {
  try {
    const technicians = await Employee.getTechnicians();
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTechnicians
};