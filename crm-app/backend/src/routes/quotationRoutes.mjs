/**
 * Quotation Routes
 * Handles generation of quotation PDFs based on user selections
 * SuiteCRM-inspired professional quotation system
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/authMiddleware.mjs';
import { generateQuotationTemplate } from '../utils/pdfGenerator.js';

// Helper function to generate quotation number from ID
function generateQuotationNumber(quotationId) {
  // Extract number from quotation ID (quot_XXXXXXXX format)
  const idParts = quotationId.split('_');
  if (idParts.length >= 2) {
    // Use the UUID part to generate a consistent number
    const hashCode = idParts[1].split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const num = Math.abs(hashCode) % 9999 + 1; // Ensure it's between 1-9999
    return `ASP-Q-${num.toString().padStart(3, '0')}`;
  }
  
  // Fallback: use full ID
  return `ASP-Q-${quotationId.substring(5, 8).toUpperCase()}`;
}
import { QuotationTableBuilder } from '../utils/quotationTableBuilder.mjs';

const router = express.Router();

// Optional auth for selected endpoints: allows bypass header regardless of NODE_ENV
const optionalAuth = (req, res, next) => {
  const bypassHeader = req.headers['x-bypass-auth'];
  if (bypassHeader === 'development-only-123' || bypassHeader === 'true') {
    console.log('⚠️ OptionalAuth: bypassing auth based on header');
    req.user = { uid: 'bypass-user', email: 'bypass@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};

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
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    console.log('📋 [Generate] Received request:', req.method, req.originalUrl);
    console.log('📋 [Generate] Headers:', req.headers);
    console.log('📋 [Generate] Body:', req.body);
    
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
 * POST /api/quotations/generate-test - Test endpoint without authentication
 */
router.post('/generate-test', async (req, res) => {
  try {
    console.log('🧪 [Generate-Test] Received request:', req.method, req.originalUrl);
    console.log('🧪 [Generate-Test] Headers:', req.headers);
    console.log('🧪 [Generate-Test] Body:', req.body);
    
    const quotation = req.body;

    if (!quotation || !quotation.items || quotation.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Quotation must include at least one item' 
      });
    }

    // Return success response for testing
    res.json({
      success: true,
      message: 'Test endpoint working - authentication bypassed',
      receivedData: {
        hasCustomer: !!quotation.customer,
        itemCount: quotation.items?.length || 0,
        hasTerms: !!quotation.terms
      }
    });

  } catch (error) {
    console.error('Generate test error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process test request',
      error: error.message
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
        SELECT 
          q.id,
          q.customer_name,
          q.customer_contact->>'email' as customer_email,
          q.customer_contact->>'phone' as customer_phone,
          q.customer_contact->>'address' as customer_address,
          q.machine_type,
          q.order_type,
          q.number_of_days,
          q.working_hours,
          q.total_cost,
          q.status,
          q.created_at,
          q.updated_at,
          q.site_distance,
          q.usage,
          q.day_night,
          q.food_resources,
          q.accom_resources,
          q.risk_factor,
          q.mob_demob_cost,
          q.working_cost,
          q.food_accom_cost,
          q.gst_amount,
          q.total_rent,
          q.incident1,
          q.incident2,
          q.incident3,
          q.rigger_amount,
          q.helper_amount,
          q.usage_load_factor,
          q.risk_adjustment,
          q.riskandusagecost
        FROM quotations q
        ORDER BY q.created_at DESC;
      `);

      // Attempt to load additionalParams from config table to provide shift/day-night factors
      let additionalParamsCfg = {};
      try {
        const cfgRes = await client.query(`SELECT value FROM config WHERE name = 'additionalParams' LIMIT 1`);
        let raw = cfgRes.rows[0]?.value;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
        }
        additionalParamsCfg = raw || {};
      } catch (cfgErr) {
        console.warn('[QuotationRoutes] Could not load additionalParams config for list endpoint, using defaults');
        additionalParamsCfg = {};
      }
      
      const quotations = result.rows.map(q => ({
        id: q.id,
        quotationId: q.id,
        quotation_number: generateQuotationNumber(q.id), // Generate quotation number from ID
        customer_name: q.customer_name,
        customer_email: q.customer_email,
        customer_phone: q.customer_phone,
        customer_address: q.customer_address,
        machine_type: q.machine_type,
        order_type: q.order_type,
        number_of_days: q.number_of_days,
        working_hours: q.working_hours,
        total_cost: parseFloat(q.total_cost || 0),
        status: q.status,
        created_at: q.created_at,
        updated_at: q.updated_at,
        site_distance: parseFloat(q.site_distance || 0),
        usage: q.usage,
        shift: q.day_night === 'day' ? 'Day Shift' : 'Night Shift', // FIX: use day_night for shift
        // derive factors from config when available, fall back to stored values or 1
        shift_factor: parseFloat((additionalParamsCfg?.shiftFactors?.[q.day_night] ?? q.shift_factor ?? 1) || 1),
        day_night_factor: parseFloat((additionalParamsCfg?.dayNightFactors?.[q.day_night] ?? q.day_night_factor ?? 1) || 1),
        food_resources: q.food_resources > 0 ? 'ASP Provided' : 'Client Provided',
        accom_resources: q.accom_resources > 0 ? 'ASP Provided' : 'Client Provided',
        risk_factor: q.risk_factor?.charAt(0).toUpperCase() + q.risk_factor?.slice(1) || 'Medium',
        mob_demob_cost: parseFloat(q.mob_demob_cost || 0),
        working_cost: parseFloat(q.working_cost || 0),
        food_accom_cost: parseFloat(q.food_accom_cost || 0),
        gst_amount: parseFloat(q.gst_amount || 0),
        total_rent: parseFloat(q.total_rent || 0),
        incident1: parseFloat(q.incident1 || 0),
        incident2: parseFloat(q.incident2 || 0),
        incident3: parseFloat(q.incident3 || 0),
        rigger_amount: parseFloat(q.rigger_amount || 0),
        helper_amount: parseFloat(q.helper_amount || 0),
        usage_load_factor: parseFloat(q.usage_load_factor || 0),
        risk_adjustment: parseFloat(q.risk_adjustment || 0),
        riskandusagecost: parseFloat(q.riskandusagecost || 0)
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
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/quotations/print-test - Simple test endpoint to verify routing
 */
router.get('/print-test', (req, res) => {
  console.log('🧪 [QuotationRoutes] Print test endpoint called');
  res.json({
    success: true,
    message: 'Print route is working!',
    timestamp: new Date().toISOString()
  });
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
               c.phone as customer_phone, c.company_name as customer_company,
               c.address as customer_address, c.designation as customer_designation,
               d.title as deal_title
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

      // Load additionalParams config so we can derive shift/day-night factors if DB doesn't have them
      let additionalParamsCfg = {};
      try {
        const cfgRes = await client.query(`SELECT value FROM config WHERE name = 'additionalParams' LIMIT 1`);
        let raw = cfgRes.rows[0]?.value;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
        }
        additionalParamsCfg = raw || {};
      } catch (cfgErr) {
        console.warn('[QuotationRoutes] Could not load additionalParams config for get/:id endpoint, using defaults');
        additionalParamsCfg = {};
      }
      
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
        quotationNumber: generateQuotationNumber(quotation.id), // Generate quotation number from ID
        dealId: quotation.deal_id,
        leadId: quotation.lead_id,
        customerId: quotation.customer_id,
        customerName: quotation.customer_name,
        customerContact: quotation.customer_contact || {
          name: quotation.customer_name,
          email: quotation.customer_email,
          phone: quotation.customer_phone,
          company: quotation.customer_company,
          address: quotation.customer_address,
          designation: quotation.customer_designation
        },
        dealTitle: quotation.deal_title,
        machineType: quotation.machine_type,
        orderType: quotation.order_type,
        numberOfDays: quotation.number_of_days,
        workingHours: quotation.working_hours,
        foodResources: quotation.food_resources,
        accomResources: quotation.accom_resources,
        siteDistance: quotation.site_distance,
        usage: quotation.usage,
        riskFactor: quotation.risk_factor,
        shift: quotation.day_night,
        dayNight: quotation.day_night,
        // Prefer stored DB value for factors; otherwise derive from config or default to 1
        shiftFactor: quotation.shift_factor ?? (additionalParamsCfg?.shiftFactors?.[quotation.day_night] ?? 1),
        dayNightFactor: quotation.day_night_factor ?? (additionalParamsCfg?.dayNightFactors?.[quotation.day_night] ?? 1),
        mobDemob: quotation.mob_demob,
        mobRelaxation: quotation.mob_relaxation,
        extraCharge: quotation.extra_charge,
        otherFactorsCharge: quotation.other_factors_charge,
        billing: quotation.billing,
        includeGst: quotation.include_gst,
        sundayWorking: quotation.sunday_working,
        incidentalCharges: quotation.incidental_charges || [],
        otherFactors: quotation.other_factors || [],
        totalRent: quotation.total_rent,
        totalCost: quotation.total_cost,
        workingCost: quotation.working_cost,
        mobDemobCost: quotation.mob_demob_cost,
        foodAccomCost: quotation.food_accom_cost,
        riggerAmount: quotation.rigger_amount || null,
        helperAmount: quotation.helper_amount || null,
        usageLoadFactor: quotation.usage_load_factor,
        riskAdjustment: quotation.risk_adjustment,
        gstAmount: quotation.gst_amount,
        version: quotation.version,
        createdBy: quotation.created_by,
        status: quotation.status,
        templateId: quotation.template_id,
        notes: quotation.notes,
        createdAt: quotation.created_at,
        updatedAt: quotation.updated_at,
        calculations: {
          baseRate: 0, // Will be calculated on frontend
          totalHours: quotation.working_hours * quotation.number_of_days,
          workingCost: quotation.working_cost || 0,
          mobDemobCost: quotation.mob_demob_cost || 0,
          foodAccomCost: quotation.food_accom_cost || 0,
          usageLoadFactor: quotation.usage_load_factor || 0,
          extraCharges: quotation.extra_charge || 0,
          riskAdjustment: quotation.risk_adjustment || 0,
          incidentalCost: 0, // Will be calculated from incidentalCharges
          otherFactorsCost: quotation.other_factors_charge || 0,
          subtotal: quotation.total_rent || 0,
          gstAmount: quotation.gst_amount || 0,
          totalAmount: quotation.total_cost || 0,
          riskandusagecost: quotation.riskandusagecost || 0
        },
        selectedMachines: machinesResult.rows.map(machine => ({
          id: machine.equipment_id,
          machineType: quotation.machine_type,
          equipmentId: machine.equipment_id,
          name: machine.equipment_name || 'Equipment',
          quantity: machine.quantity || 1,
          baseRate: machine.base_rate || 0,
          baseRates: {
            micro: machine.base_rate || 0,
            small: machine.base_rate || 0,
            monthly: machine.base_rate || 0,
            yearly: machine.base_rate || 0
          },
          runningCostPerKm: machine.running_cost_per_km || 0
        })),
        selectedEquipment: machinesResult.rows.length > 0 ? {
          id: machinesResult.rows[0].equipment_id,
          equipmentId: machinesResult.rows[0].equipment_id,
          name: machinesResult.rows[0].equipment_name || 'Equipment',
          baseRates: {
            micro: machinesResult.rows[0].base_rate || 0,
            small: machinesResult.rows[0].base_rate || 0,
            monthly: machinesResult.rows[0].base_rate || 0,
            yearly: machinesResult.rows[0].base_rate || 0
          }
        } : {
          id: '',
          equipmentId: '',
          name: '',
          baseRates: {
            micro: 0,
            small: 0,
            monthly: 0,
            yearly: 0
          }
        },
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const quotationData = req.body;
    // Validate required fields
    const requiredFields = ['customerName', 'machineType', 'orderType', 'numberOfDays'];
    const missingFields = requiredFields.filter(field => !quotationData[field]);
    // Validate dealId/leadId presence
    if (!quotationData.dealId && !quotationData.leadId) {
      return res.status(400).json({
        success: false,
        message: 'At least one of dealId or leadId must be provided.'
      });
    }
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    const client = await pool.connect();
    try {
      // Load additionalParams config to get rigger/helper default amounts and factors
      let additionalParams = {};
      try {
        const cfgRes = await client.query(`SELECT value FROM config WHERE name = 'additionalParams' LIMIT 1`);
        let raw = cfgRes.rows[0]?.value;
        if (typeof raw === 'string') {
          try {
            raw = JSON.parse(raw);
          } catch (e) {
            raw = {};
          }
        }
        additionalParams = raw || {};
      } catch (cfgErr) {
        console.warn('[QuotationRoutes] Could not load additionalParams config, proceeding with defaults');
        additionalParams = {};
      }
      
      // Compute numeric defaults
      const defaultRiggerAmount = additionalParams && additionalParams.riggerAmount ? Number(additionalParams.riggerAmount) : null;
      const defaultHelperAmount = additionalParams && additionalParams.helperAmount ? Number(additionalParams.helperAmount) : null;

      // Resolve shift/day-night factors from config or provided values
      const selectedShift = quotationData.shift || 'single';
      const selectedDayNight = quotationData.dayNight || quotationData.day_night || 'day';
      const computedShiftFactor = quotationData.shiftFactor ?? (additionalParams?.shiftFactors?.[selectedShift] ?? 1);
      const computedDayNightFactor = quotationData.dayNightFactor ?? (additionalParams?.dayNightFactors?.[selectedDayNight] ?? 1);
      
      // Check if customer exists, if not create one
      let customerId;
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE email = $1 OR name = $2',
        [quotationData.customerEmail, quotationData.customerName]
      );
      
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
      } else {
        // Create new customer
        const newCustomerResult = await client.query(`
          INSERT INTO customers (
            name, company_name, contact_name, email, phone, address, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          quotationData.customerName,
          quotationData.customerName,
          quotationData.customerName,
          quotationData.customerEmail || 'noemail@example.com',
          quotationData.customerPhone || 'N/A',
          quotationData.customerAddress || 'N/A',
          'other'
        ]);
        customerId = newCustomerResult.rows[0].id;
      }
      
      const id = uuidv4();

      // Determine primary equipment and snapshot from payload (if provided)
      const primaryEquipmentId = (quotationData.selectedMachines && quotationData.selectedMachines.length > 0)
        ? (quotationData.selectedMachines[0].id || quotationData.selectedMachines[0].equipmentId || null)
        : (quotationData.selectedEquipment ? (quotationData.selectedEquipment.id || quotationData.selectedEquipment.equipmentId || null) : null);

      const equipmentSnapshot = (quotationData.selectedMachines && quotationData.selectedMachines.length > 0)
        ? JSON.stringify(quotationData.selectedMachines)
        : (quotationData.selectedEquipment ? JSON.stringify([quotationData.selectedEquipment]) : JSON.stringify([]));

      // Map frontend data to database schema
      const riskMapping = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Very High': 'high'
      };
      
      // Incident mapping (defaults)
      const incidentAmounts = {
        incident1: 5000,
        incident2: 10000,
        incident3: 15000
      };
      const incident1 = quotationData.incidentalCharges?.includes('incident1') ? incidentAmounts.incident1 : 0;
      const incident2 = quotationData.incidentalCharges?.includes('incident2') ? incidentAmounts.incident2 : 0;
      const incident3 = quotationData.incidentalCharges?.includes('incident3') ? incidentAmounts.incident3 : 0;
      
      // Calculate costs (simplified for now)
      const totalCost = quotationData.totalCost || 100000;
      const gstAmount = totalCost * 0.18;
      const finalTotal = totalCost + gstAmount;
      
      const customerContact = {
        name: quotationData.customerName,
        email: quotationData.customerEmail || '',
        phone: quotationData.customerPhone || '',
        address: quotationData.customerAddress || '',
        company: quotationData.customerName
      };
      
      // Prepare numeric risk/usage values coming from frontend (or fallbacks)
      const usage_load_factor = quotationData.usageLoadFactor ?? 0;
      const risk_adjustment = quotationData.riskAdjustment ?? 0;
      const riskandusagecost_val = quotationData.riskandusagecost ?? (usage_load_factor + risk_adjustment);
      
      // Insert quotation (include primary_equipment_id and equipment_snapshot)
      const columns = [
        'id', 'customer_id', 'customer_name', 'machine_type', 'primary_equipment_id', 'equipment_snapshot', 'order_type',
        'number_of_days', 'working_hours', 'food_resources', 'accom_resources',
        'site_distance', 'usage', 'risk_factor', 'shift', 'day_night',
        'mob_demob', 'mob_relaxation', 'extra_charge', 'other_factors_charge',
        'billing', 'include_gst', 'sunday_working', 'customer_contact',
        'total_rent', 'total_cost', 'working_cost', 'mob_demob_cost',
        'food_accom_cost', 'usage_load_factor', 'risk_adjustment', 'riskandusagecost', 'gst_amount', 'created_by', 'status', 'notes',
        'deal_id', 'lead_id',
        'incident1', 'incident2', 'incident3',
        'rigger_amount', 'helper_amount'
      ];

      const values = [
        id,
        customerId,
        quotationData.customerName,
        quotationData.machineType,
        primaryEquipmentId,
        equipmentSnapshot,
        quotationData.orderType,
        quotationData.numberOfDays || 1,
        quotationData.workingHours || 8,
        // Store numeric counts for food and accommodation provided
        quotationData.foodResources ?? 0,
        quotationData.accomResources ?? 0,
        quotationData.siteDistance || 0,
        quotationData.usage || 'normal',
        riskMapping[quotationData.riskFactor] || 'medium',
        selectedShift, // shift
        selectedDayNight, // day_night
        15000, // mob_demob (default)
        0, // mob_relaxation
        quotationData.extraCharge || 0,
        0, // other_factors_charge
        'gst', // billing
        true, // include_gst
        'no', // sunday_working
        JSON.stringify(customerContact),
        totalCost,
        finalTotal,
        quotationData.workingCost ?? totalCost * 0.8, // working_cost
        15000, // mob_demob_cost
        // Use frontend-provided computed foodAccomCost if available, fallback to 0
        quotationData.foodAccomCost || 0,
        // usage_load_factor, risk_adjustment, riskandusagecost
        usage_load_factor,
        risk_adjustment,
        riskandusagecost_val,
        gstAmount,
        req.user.id || req.user?.uid || null, // created_by (support both id and uid keys)
        'draft',
        quotationData.notes || '',
        quotationData.dealId || null,
        quotationData.leadId || null,
        incident1,
        incident2,
        incident3,
        // rigger_amount/helper_amount: store configured amounts when selected
        (quotationData.otherFactors || []).includes('rigger') ? (quotationData.riggerAmount ?? defaultRiggerAmount ?? null) : null,
        (quotationData.otherFactors || []).includes('helper') ? (quotationData.helperAmount ?? defaultHelperAmount ?? null) : null
      ];

      // Build placeholders dynamically to avoid mismatches between columns and values
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `INSERT INTO quotations (${columns.join(', ')}) VALUES (${placeholders})`;

      await client.query(insertQuery, values);

      // Persist selected machines / equipment into quotation_machines so the equipment selection is stored
      try {
        // If frontend provided an array of selected machines, insert them
        if (quotationData.selectedMachines && Array.isArray(quotationData.selectedMachines) && quotationData.selectedMachines.length > 0) {
          for (const m of quotationData.selectedMachines) {
            const equipmentId = m.id || m.equipmentId || null;
            if (!equipmentId) continue;
            const quantity = m.quantity || 1;
            const baseRate = (m.baseRate ?? m.base_rate ?? m.price ?? 0);
            const runningCost = (m.runningCostPerKm ?? m.running_cost_per_km ?? 0);

            await client.query(`
              INSERT INTO quotation_machines (
                quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
              ) VALUES ($1, $2, $3, $4, $5)
            `, [id, equipmentId, quantity, baseRate, runningCost]);
          }
        } else if (quotationData.selectedEquipment) {
          // Single selectedEquipment object fallback
          const eq = quotationData.selectedEquipment;
          const equipmentId = eq.id || eq.equipmentId || null;
          if (equipmentId) {
            const quantity = eq.quantity || 1;
            const baseRate = (eq.baseRate ?? eq.base_rate ?? quotationData.workingCost ?? 0);
            const runningCost = (eq.runningCostPerKm ?? eq.running_cost_per_km ?? 0);

            await client.query(`
              INSERT INTO quotation_machines (
                quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
              ) VALUES ($1, $2, $3, $4, $5)
            `, [id, equipmentId, quantity, baseRate, runningCost]);
          }
        }
      } catch (mErr) {
        // Log but don't fail the entire quotation creation if machine persistence fails
        console.warn('[QuotationRoutes] Failed to persist selected machines:', mErr.message);
      }
      
      return res.status(201).json({ 
        success: true,
        message: 'Quotation created successfully',
        data: { id, quotationId: id, totalCost: finalTotal, shiftFactor: computedShiftFactor, dayNightFactor: computedDayNightFactor }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message
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
 *
      if (selectedMachines && Array.isArray(selectedMachines)) {
        // Delete existing machines
        await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
        
        // Insert updated machines
        for (const machine of selectedMachines) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            id,
            machine.id || machine.equipmentId,
            machine.quantity || 1,
            machine.baseRate || 0,
            machine.runningCostPerKm || 0
          ]);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Quotation updated successfully',
        data: result.rows[0]
      });
      
            } finally { PUT /api/quotations/:id
         * Update a quotation
         */
        router.put('/:id', async (req, res) => {
          try {
            const { id } = req.params;
            const body = req.body || {};
            const client = await pool.connect();

            try {
              // Fetch existing quotation (use as fallback/defaults)
              const existingRes = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
              if (existingRes.rows.length === 0) {
                client.release();
                return res.status(404).json({ success: false, message: 'Quotation not found' });
              }
              const existing = existingRes.rows[0];

              // Load additionalParams config (same as create)
              let additionalParams = {};
              try {
                const cfgRes = await client.query(`SELECT value FROM config WHERE name = 'additionalParams' LIMIT 1`);
                let raw = cfgRes.rows[0]?.value;
                if (typeof raw === 'string') {
                  try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
                }
                additionalParams = raw || {};
              } catch (e) {
                additionalParams = {};
              }
              const defaultRiggerAmount = additionalParams?.riggerAmount ? Number(additionalParams.riggerAmount) : null;
              const defaultHelperAmount = additionalParams?.helperAmount ? Number(additionalParams.helperAmount) : null;

              // Helper: accept camelCase or snake_case and fall back to existing DB value
              const get = (snake, camel, fallback) => {
                if (body[snake] !== undefined) return body[snake];
                if (body[camel] !== undefined) return body[camel];
                return fallback;
              };

              // Merge fields (body -> existing -> sensible default)
              const customer_name = get('customer_name', 'customerName', existing.customer_name);
              let customer_contact = get('customer_contact', 'customerContact', existing.customer_contact);
              if (customer_contact && typeof customer_contact !== 'string') {
                try { customer_contact = JSON.stringify(customer_contact); } catch (e) { customer_contact = existing.customer_contact; }
              }

              const machine_type = get('machine_type', 'machineType', existing.machine_type);
              const order_type = get('order_type', 'orderType', existing.order_type);
              const number_of_days = get('number_of_days', 'numberOfDays', existing.number_of_days);
              const working_hours = get('working_hours', 'workingHours', existing.working_hours);
              const site_distance = get('site_distance', 'siteDistance', existing.site_distance ?? 0);
              const usage = get('usage', 'usage', existing.usage ?? 'normal');
              const risk_factor = get('risk_factor', 'riskFactor', existing.risk_factor ?? 'medium');
              const shift = get('shift', 'shift', existing.shift ?? 'single');
              const day_night = get('day_night', 'dayNight', existing.day_night ?? 'day');
              const food_resources = get('food_resources', 'foodResources', existing.food_resources ?? 0);
              const accom_resources = get('accom_resources', 'accomResources', existing.accom_resources ?? 0);
              const mob_demob = get('mob_demob', 'mobDemob', existing.mob_demob ?? 15000);
              const mob_relaxation = get('mob_relaxation', 'mobRelaxation', existing.mob_relaxation ?? 0);
              const extra_charge = get('extra_charge', 'extraCharge', existing.extra_charge ?? 0);
              const other_factors_charge = get('other_factors_charge', 'otherFactorsCharge', existing.other_factors_charge ?? 0);
              const working_cost = get('working_cost', 'workingCost', existing.working_cost ?? 0);
              const mob_demob_cost = get('mob_demob_cost', 'mobDemobCost', existing.mob_demob_cost ?? 15000);
              const food_accom_cost = get('food_accom_cost', 'foodAccomCost', existing.food_accom_cost ?? 0);
              const risk_adjustment = get('risk_adjustment', 'riskAdjustment', existing.risk_adjustment ?? 0);
              const usage_load_factor = get('usage_load_factor', 'usageLoadFactor', existing.usage_load_factor ?? 0);
              const gst_amount = get('gst_amount', 'gstAmount', existing.gst_amount ?? 0);
              const total_rent = get('total_rent', 'totalRent', existing.total_rent ?? null);
              const total_cost = get('total_cost', 'totalCost', existing.total_cost ?? null);
              const notes = get('notes', 'notes', existing.notes ?? '');
              const status = get('status', 'status', existing.status ?? 'draft');
              const deal_id = get('deal_id', 'dealId', existing.deal_id ?? null);
              const lead_id = get('lead_id', 'leadId', existing.lead_id ?? null);

              // incidentalCharges / otherFactors arrays: prefer body, fallback to stored JSON arrays or empty arrays
              const parseStoredArr = (v) => {
                if (!v) return [];
                if (Array.isArray(v)) return v;
                try { return JSON.parse(v); } catch (e) { return []; }
              };
              const incidentalCharges = body.incidentalCharges ?? body.incidental_charges ?? parseStoredArr(existing.incidental_charges);
              const otherFactors = body.otherFactors ?? body.other_factors ?? parseStoredArr(existing.other_factors);

              // Incident amounts (same as create)
              const incidentAmounts = { incident1: 5000, incident2: 10000, incident3: 15000 };
              const incident1 = incidentalCharges?.includes('incident1') ? incidentAmounts.incident1 : (existing.incident1 ?? 0);
              const incident2 = incidentalCharges?.includes('incident2') ? incidentAmounts.incident2 : (existing.incident2 ?? 0);
              const incident3 = incidentalCharges?.includes('incident3') ? incidentAmounts.incident3 : (existing.incident3 ?? 0);
              const incidental_total = body.incidental_total ?? body.incidentalTotal ?? (incident1 + incident2 + incident3);

              // Rigger/helper priority: body -> existing DB -> config defaults (if otherFactors includes) -> null
              const bodyRigger = body.riggerAmount ?? body.rigger_amount;
              const bodyHelper = body.helperAmount ?? body.helper_amount;
              const existingRigger = existing.rigger_amount ?? null;
              const existingHelper = existing.helper_amount ?? null;

              const rigger_amount = (bodyRigger !== undefined && bodyRigger !== null)
                ? bodyRigger
                : (existingRigger !== undefined && existingRigger !== null)
                  ? existingRigger
                  : ((otherFactors || []).includes('rigger') ? defaultRiggerAmount : null);

              const helper_amount = (bodyHelper !== undefined && bodyHelper !== null)
                ? bodyHelper
                : (existingHelper !== undefined && existingHelper !== null)
                  ? existingHelper
                  : ((otherFactors || []).includes('helper') ? defaultHelperAmount : null);

              // Determine primary equipment and equipment snapshot (use provided selection if any, else keep existing)
              const selectedMachines = body.selectedMachines ?? body.selected_machines;
              const selectedEquipment = body.selectedEquipment ?? body.selected_equipment;
              const selMachinesArr = Array.isArray(selectedMachines) ? selectedMachines : (selectedEquipment ? [selectedEquipment] : null);
              const primary_equipment_id = selMachinesArr && selMachinesArr.length > 0
                ? (selMachinesArr[0].id ?? selMachinesArr[0].equipmentId ?? null)
                : (existing.primary_equipment_id ?? null);
              const equipment_snapshot = selMachinesArr ? JSON.stringify(selMachinesArr) : (existing.equipment_snapshot ?? JSON.stringify([]));

              // Resolve and persist factors (prefer body-provided values)
              const shift_factor = (body.shiftFactor ?? body.shift_factor) ?? (additionalParams?.shiftFactors?.[shift] ?? existing.shift_factor ?? 1);
              const day_night_factor = (body.dayNightFactor ?? body.day_night_factor) ?? (additionalParams?.dayNightFactors?.[day_night] ?? existing.day_night_factor ?? 1);
              const riskandusagecost = body.riskandusagecost ?? body.risk_and_usage_cost ?? ((usage_load_factor ?? 0) + (risk_adjustment ?? 0));

              // Begin transaction
              await client.query('BEGIN');

              // Update using same column names as create
              const updateQuery = `
                UPDATE quotations SET
                  customer_name = $1,
                  customer_contact = $2,
                  machine_type = $3,
                  primary_equipment_id = $4,
                  equipment_snapshot = $5,
                  order_type = $6,
                  number_of_days = $7,
                  working_hours = $8,
                  food_resources = $9,
                  accom_resources = $10,
                  site_distance = $11,
                  usage = $12,
                  risk_factor = $13,
                  shift = $14,
                  day_night = $15,
                  shift_factor = $16,
                  day_night_factor = $17,
                  mob_demob = $18,
                  mob_relaxation = $19,
                  extra_charge = $20,
                  other_factors_charge = $21,
                  billing = COALESCE(billing, 'gst'),
                  include_gst = COALESCE(include_gst, true),
                  sunday_working = COALESCE(sunday_working, 'no'),
                  total_rent = $22,
                  total_cost = $23,
                  working_cost = $24,
                  mob_demob_cost = $25,
                  food_accom_cost = $26,
                  gst_amount = $27,
                  notes = $28,
                  status = $29,
                  deal_id = $30,
                  lead_id = $31,
                  incidental_charges = $32,
                  other_factors = $33,
                  incident1 = $34,
                  incident2 = $35,
                  incident3 = $36,
                  incidental_total = $37,
                  rigger_amount = $38,
                  helper_amount = $39,
                  usage_load_factor = $40,
                  risk_adjustment = $41,
+                 riskandusagecost = $42,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $43
                RETURNING *;
              `;

              const updateValues = [
                customer_name,
                customer_contact,
                machine_type,
                primary_equipment_id,
                equipment_snapshot,
                order_type,
                number_of_days,
                working_hours,
                food_resources,
                accom_resources,
                site_distance,
                usage,
                risk_factor,
                shift,
                day_night,
                shift_factor,
                day_night_factor,
                mob_demob,
                mob_relaxation,
                extra_charge,
                other_factors_charge,
                total_rent,
                total_cost,
                working_cost,
                mob_demob_cost,
                food_accom_cost,
                gst_amount,
                notes,
                status,
                deal_id,
                lead_id,
                JSON.stringify(incidentalCharges || []),
                JSON.stringify(otherFactors || []),
                incident1,
                incident2,
                incident3,
                incidental_total,
                rigger_amount,
                helper_amount,
                usage_load_factor,
                risk_adjustment,
+               riskandusagecost,
                id
              ];

              const result = await client.query(updateQuery, updateValues);
              if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Quotation not found' });
              }

              // Persist machines only when client provided a selection (otherwise keep existing persisted machines)
              if (selMachinesArr !== null) {
                await client.query('DELETE FROM quotation_machines WHERE quotation_id = $1', [id]);
                if (Array.isArray(selMachinesArr) && selMachinesArr.length > 0) {
                  const insertMachineQuery = `
                    INSERT INTO quotation_machines (
                      quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
                    ) VALUES ($1, $2, $3, $4, $5)
                  `;
                  for (const m of selMachinesArr) {
                    const equipmentId = m.id ?? m.equipmentId ?? null;
                    if (!equipmentId) continue;
                    const quantity = m.quantity ?? m.qty ?? 1;
                    const baseRate = m.baseRate ?? m.base_rate ?? m.price ?? 0;
                    const runningCost = m.runningCostPerKm ?? m.running_cost_per_km ?? 0;
                    await client.query(insertMachineQuery, [id, equipmentId, quantity, baseRate, runningCost]);
                  }
                }
              }

              await client.query('COMMIT');

              return res.status(200).json({
                success: true,
                message: 'Quotation updated successfully',
                data: result.rows[0]
              });
            } catch (err) {
              try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
              console.error('Error updating quotation:', err);
              return res.status(500).json({ success: false, message: 'Failed to update quotation', error: err.message });
            } finally {
              client.release();
            }
          } catch (error) {
            console.error('Error updating quotation (outer):', error);
            return res.status(500).json({
              success: false,
              message: 'Internal server error',
              error: error.message
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

/**
 * POST /api/quotations/print - Generate printable quotation using Twenty CRM table builder pattern
 */
router.post('/print', authenticateToken, async (req, res) => {
  console.log('🖨️ [QuotationRoutes] ===== PRINT ENDPOINT CALLED =====');
  console.log('🖨️ [QuotationRoutes] Request method:', req.method);
  console.log('🖨️ [QuotationRoutes] Request path:', req.path);
  console.log('🖨️ [QuotationRoutes] Request body:', req.body);
  console.log('🖨️ [QuotationRoutes] Request headers:', req.headers);
  
  try {
    const { quotationId } = req.body;
    
    console.log('🖨️ [QuotationRoutes] Print request for quotation:', quotationId);

    if (!quotationId) {
      console.log('❌ [QuotationRoutes] No quotation ID provided');
      return res.status(400).json({
        success: false,
        error: 'Quotation ID is required'
      });
    }

    // Get quotation with full details
    console.log('🔍 [QuotationRoutes] Fetching quotation data...');
    const quotationData = await getQuotationWithFullDetails(quotationId);
    if (!quotationData) {
      console.log('❌ [QuotationRoutes] Quotation not found');
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    console.log('✅ [QuotationRoutes] Quotation data fetched:', {
      id: quotationData.id,
      number: generateQuotationNumber(quotationData.id),
      itemsCount: quotationData.items?.length || 0
    });

    // Use Twenty CRM inspired table builder
    console.log('🏗️ [QuotationRoutes] Building table with Twenty CRM pattern...');
    const tableBuilder = new QuotationTableBuilder();
    const html = tableBuilder
      .setData(quotationData)
      .setOptions({ printMode: true, theme: 'professional' })
      .generatePrintHTML();

    console.log('✅ [QuotationRoutes] Print HTML generated successfully');
    console.log('📏 [QuotationRoutes] HTML length:', html.length, 'characters');

    res.json({
      success: true,
      html,
      quotation: {
        id: quotationData.id,
        number: generateQuotationNumber(quotationData.id)
      },
      method: 'Twenty CRM Table Builder',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [QuotationRoutes] Print generation_FAILED:', error);
    console.error('❌ [QuotationRoutes] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Print generation failed',
      message: error.message
    });
  }
});


/**
 * Helper function to get quotation with complete details for printing
 */
async function getQuotationWithFullDetails(quotationId) {
  const client = await pool.connect();
  
  try {
    // Get basic quotation info
    const quotationQuery = `
      SELECT 
        q.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.company_name as customer_company
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = $1 AND q.deleted_at IS NULL
    `;
    
    const quotationResult = await client.query(quotationQuery, [quotationId]);
    
    if (quotationResult.rows.length === 0) {
      return null;
    }
    
    const quotation = quotationResult.rows[0];
    
    // Get quotation items
    const itemsQuery = `
      SELECT 
        description,
        quantity,
        unit_price,
        total,
        notes
      FROM quotation_items
      WHERE quotation_id = $1
      ORDER BY created_at ASC
    `;
    
    const itemsResult = await client.query(itemsQuery, [quotationId]);
    
    // Structure the complete data
    return {
      id: quotation.id,
      quotation_number: generateQuotationNumber(quotation.id),
      description: quotation.description,
      status: quotation.status,
      valid_until: quotation.valid_until,
      total_amount: quotation.total_amount,
      tax_rate: quotation.tax_rate,
      created_at: quotation.created_at,
      updated_at: quotation.updated_at,
      
      customer: {
        name: quotation.customer_name,
        email: quotation.customer_email,
        phone: quotation.customer_phone,
        address: quotation.customer_address,
        company: quotation.customer_company
      },
      
      company: {
        name: 'ASP Cranes',
        address: 'Industrial Area, New Delhi, India',
        phone: '+91-XXXX-XXXX',
        email: 'info@aspcranes.com'
      },

      // Include equipment selection persisted on quotation
      primaryEquipmentId: quotation.primary_equipment_id || null,
      equipmentSnapshot: quotation.equipment_snapshot ? (typeof quotation.equipment_snapshot === 'string' ? JSON.parse(quotation.equipment_snapshot) : quotation.equipment_snapshot) : [],
      
      items: itemsResult.rows || []
    };
    
  } finally {
    client.release();
  }
}

export default router;
