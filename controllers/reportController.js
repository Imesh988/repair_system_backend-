const { pool } = require('../db/db');

const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [columns] = await pool.query(`SHOW COLUMNS FROM bills LIKE 'repair_id'`);
    if (columns.length === 0) {
      return res.status(500).json({ message: 'repair_id column missing in bills table' });
    }
    const [rows] = await pool.query(`
      SELECT 
        b.bill_id, b.bill_no, b.bill_date, b.total_amount, b.discount, b.tax, b.paid_amount, b.balance,
        b.repair_id, r.ticket_no, c.full_name as customer_name, d.brand, d.model
      FROM bills b
      INNER JOIN repairs r ON b.repair_id = r.repair_id
      INNER JOIN devices d ON r.device_id = d.device_id
      INNER JOIN customers c ON d.customer_id = c.customer_id
      WHERE DATE(b.bill_date) BETWEEN ? AND ?
      ORDER BY b.bill_date DESC
    `, [start_date, end_date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message, sql: error.sql, sqlMessage: error.sqlMessage });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.part_id, i.part_name, i.category, i.quantity, i.unit_cost, i.selling_price, i.reorder_level,
        s.name as supplier_name,
        CASE WHEN i.quantity <= i.reorder_level THEN 'Low Stock' ELSE 'Sufficient' END as stock_status
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
      ORDER BY i.quantity ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRepairReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [rows] = await pool.query(`
      SELECT 
        r.repair_id, r.ticket_no, r.status, r.estimated_cost, r.final_cost, r.labor_cost,
        r.completed_date, r.collected_date,
        c.full_name as customer_name, d.brand, d.model, d.imei,
        COALESCE(e.full_name, 'Not Assigned') as technician_name
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN employees e ON r.technician_id = e.employee_id
      WHERE DATE(r.completed_date) BETWEEN ? AND ?
      ORDER BY r.completed_date DESC
    `, [start_date, end_date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSalesReport, getInventoryReport, getRepairReport };