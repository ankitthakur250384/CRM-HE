/**
 * API Connection Issue Diagnosis Tool
 * 
 * This script specifically checks for the common issue where the frontend
 * falls back to mock data instead of using real database data.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import { spawn } from 'child_process';

// Color output helpers
const success = chalk.green;
const error = chalk.red;
const info = chalk.blue;
const warn = chalk.yellow;
const highlight = chalk.yellowBright.bold;

// API base URL
const API_URL = 'http://localhost:3001/api';

console.log(highlight('\n=== API CONNECTION DIAGNOSIS TOOL ===\n'));

/**
 * Test an API endpoint and return the result
 */
async function testEndpoint(url, method = 'GET', headers = {}) {
  console.log(info(`Testing ${method} ${url}...`));
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const statusText = response.ok ? 
      success(`${response.status} ${response.statusText}`) : 
      error(`${response.status} ${response.statusText}`);
    
    console.log(`Status: ${statusText}`);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data
    };
  } catch (err) {
    console.log(error(`Failed: ${err.message}`));
    return {
      ok: false,
      error: err.message
    };
  }
}

/**
 * Run a quick server check
 */
async function checkServer() {
  console.log(info('Checking if API server is running...'));
  
  try {
    // Try health endpoint first
    const healthResult = await testEndpoint(`${API_URL}/health`);
    
    if (!healthResult.ok) {
      console.log(error('\n❌ API server health check failed.'));
      return false;
    }
    
    console.log(success('✅ API server is running!'));
    return true;
  } catch (e) {
    console.log(error(`\n❌ API server not reachable: ${e.message}`));
    return false;
  }
}

/**
 * Check if leads API is working
 */
async function checkLeadsAPI() {
  console.log(info('\nChecking leads API endpoints...'));
  
  // 1. Check direct endpoint that doesn't need auth
  console.log(info('\n1. Testing direct leads endpoint (no auth required)...'));
  const directResult = await testEndpoint(`${API_URL}/direct/leads`);
  
  if (!directResult.ok) {
    console.log(error('❌ Direct leads API failed. Backend database connection might be broken.'));
  } else if (directResult.data && Array.isArray(directResult.data.leads)) {
    console.log(success(`✅ Direct leads API returned ${directResult.data.leads.length} leads from database.`));
    if (directResult.data.leads.length === 0) {
      console.log(warn('⚠️ No leads found in database. This could be normal for a new installation.'));
    }
  }
  
  // 2. Check debug endpoint
  console.log(info('\n2. Testing debug leads endpoint...'));
  const debugResult = await testEndpoint(`${API_URL}/debug/leads`);
  
  if (!debugResult.ok) {
    console.log(error('❌ Debug leads API failed. Check the server debugLeadsRoutes implementation.'));
  } else if (debugResult.data && Array.isArray(debugResult.data)) {
    console.log(success(`✅ Debug leads API returned ${debugResult.data.length} leads.`));
  }
  
  // 3. Check auth endpoint with bypass
  console.log(info('\n3. Testing authenticated leads endpoint with bypass header...'));
  const authResult = await testEndpoint(`${API_URL}/leads`, 'GET', { 'X-Bypass-Auth': 'true' });
  
  if (!authResult.ok) {
    console.log(error('❌ Authenticated leads API failed even with bypass header.'));
  } else if (authResult.data && Array.isArray(authResult.data)) {
    console.log(success(`✅ Authenticated leads API returned ${authResult.data.length} leads.`));
  }
  
  return {
    directOk: directResult.ok,
    debugOk: debugResult.ok,
    authOk: authResult.ok
  };
}

/**
 * Run a series of diagnostics and recommend fixes
 */
async function runDiagnostics() {
  // First check if the server is running
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(error('\n❌ API Server is not running or not responding.'));
    console.log(info('\nRecommendation:'));
    console.log('1. Start the API server with: npm run server:improved');
    console.log('2. Check for any error messages during startup');
    console.log('3. Ensure port 3001 is not being used by another application');
    return;
  }
  
  // Check leads API
  const leadsStatus = await checkLeadsAPI();
  
  // Show diagnosis results
  console.log(highlight('\n=== DIAGNOSIS RESULTS ===\n'));
  
  if (leadsStatus.directOk && leadsStatus.debugOk && leadsStatus.authOk) {
    console.log(success('✅ All API endpoints are working correctly.'));
    console.log(info('\nIf frontend is still showing mock data:'));
    console.log('1. Check that the frontend is using the correct API URL: http://localhost:3001/api');
    console.log('2. Ensure the browser has network access to the API server');
    console.log('3. Check browser console for any CORS or network errors');
    console.log('4. Try clearing your browser cache and reloading');
  } else {
    console.log(error('❌ Some API endpoints are not working correctly.'));
    console.log(info('\nRecommended fixes:'));
    
    if (!leadsStatus.directOk) {
      console.log('1. Check database connection parameters in directRoutes.mjs');
      console.log('2. Ensure PostgreSQL database is running and accessible');
      console.log('3. Verify database credentials in the API routes');
    }
    
    if (!leadsStatus.debugOk) {
      console.log('1. Check implementation of debugLeadsRoutes.mjs');
      console.log('2. Ensure the debug routes are properly registered in server.mjs');
    }
    
    if (!leadsStatus.authOk) {
      console.log('1. Verify that authentication bypass is enabled in leadsRoutes.fixed.mjs');
      console.log('2. Ensure JWT_SECRET is properly set in the environment');
      console.log('3. Check for typos in the X-Bypass-Auth header handling');
    }
  }
  
  console.log(highlight('\n=== NEXT STEPS ===\n'));
  console.log(info('To run both frontend and API server together:'));
  console.log('npm run dev:full');
  
  console.log(info('\nTo test all API endpoints:'));
  console.log('npm run test:fixes');
  
  console.log(info('\nTo inspect leads data directly in the database:'));
  console.log('npm run inspect:leads');
}

// Run all diagnostics
runDiagnostics();
