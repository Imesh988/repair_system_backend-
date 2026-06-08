const express = require('express');
const { pool } = require('../db/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// GET discount by job_id
router.get('/job/:jobId', protect, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM discounts WHERE job_id = ?', [req.params.jobId]);
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST / UPSERT discount for a job
router.post('/job/:jobId', protect, async (req, res) => {
    const { discount_type, discount_value } = req.body;
    const jobId = req.params.jobId;
    try {
        await pool.query(
            `INSERT INTO discounts (job_id, discount_type, discount_value, applied_by, applied_date)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
             discount_type = VALUES(discount_type), 
             discount_value = VALUES(discount_value), 
             applied_date = NOW()`,
            [jobId, discount_type, discount_value, req.user?.employee_id || null]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE discount for a job
router.delete('/job/:jobId', protect, async (req, res) => {
    await pool.query('DELETE FROM discounts WHERE job_id = ?', [req.params.jobId]);
    res.json({ success: true });
});

module.exports = router;