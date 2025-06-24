/**
 * Test Database Configuration
 * 
 * This script tests the functionality of the database configuration system.
 * It simulates saving and loading database configuration from the database.
 */

const { getDatabaseConfig, updateDatabaseConfig } = require('./src/services/postgres/configRepository');

async function testDatabaseConfig() {
  console.log('Testing database configuration system...');
  
  try {
    // 1. Get current database configuration
    console.log('\n1. Getting current database configuration:');
    const currentConfig = await getDatabaseConfig();
    console.log('Current config:', currentConfig);
    
    // 2. Update database configuration
    console.log('\n2. Updating database configuration:');
    const testConfig = {
      host: 'test-host',
      port: 5433,
      database: 'test_database',
      user: 'test_user',
      password: 'test_password',
      ssl: true
    };
    
    const updatedConfig = await updateDatabaseConfig(testConfig);
    console.log('Updated config:', updatedConfig);
    
    // 3. Verify database configuration was updated
    console.log('\n3. Verifying database configuration was updated:');
    const verifiedConfig = await getDatabaseConfig();
    console.log('Verified config:', verifiedConfig);
    
    // 4. Restore original configuration
    console.log('\n4. Restoring original configuration:');
    await updateDatabaseConfig(currentConfig);
    console.log('Configuration restored');
    
    console.log('\nDatabase configuration system test completed successfully!');
  } catch (error) {
    console.error('Error testing database configuration:', error);
  }
}

// Run the test
testDatabaseConfig();