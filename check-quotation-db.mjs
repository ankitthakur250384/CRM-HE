/**
 * Direct Database Test for Quotation Deal ID
 * Check if deal_id is being stored in the database
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

async function checkQuotationInDatabase() {
  console.log('🔍 Checking quotation data in database...\n');
  
  const client = await pool.connect();
  
  try {
    // Get the most recent quotation
    const result = await client.query(`
      SELECT id, deal_id, lead_id, customer_id, customer_name, machine_type, created_at
      FROM quotations 
      ORDER BY created_at DESC 
      LIMIT 3;
    `);
    
    console.log('Recent quotations in database:');
    console.log('=====================================');
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Quotation ID: ${row.id}`);
      console.log(`   Deal ID: ${row.deal_id || 'NULL'}`);
      console.log(`   Lead ID: ${row.lead_id || 'NULL'}`);
      console.log(`   Customer ID: ${row.customer_id || 'NULL'}`);
      console.log(`   Customer Name: ${row.customer_name || 'NULL'}`);
      console.log(`   Machine Type: ${row.machine_type || 'NULL'}`);
      console.log(`   Created At: ${row.created_at}`);
      console.log('   ---');
    });
    
    if (result.rows.length === 0) {
      console.log('No quotations found in database');
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkQuotationInDatabase();
