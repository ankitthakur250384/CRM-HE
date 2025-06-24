/**
 * Test script for quotation endpoints
 * 
 * This script tests the quotation API endpoints:
 * - Creating a quotation
 * - Fetching all quotations
 * - Fetching a specific quotation
 * - Updating a quotation
 * - Updating a quotation's status
 * - Deleting a quotation
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
dotenv.config();

// API base URL from environment variable
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

// Test token (you should get an actual token by logging in)
// This is just a placeholder for the test
let authToken = '';

// Sample quotation data for testing
const quotationData = {
  machineType: 'mobile_crane',
  selectedEquipment: {
    id: 'eq-1',
    equipmentId: 'mobile-30t',
    name: 'Mobile Crane MC-30',
    baseRates: {
      micro: 5000,
      small: 8000,
      monthly: 150000,
      yearly: 1500000
    }
  },
  selectedMachines: [
    {
      id: 'eq-1',
      machineType: 'mobile_crane',
      equipmentId: 'mobile-30t',
      name: 'Mobile Crane MC-30',
      baseRates: {
        micro: 5000,
        small: 8000,
        monthly: 150000,
        yearly: 1500000
      },
      baseRate: 5000,
      runningCostPerKm: 25,
      quantity: 1
    }
  ],
  orderType: 'monthly',
  numberOfDays: 30,
  workingHours: 8,
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'low',
  extraCharge: 5000,
  incidentalCharges: ['incident1'],
  otherFactorsCharge: 2000,
  billing: 'gst',
  includeGst: true,
  shift: 'single',
  dayNight: 'day',
  mobDemob: 15000,
  mobRelaxation: 0,
  runningCostPerKm: 25,
  dealType: 'no_advance',
  sundayWorking: 'no',
  otherFactors: ['area', 'rigger'],
  leadId: 'lead-test',
  customerId: 'customer-test',
  customerName: 'Test Construction',
  customerContact: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-123-4567',
    company: 'Test Construction',
    address: '123 Test St, Testville'
  }
};

// Helper to make API requests with authentication
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set headers with authentication token
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };
  
  console.log(`${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Check if response is ok
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} ${response.statusText}`);
    console.error('Error details:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Get auth token
async function login() {
  try {
    console.log('Logging in to get auth token...');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Login failed: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    authToken = data.token;
    console.log('✓ Login successful, got auth token');
  } catch (error) {
    console.error('Login error:', error);
    process.exit(1);
  }
}

// Test API endpoints
async function runTests() {
  try {
    // Login to get auth token
    await login();
    
    // Variable to store the created quotation ID
    let quotationId;
    
    // 1. Create a new quotation
    console.log('\n1. Testing create quotation...');
    const createdQuotation = await apiRequest('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotationData)
    });
    console.log('✓ Quotation created successfully');
    console.log('Created quotation ID:', createdQuotation.id);
    quotationId = createdQuotation.id;
    
    // 2. Get all quotations
    console.log('\n2. Testing get all quotations...');
    const allQuotations = await apiRequest('/quotations');
    console.log(`✓ Retrieved ${allQuotations.length} quotations`);
    
    // 3. Get quotation by ID
    console.log(`\n3. Testing get quotation by ID: ${quotationId}...`);
    const quotation = await apiRequest(`/quotations/${quotationId}`);
    console.log('✓ Quotation retrieved successfully');
    console.log('Quotation status:', quotation.status);
    
    // 4. Update quotation
    console.log(`\n4. Testing update quotation: ${quotationId}...`);
    const updatedQuotation = await apiRequest(`/quotations/${quotationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        workingHours: 10, // Changing working hours from 8 to 10
        extraCharge: 8000 // Changing extra charge from 5000 to 8000
      })
    });
    console.log('✓ Quotation updated successfully');
    console.log('Updated working hours:', updatedQuotation.workingHours);
    console.log('Updated extra charge:', updatedQuotation.extraCharge);
      // 5. Update quotation status
    console.log(`\n5. Testing update quotation status: ${quotationId}...`);
    const statusUpdatedQuotation = await apiRequest(`/quotations/${quotationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'sent' })
    });
    console.log('✓ Quotation status updated successfully');
    console.log('New status:', statusUpdatedQuotation.status);
    
    // 6. Delete quotation
    console.log(`\n6. Testing delete quotation: ${quotationId}...`);
    const deleteResult = await apiRequest(`/quotations/${quotationId}`, {
      method: 'DELETE'
    });
    console.log('✓ Quotation deleted successfully');
    console.log('Delete result:', deleteResult);
    
    // 7. Verify deletion by trying to get the deleted quotation
    console.log(`\n7. Verifying deletion of quotation: ${quotationId}...`);
    try {
      await apiRequest(`/quotations/${quotationId}`);
      console.error('✗ Deletion verification failed - quotation still exists');
    } catch (error) {
      console.log('✓ Deletion verified - quotation not found as expected');
    }
    
    console.log('\n✅ All tests completed successfully');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the tests
runTests();
