/**
 * Database Lead Data Inspection Tool
 * 
 * This script connects directly to the PostgreSQL database and 
 * displays all leads data to help diagnose API vs mock data issues.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Color output helpers
const success = (message) => chalk.green(message);
const error = (message) => chalk.red(message);
const info = (message) => chalk.blue(message);
const warn = (message) => chalk.yellow(message);
const highlight = (message) => chalk.yellowBright.bold(message);

console.log(highlight('=== DATABASE LEAD DATA INSPECTOR ==='));

// Database connection with direct parameters for clarity
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',  // Hardcoded for consistent debugging
  ssl: false
};

console.log(info('Connecting to database with parameters:'));
console.log({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  passwordProvided: dbConfig.password ? 'Yes' : 'No',
  ssl: dbConfig.ssl
});

// Connect to database
const client = new pg.Pool(dbConfig);

async function inspectLeads() {
  console.log(info('Checking database tables...'));
  
  try {
    // Check if leads table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS leads_exist
    `);
    
    if (!tableCheck.rows[0].leads_exist) {
      console.log(error('❌ Leads table does not exist in the database'));
      return;
    }
    
    console.log(success('✅ Leads table exists'));
    
    // Check lead count
    const countResult = await client.query('SELECT COUNT(*) FROM leads');
    const leadCount = parseInt(countResult.rows[0].count);
    console.log(info(`Found ${leadCount} leads in database`));
    
    if (leadCount === 0) {
      console.log(warn('⚠️ No leads found in database'));
      return;
    }
    
    // Get all leads
    console.log(info('Fetching leads data...'));
    const result = await client.query(`
      SELECT * FROM leads 
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(success(`Retrieved ${result.rows.length} leads`));
    console.log(highlight('\nLead Data From Database:'));
    console.table(result.rows);
    
    // Check if there are related tables
    console.log(info('\nChecking for related tables...'));
    const relatedTablesCheck = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') AS customers_exist,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_metadata') AS lead_metadata_exist
    `);
    
    const { customers_exist, lead_metadata_exist } = relatedTablesCheck.rows[0];
    console.log(`Customers table exists: ${customers_exist ? 'Yes' : 'No'}`);
    console.log(`Lead metadata table exists: ${lead_metadata_exist ? 'Yes' : 'No'}`);
    
    // If both tables exist, show a joined query
    if (customers_exist && lead_metadata_exist) {
      console.log(info('\nFetching full lead data with joins...'));
      const joinedResult = await client.query(`
        SELECT 
          l.lead_id as id, 
          c.name as customer_name, 
          c.company as company_name,
          c.email, 
          c.phone,
          l.status, 
          l.source,
          l.notes,
          l.assigned_to,
          l.created_at,
          l.updated_at,
          lm.service_needed,
          lm.site_location,
          lm.start_date,
          lm.rental_days
        FROM leads l
        LEFT JOIN customers c ON l.customer_id::varchar = c.customer_id::varchar
        LEFT JOIN lead_metadata lm ON l.lead_id::varchar = lm.lead_id::varchar
        ORDER BY l.created_at DESC
        LIMIT 10
      `);
      
      console.log(success(`Retrieved ${joinedResult.rows.length} joined lead records`));
      console.log(highlight('\nFull Lead Data With Relationships:'));
      console.table(joinedResult.rows);
    }
    
    console.log(highlight('\nComparing to mock data...'));
    try {
      // Load mock data for comparison
      const mockDataPath = './src/models/leads-schema.json';
      const mockData = await import(mockDataPath, { assert: { type: 'json' } });
      
      console.log(info(`Mock data file has ${mockData.default.leads.length} leads`));
      console.log(info('First mock lead:'));
      console.log(mockData.default.leads[0]);
      
      console.log(highlight('\nDIFFERENCES BETWEEN DATABASE AND MOCK DATA:'));
      console.log(info('- Database lead IDs: ') + result.rows.slice(0, 3).map(r => r.lead_id).join(', '));
      console.log(info('- Mock data lead IDs: ') + mockData.default.leads.slice(0, 3).map(l => l.id).join(', '));
    } catch (err) {
      console.log(warn(`⚠️ Could not load mock data for comparison: ${err.message}`));
    }
    
  } catch (err) {
    console.log(error(`❌ Database error: ${err.message}`));
  } finally {
    await client.end();
    console.log(info('Database connection closed'));
  }
}

// Function to test database connectivity
async function testDatabaseConnection() {
  console.log(highlight('\n=== TESTING DATABASE CONNECTION ==='));
  
  try {
    console.log(info('Attempting to connect to PostgreSQL database...'));
    const testResult = await client.query('SELECT NOW() as time');
    console.log(success(`✅ Connection successful! Database time: ${testResult.rows[0].time}`));
    return true;
  } catch (err) {
    console.log(error(`❌ Database connection error: ${err.message}`));
    
    // Check common connection issues and provide specific advice
    if (err.code === 'ECONNREFUSED') {
      console.log(warn('\nPossible causes:'));
      console.log('1. PostgreSQL server is not running');
      console.log('2. Incorrect host or port');
      console.log('\nSuggested solutions:');
      console.log('- Start PostgreSQL server if it\'s not running');
      console.log('- Check your PostgreSQL installation');
      console.log('- Verify the connection parameters in the .env file');
    } else if (err.code === '28P01') {
      console.log(warn('\nAuthentication failed - incorrect password'));
      console.log('Check the database password in the script and .env file');
    } else if (err.code === '3D000') {
      console.log(warn('\nDatabase does not exist:'));
      console.log(`The database '${dbConfig.database}' does not exist.`);
      console.log('\nSuggested solutions:');
      console.log(`- Create the database: CREATE DATABASE ${dbConfig.database};`);
      console.log('- Check the database name in the .env file');
    }
    
    return false;
  }
}

// Run the inspection with improved error handling
(async () => {
  try {
    // First test basic connectivity
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      // If connected, continue with lead inspection
      await inspectLeads();
    } else {
      console.log(highlight('\n=== DATABASE CONNECTION ISSUES ==='));
      console.log(warn('Cannot inspect leads data due to database connection problems.'));
      
      // Show API check suggestion
      console.log(highlight('\n=== NEXT STEPS ==='));
      console.log(info('1. Run the server status check:'));
      console.log('   npm run check:server');
      console.log(info('\n2. Check API logs for errors:'));
      console.log('   npm run server:dev (in a separate terminal)');
      console.log(info('\n3. Verify PostgreSQL is running properly'));
    }
  } catch (err) {
    console.log(error(`Database inspection failed: ${err.message}`));
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore errors when closing connection
    }
    console.log(highlight('\n=== INSPECTION COMPLETE ==='));
  }
})();
