const BillGeneratedModel = require('../models/BillGeneratedModel');

exports.getAllGenerated = async (req, res) => {
    try {
        const repairIds = await BillGeneratedModel.getAllGeneratedRepairIds();
        res.json(repairIds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.hasGenerated = async (req, res) => {
    try {
        const { repairId } = req.params;
        const has = await BillGeneratedModel.hasBillGenerated(repairId);
        res.json({ has_bill: has });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createGenerated = async (req, res) => {
    try {
        const { repair_id, bill_id } = req.body;
        const existing = await BillGeneratedModel.hasBillGenerated(repair_id);
        if (existing) {
            return res.status(400).json({ message: 'Bill already generated' });
        }
        await BillGeneratedModel.create(repair_id, bill_id);
        res.status(201).json({ message: 'Record created' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteGenerated = async (req, res) => {
    try {
        const { repairId } = req.params;
        await BillGeneratedModel.delete(repairId);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};