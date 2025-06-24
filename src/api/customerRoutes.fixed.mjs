/**
 * Modified Customer API routes to fix frontend integration
 * This file provides endpoints to manage customers in PostgreSQL with proper mapping
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const router = express.Router();

// Database connection parameters
const dbConfig = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: 'vedant21',  // Hardcoding the password to ensure consistency
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Log database connection parameters (hiding password)
console.log('Customer API: Database connection parameters:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordProvided: dbConfig.password ? 'Yes' : 'No',
  ssl: !!dbConfig.ssl
});

let pool;
try {
  pool = new pg.Pool(dbConfig);
  console.log('✅ Customer API: PostgreSQL connection pool created');
  
  // Verify connection works
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Customer API: PostgreSQL connection test failed:', err);
    } else {
      console.log('✅ Customer API: PostgreSQL connection test successful:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('❌ Customer API: Failed to create PostgreSQL connection pool:', error);
}

// GET all customers with no auth for debugging
router.get('/', async (req, res) => {
  console.log('GET /api/customers endpoint hit');
  
  if (!pool) {
    console.error('Database pool not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('Querying database for customers...');
      const result = await client.query(`
        SELECT * FROM customers ORDER BY name ASC
      `);
      
      console.log(`Found ${result.rows.length} customers in database`);
      
      // Map database columns to frontend expected format
      const customers = result.rows.map(row => ({
        id: row.customer_id,  // Using customer_id from DB as id for frontend
        name: row.name,
        contactName: row.designation, // Using designation field as contactName
        email: row.email,
        phone: row.phone,
        address: row.address,
        type: row.company, // Using company field as type
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      if (customers.length > 0) {
        console.log('Sample customer:', customers[0]);
      }
      
      res.json(customers);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers: ' + error.message });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { id } = req.params;
    console.log(`GET /api/customers/${id} endpoint hit`);
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM customers WHERE customer_id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      // Map to frontend format
      const row = result.rows[0];
      const customer = {
        id: row.customer_id,
        name: row.name,
        contactName: row.designation,
        email: row.email,
        phone: row.phone,
        address: row.address,
        type: row.company,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(customer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching customer ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch customer: ' + error.message });
  }
});

// POST create new customer
router.post('/', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database connection not available' });
  }
  
  try {
    const { name, contactName, email, phone, address, type } = req.body;
    console.log('Creating new customer:', { name, email });
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Generate a unique customer ID
      const customerId = `customer-${uuidv4().substring(0, 8)}`;
      const now = new Date();
      
      // Map frontend fields to database columns
      const result = await client.query(`
        INSERT INTO customers (
          customer_id, name, designation, email, phone, address, company, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *
      `, [
        customerId,
        name,
        contactName || null,
        email || null,
        phone || null,
        address || null,
        type || 'other',
        now,
        now
      ]);
      
      // Map back to frontend format
      const row = result.rows[0];
      const newCustomer = {
        id: row.customer_id,
        name: row.name,
        contactName: row.designation,
        email: row.email,
        phone: row.phone,
        address: row.address,
        type: row.company,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.status(201).json(newCustomer);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer: ' + error.message });
  }
});

// Export router
export default router;
