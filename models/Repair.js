// backend/models/Repair.js

const { pool } = require('../db/db');

class Repair {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT r.*, d.brand, d.model, d.imei, c.full_name as customer_name, c.phone as customer_phone,
             e.full_name as technician_name
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN employees e ON r.technician_id = e.employee_id
      ORDER BY r.repair_id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT r.*, d.brand, d.model, d.imei, d.problem_description as device_problem,
             c.full_name as customer_name, c.phone as customer_phone, c.address as customer_address,
             e.full_name as technician_name
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN employees e ON r.technician_id = e.employee_id
      WHERE r.repair_id = ?
    `, [id]);
    return rows[0];
  }

  static async findByTicketNo(ticketNo) {
    const [rows] = await pool.query('SELECT * FROM repairs WHERE ticket_no = ?', [ticketNo]);
    return rows[0];
  }

  static async create(repairData) {
    const { ticket_no, device_id, technician_id, estimated_cost, notes } = repairData;
    const cleanEstimated = this.parsePrice(estimated_cost);
    const [result] = await pool.query(
      'INSERT INTO repairs (ticket_no, device_id, technician_id, estimated_cost, notes) VALUES (?, ?, ?, ?, ?)',
      [ticket_no, device_id, technician_id, cleanEstimated, notes]
    );
    return this.findById(result.insertId);
  }

  static async update(id, repairData) {
    const current = await this.findById(id);
    if (!current) return null;
    const technician_id = repairData.technician_id !== undefined ? repairData.technician_id : current.technician_id;
    const status = repairData.status !== undefined ? repairData.status : current.status;
    const estimated_cost = repairData.estimated_cost !== undefined ? this.parsePrice(repairData.estimated_cost) : current.estimated_cost;
    const final_cost = repairData.final_cost !== undefined ? this.parsePrice(repairData.final_cost) : current.final_cost;
    const labor_cost = repairData.labor_cost !== undefined ? this.parsePrice(repairData.labor_cost) : current.labor_cost;
    const notes = repairData.notes !== undefined ? repairData.notes : current.notes;
    const completed_date = repairData.completed_date !== undefined ? repairData.completed_date : current.completed_date;
    const collected_date = repairData.collected_date !== undefined ? repairData.collected_date : current.collected_date;
    await pool.query(
      `UPDATE repairs SET 
        technician_id = ?, status = ?, estimated_cost = ?, final_cost = ?, 
        labor_cost = ?, notes = ?, completed_date = ?, collected_date = ?
      WHERE repair_id = ?`,
      [technician_id, status, estimated_cost, final_cost, labor_cost, notes, completed_date, collected_date, id]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE repairs SET status = ? WHERE repair_id = ?', [status, id]);
    return this.findById(id);
  }

  static async getPartsTotal(repairId) {
    const [rows] = await pool.query(
      'SELECT SUM(quantity_used * price_at_time) as total FROM repair_items WHERE repair_id = ?',
      [repairId]
    );
    let total = rows[0].total || 0;
    if (typeof total === 'string') total = this.parsePrice(total);
    return parseFloat(total) || 0;
  }

  static async updateFinalCost(repairId) {
    const partsTotal = await this.getPartsTotal(repairId);
    const [repair] = await pool.query('SELECT labor_cost, estimated_cost FROM repairs WHERE repair_id = ?', [repairId]);
    let laborCost = repair[0]?.labor_cost || 0;
    let estimatedCost = repair[0]?.estimated_cost || 0;
    if (typeof laborCost === 'string') laborCost = this.parsePrice(laborCost);
    if (typeof estimatedCost === 'string') estimatedCost = this.parsePrice(estimatedCost);
    laborCost = parseFloat(laborCost) || 0;
    estimatedCost = parseFloat(estimatedCost) || 0;
    const finalCost = estimatedCost + partsTotal + laborCost;
    const roundedFinal = Math.round(finalCost * 100) / 100;
    await pool.query('UPDATE repairs SET final_cost = ? WHERE repair_id = ?', [roundedFinal, repairId]);
    return roundedFinal;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM repairs WHERE repair_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getByStatus(status) {
    const [rows] = await pool.query(`
      SELECT r.*, d.brand, d.model, c.full_name as customer_name
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      WHERE r.status = ?
    `, [status]);
    return rows;
  }

  static parsePrice(value) {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    let str = String(value).trim();
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      const lastDotIndex = str.lastIndexOf('.');
      const beforeLastDot = str.substring(0, lastDotIndex).replace(/\./g, '');
      const afterLastDot = str.substring(lastDotIndex + 1);
      str = beforeLastDot + '.' + afterLastDot;
    }
    str = str.replace(/,/g, '');
    let num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }
}

module.exports = Repair;