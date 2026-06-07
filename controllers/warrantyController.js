const PDFDocument = require('pdfkit');
const Warranty = require('../models/Warranty');
const Repair = require('../models/Repair');

const generateWarrantyPDF = async (req, res) => {
  try {
    const { repairId } = req.params;
    console.log('Generating warranty for repair ID:', repairId);

    const warranty = await Warranty.findByRepairId(repairId);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found for this repair' });
    }

    const repair = await Repair.findById(repairId);
    if (!repair) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    console.log('Repair data:', {
      ticket_no: repair.ticket_no,
      customer_name: repair.customer_name,
      brand: repair.brand,
      model: repair.model,
      imei: repair.imei,
      completed_date: repair.completed_date
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'portrait' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=warranty_${repair.ticket_no}.pdf`);
    doc.pipe(res);

    // Company details
    const company = {
      name: 'AR COMPUTERS (PVT) LTD',
      address: 'No.84 Siriwardana Road, Deraniyagala',
      phone1: '072 230 6895',
      phone2: '077 268 0664',
      email: 'arcomputersp@gmail.com'
    };

    // Decorative borders
    doc.save();
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#d4af37');
    doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#d4af37');

    // Header bar
    doc.rect(0, 0, doc.page.width, 80).fill('#1a2a6c');
    doc.fillColor('#ffffff');
    doc.fontSize(26).font('Helvetica-Bold').text('WARRANTY CERTIFICATE', 0, 25, { align: 'center' });
    doc.fontSize(10).text('Valid only for repair services', 0, 55, { align: 'center' });

    // Company info
    doc.fillColor('#2c3e50');
    doc.fontSize(12).font('Helvetica-Bold').text(company.name, 50, 100);
    doc.fontSize(9).font('Helvetica');
    doc.text(company.address, 50, 118);
    doc.text(`Tel: ${company.phone1} / ${company.phone2}`, 50, 132);
    doc.text(`Email: ${company.email}`, 50, 146);
    doc.moveDown(1);

    // Certificate content
    doc.fillColor('#333333');
    doc.fontSize(14).font('Helvetica-Bold').text('This certificate acknowledges that', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-BoldOblique').fillColor('#1a2a6c').text(repair.customer_name || 'Valued Customer', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#333').text('has been provided with a repair warranty for the following device:', { align: 'center' });
    doc.moveDown();

    // Device details box
    doc.rect(70, doc.y, doc.page.width - 140, 80).fill('#f8f9fa').stroke('#d4af37');
    doc.fillColor('#2c3e50');
    doc.fontSize(12).font('Helvetica-Bold').text('Device Details', 80, doc.y - 75);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Model: ${repair.brand || 'N/A'} ${repair.model || ''}`, 80, doc.y - 58);
    doc.text(`IMEI: ${repair.imei || 'N/A'}`, 80, doc.y - 45);
    doc.text(`Repair Ticket: ${repair.ticket_no || 'N/A'}`, 80, doc.y - 32);
    doc.text(`Completed Date: ${repair.completed_date ? new Date(repair.completed_date).toLocaleDateString() : 'N/A'}`, 80, doc.y - 19);
    doc.moveDown();

    // Warranty terms box
    doc.rect(70, doc.y, doc.page.width - 140, 110).fill('#f0f4f8').stroke('#2c3e50');
    doc.fillColor('#1a2a6c');
    doc.fontSize(12).font('Helvetica-Bold').text('WARRANTY TERMS', 80, doc.y - 100);
    doc.fillColor('#333');
    doc.fontSize(10).font('Helvetica');
    doc.text(`• Warranty Period: ${warranty.warranty_period_months} months`, 80, doc.y - 80);
    doc.text(`• Start Date: ${new Date(warranty.start_date).toLocaleDateString()}`, 80, doc.y - 65);
    doc.text(`• End Date: ${new Date(warranty.end_date).toLocaleDateString()}`, 80, doc.y - 50);
    doc.text(`• ${warranty.terms || 'Standard warranty covers manufacturing defects and repair workmanship.'}`, 80, doc.y - 35, { width: doc.page.width - 160 });
    doc.moveDown();

    // Additional notes
    doc.fillColor('#555');
    doc.fontSize(9).text('For claims, please present this certificate along with the original repair bill.', { align: 'center' });
    doc.moveDown();

    // Signature line
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Authorized Signature', doc.page.width - 200, doc.y);
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica');
    doc.text('(Seal / Stamp)', doc.page.width - 200, doc.y);
    doc.text('_________________________', doc.page.width - 210, doc.y - 10);

    // Footer
    doc.fillColor('#aaa');
    doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text('This is a system-generated certificate and does not require a physical signature.', { align: 'center' });
    doc.text(`${company.name} - ${company.address}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating warranty PDF:', error);
    res.status(500).json({ message: 'Failed to generate warranty PDF: ' + error.message });
  }
};

module.exports = { generateWarrantyPDF };