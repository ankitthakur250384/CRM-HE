/**
 * Authentication Repository
 * Handles database operations for user authentication
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
 * Initialize the users table if it doesn't exist
 */
export const initializeUsersTable = async () => {
  const client = await pool.connect();
  
  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create default admin user
      const adminId = '00000000-0000-0000-0000-000000000000';
      const adminEmail = 'admin@aspcranes.com';
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (id, email, password, role, name) 
        VALUES ($1, $2, $3, $4, $5);
      `, [adminId, adminEmail, adminPassword, 'admin', 'Admin User']);
      
      console.log('Created default admin user');
    }
    return true;
  } catch (error) {
    console.error('Error initializing users table:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Find a user by email
 */
export const findUserByEmail = async (email) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Find a user by ID
 */
export const findUserById = async (userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, email, role, name, created_at FROM users WHERE id = $1', [userId]);
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Create a new user
 */
export const createUser = async (userId, email, hashedPassword, role, name) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO users (id, email, password, role, name) VALUES ($1, $2, $3, $4, $5)', 
      [userId, email, hashedPassword, role, name]
    );
    return { id: userId, email, role, name };
  } finally {
    client.release();
  }
};

// Initialize the users table on module load
initializeUsersTable().catch(console.error);
