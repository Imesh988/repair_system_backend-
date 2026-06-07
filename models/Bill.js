// backend/models/Bill.js
const { pool } = require('../db/db');

class Bill {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        b.bill_id,
        b.repair_id,
        b.bill_no,
        b.bill_date,
        b.total_amount,
        b.discount,
        b.tax,
        b.paid_amount,
        b.balance,
        r.ticket_no,
        d.brand,
        d.model,
        c.full_name as customer_name
      FROM bills b
      JOIN repairs r ON b.repair_id = r.repair_id
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      ORDER BY b.bill_date DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        b.*,
        r.ticket_no,
        r.final_cost as repair_final_cost,
        r.labor_cost,
        d.brand,
        d.model,
        d.imei,
        d.problem_description,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address
      FROM bills b
      JOIN repairs r ON b.repair_id = r.repair_id
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      WHERE b.bill_id = ?
    `, [id]);
    return rows[0];
  }

  static async findByRepairId(repairId) {
    const [rows] = await pool.query('SELECT * FROM bills WHERE repair_id = ?', [repairId]);
    return rows[0];
  }

  static async create(billData) {
    const { repair_id, bill_no, total_amount, discount, tax, paid_amount } = billData;
    const subtotal = parseFloat(total_amount) || 0;
    const disc = parseFloat(discount) || 0;
    const t = parseFloat(tax) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const totalDue = subtotal - disc + t;
    const balance = totalDue - paid;
    const finalBalance = Math.abs(balance) < 0.01 ? 0 : balance;
    const [result] = await pool.query(
      'INSERT INTO bills (repair_id, bill_no, total_amount, discount, tax, paid_amount, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [repair_id, bill_no, subtotal, disc, t, paid, finalBalance]
    );
    return this.findById(result.insertId);
  }

  static async updatePaidAmount(billId, additionalPaid) {
    const [rows] = await pool.query('SELECT * FROM bills WHERE bill_id = ?', [billId]);
    const bill = rows[0];
    if (!bill) throw new Error('Bill not found');

    const totalAmount = parseFloat(bill.total_amount) || 0;
    const discount = parseFloat(bill.discount) || 0;
    const tax = parseFloat(bill.tax) || 0;
    const currentPaid = parseFloat(bill.paid_amount) || 0;
    const extra = parseFloat(additionalPaid);
    if (isNaN(extra)) throw new Error('Invalid payment amount');

    const totalDue = totalAmount - discount + tax;
    let newPaid = currentPaid + extra;
    if (newPaid > totalDue) newPaid = totalDue;
    let newBalance = totalDue - newPaid;
    if (newBalance < 0.01) newBalance = 0;

    await pool.query('UPDATE bills SET paid_amount = ?, balance = ? WHERE bill_id = ?', [newPaid, newBalance, billId]);
    const [updated] = await pool.query('SELECT * FROM bills WHERE bill_id = ?', [billId]);
    return updated[0];
  }

  static async getOutstandingBills() {
    const [rows] = await pool.query(`
      SELECT b.*, r.ticket_no, c.full_name as customer_name, d.brand, d.model
      FROM bills b
      JOIN repairs r ON b.repair_id = r.repair_id
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      WHERE b.balance > 0
    `);
    return rows;
  }
}

module.exports = Bill;