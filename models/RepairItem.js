const { pool } = require('../db/db');
const Inventory = require('./Inventory');
const Repair = require('./Repair');

class RepairItem {
  static async findByRepairId(repairId) {
    const [rows] = await pool.query(`
      SELECT ri.*, i.part_name, i.category
      FROM repair_items ri
      JOIN inventory i ON ri.part_id = i.part_id
      WHERE ri.repair_id = ?
    `, [repairId]);
    return rows;
  }

  static async create(repairItemData) {
    const { repair_id, part_id, quantity_used, price_at_time } = repairItemData;
    
    const part = await Inventory.findById(part_id);
    if (!part) throw new Error('Part not found');
    if (part.quantity < quantity_used) throw new Error('Insufficient stock');

    let finalPrice = price_at_time || part.selling_price;
    finalPrice = Repair.parsePrice(finalPrice);

    const [result] = await pool.query(
      'INSERT INTO repair_items (repair_id, part_id, quantity_used, price_at_time) VALUES (?, ?, ?, ?)',
      [repair_id, part_id, quantity_used, finalPrice]
    );

    await Inventory.updateQuantity(part_id, part.quantity - quantity_used);
    await Repair.updateFinalCost(repair_id);
    
    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT ri.*, i.part_name, i.category
      FROM repair_items ri
      JOIN inventory i ON ri.part_id = i.part_id
      WHERE ri.repair_item_id = ?
    `, [id]);
    return rows[0];
  }

 static async delete(id) {
  console.log('=== RepairItem.delete called with id:', id);
  const item = await this.findById(id);
  console.log('Found item:', item);
  if (!item) return false;
  
  const part = await Inventory.findById(item.part_id);
  console.log('Part before quantity restore:', part);
  
  await pool.query('DELETE FROM repair_items WHERE repair_item_id = ?', [id]);
  console.log('Deleted repair_item from DB');
  
  if (part) {
    const newQuantity = part.quantity + item.quantity_used;
    await Inventory.updateQuantity(item.part_id, newQuantity);
    console.log(`Restored part quantity: ${part.quantity} -> ${newQuantity}`);
  }
  
  console.log('About to call Repair.updateFinalCost for repair_id:', item.repair_id);
  const newFinalCost = await Repair.updateFinalCost(item.repair_id);
  console.log('updateFinalCost returned:', newFinalCost);
  return true;
}

  static async deleteByRepairId(repairId) {
    const items = await this.findByRepairId(repairId);
    for (const item of items) {
      const part = await Inventory.findById(item.part_id);
      if (part) {
        await Inventory.updateQuantity(item.part_id, part.quantity + item.quantity_used);
      }
    }
    await pool.query('DELETE FROM repair_items WHERE repair_id = ?', [repairId]);
    await Repair.updateFinalCost(repairId);
  }
}

module.exports = RepairItem;