/**
 * Equipment API Routes
 * Handles CRUD operations for equipment using PostgreSQL
 * 
 * IMPORTANT: Route order matters in Express. Routes with specific prefixes
 * must be defined before routes with path parameters to avoid conflicts.
 * 
 * FIXED: Properly ordered routes to avoid conflicts
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
      // Create the table with all necessary columns - using the actual schema we've verified
      // The actual table uses 'type' column (NOT 'equipment_type' or 'category')
      // The actual table uses individual base_rate_* columns (NOT base_rates JSON)
      await client.query(`
        CREATE TABLE equipment (
          id SERIAL PRIMARY KEY,
          equipment_id VARCHAR(10) NOT NULL, -- Format: EQ0001, EQ0002, etc.
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL, -- Frontend uses 'category', database uses 'type'
          manufacturing_date VARCHAR(7), -- YYYY-MM format
          registration_date VARCHAR(7), -- YYYY-MM format
          max_lifting_capacity NUMERIC(10,2),
          unladen_weight NUMERIC(10,2),
          base_rate_micro NUMERIC(10,2),
          base_rate_small NUMERIC(10,2),
          base_rate_monthly NUMERIC(10,2),
          base_rate_yearly NUMERIC(10,2),
          running_cost_per_km NUMERIC(10,2),
          description TEXT,
          status VARCHAR(20) NOT NULL,
          running_cost NUMERIC(10,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Equipment table created successfully');
      
      // Insert sample data for development - matching the actual table schema
      await client.query(`
        INSERT INTO equipment (
          equipment_id, name, type, manufacturing_date, registration_date,
          max_lifting_capacity, unladen_weight, base_rate_micro, base_rate_small, 
          base_rate_monthly, base_rate_yearly, running_cost_per_km,
          description, status, running_cost, created_at, updated_at
        ) VALUES 
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ),
        (
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        ),
        (
          $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
        );
      `, [
        'EQ0001', 'Mobile Crane MC-30', 'mobile_crane', '2024-01', '2024-02',
        30, 25, 5000, 8000, 150000, 1500000,
        25, '30 ton capacity mobile crane', 'available', 2500, new Date(), new Date(),
        
        'EQ0002', 'Tower Crane TC-50', 'tower_crane', '2024-02', '2024-03',
        8, 120, 10000, 15000, 300000, 3000000,
        35, '50m height tower crane', 'available', 3500, new Date(), new Date(),
        
        'EQ0003', 'Crawler Crane CC-80', 'crawler_crane', '2024-03', '2024-04',
        80, 75, 12000, 18000, 380000, 3800000,
        45, '80 ton capacity crawler crane', 'available', 4500, new Date(), new Date()
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
// This maps the database schema to the frontend model
const mapDbRowToEquipment = (row) => {
  try {
    return {
      id: row.id.toString(), // Convert numeric ID to string for frontend consistency
      equipmentId: row.equipment_id,
      name: row.name,
      category: row.type, // Map from database 'type' to frontend 'category'
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

// IMPORTANT: Route order matters!
// Routes with specific paths must come before routes with path parameters

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

// GET all equipment - Make sure this is before any parametrized routes
router.get('/', authenticateToken, async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Fetching all equipment');
    
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

// GET equipment by ID - This must come AFTER other specific GET routes
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
        manufacturing_date,
        registration_date,
        max_lifting_capacity,
        unladen_weight,
        base_rate_micro, 
        base_rate_small, 
        base_rate_monthly, 
        base_rate_yearly,
        running_cost_per_km,
        description,
        status,
        running_cost,
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `, [
      equipmentId,
      req.body.name,
      req.body.category, // Map from frontend category to database type
      req.body.manufacturingDate || '',
      req.body.registrationDate || '',
      req.body.maxLiftingCapacity || 0,
      req.body.unladenWeight || 0,
      req.body.baseRates?.micro || 0,
      req.body.baseRates?.small || 0,
      req.body.baseRates?.monthly || 0,
      req.body.baseRates?.yearly || 0,
      req.body.runningCostPerKm || 0,
      req.body.description || '',
      req.body.status || 'available',
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
    
    // Update equipment - match the actual table structure
    const result = await client.query(`
      UPDATE equipment SET
        name = $1,
        type = $2,
        manufacturing_date = $3,
        registration_date = $4,
        max_lifting_capacity = $5,
        unladen_weight = $6,
        base_rate_micro = $7,
        base_rate_small = $8,
        base_rate_monthly = $9,
        base_rate_yearly = $10,
        running_cost_per_km = $11,
        description = $12,
        status = $13,
        running_cost = $14,
        updated_at = $15
      WHERE id = $16
      RETURNING *;
    `, [
      req.body.name,
      req.body.category, // Map frontend category to database type
      req.body.manufacturingDate || '',
      req.body.registrationDate || '',
      req.body.maxLiftingCapacity || 0,
      req.body.unladenWeight || 0,
      req.body.baseRates?.micro || 0,
      req.body.baseRates?.small || 0,
      req.body.baseRates?.monthly || 0,
      req.body.baseRates?.yearly || 0,
      req.body.runningCostPerKm || 0,
      req.body.description || '',
      req.body.status || 'available',
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
    res.status(500).json({ message: 'Error deleting equipment', error: error.message });  } finally {
    if (client) client.release();
  }
});

export default router;
