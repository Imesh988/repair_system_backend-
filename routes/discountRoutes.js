const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.get('/', discountController.getAllDiscounts);
router.get('/repair/:repairId', discountController.getDiscountByRepair);
router.post('/repair/:repairId', discountController.saveDiscount);
router.delete('/repair/:repairId', discountController.removeDiscount);

module.exports = router;