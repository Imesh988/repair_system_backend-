const { pool } = require('../db/db');

class Payment {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT p.*, r.ticket_no, c.full_name as customer_name
      FROM payments p
      JOIN repairs r ON p.repair_id = r.repair_id
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      ORDER BY p.payment_date DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM payments WHERE payment_id = ?', [id]);
    return rows[0];
  }

  static async findByRepairId(repairId) {
    const [rows] = await pool.query('SELECT * FROM payments WHERE repair_id = ? ORDER BY payment_date DESC', [repairId]);
    return rows;
  }

  static async create(paymentData) {
    const { repair_id, amount, payment_method, receipt_no, bill_no } = paymentData;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) throw new Error('Invalid amount');
    
    // ✅ INSERT query with exactly 5 values (bill_no included)
    const [result] = await pool.query(
      'INSERT INTO payments (repair_id, amount, payment_method, receipt_no, bill_no) VALUES (?, ?, ?, ?, ?)',
      [repair_id, numericAmount, payment_method, receipt_no || null, bill_no || null]
    );
    return this.findById(result.insertId);
  }

  static async getTotalPaymentsByRepair(repairId) {
    const [rows] = await pool.query(
      'SELECT SUM(amount) as total FROM payments WHERE repair_id = ?',
      [repairId]
    );
    return rows[0].total || 0;
  }
}

module.exports = Payment;