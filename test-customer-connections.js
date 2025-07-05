/**
 * Customer Connection Test Script
 * Tests the customer-lead connection system end-to-end
 */

import pool from './src/lib/dbConnection.js';

async function testCustomerConnections() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing customer connection system...\n');
    
    // Test 1: Verify all leads have customer connections
    console.log('📋 Test 1: Checking lead-customer connections...');
    const leadsWithCustomers = await client.query(`
      SELECT 
        l.id as lead_id,
        l.customer_name,
        l.email,
        l.customer_id,
        c.name as linked_customer_name,
        c.company_name
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      ORDER BY l.created_at DESC
    `);
    
    console.log(`Total leads: ${leadsWithCustomers.rows.length}`);
    
    const connectedLeads = leadsWithCustomers.rows.filter(row => row.customer_id !== null);
    const orphanedLeads = leadsWithCustomers.rows.filter(row => row.customer_id === null);
    
    console.log(`✅ Connected leads: ${connectedLeads.length}`);
    console.log(`❌ Orphaned leads: ${orphanedLeads.length}`);
    
    if (orphanedLeads.length > 0) {
      console.log('Orphaned leads details:');
      orphanedLeads.forEach(lead => {
        console.log(`  - ${lead.lead_id}: ${lead.customer_name} (${lead.email})`);
      });
    }
    
    // Test 2: Verify data consistency in connected records
    console.log('\n📊 Test 2: Checking data consistency...');
    for (const lead of connectedLeads.slice(0, 3)) {
      console.log(`Lead ${lead.lead_id}:`);
      console.log(`  Lead customer name: ${lead.customer_name}`);
      console.log(`  Linked customer name: ${lead.linked_customer_name}`);
      console.log(`  Company: ${lead.company_name}`);
      console.log(`  Match: ${lead.customer_name === lead.linked_customer_name ? '✅' : '⚠️'}`);
    }
    
    // Test 3: Check deal-customer connections
    console.log('\n🤝 Test 3: Checking deal-customer connections...');
    const dealsWithCustomers = await client.query(`
      SELECT 
        d.id as deal_id,
        d.title,
        d.customer_id,
        c.name as customer_name,
        c.company_name,
        l.customer_name as lead_customer_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN leads l ON d.lead_id = l.id
      ORDER BY d.created_at DESC
    `);
    
    const connectedDeals = dealsWithCustomers.rows.filter(row => row.customer_id !== null);
    const orphanedDeals = dealsWithCustomers.rows.filter(row => row.customer_id === null);
    
    console.log(`Total deals: ${dealsWithCustomers.rows.length}`);
    console.log(`✅ Connected deals: ${connectedDeals.length}`);
    console.log(`❌ Orphaned deals: ${orphanedDeals.length}`);
    
    // Test 4: Test the query that the frontend uses
    console.log('\n🖥️ Test 4: Testing frontend query patterns...');
    const frontendLeadQuery = await client.query(`
      SELECT l.*, 
             COALESCE(c.name, l.customer_name, 'Unknown Customer') as customer_name,
             COALESCE(c.company_name, l.company_name, '') as company_name,
             COALESCE(c.email, l.email) as email,
             COALESCE(c.phone, l.phone) as phone,
             COALESCE(c.address, '') as customer_address,
             COALESCE(c.designation, l.designation, '') as designation,
             u.display_name as assigned_to_name
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.uid
      ORDER BY l.created_at DESC
      LIMIT 3
    `);
    
    console.log('Frontend lead query results:');
    frontendLeadQuery.rows.forEach(lead => {
      console.log(`  Lead ${lead.id}:`);
      console.log(`    Customer: ${lead.customer_name}`);
      console.log(`    Company: ${lead.company_name}`);
      console.log(`    Email: ${lead.email}`);
      console.log(`    Has customer_id: ${lead.customer_id ? '✅' : '❌'}`);
    });
    
    // Test 5: Test deal query for frontend
    console.log('\n💼 Test 5: Testing frontend deal query...');
    const frontendDealQuery = await client.query(`
      SELECT d.*, 
             COALESCE(c.name, l.customer_name, 'Unknown Customer') as customer_name,
             COALESCE(c.email, l.email, '') as customer_email,
             COALESCE(c.phone, l.phone, '') as customer_phone,
             COALESCE(c.company_name, l.company_name, '') as customer_company
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN leads l ON d.lead_id = l.id
      ORDER BY d.created_at DESC
      LIMIT 3
    `);
    
    console.log('Frontend deal query results:');
    frontendDealQuery.rows.forEach(deal => {
      console.log(`  Deal ${deal.id}: ${deal.title}`);
      console.log(`    Customer: ${deal.customer_name}`);
      console.log(`    Company: ${deal.customer_company}`);
      console.log(`    Email: ${deal.customer_email}`);
      console.log(`    Value: $${deal.value}`);
    });
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`   Total customers: ${(await client.query('SELECT COUNT(*) FROM customers')).rows[0].count}`);
    console.log(`   Total leads: ${(await client.query('SELECT COUNT(*) FROM leads')).rows[0].count}`);
    console.log(`   Total deals: ${(await client.query('SELECT COUNT(*) FROM deals')).rows[0].count}`);
    console.log(`   Connected leads: ${connectedLeads.length}`);
    console.log(`   Connected deals: ${connectedDeals.length}`);
    console.log(`   Orphaned leads: ${orphanedLeads.length}`);
    console.log(`   Orphaned deals: ${orphanedDeals.length}`);
    
    const overallScore = ((connectedLeads.length + connectedDeals.length) / 
                         (leadsWithCustomers.rows.length + dealsWithCustomers.rows.length)) * 100;
    
    console.log(`   Connection Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 95) {
      console.log('\n🎉 EXCELLENT: Customer connections are working perfectly!');
    } else if (overallScore >= 80) {
      console.log('\n✅ GOOD: Customer connections are mostly working well.');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Some customer connections need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error testing customer connections:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test
testCustomerConnections()
  .then(() => {
    console.log('\n✅ Customer connection test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Customer connection test failed:', error);
    process.exit(1);
  });
