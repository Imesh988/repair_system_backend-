const { pool } = require('../db/db');

class BillGeneratedModel {
    static async hasBillGenerated(repairId) {
        const [rows] = await pool.query('SELECT 1 FROM bill_generated WHERE repair_id = ?', [repairId]);
        return rows.length > 0;
    }

    static async getAllGeneratedRepairIds() {
        const [rows] = await pool.query('SELECT repair_id FROM bill_generated');
        return rows.map(row => row.repair_id);
    }

    static async create(repairId, billId) {
        const [result] = await pool.query(
            'INSERT INTO bill_generated (repair_id, bill_id) VALUES (?, ?)',
            [repairId, billId]
        );
        return result;
    }

    static async delete(repairId) {
        const [result] = await pool.query('DELETE FROM bill_generated WHERE repair_id = ?', [repairId]);
        return result.affectedRows > 0;
    }
}

module.exports = BillGeneratedModel;