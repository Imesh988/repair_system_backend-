// backend/utils/generateBillNo.js
const generateBillNo = async (pool) => {
  const [rows] = await pool.query("SELECT bill_no FROM bills ORDER BY bill_id DESC LIMIT 1");
  let lastNumber = 0;
  if (rows.length > 0) {
    const match = rows[0].bill_no.match(/\d+$/);
    if (match) lastNumber = parseInt(match[0]);
  }
  const newNumber = lastNumber + 1;
  return `BILL-${String(newNumber).padStart(6, '0')}`;
};

const generateTicketNo = async (pool) => {
  const [rows] = await pool.query("SELECT ticket_no FROM repairs ORDER BY repair_id DESC LIMIT 1");
  let lastNumber = 0;
  if (rows.length > 0) {
    const match = rows[0].ticket_no.match(/\d+$/);
    if (match) lastNumber = parseInt(match[0]);
  }
  const newNumber = lastNumber + 1;
  return `RPR-${String(newNumber).padStart(6, '0')}`;
};

module.exports = { generateBillNo, generateTicketNo };