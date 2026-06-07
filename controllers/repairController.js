// backend/controllers/repairController.js

const Repair = require('../models/Repair');
const RepairItem = require('../models/RepairItem');
const Device = require('../models/Device');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Warranty = require('../models/Warranty');
const { generateTicketNo } = require('../utils/generateBillNo');
const { pool } = require('../db/db');

const getRepairs = async (req, res) => {
  try {
    const repairs = await Repair.findAll();
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Repair not found' });
    const items = await RepairItem.findByRepairId(req.params.id);
    const payments = await Payment.findByRepairId(req.params.id);
    const bill = await Bill.findByRepairId(req.params.id);
    const warranty = await Warranty.findByRepairId(req.params.id);
    res.json({ ...repair, items, payments, bill, warranty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRepair = async (req, res) => {
  try {
    const { device_id, technician_id, estimated_cost, notes } = req.body;
    const ticket_no = await generateTicketNo(pool);
    const repair = await Repair.create({
      ticket_no,
      device_id,
      technician_id,
      estimated_cost: estimated_cost || 0,
      notes
    });
    res.status(201).json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRepair = async (req, res) => {
  try {
    const repair = await Repair.update(req.params.id, req.body);
    if (!repair) return res.status(404).json({ message: 'Repair not found' });
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRepairStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const repair = await Repair.updateStatus(req.params.id, status);
    if (!repair) return res.status(404).json({ message: 'Repair not found' });
    res.json(repair);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addRepairItem = async (req, res) => {
  try {
    const { repair_id, part_id, quantity_used, price_at_time } = req.body;
    const item = await RepairItem.create({ repair_id, part_id, quantity_used, price_at_time });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeRepairItem = async (req, res) => {
  try {
    const deleted = await RepairItem.delete(req.params.itemId);
    if (!deleted) return res.status(404).json({ message: 'Repair item not found' });
    res.json({ message: 'Repair item removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRepairItems = async (req, res) => {
  try {
    const items = await RepairItem.findByRepairId(req.params.repairId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeRepair = async (req, res) => {
  try {
    let { labor_cost, final_cost } = req.body;
    labor_cost = parseFloat(labor_cost) || 0;
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Repair not found' });
    let finalCost = final_cost;
    if (finalCost === undefined || finalCost === null || finalCost === 0) {
      const partsTotal = await Repair.getPartsTotal(req.params.id);
      const estCost = parseFloat(repair.estimated_cost) || 0;
      finalCost = estCost + partsTotal + labor_cost;
    }
    await Repair.update(req.params.id, {
      labor_cost: labor_cost,
      final_cost: finalCost,
      completed_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });
    const warrantyEndDate = new Date();
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + 3);
    await Warranty.create({
      repair_id: req.params.id,
      warranty_period_months: 3,
      start_date: new Date().toISOString().split('T')[0],
      end_date: warrantyEndDate.toISOString().split('T')[0],
      terms: 'Standard 3 months warranty on repair'
    });
    res.json({ message: 'Repair completed successfully', final_cost: finalCost });
  } catch (error) {
    console.error('Complete repair error:', error);
    res.status(500).json({ message: error.message });
  }
};

const collectRepair = async (req, res) => {
  try {
    const { collected_date } = req.body;
    const bill = await Bill.findByRepairId(req.params.id);
    if (bill && (bill.total_amount - bill.paid_amount) > 0) {
      return res.status(400).json({ message: 'Cannot collect. Outstanding balance exists.' });
    }
    const repair = await Repair.update(req.params.id, {
      collected_date: collected_date || new Date().toISOString().split('T')[0],
      status: 'collected'
    });
    res.json({ message: 'Device collected successfully', repair });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRepairs,
  getRepairById,
  createRepair,
  updateRepair,
  updateRepairStatus,
  addRepairItem,
  removeRepairItem,
  getRepairItems,
  completeRepair,
  collectRepair
};