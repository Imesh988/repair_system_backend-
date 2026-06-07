// backend/controllers/paymentController.js
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    let { repair_id, amount, payment_method, receipt_no, bill_no } = req.body;
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    repair_id = parseInt(repair_id);
    if (isNaN(repair_id)) {
      return res.status(400).json({ message: 'Invalid repair ID' });
    }

    const bill = await Bill.findByRepairId(repair_id);
    if (!bill) return res.status(400).json({ message: 'Bill not found' });

    const payment = await Payment.create({
      repair_id,
      amount,
      payment_method,
      receipt_no: receipt_no || null,
      bill_no: bill_no || null
    });

    await Bill.updatePaidAmount(bill.bill_id, amount);
    const updatedBill = await Bill.findById(bill.bill_id);

    res.status(201).json({ payment, bill: updatedBill });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({ message: error.message });
  }
};

const getPaymentsByRepair = async (req, res) => {
  try {
    const payments = await Payment.findByRepairId(req.params.repairId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, createPayment, getPaymentsByRepair };