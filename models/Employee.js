const { pool } = require('../db/db');
const bcrypt = require('bcryptjs');

class Employee {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT employee_id, full_name, role, phone, email, hire_date, salary, commission_rate, status FROM employees'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT employee_id, full_name, role, phone, email, hire_date, salary, commission_rate, status FROM employees WHERE employee_id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM employees WHERE email = ?', [email]);
    return rows[0];
  }

  static async create(employeeData) {
    const {
      full_name,
      role,
      phone,
      email,
      password,
      hire_date,
      salary,
      commission_rate,
      status,
    } = employeeData;
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO employees 
       (full_name, role, phone, email, password_hash, hire_date, salary, commission_rate, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        role,
        phone || null,
        email,
        password_hash,
        hire_date,
        salary || 0,
        commission_rate || 0,
        status || 'active',
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, employeeData) {
    const allowedFields = ['full_name', 'role', 'phone', 'email', 'hire_date', 'salary', 'commission_rate', 'status'];
    const updates = [];
    const values = [];

    if (employeeData.email) {
      const [existing] = await pool.query('SELECT employee_id FROM employees WHERE email = ? AND employee_id != ?', [
        employeeData.email,
        id,
      ]);
      if (existing.length > 0) {
        throw new Error('Email already exists');
      }
    }

    for (const field of allowedFields) {
      if (employeeData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(employeeData[field]);
      }
    }

    if (employeeData.password) {
      const password_hash = await bcrypt.hash(employeeData.password, 10);
      updates.push(`password_hash = ?`);
      values.push(password_hash);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const query = `UPDATE employees SET ${updates.join(', ')} WHERE employee_id = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows > 0 ? await this.findById(id) : false;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE employees SET password_hash = ? WHERE employee_id = ?', [password_hash, id]);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM employees WHERE employee_id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTechnicians() {
    const [rows] = await pool.query(
      'SELECT employee_id, full_name FROM employees WHERE role = "technician" AND status = "active"'
    );
    return rows;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = Employee;