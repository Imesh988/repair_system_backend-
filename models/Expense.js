// backend/models/Expense.js
const { pool } = require('../db/db');

class Expense {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE expense_id = ?', [id]);
    return rows[0];
  }

  static async create(expenseData) {
    const { expense_date, category, description, amount, paid_to, receipt_image } = expenseData;
    const [result] = await pool.query(
      'INSERT INTO expenses (expense_date, category, description, amount, paid_to, receipt_image) VALUES (?, ?, ?, ?, ?, ?)',
      [expense_date, category, description, amount, paid_to, receipt_image]
    );
    return this.findById(result.insertId);
  }

  static async update(id, expenseData) {
    const { expense_date, category, description, amount, paid_to, receipt_image } = expenseData;
    await pool.query(
      'UPDATE expenses SET expense_date = ?, category = ?, description = ?, amount = ?, paid_to = ?, receipt_image = ? WHERE expense_id = ?',
      [expense_date, category, description, amount, paid_to, receipt_image, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM expenses WHERE expense_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTotalByDateRange(startDate, endDate) {
    const [rows] = await pool.query(
      'SELECT SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return rows[0].total || 0;
  }
}

module.exports = Expense;