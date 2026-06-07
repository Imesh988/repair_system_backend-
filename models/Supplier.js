// backend/models/Supplier.js
const { pool } = require('../db/db');

class Supplier {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
    return rows[0];
  }

  static async create(supplierData) {
    const { name, contact_person, phone, email, address, payment_terms } = supplierData;
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contact_person, phone, email, address, payment_terms]
    );
    return this.findById(result.insertId);
  }

  static async update(id, supplierData) {
    const { name, contact_person, phone, email, address, payment_terms } = supplierData;
    await pool.query(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, payment_terms = ? WHERE supplier_id = ?',
      [name, contact_person, phone, email, address, payment_terms, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Supplier;