/**
 * Check current quotations in database to verify deal_id and customer info
 */

import pg from 'pg';

// Database configuration
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

async function checkQuotations() {
  console.log('🔍 Checking current quotations in database...\n');
  
  const client = await pool.connect();
  
  try {
    // Get recent quotations with deal and customer info
    const result = await client.query(`
      SELECT 
        q.id,
        q.deal_id,
        q.lead_id,
        q.customer_id,
        q.customer_name,
        q.machine_type,
        q.order_type,
        q.total_rent,
        q.status,
        q.customer_contact,
        q.created_at,
        d.title as deal_title,
        c.name as customer_table_name,
        c.email as customer_table_email,
        c.phone as customer_table_phone
      FROM quotations q
      LEFT JOIN deals d ON q.deal_id = d.id
      LEFT JOIN customers c ON q.customer_id = c.id
      ORDER BY q.created_at DESC
      LIMIT 10;
    `);
    
    console.log(`Found ${result.rows.length} quotations:\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No quotations found in database');
      return;
    }
    
    result.rows.forEach((quotation, index) => {
      console.log(`${index + 1}. Quotation ID: ${quotation.id}`);
      console.log(`   Deal ID: ${quotation.deal_id || 'NULL'}`);
      console.log(`   Deal Title: ${quotation.deal_title || 'NULL'}`);
      console.log(`   Lead ID: ${quotation.lead_id || 'NULL'}`);
      console.log(`   Customer ID: ${quotation.customer_id || 'NULL'}`);
      console.log(`   Customer Name (quotation): ${quotation.customer_name || 'NULL'}`);
      console.log(`   Customer Name (from table): ${quotation.customer_table_name || 'NULL'}`);
      console.log(`   Machine Type: ${quotation.machine_type}`);
      console.log(`   Order Type: ${quotation.order_type}`);
      console.log(`   Total Rent: ${quotation.total_rent}`);
      console.log(`   Status: ${quotation.status}`);
      
      // Check customer contact info
      let customerContact = {};
      try {
        if (quotation.customer_contact) {
          if (typeof quotation.customer_contact === 'string') {
            customerContact = JSON.parse(quotation.customer_contact);
          } else {
            customerContact = quotation.customer_contact;
          }
        }
      } catch (e) {
        console.log(`   Customer Contact: Invalid JSON - ${e.message}`);
      }
      
      console.log(`   Customer Contact:`, customerContact);
      console.log(`   Created At: ${quotation.created_at}`);
      console.log('   ' + '='.repeat(60));
    });
    
    // Check if there are quotations missing deal_id or customer info
    const missingDealId = result.rows.filter(q => !q.deal_id);
    const missingCustomerId = result.rows.filter(q => !q.customer_id);
    const missingCustomerName = result.rows.filter(q => !q.customer_name);
    
    console.log('\n📊 Analysis:');
    console.log(`   Total quotations: ${result.rows.length}`);
    console.log(`   Missing deal_id: ${missingDealId.length}`);
    console.log(`   Missing customer_id: ${missingCustomerId.length}`);
    console.log(`   Missing customer_name: ${missingCustomerName.length}`);
    
    if (missingDealId.length > 0) {
      console.log('\n⚠️ Quotations missing deal_id:');
      missingDealId.forEach(q => {
        console.log(`   - ${q.id} (${q.machine_type})`);
      });
    }
    
    if (missingCustomerId.length > 0) {
      console.log('\n⚠️ Quotations missing customer_id:');
      missingCustomerId.forEach(q => {
        console.log(`   - ${q.id} (${q.machine_type})`);
      });
    }
    
    if (missingCustomerName.length > 0) {
      console.log('\n⚠️ Quotations missing customer_name:');
      missingCustomerName.forEach(q => {
        console.log(`   - ${q.id} (${q.machine_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking quotations:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkQuotations()
  .then(() => {
    console.log('\n✅ Quotation check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error during quotation check:', error);
    process.exit(1);
  });
