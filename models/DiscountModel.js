// backend/models/DiscountModel.js
const { pool } = require('../db/db');   // 👈 object destructuring – අනෙක් modal files වගේම

class DiscountModel {
    static async getAll() {
        try {
            const [rows] = await pool.query(`
                SELECT d.*, r.ticket_no 
                FROM discounts d
                JOIN repairs r ON d.repair_id = r.repair_id
                ORDER BY d.applied_date DESC
            `);
            return rows;
        } catch (error) {
            console.error('getAll error:', error);
            throw error;
        }
    }

    static async findByRepairId(repairId) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM discounts WHERE repair_id = ?',
                [repairId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('findByRepairId error:', error);
            throw error;
        }
    }

    static async upsert(repairId, type, value, appliedBy = null) {
        try {
            const [result] = await pool.query(
                `INSERT INTO discounts (repair_id, discount_type, discount_value, applied_by)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 discount_type = VALUES(discount_type),
                 discount_value = VALUES(discount_value),
                 applied_by = VALUES(applied_by),
                 applied_date = CURRENT_TIMESTAMP`,
                [repairId, type, value, appliedBy]
            );
            return result;
        } catch (error) {
            console.error('upsert error:', error);
            throw error;
        }
    }

    static async delete(repairId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM discounts WHERE repair_id = ?',
                [repairId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('delete error:', error);
            throw error;
        }
    }
}

module.exports = DiscountModel;