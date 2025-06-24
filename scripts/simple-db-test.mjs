/**
 * Simple Database Connection Test
 * 
 * This script performs a basic PostgreSQL connection test
 * without any dependencies on other project files.
 */

import pg from 'pg';

// Database connection params
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
};

console.log('=== SIMPLE DATABASE CONNECTION TEST ===');
console.log('Connection parameters:');
console.log({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordProvided: dbConfig.password ? 'Yes' : 'No',
  ssl: dbConfig.ssl
});

// Create client
const client = new pg.Client(dbConfig);

async function testConnection() {
  try {
    console.log('\nAttempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test a simple query
    console.log('\nRunning test query...');
    const res = await client.query('SELECT NOW() as time');
    console.log(`✅ Query executed successfully: ${res.rows[0].time}`);

    // Check if the leads table exists
    console.log('\nChecking for leads table...');
    const tablesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS leads_exist
    `);

    if (tablesCheck.rows[0].leads_exist) {
      console.log('✅ Leads table exists');
      
      // Count leads
      const countRes = await client.query('SELECT COUNT(*) FROM leads');
      console.log(`✅ Found ${countRes.rows[0].count} leads in database`);
      
      // Show some lead data if available
      if (parseInt(countRes.rows[0].count) > 0) {
        const leadsRes = await client.query('SELECT * FROM leads LIMIT 3');
        console.log('\nSample lead data:');
        console.log(leadsRes.rows);
      }
    } else {
      console.log('❌ Leads table does not exist');
    }
  } catch (err) {
    console.error('❌ Database Error:', err.message);
    
    // Provide more specific error information
    if (err.code === 'ECONNREFUSED') {
      console.error('\nThe connection was refused. Possible reasons:');
      console.error('- PostgreSQL is not running');
      console.error('- Wrong host or port');
    } else if (err.code === '28P01') {
      console.error('\nAuthentication failed. Wrong username or password.');
    } else if (err.code === '3D000') {
      console.error(`\nDatabase '${dbConfig.database}' does not exist.`);
    }
  } finally {
    await client.end();
    console.log('\nConnection closed');
  }
}

// Run the test
testConnection();
