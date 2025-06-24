/**
 * Simple test for PostgreSQL connection
 */
const pgp = require('pg-promise')();
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Database configuration
const config = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log('Testing database connection with config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  ssl: !!config.ssl
});

// Create a database instance
const db = pgp(config);

async function runTests() {
  try {
    // Test connection
    console.log('Connecting to database...');
    const connection = await db.connect();
    console.log('✅ Connected to database successfully!');
    
    // Test query - list tables
    console.log('Listing tables...');
    const tables = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${tables.length} tables in the database:`);
    tables.forEach(table => console.log(`- ${table.table_name}`));
    
    // Check if config table exists and query content
    if (tables.some(t => t.table_name === 'config')) {
      console.log('Querying config table...');
      const configs = await db.any('SELECT name, value FROM config');
      console.log(`✅ Found ${configs.length} config entries:`);
      configs.forEach(config => {
        console.log(`- ${config.name}: ${JSON.stringify(config.value).substring(0, 100)}${config.value && JSON.stringify(config.value).length > 100 ? '...' : ''}`);
      });
    }
    
    // Release the connection
    connection.done();
    console.log('✅ Database tests completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    // Always terminate the connection
    pgp.end();
  }
}

// Run the tests
runTests();
