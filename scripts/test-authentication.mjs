/**
 * Authentication Test Script
 * 
 * This script tests the authentication system with valid and invalid credentials
 * to ensure that only valid credentials work.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

async function testAuthentication() {
  console.log('=== Testing Authentication System ===');
  
  const testCases = [
    {
      name: 'Valid Credentials',
      email: 'admin@aspcranes.com',
      password: 'admin123',
      expectSuccess: true
    },
    {
      name: 'Invalid Email',
      email: 'nonexistent@aspcranes.com',
      password: 'admin123',
      expectSuccess: false
    },
    {
      name: 'Invalid Password',
      email: 'admin@aspcranes.com',
      password: 'wrongpassword',
      expectSuccess: false
    },
    {
      name: 'Empty Email',
      email: '',
      password: 'admin123',
      expectSuccess: false
    },
    {
      name: 'Empty Password',
      email: 'admin@aspcranes.com',
      password: '',
      expectSuccess: false
    }
  ];
  
  for (const test of testCases) {
    console.log(`\nRunning test: ${test.name}`);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: test.email,
          password: test.password
        })
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      if (response.ok) {
        console.log('Login successful!');
        console.log('User:', data.user);
        console.log('JWT Token exists:', !!data.token);
      } else {
        console.log('Login failed:', data.error);
      }
      
      const success = response.ok;
      if (success === test.expectSuccess) {
        console.log(`✓ Test PASSED (${test.expectSuccess ? 'expected success' : 'expected failure'})`);
      } else {
        console.log(`✗ Test FAILED - Expected ${test.expectSuccess ? 'success' : 'failure'} but got ${success ? 'success' : 'failure'}`);
      }
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error);
      console.log('✗ Test FAILED due to exception');
    }
  }
}

testAuthentication();
