/**
 * Test script for the updated quotation API
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Test data
const testQuotation = {
  dealId: "deal_003", // Required: Link to a deal
  customerName: "Test Customer",
  machineType: "mobile_crane",
  orderType: "micro",
  numberOfDays: 5,
  workingHours: 8,
  foodResources: 2,
  accomResources: 1,
  siteDistance: 25,
  usage: "normal",
  riskFactor: "low",
  shift: "single",
  dayNight: "day",
  billing: "gst",
  includeGst: true,
  sundayWorking: "no",
  customerContact: {
    name: "Test Customer",
    email: "test@example.com",
    phone: "1234567890"
  },
  incidentalCharges: ["Transport charges", "Loading charges"], // Test with actual values
  otherFactors: ["Weather conditions", "Site accessibility"],     // Test with actual values
  totalRent: 50000,
  status: "draft"
};

async function testQuotationAPI() {
  try {
    console.log('🚀 Testing Quotation API...\n');
    
    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    };
    
    // Step 2: Test quotation creation
    console.log('\n2. Creating test quotation...');
    const createResponse = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(testQuotation)
    });
    
    const createResult = await createResponse.json();
    console.log('Create response status:', createResponse.status);
    console.log('Create response:', JSON.stringify(createResult, null, 2));
    
    if (!createResponse.ok) {
      console.log('❌ Quotation creation failed');
      return;
    }
    
    console.log('✅ Quotation created successfully!');
    const quotationId = createResult.data.id;
    
    // Step 3: Test quotation retrieval
    console.log('\n3. Retrieving created quotation...');
    const getResponse = await fetch(`${API_BASE}/quotations/${quotationId}`, {
      headers: authHeaders
    });
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Quotation retrieved successfully');
      console.log('Retrieved quotation ID:', getResult.data.id);
      console.log('Customer name:', getResult.data.customerName);
      console.log('Machine type:', getResult.data.machineType);
      console.log('Order type:', getResult.data.orderType);
    } else {
      console.log('❌ Failed to retrieve quotation');
    }
    
    // Step 4: Test listing quotations
    console.log('\n4. Listing all quotations...');
    const listResponse = await fetch(`${API_BASE}/quotations`, {
      headers: authHeaders
    });
    
    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ Quotations listed successfully');
      console.log(`Found ${listResult.data.length} quotations`);
    } else {
      console.log('❌ Failed to list quotations');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testQuotationAPI();
