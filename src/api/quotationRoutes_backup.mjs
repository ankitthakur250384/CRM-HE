/**
 * Quotation API Routes
 * Handles CRUD operations for quotations using the comprehensive schema
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Database configuration
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

// Import authentication middleware from central file
import { authenticateToken } from '../authMiddleware.mjs';

// Check if quotations table exists (it should already exist from schema.sql)
const checkQuotationsTable = async () => {
  const client = await pool.connect();
  
  try {
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ Quotations table exists');
    } else {
      console.log('❌ Quotations table does not exist. Please run the schema.sql file first.');
    }
  } catch (error) {
    console.error('Error checking quotations table:', error);
  } finally {
    client.release();
  }
};

// Check the quotations table
checkQuotationsTable().catch(console.error);

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT q.*, c.name as customer_name, d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.lead_id = d.id
        ORDER BY q.created_at DESC;
      `);
      
      // Transform quotations for frontend
      const transformedQuotations = result.rows.map(q => ({
        id: q.id,
        leadId: q.lead_id,
        customerId: q.customer_id,
        customerName: q.customer_name || q.customer_name,
        machineType: q.machine_type,
        orderType: q.order_type,
        numberOfDays: q.number_of_days,
        totalRent: q.total_rent,
        status: q.status,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        customerContact: q.customer_contact || {},
        dealTitle: q.deal_title
      }));
      
      return res.status(200).json({
        success: true,
        data: transformedQuotations
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

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Get quotation details
      const quotationResult = await client.query(`
        SELECT q.*, c.name as customer_name, c.email as customer_email,
               c.phone as customer_phone, d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.lead_id = d.id
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
        SELECT qm.*, e.equipment_id, e.name as equipment_name, e.category,
               e.max_lifting_capacity, e.unladen_weight
        FROM quotation_machines qm
        LEFT JOIN equipment e ON qm.equipment_id = e.id
        WHERE qm.quotation_id = $1;
      `, [id]);
      
      // Transform the quotation data to match frontend expectations
      const transformedQuotation = {
        id: quotation.id,
        leadId: quotation.lead_id,
        customerId: quotation.customer_id,
        customerName: quotation.customer_name,
        machineType: quotation.machine_type,
        orderType: quotation.order_type,
        numberOfDays: quotation.number_of_days,
        workingHours: quotation.working_hours,
        foodResources: quotation.food_resources,
        accomResources: quotation.accom_resources,
        siteDistance: quotation.site_distance,
        usage: quotation.usage,
        riskFactor: quotation.risk_factor,
        shift: quotation.shift,
        dayNight: quotation.day_night,
        mobDemob: quotation.mob_demob,
        mobRelaxation: quotation.mob_relaxation,
        extraCharge: quotation.extra_charge,
        otherFactorsCharge: quotation.other_factors_charge,
        billing: quotation.billing,
        includeGst: quotation.include_gst,
        sundayWorking: quotation.sunday_working,
        customerContact: quotation.customer_contact || {},
        incidentalCharges: quotation.incidental_charges || [],
        otherFactors: quotation.other_factors || [],
        totalRent: quotation.total_rent,
        workingCost: quotation.working_cost,
        mobDemobCost: quotation.mob_demob_cost,
        foodAccomCost: quotation.food_accom_cost,
        usageLoadFactor: quotation.usage_load_factor,
        riskAdjustment: quotation.risk_adjustment,
        gstAmount: quotation.gst_amount,
        version: quotation.version,
        createdBy: quotation.created_by,
        status: quotation.status,
        createdAt: quotation.created_at,
        updatedAt: quotation.updated_at,
        // Transform machines data to match frontend expectations
        selectedMachines: machinesResult.rows.map(machine => ({
          id: machine.equipment_id,
          equipmentId: machine.equipment_id,
          name: machine.equipment_name,
          machineType: quotation.machine_type,
          baseRate: machine.base_rate,
          runningCostPerKm: machine.running_cost_per_km,
          quantity: machine.quantity,
          baseRates: {
            micro: machine.base_rate,
            small: machine.base_rate,
            monthly: machine.base_rate,
            yearly: machine.base_rate
          }
        })),
        // For backwards compatibility, also set selectedEquipment
        selectedEquipment: machinesResult.rows.length > 0 ? {
          id: machinesResult.rows[0].equipment_id,
          equipmentId: machinesResult.rows[0].equipment_id,
          name: machinesResult.rows[0].equipment_name,
          baseRates: {
            micro: machinesResult.rows[0].base_rate,
            small: machinesResult.rows[0].base_rate,
            monthly: machinesResult.rows[0].base_rate,
            yearly: machinesResult.rows[0].base_rate
          }
        } : null
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

// Create new quotation
router.post('/', async (req, res) => {
  try {
    const quotationData = req.body;
    console.log('Received quotation data:', JSON.stringify(quotationData, null, 2));
    
    // Validate required fields based on the schema
    const requiredFields = [
      'customerName', 'machineType', 'orderType', 'numberOfDays', 
      'workingHours', 'foodResources', 'accomResources', 'siteDistance',
      'usage', 'riskFactor', 'shift', 'dayNight', 'billing', 'customerContact'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = quotationData[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    const client = await pool.connect();
    
    try {
      const id = uuidv4();
      
      // Insert quotation with comprehensive schema fields
      const insertQuery = `
        INSERT INTO quotations (
          id, lead_id, customer_id, customer_name, machine_type, order_type,
          number_of_days, working_hours, food_resources, accom_resources,
          site_distance, usage, risk_factor, shift, day_night, mob_demob,
          mob_relaxation, extra_charge, other_factors_charge, billing,
          include_gst, sunday_working, customer_contact, incidental_charges,
          other_factors, total_rent, working_cost, mob_demob_cost,
          food_accom_cost, usage_load_factor, risk_adjustment, gst_amount,
          version, created_by, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `;
      
      const values = [
        id,
        quotationData.leadId || null,
        quotationData.customerId || null,
        quotationData.customerName,
        quotationData.machineType,
        quotationData.orderType,
        quotationData.numberOfDays,
        quotationData.workingHours,
        quotationData.foodResources || 0,
        quotationData.accomResources || 0,
        quotationData.siteDistance || 0,
        quotationData.usage,
        quotationData.riskFactor,
        quotationData.shift,
        quotationData.dayNight,
        quotationData.mobDemob || 0,
        quotationData.mobRelaxation || 0,
        quotationData.extraCharge || 0,
        quotationData.otherFactorsCharge || 0,
        quotationData.billing,
        quotationData.includeGst || true,
        quotationData.sundayWorking || 'no',
        JSON.stringify(quotationData.customerContact || {}),
        JSON.stringify(quotationData.incidentalCharges || []),
        JSON.stringify(quotationData.otherFactors || []),
        quotationData.totalRent || 0,
        quotationData.workingCost || 0,
        quotationData.mobDemobCost || 0,
        quotationData.foodAccomCost || 0,
        quotationData.usageLoadFactor || 0,
        quotationData.riskAdjustment || 0,
        quotationData.gstAmount || 0,
        quotationData.version || 1,
        quotationData.createdBy || req.user?.id || req.user?.uid,
        quotationData.status || 'draft'
      ];
      
      console.log('Executing insert query with values:', values.slice(0, 10), '...'); // Log first 10 values
      
      await client.query(insertQuery, values);
      
      // Also insert quotation machines if they exist
      if (quotationData.selectedMachines && quotationData.selectedMachines.length > 0) {
        for (const machine of quotationData.selectedMachines) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5);
          `, [
            id,
            machine.id,
            machine.quantity || 1,
            machine.baseRate || 0,
            machine.runningCostPerKm || 0
          ]);
        }
      }
      
      console.log('✅ Quotation created successfully with ID:', id);
      
      return res.status(201).json({ 
        success: true,
        message: 'Quotation created successfully',
        data: { id }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quotationData = req.body;
    console.log('Updating quotation with data:', JSON.stringify(quotationData, null, 2));
    
    // Validate required fields
    const requiredFields = [
      'customerName', 'machineType', 'orderType', 'numberOfDays', 
      'workingHours', 'foodResources', 'accomResources', 'siteDistance',
      'usage', 'riskFactor', 'shift', 'dayNight', 'billing'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = quotationData[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Quotation not found' 
        });
      }
      
      // Update quotation with comprehensive schema fields
      const updateQuery = `
        UPDATE quotations SET
          lead_id = $2, customer_id = $3, customer_name = $4, machine_type = $5,
          order_type = $6, number_of_days = $7, working_hours = $8,
          food_resources = $9, accom_resources = $10, site_distance = $11,
          usage = $12, risk_factor = $13, shift = $14, day_night = $15,
          mob_demob = $16, mob_relaxation = $17, extra_charge = $18,
          other_factors_charge = $19, billing = $20, include_gst = $21,
          sunday_working = $22, customer_contact = $23, incidental_charges = $24,
          other_factors = $25, total_rent = $26, working_cost = $27,
          mob_demob_cost = $28, food_accom_cost = $29, usage_load_factor = $30,
          risk_adjustment = $31, gst_amount = $32, version = $33, status = $34,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `;
      
      const values = [
        id,
        quotationData.leadId || null,
        quotationData.customerId || null,
        quotationData.customerName,
        quotationData.machineType,
        quotationData.orderType,
        quotationData.numberOfDays,
        quotationData.workingHours,
        quotationData.foodResources || 0,
        quotationData.accomResources || 0,
        quotationData.siteDistance || 0,
        quotationData.usage,
        quotationData.riskFactor,
        quotationData.shift,
        quotationData.dayNight,
        quotationData.mobDemob || 0,
        quotationData.mobRelaxation || 0,
        quotationData.extraCharge || 0,
        quotationData.otherFactorsCharge || 0,
        quotationData.billing,
        quotationData.includeGst || true,
        quotationData.sundayWorking || 'no',
        JSON.stringify(quotationData.customerContact || {}),
        JSON.stringify(quotationData.incidentalCharges || []),
        JSON.stringify(quotationData.otherFactors || []),
        quotationData.totalRent || 0,
        quotationData.workingCost || 0,
        quotationData.mobDemobCost || 0,
        quotationData.foodAccomCost || 0,
        quotationData.usageLoadFactor || 0,
        quotationData.riskAdjustment || 0,
        quotationData.gstAmount || 0,
        quotationData.version || 1,
        quotationData.status || 'draft'
      ];
      
      await client.query(updateQuery, values);
      
      // Update quotation machines - delete existing and insert new ones
      if (quotationData.selectedMachines && quotationData.selectedMachines.length > 0) {
        // Delete existing machines for this quotation
        await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
        
        // Insert updated machines
        for (const machine of quotationData.selectedMachines) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5);
          `, [
            id,
            machine.id,
            machine.quantity || 1,
            machine.baseRate || 0,
            machine.runningCostPerKm || 0
          ]);
        }
      }
      
      console.log('✅ Quotation updated successfully');
      
      return res.status(200).json({ 
        success: true,
        message: 'Quotation updated successfully' 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error updating quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Check if quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Quotation not found' 
        });
      }
      
      // Delete quotation machines first (foreign key constraint)
      await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
      
      // Delete the quotation
      await client.query('DELETE FROM quotations WHERE id = $1', [id]);
      
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
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

export default router;
