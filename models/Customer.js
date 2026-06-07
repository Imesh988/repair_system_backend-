// backend/models/Customer.js
const { pool } = require('../db/db');

class Customer {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY registered_date DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE customer_id = ?', [id]);
    return rows[0];
  }

  static async create(customerData) {
    const { full_name, phone, alt_phone, address, email } = customerData;
    const [result] = await pool.query(
      'INSERT INTO customers (full_name, phone, alt_phone, address, email) VALUES (?, ?, ?, ?, ?)',
      [full_name, phone, alt_phone, address, email]
    );
    return this.findById(result.insertId);
  }

  static async update(id, customerData) {
    const { full_name, phone, alt_phone, address, email } = customerData;
    await pool.query(
      'UPDATE customers SET full_name = ?, phone = ?, alt_phone = ?, address = ?, email = ? WHERE customer_id = ?',
      [full_name, phone, alt_phone, address, email, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM customers WHERE customer_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async search(searchTerm) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?',
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
  }
}

module.exports = Customer;