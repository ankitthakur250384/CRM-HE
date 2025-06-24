/**
 * API Endpoint Test Tool
 * 
 * This script tests all the API endpoints including the newly added ones
 * to make sure they're working correctly.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

// Color output helpers
const success = (message) => chalk.green(message);
const error = (message) => chalk.red(message);
const info = (message) => chalk.blue(message);
const warn = (message) => chalk.yellow(message);
const highlight = (message) => chalk.yellowBright.bold(message);

// API base URL
const API_URL = 'http://localhost:3001/api';

/**
 * Test an API endpoint and return the result
 */
async function testEndpoint(url, method = 'GET', headers = {}, body = null) {
  console.log(info(`Testing ${method} ${url}...`));
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const statusText = response.ok ? success(`${response.status} ${response.statusText}`) : error(`${response.status} ${response.statusText}`);
    
    console.log(`Status: ${statusText}`);
    
    let data;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      } else {
        data = await response.text();
        console.log('Response:', data.substring(0, 100) + '...');
      }
    } catch (parseError) {
      console.log(warn('Could not parse response:', parseError.message));
      data = null;
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data
    };
  } catch (err) {
    console.log(error(`Failed to test ${url}: ${err.message}`));
    return {
      ok: false,
      error: err.message
    };
  }
}

/**
 * Run all endpoint tests
 */
async function runTests() {
  console.log(highlight('\n=== API ENDPOINT TESTS ===\n'));
  
  // First test the health check endpoint
  const healthResult = await testEndpoint(`${API_URL}/health`);
  
  if (!healthResult.ok) {
    console.log(error('\n❌ Health check failed. Is the server running?\n'));
    console.log(info('To start the server, run:\n'));
    console.log('    cd project');
    console.log('    node src/server.mjs\n');
    return;
  }
  
  console.log(success('\n✅ API server is running!\n'));
  
  // Test endpoints
  const tests = [
    // Debug and direct endpoints (no auth required)
    { name: 'Debug Routes', url: `${API_URL}/debug/routes` },
    { name: 'Debug Headers', url: `${API_URL}/debug/headers` },
    { name: 'Debug Leads', url: `${API_URL}/debug/leads` },
    { name: 'Debug Leads Direct', url: `${API_URL}/debug/leads-direct` },
    { name: 'Debug Leads Debug', url: `${API_URL}/debug/leads/debug` },
    { name: 'Debug Leads Direct Route', url: `${API_URL}/debug/leads/direct` },
    { name: 'Direct API Test', url: `${API_URL}/direct/test` },
    { name: 'Direct Leads', url: `${API_URL}/direct/leads` },
    { name: 'Direct Quotations', url: `${API_URL}/direct/quotations` },
    
    // Auth routes
    { name: 'Auth Status', url: `${API_URL}/auth/status` },
    
    // Auth required routes with bypass
    { name: 'Leads with Bypass', url: `${API_URL}/leads`, headers: { 'X-Bypass-Auth': 'true' } },
    { name: 'Deals with Bypass', url: `${API_URL}/deals`, headers: { 'X-Bypass-Auth': 'true' } },
    { name: 'Quotations with Bypass', url: `${API_URL}/quotations`, headers: { 'X-Bypass-Auth': 'true' } },
    { name: 'Customers with Bypass', url: `${API_URL}/customers`, headers: { 'X-Bypass-Auth': 'true' } },
  ];
  
  // Run each test
  for (const test of tests) {
    console.log(highlight(`\n=== ${test.name} ===`));
    await testEndpoint(test.url, test.method || 'GET', test.headers, test.body);
    
    // Short pause between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(highlight('\n=== All Tests Complete ===\n'));
}

// Run all tests
runTests();
