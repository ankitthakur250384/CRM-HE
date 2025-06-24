/**
 * Login Test Script
 * This script tests the PostgreSQL authentication by attempting to log in with the credentials 
 * from the users table
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

async function testLogin() {
  try {
    console.log('Testing login with PostgreSQL user...');
    
    // Use a valid user from your users table (based on the output from db:pg-test)
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123' // Using our development password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('User:', data.user);
      console.log('JWT Token: (first 20 chars)', data.token.substring(0, 20) + '...');
    } else {
      console.error('Login failed:', data.error);
      console.log('Check if you\'re using the correct password and if the server is running.');
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();
