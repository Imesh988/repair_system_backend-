// backend/models/Device.js
const { pool } = require('../db/db');

class Device {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT d.*, c.full_name as customer_name 
      FROM devices d 
      JOIN customers c ON d.customer_id = c.customer_id 
      ORDER BY d.received_date DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT d.*, c.full_name as customer_name, c.phone as customer_phone
      FROM devices d 
      JOIN customers c ON d.customer_id = c.customer_id 
      WHERE d.device_id = ?
    `, [id]);
    return rows[0];
  }

  static async findByCustomerId(customerId) {
    const [rows] = await pool.query('SELECT * FROM devices WHERE customer_id = ?', [customerId]);
    return rows;
  }

  static async create(deviceData) {
    const { customer_id, brand, model, imei, problem_description } = deviceData;
    const [result] = await pool.query(
      'INSERT INTO devices (customer_id, brand, model, imei, problem_description) VALUES (?, ?, ?, ?, ?)',
      [customer_id, brand, model, imei, problem_description]
    );
    return this.findById(result.insertId);
  }

  static async update(id, deviceData) {
    const { brand, model, imei, problem_description } = deviceData;
    await pool.query(
      'UPDATE devices SET brand = ?, model = ?, imei = ?, problem_description = ? WHERE device_id = ?',
      [brand, model, imei, problem_description, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM devices WHERE device_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Device;