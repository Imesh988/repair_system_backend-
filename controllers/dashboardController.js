// backend/controllers/dashboardController.js
const { pool } = require('../db/db');

const getDashboardStats = async (req, res) => {
  try {
    const [repairStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_repairs,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'collected' THEN 1 ELSE 0 END) as collected
      FROM repairs
    `);
    
    const [revenueStats] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount - discount + tax), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(balance), 0) as outstanding
      FROM bills
    `);
    
    const [customerCount] = await pool.query('SELECT COUNT(*) as total FROM customers');
    const [deviceCount] = await pool.query('SELECT COUNT(*) as total FROM devices');
    const [inventoryCount] = await pool.query('SELECT COUNT(*) as total FROM inventory');
    
    const [recentRepairs] = await pool.query(`
      SELECT r.repair_id, r.ticket_no, r.status, r.final_cost, r.created_at,
             c.full_name as customer_name, d.brand, d.model
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      ORDER BY r.repair_id DESC
      LIMIT 10
    `);
    
    res.json({
      repairs: repairStats[0],
      revenue: revenueStats[0],
      customers: customerCount[0].total,
      devices: deviceCount[0].total,
      inventory: inventoryCount[0].total,
      recentRepairs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(bill_date, '%Y-%m') as month,
        SUM(total_amount - discount + tax) as revenue,
        SUM(paid_amount) as collected
      FROM bills
      WHERE bill_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(bill_date, '%Y-%m')
      ORDER BY month DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats, getMonthlyRevenue };