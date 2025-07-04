/**
 * Test Auth Flow
 * Tests the authentication API and role assignment
 */

import fetch from 'node-fetch';

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test the login API
    console.log('🔑 Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'admin123'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.message}`);
    }
    
    const { token, user } = await response.json();
    
    console.log('✅ Login API successful');
    console.log('🎫 Token received:', token ? 'Yes' : 'No');
    console.log('👤 User data:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Name:', user.name);
    console.log('   - Role:', user.role);
    console.log('   - Role type:', typeof user.role);
    
    // Validate the role
    const validRoles = ['admin', 'sales_agent', 'operations_manager', 'operator', 'support'];
    if (validRoles.includes(user.role)) {
      console.log('✅ User role is valid');
    } else {
      console.log('❌ User role is invalid:', user.role);
    }
    
    // Test JWT decode
    if (token) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('🔍 JWT Payload:');
        console.log('   - ID:', payload.id);
        console.log('   - Email:', payload.email);
        console.log('   - Role:', payload.role);
        console.log('   - Name:', payload.name);
        console.log('   - Expires:', new Date(payload.exp * 1000).toISOString());
        
        if (payload.role === user.role) {
          console.log('✅ JWT role matches user role');
        } else {
          console.log('❌ JWT role mismatch - JWT:', payload.role, 'User:', user.role);
        }
      } catch (e) {
        console.log('❌ Failed to decode JWT:', e.message);
      }
    }
    
    // Test the /me endpoint
    console.log('🔍 Testing /me endpoint...');
    
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.ok) {
      const { user: meUser } = await meResponse.json();
      console.log('✅ /me endpoint successful');
      console.log('👤 /me User data:');
      console.log('   - ID:', meUser.id);
      console.log('   - Email:', meUser.email);
      console.log('   - Name:', meUser.name);
      console.log('   - Role:', meUser.role);
      
      if (meUser.role === user.role) {
        console.log('✅ /me user role matches login user role');
      } else {
        console.log('❌ /me user role mismatch - /me:', meUser.role, 'Login:', user.role);
      }
    } else {
      console.log('❌ /me endpoint failed:', meResponse.status, await meResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthFlow();
