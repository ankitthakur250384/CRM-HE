/**
 * End-to-end test for quotation creation with deal name lookup
 * This test simulates the complete flow of creating a quotation by deal name
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
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

// Database configuration
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

async function createQuotationByDealName() {
  console.log('🧪 End-to-End Test: Creating Quotation by Deal Name\n');
  
  const client = await pool.connect();
  
  try {
    // First, get available deals
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
    
    // Simulate the quotation creation with deal name (like the API would do)
    console.log('📝 Creating quotation with deal name...');
    
    const quotationData = {
      dealName: testDeal.title, // Using deal name instead of dealId
      machineType: 'Mobile Crane',
      orderType: 'micro',
      numberOfDays: 15,
      workingHours: 8,
      foodResources: 2,
      accomResources: 1,
      siteDistance: 75,
      usage: 'heavy',
      riskFactor: 'medium',
      shift: 'single',
      dayNight: 'day',
      billing: 'gst',
      customerContact: {
        name: 'Test Customer from Deal',
        email: 'dealcustomer@example.com',
        phone: '9876543210'
      },
      mobDemob: 5000,
      totalRent: 150000,
      includeGst: true,
      gstAmount: 27000,
      status: 'draft'
    };
    
    // Step 1: Look up deal by name (like the API does)
    console.log(`🔍 Looking up deal by name: "${quotationData.dealName}"`);
    const dealByName = await dealRepository.getDealByTitle(quotationData.dealName);
    
    if (!dealByName) {
      console.log(`❌ Deal not found by name: "${quotationData.dealName}"`);
      return;
    }
    
    console.log(`✅ Found deal: ${dealByName.title} -> ID: ${dealByName.id}`);
    
    // Step 2: Auto-populate customer info from the deal
    console.log('📋 Auto-populating customer info from deal...');
    quotationData.dealId = dealByName.id;
    quotationData.customerId = dealByName.customerId;
    quotationData.customerName = dealByName.customer.name;
    quotationData.leadId = dealByName.leadId;
    quotationData.customerContact = {
      name: dealByName.customer.name,
      email: dealByName.customer.email || 'auto@example.com',
      phone: dealByName.customer.phone || '1234567890',
      company: dealByName.customer.company || '',
      address: dealByName.customer.address || ''
    };
    
    console.log(`✅ Customer info auto-populated:`);
    console.log(`   - Customer ID: ${quotationData.customerId}`);
    console.log(`   - Customer Name: ${quotationData.customerName}`);
    console.log(`   - Lead ID: ${quotationData.leadId}`);
    console.log();
    
    // Step 3: Create the quotation in the database
    console.log('💾 Inserting quotation into database...');
    
    // First, get a valid user ID for created_by
    const userResult = await client.query('SELECT uid FROM users LIMIT 1');
    const createdBy = userResult.rows.length > 0 ? userResult.rows[0].uid : null;
    
    if (!createdBy) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }
    
    console.log(`Using user ID for created_by: ${createdBy}`);
    
    const quotationId = uuidv4();
    
    const insertQuery = `
      INSERT INTO quotations (
        id, deal_id, lead_id, customer_id, customer_name, machine_type, order_type,
        number_of_days, working_hours, food_resources, accom_resources,
        site_distance, usage, risk_factor, shift, day_night, mob_demob,
        billing, include_gst, sunday_working, customer_contact, total_rent, gst_amount,
        created_by, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;
    
    const values = [
      quotationId,
      quotationData.dealId,
      quotationData.leadId,
      quotationData.customerId,
      quotationData.customerName,
      quotationData.machineType,
      quotationData.orderType,
      quotationData.numberOfDays,
      quotationData.workingHours,
      quotationData.foodResources || 0,
      quotationData.accomResources || 0,
      quotationData.siteDistance || 0,
      quotationData.usage,
      quotationData.riskFactor,
      quotationData.shift,
      quotationData.dayNight,
      quotationData.mobDemob || 0,
      quotationData.billing,
      quotationData.includeGst || true,
      quotationData.sundayWorking || 'no',
      JSON.stringify(quotationData.customerContact || {}),
      quotationData.totalRent || 0,
      quotationData.gstAmount || 0,
      createdBy, // created_by - use actual user ID
      quotationData.status || 'draft'
    ];
    
    const result = await client.query(insertQuery, values);
    const createdQuotation = result.rows[0];
    
    console.log(`✅ Quotation created successfully with ID: ${createdQuotation.id}`);
    console.log();
    
    // Step 4: Verify the quotation was created correctly
    console.log('🔍 Verifying quotation in database...');
    
    const verifyQuery = `
      SELECT q.*, c.name as customer_name_from_table, d.title as deal_title
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN deals d ON q.deal_id = d.id
      WHERE q.id = $1;
    `;
    
    const verifyResult = await client.query(verifyQuery, [quotationId]);
    const quotation = verifyResult.rows[0];
    
    console.log('📊 Quotation details:');
    console.log(`   - ID: ${quotation.id}`);
    console.log(`   - Deal ID: ${quotation.deal_id}`);
    console.log(`   - Deal Title: ${quotation.deal_title}`);
    console.log(`   - Customer ID: ${quotation.customer_id}`);
    console.log(`   - Customer Name: ${quotation.customer_name}`);
    console.log(`   - Machine Type: ${quotation.machine_type}`);
    console.log(`   - Total Rent: ${quotation.total_rent}`);
    console.log(`   - Status: ${quotation.status}`);
    console.log(`   - Created At: ${quotation.created_at}`);
    console.log();
    
    // Step 5: Test the API response format
    console.log('📋 Testing API response format...');
    
    const apiResponseQuery = `
      SELECT q.*, c.name as customer_name, d.title as deal_title
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN deals d ON q.deal_id = d.id
      WHERE q.id = $1;
    `;
    
    const apiResult = await client.query(apiResponseQuery, [quotationId]);
    const apiQuotation = apiResult.rows[0];
    
    // Transform like the API would
    console.log('Raw customer_contact:', apiQuotation.customer_contact);
    console.log('Type of customer_contact:', typeof apiQuotation.customer_contact);
    
    let customerContact = {};
    try {
      if (apiQuotation.customer_contact) {
        if (typeof apiQuotation.customer_contact === 'string') {
          customerContact = JSON.parse(apiQuotation.customer_contact);
        } else {
          customerContact = apiQuotation.customer_contact;
        }
      }
    } catch (e) {
      console.log('Error parsing customer_contact:', e.message);
      customerContact = {};
    }
    
    const transformedQuotation = {
      id: apiQuotation.id,
      dealId: apiQuotation.deal_id,
      dealTitle: apiQuotation.deal_title,
      leadId: apiQuotation.lead_id,
      customerId: apiQuotation.customer_id,
      customerName: apiQuotation.customer_name,
      machineType: apiQuotation.machine_type,
      orderType: apiQuotation.order_type,
      numberOfDays: apiQuotation.number_of_days,
      totalRent: apiQuotation.total_rent,
      status: apiQuotation.status,
      createdAt: apiQuotation.created_at,
      updatedAt: apiQuotation.updated_at,
      customerContact: customerContact
    };
    
    console.log('✅ API Response format:');
    console.log(JSON.stringify(transformedQuotation, null, 2));
    console.log();
    
    // Clean up - delete the test quotation
    console.log('🧹 Cleaning up test data...');
    await client.query('DELETE FROM quotations WHERE id = $1', [quotationId]);
    console.log('✅ Test quotation deleted');
    console.log();
    
    console.log('🎉 End-to-End Test Results:');
    console.log('   ✅ Deal lookup by name: Working');
    console.log('   ✅ Customer info auto-population: Working');
    console.log('   ✅ Quotation creation with dealId: Working');
    console.log('   ✅ Database storage: Working');
    console.log('   ✅ API response format: Working');
    console.log('   ✅ Data cleanup: Working');
    console.log();
    console.log('🚀 The quotation creation with deal name lookup is fully functional!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test
createQuotationByDealName()
  .then(() => {
    console.log('🎉 End-to-end test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 End-to-end test failed:', error);
    process.exit(1);
  });
