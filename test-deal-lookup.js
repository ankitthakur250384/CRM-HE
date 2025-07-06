/**
 * Test script to verify deal lookup by name functionality
 * Tests the new getDealByTitle and findDealsByTitle functions
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to check if we're using ES modules
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const isModule = packageJson.type === 'module';

let dealRepository;

if (isModule) {
  dealRepository = await import('./src/services/postgres/dealRepository.js');
} else {
  dealRepository = require('./src/services/postgres/dealRepository.js');
}

async function testDealLookup() {
  console.log('🧪 Testing Deal Lookup by Name Functionality\n');
  
  try {
    // First, let's see what deals we have
    console.log('📋 Getting all deals to see what we have:');
    const allDeals = await dealRepository.getDeals();
    console.log(`Found ${allDeals.length} deals:`);
    allDeals.forEach(deal => {
      console.log(`  - ID: ${deal.id}, Title: "${deal.title}", Customer: ${deal.customer.name}`);
    });
    console.log();
    
    if (allDeals.length === 0) {
      console.log('❌ No deals found. Please create some test deals first.');
      return;
    }
    
    // Test 1: Search for deals by partial title match
    const searchTerm = allDeals[0].title.substring(0, 5); // Take first 5 characters
    console.log(`🔍 Test 1: Searching for deals with partial title: "${searchTerm}"`);
    const searchResults = await dealRepository.findDealsByTitle(searchTerm);
    console.log(`Found ${searchResults.length} deals matching "${searchTerm}":`);
    searchResults.forEach(deal => {
      console.log(`  - ID: ${deal.id}, Title: "${deal.title}", Customer: ${deal.customer.name}`);
    });
    console.log();
    
    // Test 2: Get deal by exact title
    const exactTitle = allDeals[0].title;
    console.log(`🎯 Test 2: Getting deal by exact title: "${exactTitle}"`);
    const exactDeal = await dealRepository.getDealByTitle(exactTitle);
    if (exactDeal) {
      console.log(`✅ Found exact match - ID: ${exactDeal.id}, Title: "${exactDeal.title}"`);
    } else {
      console.log(`❌ No exact match found for "${exactTitle}"`);
    }
    console.log();
    
    // Test 3: Search for non-existent deal
    console.log(`🔍 Test 3: Searching for non-existent deal: "NonExistentDeal123"`);
    const noResults = await dealRepository.findDealsByTitle('NonExistentDeal123');
    console.log(`Found ${noResults.length} deals matching "NonExistentDeal123"`);
    console.log();
    
    // Test 4: Get non-existent deal by exact title
    console.log(`🎯 Test 4: Getting non-existent deal by exact title: "NonExistentDeal123"`);
    const noExactResult = await dealRepository.getDealByTitle('NonExistentDeal123');
    if (noExactResult) {
      console.log(`❌ Unexpected result found for non-existent deal`);
    } else {
      console.log(`✅ Correctly returned null for non-existent deal`);
    }
    console.log();
    
    console.log('✅ All deal lookup tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  }
}

// Run the test
testDealLookup()
  .then(() => {
    console.log('🎉 Deal lookup test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deal lookup test failed:', error);
    process.exit(1);
  });
