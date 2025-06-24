/**
 * Direct API routes for testing
 * These routes bypass authentication and are only meant for development/testing
 */

import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection parameters
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',  // Hardcoded for consistent debugging
  ssl: false
};

// Create database pool
let pool;
try {
  pool = new pg.Pool(dbConfig);
  console.log('✅ Direct API routes: PostgreSQL connection pool created');
} catch (error) {
  console.error('❌ Direct API routes: Failed to create PostgreSQL connection pool:', error);
}

/**
 * Test endpoint that requires no authentication
 */
router.get('/test', async (req, res) => {
  res.status(200).json({
    message: 'Direct API is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get leads directly without authentication (for testing only)
 */
router.get('/leads', async (req, res) => {
  console.log('\n📋 GET /api/direct/leads endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if leads table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS leads_exist
    `);
    
    if (!tableCheck.rows[0].leads_exist) {
      console.log('Leads table does not exist');
      return res.status(200).json({
        status: 'ok',
        message: 'Leads table does not exist',
        leads: []
      });
    }
    
    // Get all leads
    const result = await client.query(`
      SELECT * FROM leads 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`Found ${result.rows.length} leads`);
    
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
    console.error('Error getting leads:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (client) client.release();
  }
});

/**
 * Get quotations directly without authentication (for testing only)
 */
router.get('/quotations', async (req, res) => {
  console.log('\n📋 GET /api/direct/quotations endpoint hit');
  
  if (!pool) {
    console.error('❌ Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if quotations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'quotations'
      ) AS quotations_exist
    `);
    
    if (!tableCheck.rows[0].quotations_exist) {
      console.log('Quotations table does not exist');
      return res.status(200).json({
        status: 'ok',
        message: 'Quotations table does not exist',
        quotations: []
      });
    }
    
    // Get all quotations
    const result = await client.query(`
      SELECT * FROM quotations 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`Found ${result.rows.length} quotations`);
    
    return res.status(200).json({
      status: 'ok',
      count: result.rows.length,
      quotations: result.rows
    });
  } catch (error) {
    console.error('Error getting quotations:', error);
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
