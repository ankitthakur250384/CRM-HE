/**
 * TEMPORARY TEST VERSION OF LEADS API
 * With no authentication required - FOR DEBUGGING ONLY
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection with proper error handling
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',  // Hardcoded password for consistency
  ssl: false
};

// Log database connection parameters
console.log('Debug Leads API: Database connection parameters:', {
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
  console.log('✅ Debug Leads API: PostgreSQL connection pool created');
  
  // Verify connection works
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Debug Leads API: PostgreSQL connection test failed:', err);
    } else {
      console.log('✅ Debug Leads API: PostgreSQL connection test successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('❌ Debug Leads API: Failed to create PostgreSQL connection pool:', error);
}

/**
 * Get all leads - NO AUTHENTICATION REQUIRED (FOR DEBUG ONLY)
 */
router.get('/', async (req, res) => {
  console.log('\n📋 GET /api/debug/leads endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if table exists
    const tablesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS leads_exist
    `);
    
    const { leads_exist } = tablesCheck.rows[0];
    console.log(`Leads table exists: ${leads_exist}`);
    
    // Return empty array if table doesn't exist
    if (!leads_exist) {
      console.log('Leads table does not exist, returning empty array');
      return res.json([]);
    }
    
    // Get leads count
    const countResult = await client.query('SELECT COUNT(*) FROM leads');
    console.log(`Found ${countResult.rows[0].count} leads in database`);
    
    // If no leads, insert sample data
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('No leads found, inserting sample data');
      
      // Insert sample lead
      const sampleLeadId = 'lead-sample-debug';
      await client.query(`
        INSERT INTO leads (lead_id, status, source, notes, created_at, updated_at)
        VALUES ($1, 'new', 'website', 'Debug sample lead', NOW(), NOW())
      `, [sampleLeadId]);
      
      console.log('Sample lead inserted');
    }
    
    // Get all leads with simple query
    console.log('Querying for all leads');
    const result = await client.query('SELECT * FROM leads');
    
    console.log(`Returning ${result.rows.length} leads`);
    return res.json(result.rows.map(row => ({
      id: row.lead_id,
      status: row.status,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ 
      error: 'Database error', 
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (client) client.release();
    console.log('Database connection released');
  }
});

/**
 * Get leads with debug info - NO AUTHENTICATION REQUIRED
 */
router.get('/debug', async (req, res) => {
  console.log('\n📋 GET /api/debug/leads/debug endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database for debug query');
    
    // Check if table exists
    const tablesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS leads_exist
    `);
    
    const { leads_exist } = tablesCheck.rows[0];
    
    if (!leads_exist) {
      return res.status(200).json({
        debug: true,
        endpoint: '/api/debug/leads/debug',
        message: 'Leads table does not exist',
        timestamp: new Date().toISOString(),
        leads: []
      });
    }
    
    // Get all leads with debug info
    const result = await client.query('SELECT * FROM leads LIMIT 20');
    
    return res.status(200).json({
      debug: true,
      endpoint: '/api/debug/leads/debug',
      timestamp: new Date().toISOString(),
      count: result.rows.length,
      leads: result.rows
    });
  } catch (error) {
    console.error('Debug leads endpoint error:', error);
    return res.status(500).json({
      debug: true,
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * Get leads directly - NO AUTHENTICATION REQUIRED
 */
router.get('/direct', async (req, res) => {
  console.log('\n📋 GET /api/debug/leads/direct endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database for direct query');
    
    // Check if leads table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS table_exists
    `);
    
    if (!tableCheck.rows[0].table_exists) {
      return res.status(200).json({
        status: 'ok',
        message: 'Leads table does not exist',
        leads: []
      });
    }
    
    // Get all leads
    const result = await client.query('SELECT * FROM leads LIMIT 100');
    
    return res.status(200).json({
      status: 'ok',
      count: result.rows.length,
      leads: result.rows.map(row => ({
        id: row.lead_id,
        customerId: row.customer_id,
        status: row.status,
        source: row.source,
        notes: row.notes,
        assignedTo: row.assigned_to,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Direct leads endpoint error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (client) client.release();
  }
});

export default router;
