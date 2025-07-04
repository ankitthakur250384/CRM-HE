/**
 * Authentication Repository
 * Handles database operations for user authentication
 * Updated to match existing database schema (uid, password_hash, display_name)
 */

import pg from 'pg';
import bcrypt from 'bcrypt';

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
 * Initialize users table and create default admin user if needed
 */
export const initializeUsersTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking users table...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Please run the database schema first.');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Check if admin user exists
    const adminCheck = await client.query(`
      SELECT uid FROM users WHERE email = $1
    `, ['admin@aspcranes.com']);
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creating default admin user...');
      
      // Create default admin user
      const adminUid = 'usr_admin01';
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (uid, email, password_hash, display_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, [adminUid, 'admin@aspcranes.com', hashedPassword, 'Admin User', 'admin']);
      
      console.log('✅ Default admin user created');
      console.log('   Email: admin@aspcranes.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create test user if it doesn't exist
    const testCheck = await client.query(`
      SELECT uid FROM users WHERE email = $1
    `, ['test@aspcranes.com']);
    
    if (testCheck.rows.length === 0) {
      const testUid = 'usr_test001';
      const testHashedPassword = await bcrypt.hash('test123', 10);
      
      await client.query(`
        INSERT INTO users (uid, email, password_hash, display_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, [testUid, 'test@aspcranes.com', testHashedPassword, 'Test User', 'sales_agent']);
      
      console.log('✅ Test user created: test@aspcranes.com / test123');
    }
    
  } catch (error) {
    console.error('Error initializing users table:', error);
  } finally {
    client.release();
  }
};

/**
 * Find user by email (maps database fields to expected auth format)
 */
export const findUserByEmail = async (email) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        uid as id, 
        email, 
        password_hash as password, 
        role, 
        display_name as name, 
        created_at, 
        updated_at
      FROM users 
      WHERE email = $1
    `, [email]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Find user by ID (maps database fields to expected auth format)
 */
export const findUserById = async (uid) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        uid as id, 
        email, 
        password_hash as password, 
        role, 
        display_name as name, 
        created_at, 
        updated_at
      FROM users 
      WHERE uid = $1
    `, [uid]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create new user
 */
export const createUser = async (uid, email, password_hash, role, display_name) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      INSERT INTO users (uid, email, password_hash, role, display_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING uid as id, email, role, display_name as name, created_at
    `, [uid, email, password_hash, role, display_name]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize the users table on module load
initializeUsersTable().catch(console.error);
