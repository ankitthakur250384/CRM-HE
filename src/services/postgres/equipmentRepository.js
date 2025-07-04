/**
 * Equipment Repository
 * Handles database operations for equipment management
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Database configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

/**
 * Initialize the equipment table if it doesn't exist
 */
export const initializeEquipmentTable = async () => {
  // Skip in browser environment
  if (typeof window !== 'undefined') {
    console.log('Skipping equipment table initialization in browser environment');
    return;
  }
  
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
    
    if (!tableExists) {
      console.log('Creating equipment table...');
      await client.query(`
        CREATE TABLE equipment (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'available',
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          serial_number VARCHAR(100),
          acquisition_date DATE,
          purchase_price DECIMAL(15, 2),
          base_rate_hourly DECIMAL(10, 2) DEFAULT 0,
          base_rate_daily DECIMAL(10, 2) DEFAULT 0,
          base_rate_weekly DECIMAL(10, 2) DEFAULT 0,
          last_maintenance_date DATE,
          next_maintenance_date DATE,
          notes TEXT,
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Equipment table created successfully');
    } else {
      console.log('Equipment table already exists');
    }
    return true;
  } catch (error) {
    console.error('Error initializing equipment table:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

/**
 * Get all equipment
 */
export const getAllEquipment = async () => {
  // Skip in browser environment
  if (typeof window !== 'undefined') {
    console.log('Skipping getAllEquipment in browser environment');
    return [];
  }
  
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM equipment ORDER BY created_at DESC'
    );
    return result.rows;
  } finally {
    client.release();
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM equipment WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Get equipment by category/type
 */
export const getEquipmentByType = async (type) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM equipment WHERE type = $1 ORDER BY name ASC',
      [type]
    );
    return result.rows;
  } finally {
    client.release();
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData) => {
  const client = await pool.connect();
  
  try {
    const id = uuidv4();
    
    const {
      name,
      description,
      type,
      status = 'available',
      manufacturer,
      model,
      serial_number,
      acquisition_date,
      purchase_price,
      base_rate_hourly,
      base_rate_daily,
      base_rate_weekly,
      last_maintenance_date,
      next_maintenance_date,
      notes,
      image_url
    } = equipmentData;
    
    const query = `
      INSERT INTO equipment (
        id, name, description, type, status, manufacturer, model, serial_number,
        acquisition_date, purchase_price, base_rate_hourly, base_rate_daily, base_rate_weekly,
        last_maintenance_date, next_maintenance_date, notes, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *;
    `;
    
    const values = [
      id, name, description, type, status, manufacturer, model, serial_number,
      acquisition_date, purchase_price, base_rate_hourly, base_rate_daily, base_rate_weekly,
      last_maintenance_date, next_maintenance_date, notes, image_url
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Update equipment
 */
export const updateEquipment = async (id, equipmentData) => {
  const client = await pool.connect();
  
  try {
    // First check if equipment exists
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    const {
      name,
      description,
      type,
      status,
      manufacturer,
      model,
      serial_number,
      acquisition_date,
      purchase_price,
      base_rate_hourly,
      base_rate_daily,
      base_rate_weekly,
      last_maintenance_date,
      next_maintenance_date,
      notes,
      image_url
    } = equipmentData;
    
    const query = `
      UPDATE equipment SET
        name = $1,
        description = $2,
        type = $3,
        status = $4,
        manufacturer = $5,
        model = $6,
        serial_number = $7,
        acquisition_date = $8,
        purchase_price = $9,
        base_rate_hourly = $10,
        base_rate_daily = $11,
        base_rate_weekly = $12,
        last_maintenance_date = $13,
        next_maintenance_date = $14,
        notes = $15,
        image_url = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *;
    `;
    
    const values = [
      name, description, type, status, manufacturer, model, serial_number,
      acquisition_date, purchase_price, base_rate_hourly, base_rate_daily, base_rate_weekly,
      last_maintenance_date, next_maintenance_date, notes, image_url, id
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id) => {
  const client = await pool.connect();
  
  try {
    // First check if equipment exists
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return null;
    }
    
    await client.query('DELETE FROM equipment WHERE id = $1', [id]);
    return { id, deleted: true };
  } finally {
    client.release();
  }
};

// Initialize table on module load
initializeEquipmentTable().catch(console.error);
