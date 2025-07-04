/**
 * Check Database Schema
 * Checks the actual database structure to see what tables and columns exist
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

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema...');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Available tables:');
    for (const table of tablesResult.rows) {
      console.log(`- ${table.table_name}`);
    }
    
    // Check specific tables that the dashboard needs
    const tablesToCheck = ['customers', 'leads', 'deals', 'equipment', 'jobs', 'users'];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n🔍 Checking ${tableName} table structure:`);
      
      try {
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);
        
        if (columnsResult.rows.length === 0) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`✅ Table '${tableName}' columns:`);
          for (const col of columnsResult.rows) {
            console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error checking ${tableName}:`, error.message);
      }
    }
    
    // Check if there's any data in existing tables
    console.log('\n📊 Checking existing data:');
    for (const tableName of tablesToCheck) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`- ${tableName}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`- ${tableName}: Table doesn't exist or error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the schema check
checkSchema().catch(console.error);
