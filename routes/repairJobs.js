const express = require('express');
const { pool } = require('../db/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Allowed columns – added closed_date
const ALLOWED_COLUMNS = [
    'job_number', 'received_on', 'customer_name', 'address',
    'category_name', 'fault_name',
    'status_code', 'bill_amount', 'expected_amount',
    'priority', 'discount_type', 'discount_value',
    'acc1_name', 'acc2_name', 'acc3_name', 'acc4_name',
    'acc5_name', 'acc6_name', 'acc7_name',
    'closed_date'  // <-- new field
];

// GET all jobs with final_amount calculation
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT rj.*,
                   CASE 
                       WHEN rj.discount_type = 'percentage' THEN rj.bill_amount * (100 - rj.discount_value) / 100
                       WHEN rj.discount_type = 'fixed' THEN rj.bill_amount - rj.discount_value
                       ELSE rj.bill_amount
                   END AS final_amount
            FROM repair_jobs rj
            ORDER BY rj.id DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single job
router.get('/:id', protect, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM repair_jobs WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create job
router.post('/', protect, async (req, res) => {
    const {
        job_number, received_on, customer_name, address = null,
        category_name = null, fault_name = null,
        status_code = 'PENDING',
        bill_amount = null, expected_amount = null, priority = null,
        discount_type = null, discount_value = null,
        acc1_name = null, acc2_name = null, acc3_name = null,
        acc4_name = null, acc5_name = null, acc6_name = null, acc7_name = null,
        closed_date = null
    } = req.body;

    if (!job_number || !customer_name) {
        return res.status(400).json({ message: 'Job number and customer name are required' });
    }

    if (bill_amount !== null && bill_amount > 0) {
        if (discount_type === 'fixed' && discount_value > bill_amount) {
            return res.status(400).json({ message: 'Fixed discount cannot exceed bill amount' });
        }
        if (discount_type === 'percentage' && discount_value > 100) {
            return res.status(400).json({ message: 'Percentage discount cannot exceed 100' });
        }
    } else if (discount_value && discount_value > 0) {
        return res.status(400).json({ message: 'Discount cannot be applied without bill amount' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO repair_jobs 
            (job_number, received_on, customer_name, address,
             category_name, fault_name,
             status_code, bill_amount, expected_amount,
             priority, discount_type, discount_value,
             acc1_name, acc2_name, acc3_name, acc4_name,
             acc5_name, acc6_name, acc7_name,
             closed_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                job_number, received_on, customer_name, address,
                category_name, fault_name,
                status_code, bill_amount, expected_amount,
                priority, discount_type, discount_value,
                acc1_name, acc2_name, acc3_name, acc4_name,
                acc5_name, acc6_name, acc7_name,
                closed_date
            ]
        );
        res.status(201).json({ id: result.insertId, message: 'Job created' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// PUT update job
router.put('/:id', protect, async (req, res) => {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'id' && ALLOWED_COLUMNS.includes(key)) {
            fields.push(`${key} = ?`);
            values.push(value === undefined ? null : value);
        }
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    const [job] = await pool.query('SELECT bill_amount FROM repair_jobs WHERE id = ?', [req.params.id]);
    if (job.length === 0) return res.status(404).json({ message: 'Job not found' });
    const currentBill = job[0].bill_amount;

    // Determine effective bill amount after update
    let effectiveBill = currentBill;
    if (req.body.bill_amount !== undefined) {
        effectiveBill = req.body.bill_amount;
    }

    // Validate discount if present
    if (req.body.discount_type !== undefined || req.body.discount_value !== undefined) {
        let discType = req.body.discount_type;
        let discValue = req.body.discount_value;
        if (discType === undefined) {
            const [curr] = await pool.query('SELECT discount_type, discount_value FROM repair_jobs WHERE id = ?', [req.params.id]);
            discType = curr[0]?.discount_type;
            discValue = curr[0]?.discount_value;
        }
        if (effectiveBill !== null && effectiveBill > 0 && discType && discValue !== null && discValue !== undefined) {
            if (discType === 'fixed' && discValue > effectiveBill) {
                return res.status(400).json({ message: 'Fixed discount cannot exceed bill amount' });
            }
            if (discType === 'percentage' && discValue > 100) {
                return res.status(400).json({ message: 'Percentage discount cannot exceed 100' });
            }
        } else if (discValue > 0) {
            return res.status(400).json({ message: 'Discount cannot be applied when bill amount is null or zero' });
        }
    }

    values.push(req.params.id);
    try {
        await pool.query(`UPDATE repair_jobs SET ${fields.join(', ')} WHERE id = ?`, values);
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE job
router.delete('/:id', protect, async (req, res) => {
    try {
        await pool.query('DELETE FROM repair_jobs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;