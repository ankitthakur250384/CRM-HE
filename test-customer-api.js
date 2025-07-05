/**
 * Test Customer API endpoints
 * Quick test to verify the customer API is working properly
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Test login to get auth token
async function getAuthToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    if (data.token) {
      console.log('✅ Authentication successful');
      return data.token;
    } else {
      console.error('❌ Authentication failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return null;
  }
}

// Test customer API endpoints
async function testCustomerAPI() {
  console.log('🧪 Testing Customer API...\n');
  
  // Get auth token
  const token = await getAuthToken();
  if (!token) {
    console.error('❌ Cannot test API without authentication token');
    return;
  }
  
  console.log('🔍 Testing GET /api/customers...');
  try {
    const response = await fetch(`${API_BASE}/customers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const customers = await response.json();
      console.log(`✅ GET /customers successful - Found ${customers.length} customers`);
      
      if (customers.length > 0) {
        console.log('First customer:', {
          id: customers[0].id,
          name: customers[0].name,
          email: customers[0].email
        });
      }
    } else {
      const error = await response.text();
      console.error(`❌ GET /customers failed (${response.status}):`, error);
    }
  } catch (error) {
    console.error('❌ Error testing GET /customers:', error);
  }
  
  console.log('\n🔍 Testing GET /api/customers/debug...');
  try {
    const response = await fetch(`${API_BASE}/customers/debug`);
    const result = await response.json();
    console.log('✅ Debug endpoint response:', result);
  } catch (error) {
    console.error('❌ Error testing debug endpoint:', error);
  }
}

// Run the test
testCustomerAPI()
  .then(() => {
    console.log('\n✅ Customer API test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Customer API test failed:', error);
    process.exit(1);
  });
