/**
 * Quotation API Routes
 * Handles CRUD operations for quotations using the comprehensive schema
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dealRepository from '../services/postgres/dealRepository.js';

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

// Check the quotations table - commented out for production deployment
// checkQuotationsTable().catch(console.error);

// Apply authentication middleware to all routes
// Apply authentication to all routes except health check and test creation
router.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/' && req.query.test === 'true') {
    // Skip authentication for test creation
    next();
  } else {
    authenticateToken(req, res, next);
  }
});

// Get all quotations
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
      
      // Transform quotations for frontend and fetch machines for each quotation
      const transformedQuotations = [];
      
      for (const q of result.rows) {
        // Fetch machines for this quotation
        const machinesResult = await client.query(`
          SELECT qm.*, e.name as equipment_name, e.category as equipment_category
          FROM quotation_machines qm
          LEFT JOIN equipment e ON qm.equipment_id = e.id
          WHERE qm.quotation_id = $1
        `, [q.id]);
        
        const selectedMachines = machinesResult.rows.map(m => ({
          id: m.equipment_id,
          name: m.equipment_name,
          category: m.equipment_category,
          quantity: m.quantity,
          baseRate: m.base_rate,
          runningCostPerKm: m.running_cost_per_km
        }));
        
        transformedQuotations.push({
          id: q.id,
          dealId: q.deal_id,
          leadId: q.lead_id,
          customerId: q.customer_id,
          customerName: q.customer_name || q.customer_name,
          machineType: q.machine_type,
          orderType: q.order_type,
          numberOfDays: q.number_of_days,
          totalRent: q.total_rent,
          totalCost: q.total_cost, // Add total_cost for quotation value display
          status: q.status,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
          customerContact: q.customer_contact || {},
          dealTitle: q.deal_title,
          selectedMachines: selectedMachines,
          // For backward compatibility, if no machines in junction table, use machineType
          selectedEquipment: selectedMachines.length === 0 && q.machine_type ? {
            name: q.machine_type
          } : null
        });
      }
      
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
        SELECT qm.*, e.equipment_id, e.name as equipment_name, e.category,
               e.max_lifting_capacity, e.unladen_weight
        FROM quotation_machines qm
        LEFT JOIN equipment e ON qm.equipment_id = e.id
        WHERE qm.quotation_id = $1;
      `, [id]);
      
      // Transform the quotation data to match frontend expectations
      const transformedQuotation = {
        id: quotation.id,
        dealId: quotation.deal_id,
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
        totalCost: quotation.total_cost, // Add total_cost to response
        totalAmount: quotation.total_cost, // Alias for frontend compatibility
        workingCost: quotation.working_cost,
        mobDemobCost: quotation.mob_demob_cost,
        foodAccomCost: quotation.food_accom_cost,
        usageLoadFactor: quotation.usage_load_factor,
        riskAdjustment: quotation.risk_adjustment,
        gstAmount: quotation.gst_amount,
        // Include calculations object for frontend
        calculations: {
          baseRate: quotation.working_cost / (quotation.number_of_days * quotation.working_hours) || 0,
          totalHours: quotation.number_of_days * quotation.working_hours,
          workingCost: quotation.working_cost,
          mobDemobCost: quotation.mob_demob_cost,
          foodAccomCost: quotation.food_accom_cost,
          usageLoadFactor: quotation.usage_load_factor,
          extraCharges: quotation.extra_charge,
          riskAdjustment: quotation.risk_adjustment,
          gstAmount: quotation.gst_amount,
          totalAmount: quotation.total_cost,
        },
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
    
    console.log('🔍 Creating quotation with data:', {
      keys: Object.keys(quotationData),
      hasSelectedMachines: !!(quotationData.selectedMachines && quotationData.selectedMachines.length > 0),
      machinesCount: quotationData.selectedMachines?.length || 0,
      machineType: quotationData.machineType,
      dealId: quotationData.dealId,
      leadId: quotationData.leadId
    });
    
    const client = await pool.connect();
    
    try {
      // Handle dealId resolution - support lookup by deal ID or deal name/title
      let dealId = quotationData.dealId || req.query.dealId;
      const dealName = quotationData.dealName || req.query.dealName;
      
      // If no dealId but we have a dealName, look up the deal by name
      if (!dealId && dealName) {
        try {
          const dealByName = await dealRepository.getDealByTitle(dealName);
          if (dealByName) {
            dealId = dealByName.id;
            // Auto-populate deal info for convenience
            quotationData.dealId = dealId;
            quotationData.dealTitle = dealByName.title;
          } else {
            return res.status(400).json({
              success: false,
              message: `Deal with name "${dealName}" not found`
            });
          }
        } catch (dealLookupError) {
          console.error('Error looking up deal by name:', dealLookupError);
          return res.status(500).json({
            success: false,
            message: 'Error looking up deal by name'
          });
        }
      }
      
      // Add dealId to quotationData if found in query params
      if (dealId && !quotationData.dealId) {
        quotationData.dealId = dealId;
      }
      
      // If we have a deal ID, automatically fetch customer info from the deal
      if (dealId) {        
        try {
          const dealResult = await client.query(`
            SELECT d.*, 
                   c.name as customer_name, 
                   c.email as customer_email,
                   c.phone as customer_phone,
                   c.company_name as customer_company,
                   c.address as customer_address
            FROM deals d
            LEFT JOIN customers c ON d.customer_id = c.id
            WHERE d.id = $1
          `, [dealId]);
          
          if (dealResult.rows.length > 0) {
            const deal = dealResult.rows[0];
            
            // Auto-populate customer fields (always populate when we have a deal)
            quotationData.customerName = deal.customer_name;
            quotationData.customerId = deal.customer_id;
            quotationData.customerContact = {
              name: deal.customer_name,
              email: deal.customer_email || '',
              phone: deal.customer_phone || '',
              company: deal.customer_company || '',
              address: deal.customer_address || ''
            };
            quotationData.leadId = deal.lead_id;
          }
        } catch (dealError) {
          console.error('Error fetching deal info:', dealError);
          // Continue with validation - if deal fetch fails, let normal validation handle it
        }
      }
      
      // Validate required fields based on the schema
      // Note: dealId is not always required - quotations can be for leads that haven't been converted yet
      // Also: machineType can be derived from selectedMachines if not provided
      const requiredFields = [
        'customerName', 'orderType', 'numberOfDays', 
        'workingHours', 'foodResources', 'accomResources', 'siteDistance',
        'usage', 'riskFactor', 'shift', 'dayNight', 'billing', 'customerContact'
      ];
      
      // If no selectedMachines, then machineType is required
      if (!quotationData.selectedMachines || quotationData.selectedMachines.length === 0) {
        requiredFields.push('machineType');
      }
      
      const missingFields = requiredFields.filter(field => {
        const value = quotationData[field];
        return value === undefined || value === null || value === '';
      });
      
      // Additional validation: must have either dealId or leadId
      if (!quotationData.dealId && !quotationData.leadId) {
        missingFields.push('dealId or leadId (at least one is required)');
      }
      
      if (missingFields.length > 0) {
        console.log('❌ Validation failed - missing fields:', missingFields);
        console.log('📋 Quotation data received:', quotationData);
        return res.status(400).json({ 
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Ensure we have a machineType - derive from selectedMachines if needed
      if (!quotationData.machineType && quotationData.selectedMachines && quotationData.selectedMachines.length > 0) {
        if (quotationData.selectedMachines.length === 1) {
          quotationData.machineType = quotationData.selectedMachines[0].category || quotationData.selectedMachines[0].name || 'selected_machine';
        } else {
          quotationData.machineType = 'multiple_machines';
        }
        console.log('🔧 Derived machineType:', quotationData.machineType);
      }
      
      const id = uuidv4();
      
      // Extract calculations from the frontend
      const calculations = quotationData.calculations || {};
      const totalAmount = calculations.totalAmount || quotationData.totalAmount || 0;
      
      // Insert quotation with comprehensive schema fields including total_cost
      const insertQuery = `
        INSERT INTO quotations (
          id, deal_id, lead_id, customer_id, customer_name, machine_type, order_type,
          number_of_days, working_hours, food_resources, accom_resources,
          site_distance, usage, risk_factor, shift, day_night, mob_demob,
          mob_relaxation, extra_charge, other_factors_charge, billing,
          include_gst, sunday_working, customer_contact, incidental_charges,
          other_factors, total_rent, total_cost, working_cost, mob_demob_cost,
          food_accom_cost, usage_load_factor, risk_adjustment, gst_amount,
          version, created_by, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35, $36, $37, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `;
      
      const values = [
        id,
        quotationData.dealId || null,  // deal_id
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
        JSON.stringify(quotationData.customerContact || {}), // JSONB field - needs JSON string
        quotationData.incidentalCharges || [],  // TEXT[] field - needs actual array, not JSON string
        quotationData.otherFactors || [],       // TEXT[] field - needs actual array, not JSON string
        quotationData.totalRent || totalAmount || 0,
        totalAmount, // total_cost - this is the main quotation value
        calculations.workingCost || quotationData.workingCost || 0,
        calculations.mobDemobCost || quotationData.mobDemobCost || 0,
        calculations.foodAccomCost || quotationData.foodAccomCost || 0,
        calculations.usageLoadFactor || quotationData.usageLoadFactor || 0,
        calculations.riskAdjustment || quotationData.riskAdjustment || 0,
        calculations.gstAmount || quotationData.gstAmount || 0,
        quotationData.version || 1,
        quotationData.createdBy || req.user?.id || req.user?.uid,
        quotationData.status || 'draft'
      ];
      
      
      await client.query(insertQuery, values);
      console.log('✅ Quotation inserted successfully');
      
      // Also insert quotation machines if they exist
      if (quotationData.selectedMachines && quotationData.selectedMachines.length > 0) {
        console.log(`🔧 Inserting ${quotationData.selectedMachines.length} machines...`);
        for (const machine of quotationData.selectedMachines) {
          console.log(`📦 Inserting machine: ${machine.name || machine.id}`, {
            id: machine.id,
            quantity: machine.quantity,
            baseRate: machine.baseRate
          });
          
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
        console.log('✅ All machines inserted successfully');
      } else {
        console.log('ℹ️ No selectedMachines to insert');
      }
      
      return res.status(201).json({ 
        success: true,
        message: 'Quotation created successfully',
        data: { id }
      });
    } catch (error) {
      console.error('❌ Error creating quotation:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error in quotation creation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Create new quotation from a deal
router.post('/from-deal/:dealId', async (req, res) => {
  console.log('🎯 POST /api/quotations/from-deal/:dealId called');
  console.log('Deal ID:', req.params.dealId);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const quotationData = { ...req.body };
    const dealId = req.params.dealId;
    
    // Automatically set the dealId from URL parameter
    quotationData.dealId = dealId;
    
    const client = await pool.connect();
    
    try {
      // Fetch customer info from the deal
      console.log('🔍 Fetching customer info from deal:', dealId);
      
      const dealResult = await client.query(`
        SELECT d.*, 
               c.name as customer_name, 
               c.email as customer_email,
               c.phone as customer_phone,
               c.company_name as customer_company,
               c.address as customer_address
        FROM deals d
        LEFT JOIN customers c ON d.customer_id = c.id
        WHERE d.id = $1
      `, [dealId]);
      
      if (dealResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Deal with ID ${dealId} not found`
        });
      }
      
      const deal = dealResult.rows[0];
      console.log('✅ Found deal with customer info:', deal.customer_name);
      
      // Auto-populate customer fields from deal
      quotationData.customerName = deal.customer_name;
      quotationData.customerId = deal.customer_id;
      quotationData.customerContact = {
        name: deal.customer_name,
        email: deal.customer_email || '',
        phone: deal.customer_phone || '',
        company: deal.customer_company || '',
        address: deal.customer_address || ''
      };
      quotationData.leadId = deal.lead_id;
      
      console.log('✅ Auto-populated customer info from deal');
      
      // Now proceed with quotation creation using the updated data
      return await createQuotation(quotationData, client, res);
      
    } catch (error) {
      console.error('Error in from-deal route:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in from-deal route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Shared function to create quotations
async function createQuotation(quotationData, client, res) {
  console.log('📝 Creating quotation with data:', JSON.stringify(quotationData, null, 2));
  
  // DEBUG: Check dealId specifically
  console.log('🔍 DEBUG - dealId in quotationData:', quotationData.dealId);
  console.log('🔍 DEBUG - typeof dealId:', typeof quotationData.dealId);
  console.log('🔍 DEBUG - dealId truthy check:', !!quotationData.dealId);
  
  try {
    // Validate required fields based on the schema
    // Note: dealId is not always required - quotations can be for leads that haven't been converted yet
    const requiredFields = [
      'customerName', 'machineType', 'orderType', 'numberOfDays', 
      'workingHours', 'foodResources', 'accomResources', 'siteDistance',
      'usage', 'riskFactor', 'shift', 'dayNight', 'billing', 'customerContact'
    ];
    
    const missingFields = requiredFields.filter(field => {
      const value = quotationData[field];
      return value === undefined || value === null || value === '';
    });
    
    // Additional validation: must have either dealId or leadId
    if (!quotationData.dealId && !quotationData.leadId) {
      missingFields.push('dealId or leadId (at least one is required)');
    }
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    const id = `quot_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert quotation with comprehensive schema fields
    const insertQuery = `
      INSERT INTO quotations (
        id, deal_id, lead_id, customer_id, customer_name, machine_type, order_type,
        number_of_days, working_hours, food_resources, accom_resources,
        site_distance, usage, risk_factor, shift, day_night, mob_demob,
        mob_relaxation, extra_charge, other_factors_charge, billing,
        include_gst, sunday_working, customer_contact, incidental_charges,
        other_factors, total_rent, total_cost, working_cost, mob_demob_cost,
        food_accom_cost, usage_load_factor, risk_adjustment, gst_amount,
        version, created_by, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35, $36, $37, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );
    `;
    
    // Extract calculations from the frontend
    const calculations = quotationData.calculations || {};
    const totalAmount = calculations.totalAmount || quotationData.totalAmount || 0;
    
    const values = [
      id,
      quotationData.dealId || null,  // deal_id
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
      JSON.stringify(quotationData.customerContact || {}), // JSONB field - needs JSON string
      quotationData.incidentalCharges || [],  // TEXT[] field - needs actual array, not JSON string
      quotationData.otherFactors || [],       // TEXT[] field - needs actual array, not JSON string
      quotationData.totalRent || totalAmount || 0,
      totalAmount, // total_cost - this is the main quotation value
      calculations.workingCost || quotationData.workingCost || 0,
      calculations.mobDemobCost || quotationData.mobDemobCost || 0,
      calculations.foodAccomCost || quotationData.foodAccomCost || 0,
      calculations.usageLoadFactor || quotationData.usageLoadFactor || 0,
      calculations.riskAdjustment || quotationData.riskAdjustment || 0,
      calculations.gstAmount || quotationData.gstAmount || 0,
      quotationData.version || 1,
      quotationData.createdBy || 'default_user',
      quotationData.status || 'draft'
    ];
    
    console.log('🔍 Debugging array values:');
    console.log('incidentalCharges:', quotationData.incidentalCharges, 'type:', typeof quotationData.incidentalCharges, 'isArray:', Array.isArray(quotationData.incidentalCharges));
    console.log('otherFactors:', quotationData.otherFactors, 'type:', typeof quotationData.otherFactors, 'isArray:', Array.isArray(quotationData.otherFactors));
    
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
    
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

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
          other_factors = $25, total_rent = $26, total_cost = $27, working_cost = $28,
          mob_demob_cost = $29, food_accom_cost = $30, usage_load_factor = $31,
          risk_adjustment = $32, gst_amount = $33, version = $34, status = $35,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `;
      
      // Extract calculations from the frontend
      const calculations = quotationData.calculations || {};
      const totalAmount = calculations.totalAmount || quotationData.totalAmount || 0;
      
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
        JSON.stringify(quotationData.customerContact || {}), // JSONB field - needs JSON string
        quotationData.incidentalCharges || [],  // TEXT[] field - needs actual array, not JSON string
        quotationData.otherFactors || [],       // TEXT[] field - needs actual array, not JSON string
        quotationData.totalRent || totalAmount || 0,
        totalAmount, // total_cost - this is the main quotation value
        calculations.workingCost || quotationData.workingCost || 0,
        calculations.mobDemobCost || quotationData.mobDemobCost || 0,
        calculations.foodAccomCost || quotationData.foodAccomCost || 0,
        calculations.usageLoadFactor || quotationData.usageLoadFactor || 0,
        calculations.riskAdjustment || quotationData.riskAdjustment || 0,
        calculations.gstAmount || quotationData.gstAmount || 0,
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

// Helper endpoint: Search deals by name (for quotation creation)
router.get('/deals/search', async (req, res) => {
  try {
    const { title } = req.query;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Title query parameter is required and must be a string'
      });
    }
    
    const deals = await dealRepository.findDealsByTitle(title);
    
    return res.status(200).json({
      success: true,
      data: deals,
      count: deals.length
    });
  } catch (error) {
    console.error('Error searching deals:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
