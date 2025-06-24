/**
 * Test Database API Endpoints
 * 
 * This script tests the database API endpoints by making requests to them directly.
 * It validates that the GET and PUT endpoints for database configuration are working.
 */

const http = require('http');
const https = require('https');

// Configuration
const API_HOST = 'localhost';
const API_PORT = 3001;
const USE_HTTPS = false;
// This would be a valid token from a logged-in admin user in a real scenario
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0NTAxMjM0NX0.8KRWV-GzkIKCLSZLrXhB7RLNRxeVTOU5nagkbBDKKXg';

// Helper function to make API requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const httpModule = USE_HTTPS ? https : http;
    
    const req = httpModule.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        const statusCode = res.statusCode;
        
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ statusCode, body: parsedBody });
        } catch (e) {
          resolve({ statusCode, body });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testGetDatabaseConfig() {
  console.log('Testing GET /api/database/config');
  try {
    const response = await makeRequest('GET', '/api/database/config');
    console.log('Status:', response.statusCode);
    console.log('Response:', response.body);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testUpdateDatabaseConfig() {
  console.log('Testing PUT /api/database/config');
  
  // Test configuration
  const testConfig = {
    host: 'api-test-host',
    port: 5433,
    database: 'api_test_db',
    user: 'api_test_user',
    password: 'test_password',
    ssl: true
  };
  
  try {
    const response = await makeRequest('PUT', '/api/database/config', testConfig);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.body);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testTestConnection() {
  console.log('Testing POST /api/database/test-connection');
  
  // Test configuration
  const testConfig = {
    host: 'test-connection-host',
    port: 5432,
    database: 'test_connection_db',
    user: 'test_user',
    password: 'test_password',
    ssl: false
  };
  
  try {
    const response = await makeRequest('POST', '/api/database/test-connection', testConfig);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.body);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run all tests in sequence
async function runTests() {
  try {
    console.log('=== Testing Database API Endpoints ===\n');
    
    // 1. Get current configuration
    console.log('\n1. Getting current database configuration:');
    const originalConfig = await testGetDatabaseConfig();
    
    // 2. Update configuration
    console.log('\n2. Updating database configuration:');
    await testUpdateDatabaseConfig();
    
    // 3. Get updated configuration to verify it changed
    console.log('\n3. Verifying database configuration was updated:');
    await testGetDatabaseConfig();
    
    // 4. Test the connection test endpoint
    console.log('\n4. Testing connection test endpoint:');
    await testTestConnection();
    
    // 5. If we got the original configuration successfully, restore it
    if (originalConfig && originalConfig.statusCode === 200) {
      console.log('\n5. Restoring original configuration:');
      
      // Remove message field if it exists
      const configToRestore = { ...originalConfig.body };
      delete configToRestore.message;
      
      const response = await makeRequest('PUT', '/api/database/config', configToRestore);
      console.log('Status:', response.statusCode);
      console.log('Original configuration restored:', response.body.message || 'Unknown');
    }
    
    console.log('\n=== Database API Tests Completed ===');
    
  } catch (error) {
    console.error('\n=== Database API Tests Failed ===');
    console.error(error);
  }
}

// Run the tests
runTests();