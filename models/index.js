// backend/models/index.js
const Customer = require('./Customer');
const Device = require('./Device');
const Repair = require('./Repair');
const RepairItem = require('./RepairItem');
const Inventory = require('./Inventory');
const Bill = require('./Bill');
const Payment = require('./Payment');
const Employee = require('./Employee');
const Supplier = require('./Supplier');
const Warranty = require('./Warranty');
const Expense = require('./Expense');

module.exports = {
  Customer,
  Device,
  Repair,
  RepairItem,
  Inventory,
  Bill,
  Payment,
  Employee,
  Supplier,
  Warranty,
  Expense
};