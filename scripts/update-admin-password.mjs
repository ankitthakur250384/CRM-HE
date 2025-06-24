/**
 * Update Admin Password Script
 * This script updates the admin user's password in the PostgreSQL database
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const pool = new pg.Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function updateAdminPassword() {
  const client = await pool.connect();
  try {
    // Default password for development
    const plainPassword = 'admin123';
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
    
    // Update the admin user's password
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *',
      [passwordHash, 'admin@aspcranes.com']
    );
    
    if (result.rowCount === 0) {
      console.log('Admin user not found!');
    } else {
      console.log('Admin password updated successfully!');
      console.log(`Updated user: ${result.rows[0].email}, role: ${result.rows[0].role}`);
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAdminPassword();
