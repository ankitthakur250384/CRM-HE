/**
 * API routes for quotation operations - fixed version
 * This file provides endpoints to manage quotations in PostgreSQL
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Debug route to check if routes are loaded
router.get('/debug', (req, res) => {
  console.log('Quotation routes debug endpoint hit');
  res.json({ 
    status: 'ok', 
    message: 'Quotation routes are loaded',
    timestamp: new Date().toISOString()
  });
});

// Debug route to test database connection specifically
router.get('/test-db', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ 
        error: 'Database pool not initialized',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    try {
      // Test simple query
      const dbResult = await client.query('SELECT NOW() as time, version() as version, current_database() as db');
      
      // Test if quotations table exists
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'quotations'
        ) as table_exists;
      `);
      
      // If table exists, count records
      let quotationsCount = null;
      if (tableResult.rows[0].table_exists) {
        const countResult = await client.query('SELECT COUNT(*) as count FROM quotations');
        quotationsCount = parseInt(countResult.rows[0].count);
      }
      
      res.json({
        status: 'Database connection successful',
        timestamp: new Date().toISOString(),
        database: {
          time: dbResult.rows[0].time,
          version: dbResult.rows[0].version,
          database: dbResult.rows[0].db
        },
        tables: {
          quotations: {
            exists: tableResult.rows[0].table_exists,
            recordCount: quotationsCount
          }
        },
        environment: {
          host: process.env.VITE_DB_HOST || 'localhost',
          port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
          database: process.env.VITE_DB_NAME || 'asp_crm',
          user: process.env.VITE_DB_USER || 'postgres',
          ssl: process.env.VITE_DB_SSL === 'true'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    res.status(500).json({ 
      error: 'Failed to test database connection',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database connection with error handling
let pool;
try {
  pool = new pg.Pool({
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
    database: process.env.VITE_DB_NAME || 'asp_crm',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || 'vedant21',
    ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  // Log database connection info for debugging
  console.log('Quotation API: Database connection parameters:', {
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
    database: process.env.VITE_DB_NAME || 'asp_crm',
    user: process.env.VITE_DB_USER || 'postgres',
    passwordProvided: process.env.VITE_DB_PASSWORD ? 'Yes' : 'No',
    ssl: process.env.VITE_DB_SSL === 'true'
  });

  // Test database connection on startup
  pool.query('SELECT NOW()')
    .then(result => {
      console.log('✓ Quotation API: PostgreSQL connection test successful:', result.rows[0].now);
    })
    .catch(error => {
      console.error('✗ Quotation API: PostgreSQL connection test failed:', error);
    });
} catch (error) {
  console.error('Failed to create database pool:', error);
}

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    // Verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('Token verification failed:', err);
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Helper function to initialize quotation table if it doesn't exist
const initializeQuotationTable = async () => {
  if (!pool) {
    console.error('Cannot initialize quotation table: database pool is not available');
    return;
  }
  
  try {
    const client = await pool.connect();
    
    try {
      // Check if table exists first
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'quotations'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('Creating quotations table...');
        
        await client.query(`
          CREATE TABLE IF NOT EXISTS quotations (
            id VARCHAR(255) PRIMARY KEY,
            lead_id VARCHAR(255),
            customer_id VARCHAR(255),
            customer_name VARCHAR(255),
            customer_contact JSONB,
            machine_type VARCHAR(50),
            selected_equipment JSONB,
            selected_machines JSONB,
            order_type VARCHAR(50),
            number_of_days INTEGER,
            working_hours INTEGER,
            food_resources INTEGER,
            accom_resources INTEGER,
            site_distance INTEGER,
            usage VARCHAR(50),
            risk_factor VARCHAR(50),
            extra_charge DECIMAL(12, 2),
            incidental_charges JSONB,
            other_factors_charge DECIMAL(12, 2),
            billing VARCHAR(50),
            include_gst BOOLEAN,
            shift VARCHAR(50),
            day_night VARCHAR(50),
            mob_demob DECIMAL(12, 2),
            mob_relaxation DECIMAL(12, 2),
            running_cost_per_km DECIMAL(12, 2),
            deal_type VARCHAR(50),
            sunday_working VARCHAR(10),
            other_factors JSONB,
            total_rent DECIMAL(12, 2),
            working_cost DECIMAL(12, 2),
            mob_demob_cost DECIMAL(12, 2),
            food_accom_cost DECIMAL(12, 2),
            usage_load_factor DECIMAL(5, 2),
            extra_charges DECIMAL(12, 2),
            risk_adjustment DECIMAL(12, 2),
            gst_amount DECIMAL(12, 2),
            version INTEGER,
            status VARCHAR(50),
            created_by VARCHAR(255),
            created_at TIMESTAMP,
            updated_at TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON quotations(lead_id);
          CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
          CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
        `);
        
        console.log('✓ Quotations table created successfully');
      } else {
        console.log('✓ Quotations table already exists');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error initializing quotations table:', error);
  }
};

// Try to initialize table on module load, but don't block if it fails
initializeQuotationTable().catch(error => {
  console.error('Failed to initialize quotations table:', error);
  console.log('API will continue to function, but database operations may fail');
});

// Helper function to convert snake_case database fields to camelCase for JavaScript
const snakeToCamel = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

// Helper function to convert camelCase JavaScript fields to snake_case for database
const camelToSnake = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
};

// GET all quotations with customer data
router.get('/', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('Fetching quotations with customer data...');
      
      // First check if customers table exists
      const tablesResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'customers'
        ) as customers_exists;
      `);
      
      const customersTableExists = tablesResult.rows[0].customers_exists;
      console.log('Customers table exists:', customersTableExists);
      
      let quotations;
        if (customersTableExists) {
        // LEFT JOIN with customers table to get customer info
        const result = await client.query(`
          SELECT            q.*,
            c.customer_id as customer_id_from_customer,
            c.name as customer_name_from_customer,
            c.contact_name as customer_contact_name,
            c.email as customer_email,            c.phone as customer_phone,
            c.address as customer_address          FROM 
            quotations q
          LEFT JOIN 
            customers c ON q.customer_id = c.customer_id
          ORDER BY 
            q.created_at DESC
        `);
        
        console.log(`Got ${result.rows.length} quotations from database`);
        if (result.rows.length > 0) {
          console.log('Sample quotation data:', {
            id: result.rows[0].id,
            customer_id: result.rows[0].customer_id,
            customer_id_from_customer: result.rows[0].customer_id_from_customer,
            customer_name: result.rows[0].customer_name,
            customer_name_from_customer: result.rows[0].customer_name_from_customer
          });
        }
        
        quotations = result.rows.map(row => {
          const quotation = snakeToCamel(row);
          
          // If customerContact is missing or empty, create it from customer data
          if (!quotation.customerContact || 
              !quotation.customerContact.name || 
              Object.keys(quotation.customerContact).length === 0) {
            quotation.customerContact = {
              name: row.customer_contact_name || row.customer_name_from_customer || quotation.customerName || 'Customer',
              email: row.customer_email || '',
              phone: row.customer_phone || '',
              company: row.customer_name_from_customer || quotation.customerName || 'No Company',
              address: row.customer_address || ''
            };
          }
          
          // Always update customerName from customers table if available
          if (row.customer_name_from_customer) {
            quotation.customerName = row.customer_name_from_customer;
          } else if (!quotation.customerName) {
            quotation.customerName = 'Unknown Customer';
          }
          
          // Ensure customerId is set correctly
          if (row.customer_id_from_customer) {
            quotation.customerId = row.customer_id_from_customer;
          }
          
          return quotation;
        });
      } else {
        // Fallback to original query if customers table doesn't exist
        const result = await client.query('SELECT * FROM quotations ORDER BY created_at DESC');
        quotations = result.rows.map(row => snakeToCamel(row));
      }
      
      console.log(`Returning ${quotations.length} quotations`);
      res.status(200).json(quotations);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// GET quotation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }
      
      const quotation = snakeToCamel(result.rows[0]);
      res.status(200).json(quotation);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching quotation with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

// POST create new quotation
router.post('/', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const quotationData = req.body;
    const userId = req.user?.userId || 'unknown';
    
    // Generate a unique ID
    const quotationId = `quote-${Date.now()}`;
    const now = new Date().toISOString();
    
    // For error handling and fallback
    if (!quotationData.selectedEquipment || !quotationData.orderType) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'selectedEquipment and orderType are required' 
      });
    }
    
    // Calculate values based on input data
    const baseRate = quotationData.selectedEquipment?.baseRates?.[quotationData.orderType] || 0;
    const totalRent = baseRate * quotationData.numberOfDays;
    const workingCost = quotationData.workingHours * 50 * quotationData.numberOfDays;
    const mobDemobCost = quotationData.mobDemob || 0;
    const foodAccomCost = (
      (quotationData.foodResources || 0) * 500 + 
      (quotationData.accomResources || 0) * 1000
    ) * quotationData.numberOfDays;
    const usageLoadFactor = quotationData.usage === 'heavy' ? 1.2 : 1.0;
    const extraCharges = quotationData.extraCharge || 0;
    const riskAdjustment = 
      quotationData.riskFactor === 'high' ? 15000 : 
      quotationData.riskFactor === 'medium' ? 8000 : 0;
    
    // Calculate GST if applicable
    const subtotal = totalRent + workingCost + mobDemobCost + foodAccomCost + extraCharges + riskAdjustment;
    const gstAmount = quotationData.includeGst ? subtotal * 0.18 : 0; // 18% GST
    
    // Prepare data for database insertion
    const dbQuotation = {
      id: quotationId,
      lead_id: quotationData.leadId || null,
      customer_id: quotationData.customerId || null,
      customer_name: quotationData.customerName || null,
      customer_contact: JSON.stringify(quotationData.customerContact || {}),
      machine_type: quotationData.machineType,
      selected_equipment: JSON.stringify(quotationData.selectedEquipment),
      selected_machines: JSON.stringify(quotationData.selectedMachines || []),
      order_type: quotationData.orderType,
      number_of_days: quotationData.numberOfDays,
      working_hours: quotationData.workingHours,
      food_resources: quotationData.foodResources || 0,
      accom_resources: quotationData.accomResources || 0,
      site_distance: quotationData.siteDistance || 0,
      usage: quotationData.usage || 'normal',
      risk_factor: quotationData.riskFactor || 'low',
      extra_charge: quotationData.extraCharge || 0,
      incidental_charges: JSON.stringify(quotationData.incidentalCharges || []),
      other_factors_charge: quotationData.otherFactorsCharge || 0,
      billing: quotationData.billing || 'gst',
      include_gst: quotationData.includeGst || false,
      shift: quotationData.shift || 'single',
      day_night: quotationData.dayNight || 'day',
      mob_demob: quotationData.mobDemob || 0,
      mob_relaxation: quotationData.mobRelaxation || 0,
      running_cost_per_km: quotationData.runningCostPerKm || 0,
      deal_type: quotationData.dealType || 'no_advance',
      sunday_working: quotationData.sundayWorking || 'no',
      other_factors: JSON.stringify(quotationData.otherFactors || []),
      total_rent: totalRent,
      working_cost: workingCost,
      mob_demob_cost: mobDemobCost,
      food_accom_cost: foodAccomCost,
      usage_load_factor: usageLoadFactor,
      extra_charges: extraCharges,
      risk_adjustment: riskAdjustment,
      gst_amount: gstAmount,
      version: 1,
      status: 'draft',
      created_by: userId,
      created_at: now,
      updated_at: now
    };
    
    // Build the query dynamically with error handling
    const fields = Object.keys(dbQuotation).join(', ');
    const placeholders = Object.keys(dbQuotation).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(dbQuotation);
    
    const client = await pool.connect();
    
    try {
      await client.query(`INSERT INTO quotations (${fields}) VALUES (${placeholders})`, values);
      
      // Fetch the inserted quotation to return
      const result = await client.query('SELECT * FROM quotations WHERE id = $1', [quotationId]);
      const quotation = snakeToCamel(result.rows[0]);
      
      res.status(201).json(quotation);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// PUT update quotation
router.put('/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { id } = req.params;
    const updateData = req.body;
    const now = new Date().toISOString();
    
    const client = await pool.connect();
    
    try {
      // First check if the quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }
      
      const currentVersion = checkResult.rows[0].version || 0;
      const existingQuotation = snakeToCamel(checkResult.rows[0]);
      
      // Prepare update data
      const updatedQuotation = {
        ...existingQuotation,
        ...updateData,
        updatedAt: now,
        version: currentVersion + 1
      };
      
      // Convert to snake_case for the database
      const dbQuotation = camelToSnake(updatedQuotation);
      
      // Build SET clause for UPDATE statement
      const setClause = Object.keys(dbQuotation)
        .filter(key => key !== 'id') // Exclude ID from updates
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [
        id,
        ...Object.keys(dbQuotation)
          .filter(key => key !== 'id')
          .map(key => {
            // Convert objects to JSON strings
            const value = dbQuotation[key];
            return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
          })
      ];
      
      await client.query(`UPDATE quotations SET ${setClause} WHERE id = $1`, values);
      
      // Fetch the updated quotation to return
      const result = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      const quotation = snakeToCamel(result.rows[0]);
      
      res.status(200).json(quotation);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error updating quotation with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// PUT update quotation status
router.put('/:id/status', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['draft', 'sent', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status provided' });
    }
    
    const now = new Date().toISOString();
    const client = await pool.connect();
    
    try {
      // Check if quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }
      
      const currentVersion = checkResult.rows[0].version || 0;
      
      // Update status
      await client.query(
        'UPDATE quotations SET status = $1, updated_at = $2, version = $3 WHERE id = $4',
        [status, now, currentVersion + 1, id]
      );
      
      // Fetch the updated quotation to return
      const result = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      const quotation = snakeToCamel(result.rows[0]);
      
      res.status(200).json(quotation);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error updating status for quotation with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update quotation status' });
  }
});

// DELETE quotation
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      // Check if quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Quotation not found' });
      }
      
      // Delete the quotation
      await client.query('DELETE FROM quotations WHERE id = $1', [id]);
      
      res.status(200).json({ message: 'Quotation deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error deleting quotation with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
});

// GET quotations for a specific lead
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { leadId } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM quotations WHERE lead_id = $1 ORDER BY created_at DESC', 
        [leadId]
      );
      const quotations = result.rows.map(row => snakeToCamel(row));
      
      res.status(200).json(quotations);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching quotations for lead ${req.params.leadId}:`, error);
    res.status(500).json({ error: 'Failed to fetch quotations for lead' });
  }
});

export default router;
