/**
 * Quotation Routes
 * Handles generation of quotation PDFs based on user selections
 * SuiteCRM-inspired professional quotation system
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { generateQuotationTemplate } from '../utils/pdfGenerator.js';

const router = express.Router();

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'crmdb@21',
  ssl: (process.env.DB_SSL === 'true') ? true : false
});

/**
 * POST /api/quotations/generate
 * Generate a quotation PDF
 * Expects request body with:
 *  - quotationId (string)
 *  - customerName (string)
 *  - customerEmail (string)
 *  - items (array of { description, qty, price })
 *  - gstRate (number, e.g., 18)
 *  - terms (array of strings)
 */
router.post('/generate', async (req, res) => {
  try {
    const quotation = req.body;

    if (!quotation || !quotation.items || quotation.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quotation must include at least one item' 
      });
    }

    // Company info - ideally fetched from DB or config
    const companyInfo = {
      name: 'ASP Cranes Pvt. Ltd.',
      email: 'sales@aspcranes.com',
      phone: '+91 99999 88888',
      address: 'Pune, Maharashtra',
    };

    // Generate PDF
    const pdfBuffer = await generateQuotationTemplate(quotation, companyInfo);

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation_${quotation.quotationId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating quotation:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate quotation PDF' 
    });
  }
});

/**
 * GET /api/quotations
 * Get all quotations with basic info for SuiteCRM-style listing
 */
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT q.*, c.name as customer_name, d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.deal_id = d.id
        ORDER BY q.created_at DESC;
      `);
      
      const quotations = result.rows.map(q => ({
        id: q.id,
        quotationId: q.id,
        customerName: q.customer_name || q.customer_name,
        dealTitle: q.deal_title,
        totalCost: q.total_cost,
        status: q.status,
        createdAt: q.created_at,
        machineType: q.machine_type,
        orderType: q.order_type,
        numberOfDays: q.number_of_days
      }));
      
      return res.status(200).json({
        success: true,
        data: quotations
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * GET /api/quotations/:id
 * Get quotation by ID for SuiteCRM-style detailed view
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const quotationResult = await client.query(`
        SELECT q.*, c.name as customer_name, c.email as customer_email,
               c.phone as customer_phone, d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.deal_id = d.id
        WHERE q.id = $1;
      `, [id]);
      
      if (quotationResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Quotation not found' 
        });
      }
      
      const quotation = quotationResult.rows[0];
      
      // Get associated machines
      const machinesResult = await client.query(`
        SELECT qm.*, e.name as equipment_name, e.category
        FROM quotation_machines qm
        LEFT JOIN equipment e ON qm.equipment_id = e.id
        WHERE qm.quotation_id = $1;
      `, [id]);
      
      const transformedQuotation = {
        id: quotation.id,
        quotationId: quotation.id,
        customerName: quotation.customer_name,
        customerEmail: quotation.customer_email,
        customerPhone: quotation.customer_phone,
        dealTitle: quotation.deal_title,
        machineType: quotation.machine_type,
        orderType: quotation.order_type,
        numberOfDays: quotation.number_of_days,
        totalCost: quotation.total_cost,
        status: quotation.status,
        createdAt: quotation.created_at,
        items: machinesResult.rows.map(machine => ({
          description: machine.equipment_name || 'Equipment',
          qty: machine.quantity || 1,
          price: machine.base_rate || 0
        })),
        gstRate: 18, // Default GST rate
        terms: [
          'Payment Terms: 50% advance, balance on completion',
          'Equipment delivery within 2-3 working days from advance payment',
          'Fuel charges extra as per actual consumption',
          'All rates are subject to site conditions and accessibility',
          'This quotation is valid for 15 days from date of issue'
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: transformedQuotation
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/quotations
 * Create a new quotation in the system
 */
router.post('/', async (req, res) => {
  try {
    const quotationData = req.body;
    
    // Validate required fields
    const requiredFields = ['customerName', 'items'];
    const missingFields = requiredFields.filter(field => 
      !quotationData[field] || (Array.isArray(quotationData[field]) && quotationData[field].length === 0)
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    const client = await pool.connect();
    
    try {
      const id = uuidv4();
      
      // Calculate total cost from items
      const totalCost = quotationData.items.reduce((sum, item) => {
        const itemTotal = (item.qty || 0) * (item.price || 0);
        return sum + itemTotal;
      }, 0);
      
      // Apply GST
      const gstRate = quotationData.gstRate || 18;
      const gstAmount = totalCost * (gstRate / 100);
      const finalTotal = totalCost + gstAmount;
      
      // Insert quotation
      const insertQuery = `
        INSERT INTO quotations (
          id, customer_name, machine_type, order_type, number_of_days,
          total_cost, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      const values = [
        id,
        quotationData.customerName,
        quotationData.machineType || 'Mixed Equipment',
        quotationData.orderType || 'rental',
        quotationData.numberOfDays || 1,
        finalTotal,
        'draft'
      ];
      
      await client.query(insertQuery, values);
      
      // Insert items as quotation machines
      if (quotationData.items && quotationData.items.length > 0) {
        for (const item of quotationData.items) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate
            ) VALUES ($1, $2, $3, $4)
          `, [
            id,
            item.equipmentId || null,
            item.qty || 1,
            item.price || 0
          ]);
        }
      }
      
      return res.status(201).json({ 
        success: true,
        message: 'Quotation created successfully',
        data: { id, quotationId: id, totalCost: finalTotal }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/quotations/:id/status
 * Update quotation status (draft, sent, approved, rejected)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE quotations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
        RETURNING id, status
      `, [status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation status updated successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating quotation status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/quotations/:id
 * Delete a quotation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Delete quotation machines first
      await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
      
      // Delete the quotation
      const result = await client.query('DELETE FROM quotations WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Quotation not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation deleted successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
