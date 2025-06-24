/**
 * Fixed API routes for quotations with proper type handling
 * This file addresses the type mismatch between VARCHAR and INTEGER fields
 */

import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection with proper error handling
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: 'vedant21',  // Hardcoding the password to ensure consistency
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Setup pool with error handling
let pool;
try {
  pool = new pg.Pool(dbConfig);
  console.log('✅ Quotation API: PostgreSQL connection pool created');
  
  // Verify connection works
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Quotation API: PostgreSQL connection test failed:', err);
    } else {
      console.log('✅ Quotation API: PostgreSQL connection test successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('❌ Quotation API: Failed to create PostgreSQL connection pool:', error);
}

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Authentication middleware with development bypass option
const authenticateToken = (req, res, next) => {
  try {
    console.log('🔐 Authenticating request to Quotations API...');
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Find any bypass header regardless of case
    const hasBypassHeader = Object.keys(req.headers).some(key => 
      key.toLowerCase() === 'x-bypass-auth' && 
      req.headers[key] === 'true'
    );
    
    // DEBUGGING: Check if we're in development and allow bypass for testing
    if (process.env.NODE_ENV === 'development' && hasBypassHeader) {
      console.log('⚠️ Auth bypass enabled for development');
      req.user = { userId: 'dev-user', email: 'dev@example.com', role: 'admin' };
      return next();
    }
    
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('✅ Token authenticated for user:', req.user?.email || 'unknown');
      next();
    } catch (err) {
      console.error('❌ Invalid token:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
};

// Helper function for snake_case to camelCase conversion
function snakeToCamel(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
}

// Helper function for camelCase to snake_case conversion
function camelToSnake(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
}

/**
 * Ensure quotations table exists
 */
async function ensureQuotationsTable(client) {
  try {
    console.log('🏗️ Ensuring quotations table exists...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations'
      ) as exists
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`📊 Quotations table exists: ${tableExists}`);
    
    // Create table if it doesn't exist
    if (!tableExists) {
      console.log('🔧 Creating quotations table...');
      
      try {
        await client.query(`
          CREATE TABLE quotations (
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
            total_price DECIMAL(12, 2),
            status VARCHAR(50) DEFAULT 'draft',
            versions JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        console.log('✅ Successfully created quotations table');
      } catch (tableCreateError) {
        console.error('❌ Error creating quotations table:', tableCreateError);
        throw new Error(`Failed to create quotations table: ${tableCreateError.message}`);
      }
      
      console.log('✅ Quotations table created successfully');
    }
    
    return { success: true, tableCreated: !tableExists };
  } catch (error) {
    console.error('❌ Error ensuring quotations table exists:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all quotations with customer info if available
 */
router.get('/', async (req, res) => {
  console.log('\n📋 GET /api/quotations endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected to database for quotations query');
    
    try {
      // Ensure tables exist
      const tableResult = await ensureQuotationsTable(client);
      console.log('📊 Quotations table check:', tableResult);
      
      // Check if customers table exists for joining
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
        // CRITICAL FIX: Make sure we're joining using the correct field types
        // customer_id in both tables is VARCHAR, so this should work correctly
        try {
          const result = await client.query(`
            SELECT 
              q.*,
              c.customer_id as customer_id_from_customer,
              c.name as customer_name_from_customer,
              c.contact_name as contact_name,
              c.email as customer_email,
              c.phone as customer_phone,
              c.address as customer_address 
            FROM 
              quotations q
            LEFT JOIN 
              customers c ON q.customer_id::varchar = c.customer_id::varchar
            ORDER BY 
              q.created_at DESC
          `);
          
          console.log(`Got ${result.rows.length} quotations from database`);
          quotations = result.rows.map(row => snakeToCamel(row));
        } catch (joinError) {
          console.error('Error with customer join query:', joinError);
          // Fallback to simple query if join fails
          const fallbackResult = await client.query(`
            SELECT * FROM quotations
            ORDER BY created_at DESC
          `);
          
          console.log(`Fallback query retrieved ${fallbackResult.rows.length} quotations`);
          quotations = fallbackResult.rows.map(row => snakeToCamel(row));
        }
      } else {
        // If customers table doesn't exist, just get quotations
        const result = await client.query(`
          SELECT * FROM quotations
          ORDER BY created_at DESC
        `);
        
        console.log(`Got ${result.rows.length} quotations from database (no customer join)`);
        quotations = result.rows.map(row => snakeToCamel(row));
      }
      
      res.json(quotations);
    } catch (innerError) {
      console.error('Error in quotations query processing:', innerError);
      res.status(500).json({ 
        error: 'Failed to process quotations query', 
        details: innerError.message,
        stack: innerError.stack 
      });
    }
  } catch (error) {
    console.error('Error getting quotations:', error);
    res.status(500).json({ 
      error: 'Failed to get quotations', 
      details: error.message,
      stack: error.stack 
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * Get a specific quotation by ID
 */
router.get('/:id', async (req, res) => {
  console.log('\n📋 GET /api/quotations/:id endpoint hit');
  const { id } = req.params;
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  console.log(`Getting quotation with ID: ${id}`);
  
  const client = await pool.connect();
  
  try {
    // Ensure quotation ID is a string since the table schema uses VARCHAR
    const result = await client.query('SELECT * FROM quotations WHERE id = $1', [String(id)]);
    
    if (result.rows.length === 0) {
      console.log(`Quotation with ID ${id} not found`);
      return res.status(404).json({ error: 'Quotation not found' });
    }
    
    const quotation = snakeToCamel(result.rows[0]);
    res.json(quotation);
  } catch (error) {
    console.error(`Error getting quotation with ID ${id}:`, error);
    res.status(500).json({ error: 'Failed to get quotation', details: error.message });
  } finally {
    client.release();
  }
});

/**
 * Create a new quotation
 */
router.post('/', async (req, res) => {
  console.log('\n📝 POST /api/quotations endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const quotation = req.body;
    console.log('Creating new quotation:', quotation);
    
    // Generate UUID for quotation ID if not provided
    const quotationId = quotation.id || uuidv4();
    
    // Convert camelCase to snake_case for database
    const dbQuotation = camelToSnake({
      ...quotation,
      id: quotationId,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Convert JSON objects to PostgreSQL JSONB
    if (dbQuotation.customer_contact && typeof dbQuotation.customer_contact === 'object') {
      dbQuotation.customer_contact = JSON.stringify(dbQuotation.customer_contact);
    }
    
    if (dbQuotation.selected_equipment && typeof dbQuotation.selected_equipment === 'object') {
      dbQuotation.selected_equipment = JSON.stringify(dbQuotation.selected_equipment);
    }
    
    if (dbQuotation.selected_machines && typeof dbQuotation.selected_machines === 'object') {
      dbQuotation.selected_machines = JSON.stringify(dbQuotation.selected_machines);
    }
    
    if (dbQuotation.incidental_charges && typeof dbQuotation.incidental_charges === 'object') {
      dbQuotation.incidental_charges = JSON.stringify(dbQuotation.incidental_charges);
    }
    
    if (dbQuotation.versions && typeof dbQuotation.versions === 'object') {
      dbQuotation.versions = JSON.stringify(dbQuotation.versions);
    }
    
    // Build the query dynamically with error handling
    const fields = Object.keys(dbQuotation).join(', ');
    const placeholders = Object.keys(dbQuotation).map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(dbQuotation);
    
    const client = await pool.connect();
    
    try {
      // Ensure quotations table exists
      await ensureQuotationsTable(client);
      
      // Insert the new quotation
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
    res.status(500).json({ error: 'Failed to create quotation', details: error.message });
  }
});

// Export the router
export default router;
