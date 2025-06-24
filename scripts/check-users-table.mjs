/**
 * Check Users Table Schema
 * This script checks the schema of the users table
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
  password: process.env.VITE_DB_PASSWORD || 'vedant21',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkUsersTable() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Database connection successful!');
    
    // Get column information
    const result = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUsers table schema:');
    console.table(result.rows);
    
    // Get sample data
    const userResult = await client.query('SELECT * FROM users LIMIT 3');
    if (userResult.rows.length > 0) {
      console.log('\nSample user data (up to 3 records):');
      userResult.rows.forEach((row, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(row);
      });
    } else {
      console.log('\nNo users found in the table.');
    }
    
    // Count all records
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\nTotal user records: ${countResult.rows[0].count}`);
  } catch (error) {
    console.error('Error checking users table:', error);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

checkUsersTable();
