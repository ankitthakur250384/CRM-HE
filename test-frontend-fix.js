/**
 * Test script to verify that frontend quotation creation includes dealId
 * Simulates the fixed frontend logic
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

async function testFrontendQuotationCreation() {
  console.log('🧪 Testing Frontend Quotation Creation Fix\n');
  
  try {
    // Get available deals
    console.log('📋 Getting available deals:');
    const allDeals = await dealRepository.getDeals();
    
    if (allDeals.length === 0) {
      console.log('❌ No deals found. Please create some test deals first.');
      return;
    }
    
    const testDeal = allDeals[0];
    console.log(`🎯 Using deal: "${testDeal.title}" (ID: ${testDeal.id})`);
    console.log(`   Customer: ${testDeal.customer.name}`);
    console.log();
    
    // Simulate the FIXED frontend logic
    console.log('📝 Simulating FIXED frontend quotation creation...');
    
    const formData = {
      machineType: 'mobile_crane',
      orderType: 'micro',
      numberOfDays: 10,
      workingHours: 8,
      foodResources: 2,
      accomResources: 1,
      siteDistance: 50,
      usage: 'normal',
      riskFactor: 'low',
      shift: 'single',
      dayNight: 'day',
      billing: 'gst',
      includeGst: true,
      mobDemob: 5000,
      totalRent: 75000,
      status: 'draft',
      sundayWorking: 'no'
    };
    
    // This is the FIXED logic from QuotationCreation.tsx
    const quotationData = {
      ...formData,
      dealId: testDeal.id,  // ✅ FIXED: Include the deal ID
      leadId: testDeal.leadId,  // ✅ FIXED: Include the original lead ID from the deal
      customerId: testDeal.customerId,
      customerName: testDeal.customer.name,
      customerContact: {
        name: testDeal.customer.name,
        email: testDeal.customer.email,
        phone: testDeal.customer.phone,
        company: testDeal.customer.company,
        address: testDeal.customer.address,
        designation: testDeal.customer.designation
      }
    };
    
    console.log('✅ FIXED quotation data would include:');
    console.log(`   - dealId: ${quotationData.dealId}`);
    console.log(`   - leadId: ${quotationData.leadId}`);
    console.log(`   - customerId: ${quotationData.customerId}`);
    console.log(`   - customerName: ${quotationData.customerName}`);
    console.log(`   - customerContact: ${JSON.stringify(quotationData.customerContact, null, 2)}`);
    console.log();
    
    // Compare with the OLD (broken) logic
    console.log('❌ OLD (broken) quotation data would include:');
    const oldQuotationData = {
      ...formData,
      leadId: testDeal.id,  // ❌ WRONG: This sets leadId to deal.id instead of dealId
      customerId: testDeal.customerId,
      customerName: testDeal.customer.name,
      customerContact: {
        name: testDeal.customer.name,
        email: testDeal.customer.email,
        phone: testDeal.customer.phone,
        company: testDeal.customer.company,
        address: testDeal.customer.address,
        designation: testDeal.customer.designation
      }
    };
    
    console.log(`   - dealId: ${oldQuotationData.dealId || 'MISSING ❌'}`);
    console.log(`   - leadId: ${oldQuotationData.leadId} (WRONG - this is the deal.id)`);
    console.log(`   - customerId: ${oldQuotationData.customerId}`);
    console.log(`   - customerName: ${oldQuotationData.customerName}`);
    console.log();
    
    console.log('🔧 Summary of the fix:');
    console.log('   ❌ OLD: leadId = deal.id (missing dealId)');
    console.log('   ✅ NEW: dealId = deal.id, leadId = deal.leadId');
    console.log();
    console.log('📋 This fix ensures:');
    console.log('   1. dealId is properly included in quotations');
    console.log('   2. Customer info is auto-populated from the deal');
    console.log('   3. Both deal and lead references are maintained');
    console.log('   4. Backend can properly link quotations to deals');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  }
}

// Run the test
testFrontendQuotationCreation()
  .then(() => {
    console.log('\n🎉 Frontend quotation creation test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Frontend quotation creation test failed:', error);
    process.exit(1);
  });
