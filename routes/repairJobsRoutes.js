const express = require('express');
const { pool } = require('../db/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.repair_id as id,
        r.ticket_no as job_number,
        DATE(COALESCE(d.received_date, r.created_at, CURDATE())) as received_on,
        CONCAT(d.brand, ' ', d.model) as item_name,
        c.full_name as customer_name,
        c.phone,
        d.problem_description as fault,
        c.address,
        d.category as category_code,
        COALESCE(b.total_amount, 0) as bill_amount,
        d.accessories,
        r.status,
        COALESCE(r.estimated_cost, 0) as expected_amount
      FROM repairs r
      JOIN devices d ON r.device_id = d.device_id
      JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN bills b ON r.repair_id = b.repair_id
      ORDER BY r.repair_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /repair-jobs error:', err);
    res.status(500).json({ message: err.message, sql: err.sql });
  }
});
router.post('/', protect, async (req, res) => {
  const {
    job_number, received_on, item_name, customer_name, phone,
    fault, address, category_code, bill_amount, accessories,
    status, expected_amount
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let [existing] = await connection.query('SELECT customer_id FROM customers WHERE phone = ?', [phone]);
    let customerId;
    if (existing.length === 0) {
      const [custRes] = await connection.query(
        'INSERT INTO customers (full_name, phone, address) VALUES (?, ?, ?)',
        [customer_name, phone, address || null]
      );
      customerId = custRes.insertId;
    } else {
      customerId = existing[0].customer_id;
      await connection.query(
        'UPDATE customers SET full_name = ?, address = ? WHERE customer_id = ?',
        [customer_name, address || null, customerId]
      );
    }
    const [brand, model] = item_name.split(' ');
    const [devRes] = await connection.query(
      `INSERT INTO devices 
       (customer_id, brand, model, problem_description, received_date, accessories, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, brand || item_name, model || '', fault, received_on, accessories || null, category_code || null]
    );
    const deviceId = devRes.insertId;
    const [repRes] = await connection.query(
      'INSERT INTO repairs (ticket_no, device_id, estimated_cost, status) VALUES (?, ?, ?, ?)',
      [job_number, deviceId, parseFloat(expected_amount) || 0, status || 'PENDING']
    );
    const repairId = repRes.insertId;
    if (bill_amount && parseFloat(bill_amount) > 0) {
      await connection.query(
        `INSERT INTO bills (repair_id, bill_no, total_amount, paid_amount, balance) 
         VALUES (?, ?, ?, ?, ?)`,
        [repairId, `INV-${repairId}`, parseFloat(bill_amount), 0, parseFloat(bill_amount)]
      );
    }
    await connection.commit();
    res.status(201).json({ id: repairId });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
});

router.put('/:id', protect, async (req, res) => {
  const repairId = req.params.id;
  const {
    job_number, received_on, item_name, customer_name, phone,
    fault, address, category_code, bill_amount, accessories,
    status, expected_amount
  } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [repair] = await connection.query('SELECT device_id FROM repairs WHERE repair_id = ?', [repairId]);
    if (!repair.length) throw new Error('Repair not found');
    const deviceId = repair[0].device_id;
    const [device] = await connection.query('SELECT customer_id FROM devices WHERE device_id = ?', [deviceId]);
    const customerId = device[0].customer_id;
    await connection.query(
      'UPDATE customers SET full_name = ?, phone = ?, address = ? WHERE customer_id = ?',
      [customer_name, phone, address || null, customerId]
    );
    const [brand, model] = item_name.split(' ');
    await connection.query(
      `UPDATE devices SET 
        brand = ?, model = ?, problem_description = ?, received_date = ?, 
        accessories = ?, category = ?
       WHERE device_id = ?`,
      [brand || item_name, model || '', fault, received_on, accessories || null, category_code || null, deviceId]
    );
    await connection.query(
      'UPDATE repairs SET ticket_no = ?, estimated_cost = ?, status = ? WHERE repair_id = ?',
      [job_number, parseFloat(expected_amount) || 0, status, repairId]
    );
    const [existingBill] = await connection.query('SELECT bill_id FROM bills WHERE repair_id = ?', [repairId]);
    if (bill_amount && parseFloat(bill_amount) > 0) {
      if (existingBill.length) {
        await connection.query(
          'UPDATE bills SET total_amount = ?, balance = ? WHERE repair_id = ?',
          [parseFloat(bill_amount), parseFloat(bill_amount), repairId]
        );
      } else {
        await connection.query(
          'INSERT INTO bills (repair_id, bill_no, total_amount, paid_amount, balance) VALUES (?, ?, ?, ?, ?)',
          [repairId, `INV-${repairId}`, parseFloat(bill_amount), 0, parseFloat(bill_amount)]
        );
      }
    } else if (existingBill.length) {
      await connection.query('DELETE FROM bills WHERE repair_id = ?', [repairId]);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
});

router.delete('/:id', protect, async (req, res) => {
  const repairId = req.params.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [repair] = await connection.query('SELECT device_id FROM repairs WHERE repair_id = ?', [repairId]);
    if (!repair.length) throw new Error('Repair not found');
    const deviceId = repair[0].device_id;
    await connection.query('DELETE FROM bills WHERE repair_id = ?', [repairId]);
    await connection.query('DELETE FROM repairs WHERE repair_id = ?', [repairId]);
    await connection.query('DELETE FROM devices WHERE device_id = ?', [deviceId]);
    await connection.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;