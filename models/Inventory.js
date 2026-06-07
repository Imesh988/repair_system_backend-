// backend/models/Inventory.js
const { pool } = require('../db/db');

class Inventory {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT i.*, s.name as supplier_name 
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
      ORDER BY i.part_name
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM inventory WHERE part_id = ?', [id]);
    return rows[0];
  }

  static async create(partData) {
    const { part_name, category, quantity, unit_cost, selling_price, reorder_level, supplier_id } = partData;
    const [result] = await pool.query(
      'INSERT INTO inventory (part_name, category, quantity, unit_cost, selling_price, reorder_level, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [part_name, category, quantity, unit_cost, selling_price, reorder_level, supplier_id]
    );
    return this.findById(result.insertId);
  }

  static async update(id, partData) {
    const { part_name, category, quantity, unit_cost, selling_price, reorder_level, supplier_id } = partData;
    await pool.query(
      'UPDATE inventory SET part_name = ?, category = ?, quantity = ?, unit_cost = ?, selling_price = ?, reorder_level = ?, supplier_id = ? WHERE part_id = ?',
      [part_name, category, quantity, unit_cost, selling_price, reorder_level, supplier_id, id]
    );
    return this.findById(id);
  }

  static async updateQuantity(id, newQuantity) {
    await pool.query('UPDATE inventory SET quantity = ? WHERE part_id = ?', [newQuantity, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM inventory WHERE part_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getLowStock() {
    const [rows] = await pool.query(
      'SELECT * FROM inventory WHERE quantity <= reorder_level ORDER BY quantity ASC'
    );
    return rows;
  }
}

module.exports = Inventory;