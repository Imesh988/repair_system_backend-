const Bill = require('../models/Bill');
const Repair = require('../models/Repair');
const RepairItem = require('../models/RepairItem');
const { generateBillNo } = require('../utils/generateBillNo');
const { pool } = require('../db/db');

const generateBill = async (req, res) => {
  try {
    let { repair_id, discount, tax } = req.body;
    discount = parseFloat(discount) || 0;
    tax = parseFloat(tax) || 0;
    repair_id = parseInt(repair_id);

    if (isNaN(repair_id)) {
      return res.status(400).json({ message: 'Invalid repair ID' });
    }

    const existingBill = await Bill.findByRepairId(repair_id);
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already generated' });
    }

    const repair = await Repair.findById(repair_id);
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    if (!repair.final_cost && repair.final_cost !== 0) {
      await Repair.updateFinalCost(repair_id);
    }
    const updatedRepair = await Repair.findById(repair_id);
    const totalAmount = updatedRepair.final_cost || 0;

    const bill_no = await generateBillNo(pool);
    
    const bill = await Bill.create({
      repair_id,
      bill_no,
      total_amount: totalAmount,
      discount,
      tax,
      paid_amount: 0,
      notes: null
    });
    
    res.status(201).json(bill);
  } catch (error) {
    console.error('Bill generation error:', error);
    res.status(400).json({ message: error.message });
  }
};

const getBills = async (req, res) => {
  try {
    const bills = await Bill.findAll();
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    
    const items = await RepairItem.findByRepairId(bill.repair_id);
    const repair = await Repair.findById(bill.repair_id);
    
    res.json({ 
      ...bill, 
      items,
      labor_cost: repair?.labor_cost || 0,
      technician_name: repair?.technician_name || null,
      ticket_no: repair?.ticket_no,
      device_problem: repair?.problem_description,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOutstandingBills = async (req, res) => {
  try {
    const bills = await Bill.getOutstandingBills();
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBills, getBillById, generateBill, getOutstandingBills };