/**
 * Add Password Hash Column Script
 * This script adds the password_hash column to the users table
 */

import pg from 'pg';
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

async function addPasswordHashColumn() {
  const client = await pool.connect();
  try {
    // Check if the column already exists
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'password_hash';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Password hash column already exists.');
      return;
    }
    
    // Add the password_hash column
    await client.query(`
      ALTER TABLE users
      ADD COLUMN password_hash VARCHAR(255);
    `);
    
    console.log('Password hash column added successfully!');
  } catch (error) {
    console.error('Error adding password hash column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addPasswordHashColumn();
