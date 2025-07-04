/**
 * Check Existing Users
 * Checks what users exist in the database to use proper foreign keys
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

async function checkUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👥 Checking existing users...');
    
    const usersResult = await client.query(`
      SELECT uid, email, display_name, role
      FROM users
      ORDER BY role, display_name;
    `);
    
    console.log('📋 Existing users:');
    for (const user of usersResult.rows) {
      console.log(`- ${user.uid} | ${user.display_name} | ${user.email} | ${user.role}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the user check
checkUsers().catch(console.error);
