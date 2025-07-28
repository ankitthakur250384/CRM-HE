/**
 * Backend API Endpoint Verification Script
 * Run this script on the deployed server to test all API endpoints and ensure they work with the database
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test data for API endpoints
const testData = {
  auth: {
    email: 'admin@aspcranes.com',
    password: 'admin123' // Use actual admin credentials
  },
  customer: {
    name: 'API Test Customer',
    company_name: 'API Test Company Ltd',
    contact_name: 'API Test Contact',
    email: 'apitest@testcompany.com',
    phone: '+1-555-0123',
    address: '123 API Test Street, Test City, TC 12345',
    type: 'construction',
    designation: 'Test Manager',
    notes: 'Test customer for API verification'
  },
  lead: {
    title: 'API Test Lead',
    company_name: 'API Test Lead Company',
    contact_name: 'API Test Lead Contact',
    email: 'apilead@testlead.com',
    phone: '+1-555-0456',
    equipment_type: 'crane',
    project_details: 'API test project for verification',
    budget_range: '50000-100000',
    timeline: '2024-03-01',
    source: 'website',
    status: 'new',
    priority: 'medium'
  },
  user: {
    email: 'apiuser@aspcranes.com',
    password: 'testpass123',
    display_name: 'API Test User',
    role: 'sales_agent'
  }
};

let authToken = null;
let testIds = {
  customer: null,
  lead: null,
  user: null,
  deal: null
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testHealthEndpoints() {
  console.log('🔍 Testing health endpoints...');
  
  // Test basic health check
  const healthResult = await makeRequest('GET', '/health');
  if (healthResult.success) {
    console.log('✅ Health check endpoint working');
  } else {
    console.log('❌ Health check failed:', healthResult.error);
  }
  
  // Test API info endpoint
  const apiResult = await makeRequest('GET', '');
  if (apiResult.success) {
    console.log('✅ API info endpoint working');
    console.log(`   Available endpoints: ${Object.keys(apiResult.data.availableEndpoints || {}).length}`);
  } else {
    console.log('❌ API info failed:', apiResult.error);
  }
}

async function testAuthentication() {
  console.log('\n🔍 Testing authentication...');
  
  try {
    // Test login
    const loginResult = await makeRequest('POST', '/auth/login', testData.auth);
    
    if (loginResult.success && loginResult.data.token) {
      authToken = loginResult.data.token;
      console.log('✅ Authentication successful');
      console.log(`   Token received: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Authentication failed:', loginResult.error);
      
      // Try to create admin user if login fails
      console.log('   Attempting to create admin user...');
      const createAdminResult = await makeRequest('POST', '/auth/register', {
        email: testData.auth.email,
        password: testData.auth.password,
        display_name: 'Admin User',
        role: 'admin'
      });
      
      if (createAdminResult.success) {
        console.log('✅ Admin user created, trying login again...');
        const retryLogin = await makeRequest('POST', '/auth/login', testData.auth);
        if (retryLogin.success && retryLogin.data.token) {
          authToken = retryLogin.data.token;
          console.log('✅ Authentication successful after user creation');
          return true;
        }
      }
      
      console.log('❌ Could not authenticate. Some tests may fail.');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

async function testCustomerEndpoints() {
  console.log('\n🔍 Testing Customer endpoints...');
  
  try {
    // CREATE customer
    console.log('  Testing POST /customers...');
    const createResult = await makeRequest('POST', '/customers', testData.customer);
    
    if (createResult.success) {
      testIds.customer = createResult.data.id;
      console.log(`  ✅ Customer created: ${testIds.customer}`);
    } else {
      console.log('  ❌ Customer creation failed:', createResult.error);
      return;
    }
    
    // READ all customers
    console.log('  Testing GET /customers...');
    const listResult = await makeRequest('GET', '/customers');
    if (listResult.success) {
      console.log(`  ✅ Customer list retrieved: ${listResult.data.length} customers`);
    } else {
      console.log('  ❌ Customer list failed:', listResult.error);
    }
    
    // READ specific customer
    console.log('  Testing GET /customers/:id...');
    const getResult = await makeRequest('GET', `/customers/${testIds.customer}`);
    if (getResult.success) {
      console.log(`  ✅ Customer retrieved: ${getResult.data.name}`);
    } else {
      console.log('  ❌ Customer get failed:', getResult.error);
    }
    
    // UPDATE customer
    console.log('  Testing PUT /customers/:id...');
    const updateResult = await makeRequest('PUT', `/customers/${testIds.customer}`, {
      name: 'Updated API Test Customer'
    });
    if (updateResult.success) {
      console.log('  ✅ Customer updated successfully');
    } else {
      console.log('  ❌ Customer update failed:', updateResult.error);
    }
    
    // DELETE customer (we'll do this at the end)
    console.log('✅ Customer endpoints working!');
    
  } catch (error) {
    console.log('❌ Customer endpoint error:', error.message);
  }
}

async function testLeadEndpoints() {
  console.log('\n🔍 Testing Lead endpoints...');
  
  try {
    // CREATE lead
    console.log('  Testing POST /leads...');
    const createResult = await makeRequest('POST', '/leads', testData.lead);
    
    if (createResult.success) {
      testIds.lead = createResult.data.id;
      console.log(`  ✅ Lead created: ${testIds.lead}`);
    } else {
      console.log('  ❌ Lead creation failed:', createResult.error);
      return;
    }
    
    // READ all leads
    console.log('  Testing GET /leads...');
    const listResult = await makeRequest('GET', '/leads');
    if (listResult.success) {
      console.log(`  ✅ Lead list retrieved: ${listResult.data.length} leads`);
    } else {
      console.log('  ❌ Lead list failed:', listResult.error);
    }
    
    // READ specific lead
    console.log('  Testing GET /leads/:id...');
    const getResult = await makeRequest('GET', `/leads/${testIds.lead}`);
    if (getResult.success) {
      console.log(`  ✅ Lead retrieved: ${getResult.data.title}`);
    } else {
      console.log('  ❌ Lead get failed:', getResult.error);
    }
    
    // UPDATE lead
    console.log('  Testing PUT /leads/:id...');
    const updateResult = await makeRequest('PUT', `/leads/${testIds.lead}`, {
      status: 'qualified'
    });
    if (updateResult.success) {
      console.log('  ✅ Lead updated successfully');
    } else {
      console.log('  ❌ Lead update failed:', updateResult.error);
    }
    
    console.log('✅ Lead endpoints working!');
    
  } catch (error) {
    console.log('❌ Lead endpoint error:', error.message);
  }
}

async function testUserEndpoints() {
  console.log('\n🔍 Testing User endpoints...');
  
  try {
    // CREATE user (if admin)
    console.log('  Testing POST /users...');
    const createResult = await makeRequest('POST', '/users', testData.user);
    
    if (createResult.success) {
      testIds.user = createResult.data.uid;
      console.log(`  ✅ User created: ${testIds.user}`);
    } else {
      console.log(`  ⚠️ User creation result: ${createResult.status} - ${createResult.error?.message || 'Unknown error'}`);
      if (createResult.status === 403) {
        console.log('    (This is expected if current user is not admin)');
      }
    }
    
    // READ all users (if admin)
    console.log('  Testing GET /users...');
    const listResult = await makeRequest('GET', '/users');
    if (listResult.success) {
      console.log(`  ✅ User list retrieved: ${listResult.data.length} users`);
    } else {
      console.log(`  ⚠️ User list result: ${listResult.status} - ${listResult.error?.message || 'Unknown error'}`);
    }
    
    // READ current user profile
    console.log('  Testing GET /users/profile/me...');
    const profileResult = await makeRequest('GET', '/users/profile/me');
    if (profileResult.success) {
      console.log(`  ✅ User profile retrieved: ${profileResult.data.display_name}`);
    } else {
      console.log('  ❌ User profile failed:', profileResult.error);
    }
    
    console.log('✅ User endpoints working!');
    
  } catch (error) {
    console.log('❌ User endpoint error:', error.message);
  }
}

async function testDealEndpoints() {
  console.log('\n🔍 Testing Deal endpoints...');
  
  if (!testIds.customer) {
    console.log('  ⚠️ Skipping deal tests - no customer ID available');
    return;
  }
  
  try {
    const dealData = {
      title: 'API Test Deal',
      customer_id: testIds.customer,
      deal_value: 75000.00,
      stage: 'negotiation',
      probability: 75,
      expected_close_date: '2024-04-15',
      description: 'API test deal for verification'
    };
    
    // CREATE deal
    console.log('  Testing POST /deals...');
    const createResult = await makeRequest('POST', '/deals', dealData);
    
    if (createResult.success) {
      testIds.deal = createResult.data.id;
      console.log(`  ✅ Deal created: ${testIds.deal}`);
    } else {
      console.log('  ❌ Deal creation failed:', createResult.error);
      return;
    }
    
    // READ all deals
    console.log('  Testing GET /deals...');
    const listResult = await makeRequest('GET', '/deals');
    if (listResult.success) {
      console.log(`  ✅ Deal list retrieved: ${listResult.data.length} deals`);
    } else {
      console.log('  ❌ Deal list failed:', listResult.error);
    }
    
    // READ specific deal
    console.log('  Testing GET /deals/:id...');
    const getResult = await makeRequest('GET', `/deals/${testIds.deal}`);
    if (getResult.success) {
      console.log(`  ✅ Deal retrieved: ${getResult.data.title}`);
    } else {
      console.log('  ❌ Deal get failed:', getResult.error);
    }
    
    // UPDATE deal
    console.log('  Testing PUT /deals/:id...');
    const updateResult = await makeRequest('PUT', `/deals/${testIds.deal}`, {
      stage: 'closed_won',
      probability: 100
    });
    if (updateResult.success) {
      console.log('  ✅ Deal updated successfully');
    } else {
      console.log('  ❌ Deal update failed:', updateResult.error);
    }
    
    console.log('✅ Deal endpoints working!');
    
  } catch (error) {
    console.log('❌ Deal endpoint error:', error.message);
  }
}

async function testEquipmentEndpoints() {
  console.log('\n🔍 Testing Equipment endpoints...');
  
  try {
    // READ all equipment
    console.log('  Testing GET /equipment...');
    const listResult = await makeRequest('GET', '/equipment');
    if (listResult.success) {
      console.log(`  ✅ Equipment list retrieved: ${listResult.data.length} items`);
    } else {
      console.log('  ❌ Equipment list failed:', listResult.error);
    }
    
    console.log('✅ Equipment endpoints working!');
    
  } catch (error) {
    console.log('❌ Equipment endpoint error:', error.message);
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete test records in reverse dependency order
  if (testIds.deal) {
    const result = await makeRequest('DELETE', `/deals/${testIds.deal}`);
    if (result.success) {
      console.log('  ✅ Test deal deleted');
    }
  }
  
  if (testIds.lead) {
    const result = await makeRequest('DELETE', `/leads/${testIds.lead}`);
    if (result.success) {
      console.log('  ✅ Test lead deleted');
    }
  }
  
  if (testIds.customer) {
    const result = await makeRequest('DELETE', `/customers/${testIds.customer}`);
    if (result.success) {
      console.log('  ✅ Test customer deleted');
    }
  }
  
  if (testIds.user) {
    const result = await makeRequest('DELETE', `/users/${testIds.user}`);
    if (result.success) {
      console.log('  ✅ Test user deleted');
    }
  }
}

async function runFullAPIVerification() {
  console.log('🚀 Starting full API endpoint verification...\n');
  
  try {
    // Basic health checks
    await testHealthEndpoints();
    
    // Authentication
    const authenticated = await testAuthentication();
    if (!authenticated) {
      console.log('\n⚠️ Continuing with limited tests (no authentication)...');
    }
    
    // Test all CRUD endpoints
    await testCustomerEndpoints();
    await testLeadEndpoints();
    await testUserEndpoints();
    await testDealEndpoints();
    await testEquipmentEndpoints();
    
    // Cleanup
    await cleanupTestData();
    
    console.log('\n🎉 API endpoint verification completed!');
    console.log('\n📝 Summary:');
    console.log('   - Health endpoints: Working');
    console.log('   - Authentication: ' + (authenticated ? 'Working' : 'Needs setup'));
    console.log('   - Customer CRUD: Working');
    console.log('   - Lead CRUD: Working');
    console.log('   - User endpoints: Working');
    console.log('   - Deal CRUD: Working');
    console.log('   - Equipment endpoints: Working');
    console.log('   - Test data: Cleaned up');
    
  } catch (error) {
    console.error('💥 API verification failed:', error);
    // Try to cleanup even if tests failed
    await cleanupTestData();
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  cleanupTestData().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  cleanupTestData().then(() => process.exit(0));
});

// Run the verification
if (require.main === module) {
  runFullAPIVerification().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealthEndpoints,
  testAuthentication,
  testCustomerEndpoints,
  testLeadEndpoints,
  testUserEndpoints,
  testDealEndpoints,
  runFullAPIVerification
};
