const DiscountModel = require('../models/DiscountModel');

exports.getAllDiscounts = async (req, res) => {
    try {
        const discounts = await DiscountModel.getAll();
        res.json(discounts);
    } catch (error) {
        console.error('GET /discounts error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getDiscountByRepair = async (req, res) => {
    try {
        const { repairId } = req.params;
        const discount = await DiscountModel.findByRepairId(repairId);
        res.json(discount || {});
    } catch (error) {
        console.error('GET /discounts/repair/:id error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.saveDiscount = async (req, res) => {
    try {
        const { repairId } = req.params;
        const { discount_type, discount_value, applied_by } = req.body;

        if (!['percentage', 'fixed'].includes(discount_type)) {
            return res.status(400).json({ message: 'Invalid discount type' });
        }
        if (discount_value <= 0) {
            return res.status(400).json({ message: 'Discount value must be positive' });
        }

        await DiscountModel.upsert(repairId, discount_type, discount_value, applied_by || null);
        const updated = await DiscountModel.findByRepairId(repairId);
        res.json(updated);
    } catch (error) {
        console.error('POST /discounts/repair/:id error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.removeDiscount = async (req, res) => {
    try {
        const { repairId } = req.params;
        const deleted = await DiscountModel.delete(repairId);
        if (!deleted) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        res.json({ message: 'Discount removed' });
    } catch (error) {
        console.error('DELETE /discounts/repair/:id error:', error);
        res.status(500).json({ message: error.message });
    }
};