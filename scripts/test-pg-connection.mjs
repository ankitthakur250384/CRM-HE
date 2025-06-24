/**
 * Simple PostgreSQL connection test
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection pool
const pool = new pg.Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully!');
    
    // Test query to retrieve users count
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Users in database: ${result.rows[0].count}`);
    
    // Test query to get users
    const users = await client.query('SELECT uid, email, role FROM users LIMIT 5');
    console.log('Sample users:');
    console.table(users.rows.map(user => ({
      uid: user.uid,
      email: user.email,
      role: user.role
    })));
    
    client.release();
    console.log('Connection test completed successfully.');
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
    console.error('Please check your database configuration in .env file.');
  } finally {
    // Close the pool
    await pool.end();
  }
}

testConnection();
