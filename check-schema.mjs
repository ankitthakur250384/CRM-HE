/**
 * Check Quotations Table Schema
 */

import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

async function checkSchema() {
  console.log('🔍 Checking quotations table schema...\n');
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'quotations' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Quotations table columns:');
    console.log('========================');
    result.rows.forEach(row => {
      console.log(`${row.ordinal_position}. ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      if (row.column_default) {
        console.log(`   Default: ${row.column_default}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
