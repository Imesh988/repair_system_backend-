const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findByEmail(email);

    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (employee.status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive. Please contact admin.' });
    }

    const isPasswordValid = await Employee.validatePassword(password, employee.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(employee.employee_id);

    res.json({
      token,
      user: {
        id: employee.employee_id,
        name: employee.full_name,
        role: employee.role,
        email: employee.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: employee.employee_id,
      name: employee.full_name,
      role: employee.role,
      email: employee.email,
      phone: employee.phone,
      hire_date: employee.hire_date,
      salary: employee.salary,
      commission_rate: employee.commission_rate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Temporary route – create or update admin user with correct password hash
const createAdmin = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const adminEmail = email || 'imesh@gmail.com';
    const adminPassword = password || '20030720';
    const adminName = full_name || 'Administrator';

    const existing = await Employee.findByEmail(adminEmail);
    if (existing) {
      // Update existing user's password with correct bcrypt hash
      await Employee.updatePassword(existing.employee_id, adminPassword);
      return res.json({ message: 'Admin password updated successfully. Try login now.' });
    }

    const newAdmin = await Employee.create({
      full_name: adminName,
      role: 'admin',
      phone: '0771234567',
      email: adminEmail,
      password: adminPassword,
      hire_date: new Date().toISOString().split('T')[0],
      salary: 50000,
      commission_rate: 0,
      status: 'active',
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: newAdmin.employee_id,
        name: newAdmin.full_name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { login, getMe, createAdmin };