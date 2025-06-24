/**
 * Equipment API Routes
 * Handles CRUD operations for equipment using PostgreSQL
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
  password: 'vedant21', // Using hardcoded value for consistency with other routes
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

// Create equipment table if it doesn't exist
const initializeEquipmentTable = async () => {
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'equipment'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating equipment table...');
      
      // Create the table with all necessary columns
      await client.query(`
        CREATE TABLE equipment (
          id VARCHAR(36) PRIMARY KEY,
          equipment_id VARCHAR(10) NOT NULL, -- Format: EQ0001, EQ0002, etc.
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          manufacturing_date VARCHAR(7), -- YYYY-MM format
          registration_date VARCHAR(7), -- YYYY-MM format
          max_lifting_capacity NUMERIC(10,2),
          unladen_weight NUMERIC(10,2),
          base_rates JSONB,
          running_cost_per_km NUMERIC(10,2),
          description TEXT,
          status VARCHAR(20) NOT NULL,
          running_cost NUMERIC(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Equipment table created successfully');
      
      // Insert sample data for development
      await client.query(`
        INSERT INTO equipment (
          id, equipment_id, name, category, manufacturing_date, registration_date,
          max_lifting_capacity, unladen_weight, base_rates, running_cost_per_km,
          description, status, running_cost, created_at, updated_at
        ) VALUES 
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ),
        (
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ),
        (
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45
        );
      `, [
        'eq-1', 'EQ0001', 'Mobile Crane MC-30', 'mobile_crane', '2024-01', '2024-02',
        30, 25, JSON.stringify({ micro: 5000, small: 8000, monthly: 150000, yearly: 1500000 }),
        25, '30 ton capacity mobile crane', 'available', 2500, new Date('2025-01-10'), new Date('2025-05-15'),
        
        'eq-2', 'EQ0002', 'Tower Crane TC-50', 'tower_crane', '2024-02', '2024-03',
        8, 120, JSON.stringify({ micro: 10000, small: 15000, monthly: 300000, yearly: 3000000 }),
        35, '50m height tower crane', 'available', 3500, new Date('2025-02-05'), new Date('2025-06-01'),
        
        'eq-3', 'EQ0003', 'Crawler Crane CC-80', 'crawler_crane', '2024-03', '2024-04',
        80, 75, JSON.stringify({ micro: 12000, small: 18000, monthly: 380000, yearly: 3800000 }),
        45, '80 ton capacity crawler crane', 'available', 4500, new Date('2025-03-15'), new Date('2025-04-28')
      ]);
      
      console.log('✅ Sample equipment data inserted successfully');
    } else {
      console.log('Equipment table already exists');
    }
  } catch (error) {
    console.error('Error initializing equipment table:', error);
  } finally {
    client.release();
  }
};

// Initialize table
initializeEquipmentTable().catch(error => {
  console.error('Failed to initialize equipment table:', error);
});

// Helper to convert database row to Equipment object
const mapDbRowToEquipment = (row) => {
  try {
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      name: row.name,
      category: row.category,
      manufacturingDate: row.manufacturing_date,
      registrationDate: row.registration_date,
      maxLiftingCapacity: parseFloat(row.max_lifting_capacity),
      unladenWeight: parseFloat(row.unladen_weight),
      baseRates: typeof row.base_rates === 'string' ? JSON.parse(row.base_rates) : row.base_rates,
      runningCostPerKm: parseFloat(row.running_cost_per_km),
      description: row.description || '',
      status: row.status,
      runningCost: parseFloat(row.running_cost),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    };
  } catch (error) {
    console.error('Error mapping equipment row:', error, row);
    throw error;
  }
};

// Debug endpoint to check equipment table
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
      
      res.status(200).json({
        status: 'ok',
        tableExists,
        count,
        message: `Equipment table exists with ${count} records`
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
    
    const result = await client.query('SELECT * FROM equipment WHERE category = $1', [req.params.category]);
    const mappedEquipment = result.rows.map(mapDbRowToEquipment);
    
    res.status(200).json(mappedEquipment);
  } catch (error) {
    console.error(`Error fetching equipment by category ${req.params.category}:`, error);
    res.status(500).json({ message: 'Error fetching equipment by category', error: error.message });
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
    
    // Generate a unique ID
    const equipmentId = req.body.equipmentId || `EQ${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
    const id = req.body.id || `eq-${uuidv4()}`;
    
    // Insert new equipment
    const result = await client.query(`
      INSERT INTO equipment (
        id, equipment_id, name, category, manufacturing_date, registration_date,
        max_lifting_capacity, unladen_weight, base_rates, running_cost_per_km,
        description, status, running_cost, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `, [
      id,
      equipmentId,
      req.body.name,
      req.body.category,
      req.body.manufacturingDate,
      req.body.registrationDate,
      req.body.maxLiftingCapacity,
      req.body.unladenWeight,
      JSON.stringify(req.body.baseRates),
      req.body.runningCostPerKm,
      req.body.description || '',
      req.body.status,
      req.body.runningCost || 0,
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
    
    // Update equipment
    const result = await client.query(`
      UPDATE equipment SET
        name = $1,
        category = $2,
        manufacturing_date = $3,
        registration_date = $4,
        max_lifting_capacity = $5,
        unladen_weight = $6,
        base_rates = $7,
        running_cost_per_km = $8,
        description = $9,
        status = $10,
        running_cost = $11,
        updated_at = $12
      WHERE id = $13
      RETURNING *;
    `, [
      req.body.name,
      req.body.category,
      req.body.manufacturingDate,
      req.body.registrationDate,
      req.body.maxLiftingCapacity,
      req.body.unladenWeight,
      JSON.stringify(req.body.baseRates),
      req.body.runningCostPerKm,
      req.body.description || '',
      req.body.status,
      req.body.runningCost || 0,
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
    
    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error(`Error deleting equipment ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error deleting equipment', error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Debug endpoint to check equipment table
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
      
      res.status(200).json({
        status: 'ok',
        tableExists,
        count,
        message: `Equipment table exists with ${count} records`
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

export default router;
