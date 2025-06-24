/**
 * API routes for lead operations - Fixed version with better error handling
 * This file provides endpoints to manage leads in PostgreSQL
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
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

// Log database connection parameters (hiding password)
console.log('Leads API: Database connection parameters:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordProvided: dbConfig.password ? 'Yes' : 'No',
  ssl: !!dbConfig.ssl
});

// Create a new pool with appropriate error handling
let pool;
try {
  pool = new pg.Pool(dbConfig);
  console.log('✅ Leads API: PostgreSQL connection pool created');
  
  // Verify connection works
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Leads API: PostgreSQL connection test failed:', err);
    } else {
      console.log('✅ Leads API: PostgreSQL connection test successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('❌ Leads API: Failed to create PostgreSQL connection pool:', error);
}

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Authentication middleware with improved error handling and debugging
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 Authenticating request to Leads API...');
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Log request path for debugging
    console.log(`Request path: ${req.method} ${req.path}`);
    
    // Find any bypass header regardless of case
    const hasBypassHeader = Object.keys(req.headers).some(key => 
      key.toLowerCase() === 'x-bypass-auth' && 
      req.headers[key] === 'true'
    );
    
    // Development bypass authentication
    if (process.env.NODE_ENV === 'development') {
      if (hasBypassHeader) {
        console.log('⚠️ Auth bypass enabled for development environment');
        req.user = { userId: 'dev-user', email: 'dev@example.com', role: 'admin' };
        return next();
      } else {
        console.log('ℹ️ Development mode but no bypass header found');
      }
    }
    
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    
    // Detailed logging
    if (!authHeader) {
      console.log('❌ No authorization header found');
    } else {
      console.log('Authorization header found:', authHeader.substring(0, 15) + '...');
    }
    
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided or token format incorrect');
      return res.status(401).json({ 
        error: 'Authentication required', 
        details: 'No valid token provided',
        help: process.env.NODE_ENV === 'development' ? 
          'Add X-Bypass-Auth: true header for development testing' : undefined
      });
    }
    
    // Verify token with more robust error handling
    try {
      // Log token's first few characters for debugging
      console.log(`🔑 Verifying token: ${token.substring(0, 10)}...`);
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('✅ Token authenticated for user:', req.user?.email || req.user?.userId || 'unknown');
      next();
    } catch (err) {
      console.error('❌ Token verification error:', err.message);
      
      // More specific error messages based on jwt error
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', details: 'Please log in again' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: 'Invalid token', details: err.message });
      } else {
        return res.status(403).json({ error: 'Token verification failed', details: err.message });
      }
    }
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Server authentication error', 
      details: error.message 
    });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Get all leads
 */
router.get('/', async (req, res) => {
  console.log('\n📋 GET /api/leads endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') AS leads_exist,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') AS customers_exist,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_metadata') AS lead_metadata_exist
    `);
    
    const { leads_exist, customers_exist, lead_metadata_exist } = tablesCheck.rows[0];
    
    if (!leads_exist) {
      console.log('⚠️ Leads table does not exist, creating...');
      // Create leads table
      await client.query(`
        CREATE TABLE leads (
          lead_id VARCHAR(255) PRIMARY KEY,
          customer_id VARCHAR(255),
          status VARCHAR(50) NOT NULL DEFAULT 'new',
          source VARCHAR(50),
          notes TEXT,
          assigned_to VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Leads table created');
    }
    
    if (!lead_metadata_exist) {
      console.log('⚠️ Lead metadata table does not exist, creating...');
      // Create lead metadata table
      await client.query(`
        CREATE TABLE lead_metadata (
          id SERIAL PRIMARY KEY,
          lead_id VARCHAR(255) REFERENCES leads(lead_id),
          service_needed VARCHAR(100),
          site_location TEXT,
          start_date TIMESTAMP WITH TIME ZONE,
          rental_days INTEGER,
          shift_timing VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Lead metadata table created');
    }
      // Check if tables are empty and return early with empty array
    if (!leads_exist) {
      console.log('⚠️ Leads table does not exist yet, returning empty array');
      return res.json([]);
    }
    
    // Add some sample data if the table is empty
    const countResult = await client.query('SELECT COUNT(*) FROM leads');
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('⚠️ Leads table is empty, adding sample data...');
      
      // Insert a sample lead
      const sampleLeadId = 'lead-sample-1';
      await client.query(`
        INSERT INTO leads (lead_id, status, source, notes, created_at, updated_at)
        VALUES ($1, 'new', 'website', 'Sample lead for testing', NOW(), NOW())
      `, [sampleLeadId]);
      
      // Insert sample metadata if the table exists
      if (lead_metadata_exist) {
        await client.query(`
          INSERT INTO lead_metadata (lead_id, service_needed, site_location)
          VALUES ($1, 'Mobile Crane Rental', 'Downtown Project Site')
        `, [sampleLeadId]);
      }
      
      console.log('✅ Sample lead data added');
    }
    
    // Join leads with customers to get customer information - WITH TYPE CASTING and proper error handling
    console.log('🔍 Fetching leads with customer information...');
    
    // Build query based on which tables exist
    let query;
    if (customers_exist && lead_metadata_exist) {
      query = `
        SELECT 
          l.lead_id as id, 
          c.name as customer_name, 
          c.company as company_name,
          c.email, 
          c.phone,
          c.designation,
          l.status, 
          l.source,
          l.notes,
          l.assigned_to,
          l.created_at,
          l.updated_at,
          lm.service_needed,
          lm.site_location,
          lm.start_date,
          lm.rental_days,
          lm.shift_timing
        FROM leads l
        LEFT JOIN customers c ON l.customer_id::varchar = c.customer_id::varchar
        LEFT JOIN lead_metadata lm ON l.lead_id::varchar = lm.lead_id::varchar
        ORDER BY l.created_at DESC
      `;
    } else if (customers_exist) {
      query = `
        SELECT 
          l.lead_id as id, 
          c.name as customer_name, 
          c.company as company_name,
          c.email, 
          c.phone,
          c.designation,
          l.status, 
          l.source,
          l.notes,
          l.assigned_to,
          l.created_at,
          l.updated_at
        FROM leads l
        LEFT JOIN customers c ON l.customer_id::varchar = c.customer_id::varchar
        ORDER BY l.created_at DESC
      `;
    } else {
      query = `
        SELECT 
          lead_id as id,
          status, 
          source,
          notes,
          assigned_to,
          created_at,
          updated_at
        FROM leads
        ORDER BY created_at DESC
      `;
    }
    
    const result = await client.query(query);
    console.log(`✅ Retrieved ${result.rows.length} leads`);
    
    // Transform data to match the Lead type
    const leads = result.rows.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      designation: row.designation,
      status: row.status,
      source: row.source,
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      shiftTiming: row.shift_timing
    }));
    
    res.json(leads);
  } catch (error) {
    console.error('❌ Error getting leads:', error);
    res.status(500).json({ error: `Error getting leads: ${error.message}` });
  } finally {
    if (client) client.release();
  }
});

// Additional routes from the original file would go here...

export default router;
