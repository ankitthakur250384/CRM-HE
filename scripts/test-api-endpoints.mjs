/**
 * API Endpoint Test Suite
 * 
 * This script tests all major API endpoints to ensure they're working properly,
 * with proper error handling and authentication bypass for development.
 */

import fetch from 'node-fetch';
import process from 'process';
import chalk from 'chalk';

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
const BYPASS_AUTH = true; // Set to true to use the X-Bypass-Auth header for development

// Test endpoints
const ENDPOINTS = [
  { url: '/health', method: 'GET', name: 'Health Check', requiresAuth: false },
  { url: '/debug/headers', method: 'GET', name: 'Headers Debug', requiresAuth: false },
  { url: '/debug/routes', method: 'GET', name: 'Routes Debug', requiresAuth: false },
  { url: '/debug/leads-direct', method: 'GET', name: 'Direct Leads Debug', requiresAuth: false },
  { url: '/leads', method: 'GET', name: 'Leads List', requiresAuth: true },
  { url: '/quotations', method: 'GET', name: 'Quotations List', requiresAuth: true },
  { url: '/customers', method: 'GET', name: 'Customers List', requiresAuth: true },
  { url: '/deals', method: 'GET', name: 'Deals List', requiresAuth: true },
];

// Color output helpers
const success = (message) => chalk.green(message);
const error = (message) => chalk.red(message);
const info = (message) => chalk.blue(message);
const warn = (message) => chalk.yellow(message);

// Execute a test
async function testEndpoint(endpoint) {
  try {
    console.log(info(`Testing ${endpoint.method} ${endpoint.name} (${endpoint.url})...`));
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add bypass auth header if needed
    if (BYPASS_AUTH && endpoint.requiresAuth) {
      headers['X-Bypass-Auth'] = 'true';
      console.log(warn('Using auth bypass header for this request'));
    }
    
    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers,
    });
    
    // Check status
    const status = response.status;
    const statusText = response.statusText;
    
    if (status >= 200 && status < 300) {
      console.log(success(`✓ ${endpoint.name}: ${status} ${statusText}`));
      
      // Parse and log response data (limited to prevent console overflow)
      const data = await response.json();
      
      console.log(info('Response preview:'));
      if (Array.isArray(data)) {
        console.log(`Array with ${data.length} items`);
        if (data.length > 0) {
          console.log(JSON.stringify(data[0], null, 2));
        }
      } else if (data && typeof data === 'object') {
        // For objects, show a summary
        const keys = Object.keys(data);
        console.log(`Object with keys: ${keys.join(', ')}`);
        
        // If it has a 'leads' or similar array property, show count
        for (const key of ['leads', 'quotations', 'customers', 'deals']) {
          if (data[key] && Array.isArray(data[key])) {
            console.log(`${key}: ${data[key].length} items`);
            if (data[key].length > 0) {
              console.log(`First ${key} item:`, JSON.stringify(data[key][0], null, 2));
            }
            break;
          }
        }
      } else {
        console.log(data);
      }
    } else {
      console.log(error(`✗ ${endpoint.name}: ${status} ${statusText}`));
      try {
        const errorData = await response.json();
        console.log(error('Error details:'), errorData);
      } catch (e) {
        const text = await response.text();
        console.log(error('Response text:'), text.substring(0, 200));
      }
    }
  } catch (err) {
    console.log(error(`✗ ${endpoint.name}: ${err.message}`));
  }
  
  console.log('-------------------------------------------');
}

// Main function to run all tests
async function runTests() {
  console.log(info('=== API ENDPOINT TEST SUITE ==='));
  console.log(info(`Base URL: ${API_BASE_URL}`));
  console.log(info(`Auth Bypass: ${BYPASS_AUTH ? 'Enabled' : 'Disabled'}`));
  console.log('-------------------------------------------');
  
  // Run tests sequentially
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log(info('=== TEST SUITE COMPLETE ==='));
}

// Run the tests
runTests().catch(err => {
  console.log(error(`Test suite error: ${err.message}`));
  process.exit(1);
});
