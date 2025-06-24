/**
 * Test PostgreSQL connection
 * This script tests the connection to the PostgreSQL database
 */

const pgp = require('pg-promise')();
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
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

console.log('Testing connection to database with config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  ssl: !!config.ssl
});

// Create a database instance
const db = pgp(config);

async function testConnection() {
  try {
    // Test connection
    const connection = await db.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
      // List all tables in the database
    const tables = await db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`✅ Found ${tables.length} tables in the database:`);
    tables.forEach(table => console.log(`- ${table.table_name}`));
    
    // Release the connection
    connection.done();
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection or query failed:', error);
    process.exit(1);
  }
}

// Run the test
testConnection();
