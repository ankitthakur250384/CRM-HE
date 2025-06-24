/**
 * Equipment API Routes - Fixed Version
 * Handles CRUD operations for equipment using PostgreSQL
 * 
 * IMPORTANT: Route order matters in Express. Routes with specific prefixes
 * must be defined before routes with path parameters to avoid conflicts.
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
      // Create the table with ONLY the columns that actually exist in the database
      // Based on our inspection, the database only has these columns
      await client.query(`
        CREATE TABLE equipment (
          id SERIAL PRIMARY KEY,
          equipment_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100),
          status VARCHAR(50) DEFAULT 'available',
          base_rate_micro NUMERIC,
          base_rate_small NUMERIC,
          base_rate_monthly NUMERIC,
          base_rate_yearly NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Equipment table created successfully');
      
      // Insert sample data for development - ADJUSTED to only include fields that actually exist in the database
      await client.query(`
        INSERT INTO equipment (
          equipment_id, name, type, status, 
          base_rate_micro, base_rate_small, base_rate_monthly, base_rate_yearly,
          created_at, updated_at
        ) VALUES 
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ),
        (
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ),
        (
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        );
      `, [
        'EQ0001', 'Mobile Crane MC-30', 'mobile_crane', 'available',
        5000, 8000, 150000, 1500000, new Date(), new Date(),
        
        'EQ0002', 'Tower Crane TC-50', 'tower_crane', 'available',
        10000, 15000, 300000, 3000000, new Date(), new Date(),
        
        'EQ0003', 'Crawler Crane CC-80', 'crawler_crane', 'available',
        12000, 18000, 380000, 3800000, new Date(), new Date()
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
    // CRITICAL: Debugging row properties
    console.log('Raw database row keys:', Object.keys(row));
    console.log('Database type field:', row.type);
    console.log('Database base_rate fields:', {
      micro: row.base_rate_micro,
      small: row.base_rate_small,
      monthly: row.base_rate_monthly,
      yearly: row.base_rate_yearly
    });
    
    // Parse base rates as numbers, ensuring they're not null/undefined
    const baseMicro = row.base_rate_micro !== null ? parseFloat(row.base_rate_micro) : 0;
    const baseSmall = row.base_rate_small !== null ? parseFloat(row.base_rate_small) : 0;
    const baseMonthly = row.base_rate_monthly !== null ? parseFloat(row.base_rate_monthly) : 0;
    const baseYearly = row.base_rate_yearly !== null ? parseFloat(row.base_rate_yearly) : 0;
    
    // CRITICAL: Ensure we have a valid type/category
    const category = row.type || 'mobile_crane';
      // Map database fields to frontend model, using the newly added columns
    const mapped = {
      id: row.id.toString(), // Convert numeric ID to string for frontend consistency
      equipmentId: row.equipment_id,
      name: row.name,
      category: category, // Map from database 'type' to frontend 'category'
      manufacturingDate: row.manufacturing_date || '', // Now using the DB column
      registrationDate: row.registration_date || '', // Now using the DB column
      maxLiftingCapacity: row.max_lifting_capacity !== null ? parseFloat(row.max_lifting_capacity) : 0, // Now using the DB column
      unladenWeight: row.unladen_weight !== null ? parseFloat(row.unladen_weight) : 0, // Now using the DB column
      baseRates: {
        micro: baseMicro,
        small: baseSmall,
        monthly: baseMonthly,
        yearly: baseYearly
      },
      runningCostPerKm: row.running_cost_per_km !== null ? parseFloat(row.running_cost_per_km) : 0, // Now using the DB column
      description: row.description || '', // Now using the DB column
      status: row.status || 'available',
      runningCost: 0, // Not in actual database schema, but needed by frontend
      createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : new Date().toISOString()
    };
    
    // CRITICAL: Verify the mapped object has all required fields
    console.log('Mapped category:', mapped.category);
    console.log('Mapped baseRates:', mapped.baseRates);
    
    return mapped;
  } catch (error) {
    console.error('Error in mapDbRowToEquipment:', error);
    // Provide a minimum valid object even in case of error
    return {
      id: row.id ? row.id.toString() : '0',
      equipmentId: row.equipment_id || 'unknown',
      name: row.name || 'Error mapping equipment',
      category: 'mobile_crane',
      baseRates: { micro: 0, small: 0, monthly: 0, yearly: 0 },
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
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

// GET equipment by category - specific path must come BEFORE '/:id' path
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

// GET equipment by ID - this should come AFTER any routes with path prefixes like /category or /debug
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
      // Insert new equipment - Now including all the newly added columns
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
        max_lifting_capacity,
        unladen_weight,
        running_cost_per_km,
        manufacturing_date,
        registration_date,
        description,
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
      req.body.maxLiftingCapacity || 0,
      req.body.unladenWeight || 0,
      req.body.runningCostPerKm || 0,
      req.body.manufacturingDate || null,
      req.body.registrationDate || null,
      req.body.description || '',
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
      // Update equipment - Now including all the newly added columns
    const result = await client.query(`
      UPDATE equipment SET
        name = $1,
        type = $2,
        status = $3,
        base_rate_micro = $4,
        base_rate_small = $5,
        base_rate_monthly = $6,
        base_rate_yearly = $7,
        max_lifting_capacity = $8,
        unladen_weight = $9,
        running_cost_per_km = $10,
        manufacturing_date = $11,
        registration_date = $12,
        description = $13,
        updated_at = $14
      WHERE id = $15
      RETURNING *;
    `, [
      req.body.name,
      req.body.category, // Map frontend category to database type
      req.body.status || 'available',
      req.body.baseRates?.micro || 0,
      req.body.baseRates?.small || 0,
      req.body.baseRates?.monthly || 0,
      req.body.baseRates?.yearly || 0,
      req.body.maxLiftingCapacity || 0,
      req.body.unladenWeight || 0,
      req.body.runningCostPerKm || 0,
      req.body.manufacturingDate || null,
      req.body.registrationDate || null,
      req.body.description || '',
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

export default router;
