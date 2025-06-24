/**
 * Script to verify if the quotation routes are properly loaded and working
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
dotenv.config();

// API base URL from environment variable
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

// Test endpoints
async function testEndpoints() {
  console.log('Testing API endpoints...');
  console.log(`API URL: ${API_URL}`);
  
  // Check health endpoint
  try {
    console.log('\nTesting /api/health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✓ Health endpoint working:', healthData);
    } else {
      console.error('✗ Health endpoint not working:', healthResponse.status, healthResponse.statusText);
      const errorText = await healthResponse.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('Error testing health endpoint:', error);
  }
  
  // Check auth login endpoint
  try {
    console.log('\nTesting /api/auth/login endpoint...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('✓ Login endpoint working');
      const loginData = await loginResponse.json();
      
      // Store the token for testing protected endpoints
      const token = loginData.token;
      console.log('Got token:', token.substring(0, 20) + '...');
      
      // If login works, test the quotations endpoint
      try {
        console.log('\nTesting /api/quotations endpoint (GET)...');
        const quotationsResponse = await fetch(`${API_URL}/quotations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (quotationsResponse.ok) {
          const quotationsData = await quotationsResponse.json();
          console.log('✓ Quotations endpoint working!');
          console.log(`Retrieved ${quotationsData.length} quotations`);
        } else {
          console.error('✗ Quotations endpoint not working:', quotationsResponse.status, quotationsResponse.statusText);
          const errorText = await quotationsResponse.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('Error testing quotations endpoint:', error);
      }
      
      // Test the server configuration endpoint
      try {
        console.log('\nTesting server routes configuration...');
        const routesResponse = await fetch(`${API_URL}/debug/routes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (routesResponse.ok) {
          const routesData = await routesResponse.json();
          console.log('✓ Routes debug endpoint working');
          console.log('Registered routes:', routesData);
        } else {
          console.log('Routes debug endpoint not available (this is normal if the debug endpoint is not implemented)');
        }
      } catch (error) {
        console.log('Routes debug endpoint not available:', error.message);
      }
    } else {
      console.error('✗ Login endpoint not working:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('Error testing login endpoint:', error);
  }
}

// Run the tests
testEndpoints().catch(console.error);
