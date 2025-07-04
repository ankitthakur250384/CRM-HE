/**
 * Quotation API Routes
 * Handles CRUD operations for quotations
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

// Create quotations table if it doesn't exist
const initializeQuotationsTable = async () => {
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      console.log('Creating quotations table...');
      await client.query(`
        CREATE TABLE quotations (
          id VARCHAR(36) PRIMARY KEY,
          customer_id VARCHAR(36) REFERENCES customers(id),
          deal_id VARCHAR(36) REFERENCES deals(id),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          total_amount DECIMAL(15, 2),
          status VARCHAR(50) NOT NULL,
          created_by VARCHAR(36),
          assigned_to VARCHAR(36),
          valid_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Quotations table created successfully');
    }
  } catch (error) {
    console.error('Error initializing quotations table:', error);
  } finally {
    client.release();
  }
};

// Initialize the quotations table
initializeQuotationsTable().catch(console.error);

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
        LEFT JOIN deals d ON q.deal_id = d.id
        ORDER BY q.created_at DESC;
      `);
      
      return res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT q.*, c.name as customer_name, c.email as customer_email,
               c.phone as customer_phone, d.title as deal_title
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        LEFT JOIN deals d ON q.deal_id = d.id
        WHERE q.id = $1;
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new quotation
router.post('/', async (req, res) => {
  try {
    const { 
      customer_id, 
      deal_id, 
      title, 
      description, 
      total_amount, 
      status, 
      created_by,
      assigned_to,
      valid_until
    } = req.body;
    
    if (!customer_id || !title || !status) {
      return res.status(400).json({ message: 'Customer ID, title and status are required' });
    }
    
    const client = await pool.connect();
    
    try {
      const id = uuidv4();
      
      await client.query(`
        INSERT INTO quotations (
          id, customer_id, deal_id, title, description, total_amount, 
          status, created_by, assigned_to, valid_until
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
      `, [
        id, customer_id, deal_id, title, description, total_amount, 
        status, created_by || req.user.id, assigned_to, valid_until
      ]);
      
      return res.status(201).json({ 
        id,
        message: 'Quotation created successfully' 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_id, 
      deal_id, 
      title, 
      description, 
      total_amount, 
      status, 
      assigned_to,
      valid_until
    } = req.body;
    
    if (!title || !status) {
      return res.status(400).json({ message: 'Title and status are required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if quotation exists
      const checkResult = await client.query('SELECT * FROM quotations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      await client.query(`
        UPDATE quotations
        SET customer_id = $1,
            deal_id = $2,
            title = $3,
            description = $4,
            total_amount = $5,
            status = $6,
            assigned_to = $7,
            valid_until = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9;
      `, [customer_id, deal_id, title, description, total_amount, status, assigned_to, valid_until, id]);
      
      return res.status(200).json({ message: 'Quotation updated successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      await client.query('DELETE FROM quotations WHERE id = $1', [id]);
      
      return res.status(200).json({ message: 'Quotation deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
