const jwt = require('jsonwebtoken');
const { pool } = require('../db/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.query(
        'SELECT employee_id, full_name, role, email FROM employees WHERE employee_id = ? AND status = "active"',
        [decoded.id]
      );
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user not found or inactive' });
      }
      req.user = rows[0];
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

const managerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Manager or Admin only.' });
  }
};

module.exports = { protect, adminOnly, managerOrAdmin };