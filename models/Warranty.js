// backend/models/Warranty.js
const { pool } = require('../db/db');

class Warranty {
  static async findByRepairId(repairId) {
    const [rows] = await pool.query('SELECT * FROM warranties WHERE repair_id = ?', [repairId]);
    return rows[0];
  }

  static async create(warrantyData) {
    const { repair_id, warranty_period_months, start_date, end_date, terms } = warrantyData;
    const [result] = await pool.query(
      'INSERT INTO warranties (repair_id, warranty_period_months, start_date, end_date, terms) VALUES (?, ?, ?, ?, ?)',
      [repair_id, warranty_period_months, start_date, end_date, terms]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM warranties WHERE warranty_id = ?', [id]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE warranties SET status = ? WHERE warranty_id = ?', [status, id]);
    return this.findById(id);
  }
}

module.exports = Warranty;