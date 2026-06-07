const { pool } = require('../db/db');

class ExpenseModel {
    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM expenses WHERE expense_id = ?', [id]);
        return rows[0];
    }

    static async create({ expense_date, category, description, amount, paid_to, receipt_image }) {
        const [result] = await pool.query(
            `INSERT INTO expenses (expense_date, category, description, amount, paid_to, receipt_image)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [expense_date, category, description || null, amount, paid_to || null, receipt_image || null]
        );
        return result;
    }

    static async update(id, { expense_date, category, description, amount, paid_to, receipt_image }) {
        const [result] = await pool.query(
            `UPDATE expenses SET 
                expense_date = COALESCE(?, expense_date),
                category = COALESCE(?, category),
                description = ?,
                amount = COALESCE(?, amount),
                paid_to = ?,
                receipt_image = ?
             WHERE expense_id = ?`,
            [expense_date, category, description || null, amount, paid_to || null, receipt_image || null, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM expenses WHERE expense_id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ExpenseModel;