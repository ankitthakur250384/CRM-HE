#!/usr/bin/env node

/**
 * Simple test script to verify API endpoints are working
 */

const API_BASE = 'http://localhost:3001';

const endpoints = [
  '/api',
  '/api/health',
  '/api/check',
  '/api/deals',
  '/api/leads',
  '/api/customers',
  '/api/equipment',
  '/api/quotations'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const status = response.status;
    const statusText = response.statusText;
    
    if (response.ok) {
      console.log(`✅ ${endpoint} - ${status} ${statusText}`);
    } else {
      console.log(`❌ ${endpoint} - ${status} ${statusText}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ ${endpoint} - Connection failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ endpoint, success });
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`${successful}/${total} endpoints are working`);
  
  if (successful === total) {
    console.log('🎉 All endpoints are working correctly!');
  } else {
    console.log('⚠️ Some endpoints need attention.');
  }
}

// Run if this script is executed directly
runTests().catch(console.error);
