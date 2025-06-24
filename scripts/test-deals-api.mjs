/**
 * Test Deals API
 * 
 * This script tests the deals API endpoints to ensure they're working correctly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Create a test JWT token with admin privileges
const createTestToken = () => {
  const payload = {
    id: 'admin-test',
    name: 'Admin Test',
    email: 'admin@example.com',
    role: 'admin'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Get all deals
const getDeals = async (token) => {
  try {
    console.log('Getting all deals...');
    
    const response = await fetch(`${API_URL}/deals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get deals: ${errorData.error || response.statusText}`);
    }
    
    const deals = await response.json();
    console.log(`✅ Successfully retrieved ${deals.length} deals`);
    return deals;
  } catch (error) {
    console.error('❌ Error getting deals:', error);
    throw error;
  }
};

// Get deal by ID
const getDealById = async (token, dealId) => {
  try {
    console.log(`Getting deal ${dealId}...`);
    
    const response = await fetch(`${API_URL}/deals/${dealId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get deal: ${errorData.error || response.statusText}`);
    }
    
    const deal = await response.json();
    console.log('✅ Successfully retrieved deal:');
    console.log(`- ID: ${deal.id}`);
    console.log(`- Title: ${deal.title}`);
    console.log(`- Stage: ${deal.stage}`);
    return deal;
  } catch (error) {
    console.error('❌ Error getting deal:', error);
    throw error;
  }
};

// Update deal stage
const updateDealStage = async (token, dealId, stage) => {
  try {
    console.log(`Updating deal ${dealId} stage to ${stage}...`);
    
    const response = await fetch(`${API_URL}/deals/${dealId}/stage`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stage })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update deal stage: ${errorData.error || response.statusText}`);
    }
    
    const updatedDeal = await response.json();
    console.log('✅ Successfully updated deal stage:');
    console.log(`- ID: ${updatedDeal.id}`);
    console.log(`- New Stage: ${updatedDeal.stage}`);
    return updatedDeal;
  } catch (error) {
    console.error('❌ Error updating deal stage:', error);
    throw error;
  }
};

// Create a new deal
const createDeal = async (token, dealData) => {
  try {
    console.log('Creating new deal...');
    
    const response = await fetch(`${API_URL}/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dealData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create deal: ${errorData.error || response.statusText}`);
    }
    
    const createdDeal = await response.json();
    console.log('✅ Successfully created deal:');
    console.log(`- ID: ${createdDeal.id}`);
    console.log(`- Title: ${createdDeal.title}`);
    console.log(`- Stage: ${createdDeal.stage}`);
    return createdDeal;
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    throw error;
  }
};

// Run the tests
const runTests = async () => {
  try {
    console.log('🧪 Running deals API tests...');
    
    // Create a test token
    const token = createTestToken();
    
    // 1. Get all deals
    const deals = await getDeals(token);
    
    if (deals.length === 0) {
      console.log('No deals found. Make sure to run the db:create-deals script first.');
      return;
    }
    
    // 2. Get a specific deal
    const deal = await getDealById(token, deals[0].id);
    
    // 3. Update a deal's stage
    const newStage = deal.stage === 'qualification' ? 'proposal' : 'qualification';
    const updatedDeal = await updateDealStage(token, deal.id, newStage);
      // 4. Create a new deal
    const newDeal = {
      customerId: deals[0].customerId, // Reuse an existing customer ID
      value: 999.99, // This maps to amount field in DB
      stage: 'qualification', // This maps to status field in DB
      assignedTo: deals[0].assignedTo, // Reuse an existing assigned user
      notes: 'Created during API testing',
      customer: deals[0].customer, // Reuse an existing customer
    };
    
    await createDeal(token, newDeal);
    
    // 5. Verify all deals again
    const updatedDeals = await getDeals(token);
    console.log(`🎉 All tests passed! Current deal count: ${updatedDeals.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

runTests();
