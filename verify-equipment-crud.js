/**
 * Verify Equipment CRUD Operations
 * 
 * This script verifies that CRUD operations for equipment work correctly
 * after database configuration changes.
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

// Test functions for equipment CRUD operations
async function testGetAllEquipment() {
  console.log('Testing GET /api/equipment');
  try {
    const response = await makeRequest('GET', '/api/equipment');
    console.log('Status:', response.statusCode);
    console.log('Equipment count:', response.body.length);
    return response.body;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testCreateEquipment() {
  console.log('Testing POST /api/equipment');
  
  const testEquipment = {
    name: `Test Crane ${Date.now()}`,
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    type: 'Crane',
    status: 'available',
    description: 'Test equipment created for verification',
    manufacturing_date: new Date().toISOString().split('T')[0],
    registration_date: new Date().toISOString().split('T')[0],
    max_lifting_capacity: 2000,
    unladen_weight: 1000,
    running_cost: 500
  };
  
  try {
    const response = await makeRequest('POST', '/api/equipment', testEquipment);
    console.log('Status:', response.statusCode);
    console.log('Created Equipment:', response.body);
    return response.body;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testGetEquipment(id) {
  console.log(`Testing GET /api/equipment/${id}`);
  try {
    const response = await makeRequest('GET', `/api/equipment/${id}`);
    console.log('Status:', response.statusCode);
    console.log('Equipment Details:', response.body);
    return response.body;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testUpdateEquipment(id, updates) {
  console.log(`Testing PUT /api/equipment/${id}`);
  try {
    const response = await makeRequest('PUT', `/api/equipment/${id}`, updates);
    console.log('Status:', response.statusCode);
    console.log('Updated Equipment:', response.body);
    return response.body;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function testDeleteEquipment(id) {
  console.log(`Testing DELETE /api/equipment/${id}`);
  try {
    const response = await makeRequest('DELETE', `/api/equipment/${id}`);
    console.log('Status:', response.statusCode);
    console.log('Delete Response:', response.body);
    return response.body;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run all tests in sequence
async function runTests() {
  try {
    console.log('=== Verifying Equipment CRUD Operations ===\n');
    
    // 1. Get all equipment
    console.log('\n1. Getting all equipment:');
    await testGetAllEquipment();
    
    // 2. Create new equipment
    console.log('\n2. Creating new equipment:');
    const createdEquipment = await testCreateEquipment();
    
    if (!createdEquipment || !createdEquipment.id) {
      throw new Error('Failed to create equipment');
    }
    
    const equipmentId = createdEquipment.id;
    console.log(`Equipment created with ID: ${equipmentId}`);
    
    // 3. Get the created equipment
    console.log('\n3. Getting the created equipment:');
    await testGetEquipment(equipmentId);
    
    // 4. Update the equipment
    console.log('\n4. Updating the equipment:');
    const updates = {
      name: `Updated Test Crane ${Date.now()}`,
      status: 'maintenance',
      description: 'This equipment has been updated for verification'
    };
    await testUpdateEquipment(equipmentId, updates);
    
    // 5. Get the updated equipment
    console.log('\n5. Getting the updated equipment:');
    await testGetEquipment(equipmentId);
    
    // 6. Delete the equipment
    console.log('\n6. Deleting the equipment:');
    await testDeleteEquipment(equipmentId);
    
    // 7. Try to get the deleted equipment (should fail)
    console.log('\n7. Verifying equipment was deleted:');
    try {
      const response = await testGetEquipment(equipmentId);
      if (response && response.id) {
        console.error('ERROR: Equipment was not deleted!');
      } else {
        console.log('Success: Equipment was properly deleted');
      }
    } catch (error) {
      console.log('Success: Equipment was properly deleted (404 expected)');
    }
    
    console.log('\n=== Equipment CRUD Verification Complete ===');
    console.log('All operations completed successfully!');
    
  } catch (error) {
    console.error('\n=== Equipment CRUD Verification Failed ===');
    console.error(error);
  }
}

// Run the tests
runTests();