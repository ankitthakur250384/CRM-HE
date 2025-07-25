/**
 * Equipment Repository
 * Handles database operations for equipment management
 */

import { query, getClient } from '../../lib/dbConnection.js';

// Remove the separate pool configuration - use centralized connection

/**
 * Transform database row to frontend format
 * Converts snake_case to camelCase and handles date formatting
 */
const transformDbToFrontend = (dbRow) => {
  if (!dbRow) return null;
  
  // Format dates from YYYY-MM-DD to YYYY-MM for frontend
  const formatDateForFrontend = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().substring(0, 7); // YYYY-MM format
  };
  
  return {
    id: dbRow.id,
    equipmentId: dbRow.equipment_id,
    name: dbRow.name,
    category: dbRow.category,
    manufacturingDate: formatDateForFrontend(dbRow.manufacturing_date),
    registrationDate: formatDateForFrontend(dbRow.registration_date),
    maxLiftingCapacity: parseFloat(dbRow.max_lifting_capacity) || 0,
    unladenWeight: parseFloat(dbRow.unladen_weight) || 0,
    baseRates: {
      micro: parseFloat(dbRow.base_rate_micro) || 0,
      small: parseFloat(dbRow.base_rate_small) || 0,
      monthly: parseFloat(dbRow.base_rate_monthly) || 0,
      yearly: parseFloat(dbRow.base_rate_yearly) || 0,
    },
    runningCostPerKm: parseFloat(dbRow.running_cost_per_km) || 0,
    runningCost: parseFloat(dbRow.running_cost) || 0,
    description: dbRow.description || '',
    status: dbRow.status || 'available',
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
    _source: 'api'
  };
};

/**
 * Transform frontend data to database format
 * Converts camelCase to snake_case and handles date formatting
 */
const transformFrontendToDb = (frontendData) => {
  // Format dates from YYYY-MM to YYYY-MM-01 for PostgreSQL DATE type
  const formatDateForDb = (dateString) => {
    if (!dateString || dateString === '') {
      return null;
    }
    
    const dateStr = String(dateString).trim();
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // If in YYYY-MM format, add -01 for the day
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      return `${dateStr}-01`;
    }
    
    // Try to parse other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().substring(0, 10); // YYYY-MM-DD
    }
    
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM or YYYY-MM-DD`);
  };

  const result = {
    equipment_id: frontendData.equipmentId,
    name: frontendData.name,
    category: frontendData.category,
    manufacturing_date: formatDateForDb(frontendData.manufacturingDate),
    registration_date: formatDateForDb(frontendData.registrationDate),
    max_lifting_capacity: frontendData.maxLiftingCapacity,
    unladen_weight: frontendData.unladenWeight,
    base_rate_micro: frontendData.baseRates?.micro || 0,
    base_rate_small: frontendData.baseRates?.small || 0,
    base_rate_monthly: frontendData.baseRates?.monthly || 0,
    base_rate_yearly: frontendData.baseRates?.yearly || 0,
    running_cost_per_km: frontendData.runningCostPerKm || 0,
    running_cost: frontendData.runningCost || 0,
    description: frontendData.description || '',
    status: frontendData.status || 'available'
  };
  
  return result;
};

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
    client = await getClient();
    
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
  try {
    console.log('Getting all equipment from PostgreSQL database');
    
    const result = await query(`
      SELECT * FROM equipment 
      ORDER BY created_at DESC
    `);
    
    console.log(`Successfully retrieved ${result.rows.length} equipment records`);
    return result.rows.map(transformDbToFrontend);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id) => {
  try {
    console.log(`Getting equipment by ID: ${id}`);
    
    const result = await query(
      'SELECT * FROM equipment WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`Equipment with ID ${id} not found`);
      return null;
    }
    
    console.log(`Equipment ${id} retrieved successfully`);
    return transformDbToFrontend(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching equipment ${id}:`, error);
    throw error;
  }
};

/**
 * Get equipment by category/type
 */
export const getEquipmentByType = async (type) => {
  try {
    console.log(`Getting equipment by category: ${type}`);
    
    const result = await query(
      'SELECT * FROM equipment WHERE category = $1 ORDER BY name ASC',
      [type]
    );
    
    console.log(`Retrieved ${result.rows.length} equipment records for category ${type}`);
    return result.rows.map(transformDbToFrontend);
  } catch (error) {
    console.error(`Error fetching equipment by type ${type}:`, error);
    throw error;
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Transform frontend data to database format
    const dbData = transformFrontendToDb(equipmentData);
    
    // Generate a unique equipment_id if not provided
    const equipmentId = dbData.equipment_id || await generateEquipmentId(client);
    
    // Validate required fields
    if (!dbData.name || !dbData.category || !dbData.manufacturing_date || !dbData.registration_date) {
      throw new Error('Missing required fields: name, category, manufacturingDate, registrationDate are required');
    }
    
    if (!dbData.max_lifting_capacity || !dbData.unladen_weight) {
      throw new Error('Missing required fields: maxLiftingCapacity and unladenWeight are required');
    }
    
    const query = `
      INSERT INTO equipment (
        equipment_id, name, category, manufacturing_date, registration_date,
        max_lifting_capacity, unladen_weight, base_rate_micro, base_rate_small,
        base_rate_monthly, base_rate_yearly, running_cost_per_km, running_cost,
        description, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *;
    `;
    
    const values = [
      equipmentId,
      dbData.name,
      dbData.category,
      dbData.manufacturing_date,
      dbData.registration_date,
      dbData.max_lifting_capacity,
      dbData.unladen_weight,
      dbData.base_rate_micro || 0,
      dbData.base_rate_small || 0,
      dbData.base_rate_monthly || 0,
      dbData.base_rate_yearly || 0,
      dbData.running_cost_per_km || 0,
      dbData.running_cost || 0,
      dbData.description || '',
      dbData.status || 'available'
    ];
    
    const result = await client.query(query, values);
    
    await client.query('COMMIT');
    
    console.log('Equipment created successfully:', result.rows[0].id);
    return transformDbToFrontend(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating equipment:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Generate a unique equipment ID
 */
async function generateEquipmentId(client) {
  try {
    const result = await client.query(
      'SELECT equipment_id FROM equipment WHERE equipment_id LIKE $1 ORDER BY equipment_id DESC LIMIT 1',
      ['EQ%']
    );
    
    if (result.rows.length === 0) {
      return 'EQ0001';
    }
    
    const lastId = result.rows[0].equipment_id;
    const numPart = parseInt(lastId.substring(2)) + 1;
    return `EQ${numPart.toString().padStart(4, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based ID
    return `EQ${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Update equipment
 */
export const updateEquipment = async (id, equipmentData) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log(`Updating equipment ${id}`);
    
    // First check if equipment exists and get current data
    const checkResult = await client.query('SELECT * FROM equipment WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    
    const existingEquipment = checkResult.rows[0];
    
    // Transform frontend data to database format, preserving existing values for missing fields
    const dbData = transformFrontendToDb(equipmentData);
    
    const query = `
      UPDATE equipment SET
        equipment_id = $1,
        name = $2,
        category = $3,
        manufacturing_date = $4,
        registration_date = $5,
        max_lifting_capacity = $6,
        unladen_weight = $7,
        base_rate_micro = $8,
        base_rate_small = $9,
        base_rate_monthly = $10,
        base_rate_yearly = $11,
        running_cost_per_km = $12,
        running_cost = $13,
        description = $14,
        status = $15,
        updated_at = NOW()
      WHERE id = $16
      RETURNING *;
    `;
    
    const values = [
      dbData.equipment_id || existingEquipment.equipment_id,
      dbData.name || existingEquipment.name,
      dbData.category || existingEquipment.category,
      dbData.manufacturing_date || existingEquipment.manufacturing_date,
      dbData.registration_date || existingEquipment.registration_date,
      dbData.max_lifting_capacity || existingEquipment.max_lifting_capacity,
      dbData.unladen_weight || existingEquipment.unladen_weight,
      dbData.base_rate_micro || existingEquipment.base_rate_micro,
      dbData.base_rate_small || existingEquipment.base_rate_small,
      dbData.base_rate_monthly || existingEquipment.base_rate_monthly,
      dbData.base_rate_yearly || existingEquipment.base_rate_yearly,
      dbData.running_cost_per_km || existingEquipment.running_cost_per_km,
      dbData.running_cost || existingEquipment.running_cost,
      dbData.description || existingEquipment.description,
      dbData.status || existingEquipment.status,
      id
    ];
    
    const result = await client.query(query, values);
    return transformDbToFrontend(result.rows[0]);
  } finally {
    client.release();
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id) => {
  const client = await getClient();
  
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

// Export aliases for compatibility
export const getEquipment = getAllEquipment;

// Initialize table on module load - commented out for production deployment
// initializeEquipmentTable().catch(console.error);
