/**
 * Test the database client from the application
 * This helps ensure the client is configured correctly
 */

import { db } from '../src/lib/db.js';

async function testDbClient() {
  try {
    console.log('Testing database client connection...');
    
    // Check if table exists by querying pg_tables
    const tableCheck = await db.any(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'config'
      ) as exists
    `);
    
    console.log('Config table exists:', tableCheck[0]?.exists);
    
    if (tableCheck[0]?.exists) {
      // Query config entries
      const configs = await db.any('SELECT name, updated_at FROM config');
      console.log('Found configs:', configs);
      
      // Try to get a specific config
      const additionalParams = await db.oneOrNone(
        'SELECT value FROM config WHERE name = $1',
        ['additional_params']
      );
      
      console.log('Additional Params config:', additionalParams?.value || 'Not found');
      
      // Try to insert a test config if it doesn't exist
      await db.none(
        `INSERT INTO config(name, value) 
         VALUES($1, $2) 
         ON CONFLICT (name) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        ['test_config', { test: true, timestamp: new Date().toISOString() }]
      );
      
      console.log('Test config inserted/updated successfully');
    }
    
    console.log('✅ Database client tests completed successfully');
  } catch (error) {
    console.error('❌ Database client test failed:', error);
  }
}

// Run the test
testDbClient();
