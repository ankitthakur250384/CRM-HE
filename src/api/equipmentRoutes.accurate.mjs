/**
 * Fix Equipment API Routes
 * Adjusts the route handlers to match the actual database schema
 */

import express from 'express';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Skip authentication check if we're in development mode with bypass header
  if (
    process.env.NODE_ENV === 'development' && 
    (
      req.headers['x-bypass-auth'] === 'development-only-123' ||
      req.headers['x-bypass-auth'] === 'true'
    )
  ) {
    console.log('⚠️ Bypassing authentication in development mode');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development', (err, user) => {
    if (err) {
      console.log('❌ Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Helper to convert database row to Equipment object
// This maps the database schema to the frontend model
const mapDbRowToEquipment = (row) => {
  try {
    return {
      id: row.id.toString(), // Convert numeric ID to string for frontend consistency
      equipmentId: row.equipment_id,
      name: row.name,
      category: row.type || 'mobile_crane', // Map type to category for frontend
      manufacturingDate: row.manufacturing_date || '',
      registrationDate: row.registration_date || '',
      maxLiftingCapacity: parseFloat(row.max_lifting_capacity || 0),
      unladenWeight: parseFloat(row.unladen_weight || 0),
      baseRates: {
        micro: parseFloat(row.base_rate_micro || 0),
        small: parseFloat(row.base_rate_small || 0),
        monthly: parseFloat(row.base_rate_monthly || 0),
        yearly: parseFloat(row.base_rate_yearly || 0),
      },
      runningCostPerKm: parseFloat(row.running_cost_per_km || 0),
      description: row.description || '',
      status: row.status || 'available',
      runningCost: parseFloat(row.running_cost || 0),
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error mapping equipment row:', error, row);
    throw error;
  }
};

// ROUTE ORDER IS IMPORTANT:
// 1. Specific paths (e.g., '/debug/status') before variable paths (e.g., '/:id')
// 2. More specific routes before more general ones

// GET debug status endpoint - specific path must come BEFORE '/:id' path
router.get('/debug/status', async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'equipment'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (tableExists) {
      // Count equipment
      const countResult = await client.query('SELECT COUNT(*) FROM equipment');
      const count = parseInt(countResult.rows[0].count);
      
      // Get column info
      const columnsResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'equipment'
        ORDER BY ordinal_position;
      `);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      res.status(200).json({
        status: 'ok',
        tableExists,
        count,
        columns,
        message: `Equipment table exists with ${count} records and columns: ${columns.join(', ')}`
      });
    } else {
      res.status(200).json({
        status: 'warning',
        tableExists,
        message: 'Equipment table does not exist'
      });
    }
  } catch (error) {
    console.error('Error checking equipment table status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking equipment table status',
      error: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// GET equipment by category
router.get('/category/:category', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log(`Fetching equipment with category: ${req.params.category}`);
    
    // Map category from frontend to type in database
    const result = await client.query('SELECT * FROM equipment WHERE type = $1', [req.params.category]);
    const mappedEquipment = result.rows.map(mapDbRowToEquipment);
    
    res.status(200).json(mappedEquipment);
  } catch (error) {
    console.error(`Error fetching equipment by category ${req.params.category}:`, error);
    res.status(500).json({ message: 'Error fetching equipment by category', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// GET all equipment
router.get('/', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Fetching all equipment from database');
    
    const result = await client.query('SELECT * FROM equipment ORDER BY equipment_id');
    const mappedEquipment = result.rows.map(mapDbRowToEquipment);
    
    res.status(200).json(mappedEquipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// GET equipment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log(`Fetching equipment with ID: ${req.params.id}`);
    
    const result = await client.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    const equipment = mapDbRowToEquipment(result.rows[0]);
    
    res.status(200).json(equipment);
  } catch (error) {
    console.error(`Error fetching equipment ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// CREATE new equipment
router.post('/', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Creating new equipment with data:', req.body);
    
    // Generate equipment ID if not provided
    const equipmentId = req.body.equipmentId || `EQ${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
    
    // Insert new equipment - match the actual table structure
    const result = await client.query(`
      INSERT INTO equipment (
        equipment_id, 
        name, 
        type, 
        status,
        base_rate_micro, 
        base_rate_small, 
        base_rate_monthly, 
        base_rate_yearly,
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      equipmentId,
      req.body.name,
      req.body.category, // Map from frontend category to database type
      req.body.status || 'available',
      req.body.baseRates?.micro || 0,
      req.body.baseRates?.small || 0,
      req.body.baseRates?.monthly || 0,
      req.body.baseRates?.yearly || 0,
      new Date(),
      new Date()
    ]);
    
    const newEquipment = mapDbRowToEquipment(result.rows[0]);
    
    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Error creating equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// UPDATE equipment
router.put('/:id', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log(`Updating equipment with ID: ${req.params.id}`);
    
    // Check if equipment exists
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Update equipment - match the actual table structure
    const result = await client.query(`
      UPDATE equipment SET
        name = $1,
        type = $2,
        status = $3,
        base_rate_micro = $4,
        base_rate_small = $5,
        base_rate_monthly = $6,
        base_rate_yearly = $7,
        updated_at = $8
      WHERE id = $9
      RETURNING *;
    `, [
      req.body.name,
      req.body.category, // Map frontend category to database type
      req.body.status || 'available',
      req.body.baseRates?.micro || 0,
      req.body.baseRates?.small || 0,
      req.body.baseRates?.monthly || 0,
      req.body.baseRates?.yearly || 0,
      new Date(),
      req.params.id
    ]);
    
    const updatedEquipment = mapDbRowToEquipment(result.rows[0]);
    
    res.status(200).json(updatedEquipment);
  } catch (error) {
    console.error(`Error updating equipment ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// DELETE equipment
router.delete('/:id', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log(`Deleting equipment with ID: ${req.params.id}`);
    
    // Check if equipment exists
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Delete equipment
    await client.query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
    
    res.status(200).json({ message: 'Equipment deleted successfully', id: req.params.id });
  } catch (error) {
    console.error(`Error deleting equipment ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

export default router;
