// backend/controllers/inventoryController.js
const Inventory = require('../models/Inventory');

const getInventory = async (req, res) => {
  try {
    const parts = await Inventory.findAll();
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPartById = async (req, res) => {
  try {
    const part = await Inventory.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPart = async (req, res) => {
  try {
    const part = await Inventory.create(req.body);
    res.status(201).json(part);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePart = async (req, res) => {
  try {
    const part = await Inventory.update(req.params.id, req.body);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.json(part);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePart = async (req, res) => {
  try {
    const deleted = await Inventory.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStock = async (req, res) => {
  try {
    const parts = await Inventory.getLowStock();
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  getLowStock
};