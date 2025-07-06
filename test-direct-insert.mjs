/**
 * Direct Database Insert Test
 * Test inserting a quotation directly with deal_id
 */

import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

async function testDirectInsert() {
  console.log('🧪 Testing direct quotation insert with deal_id...\n');
  
  const client = await pool.connect();
  
  try {
    // Get a deal ID and valid user ID to use
    const dealResult = await client.query('SELECT id, customer_id FROM deals LIMIT 1;');
    const userResult = await client.query('SELECT uid FROM users LIMIT 1;');
    
    if (dealResult.rows.length === 0) {
      console.log('❌ No deals found to test with');
      return;
    }
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }
    
    const deal = dealResult.rows[0];
    const user = userResult.rows[0];
    console.log('Using deal:', deal.id);
    console.log('Customer ID:', deal.customer_id);
    console.log('User ID:', user.uid);
    
    // Insert a test quotation directly
    const quotationId = `test_quot_${Date.now()}`;
    
    const insertQuery = `
      INSERT INTO quotations (
        id, deal_id, customer_id, customer_name, machine_type, order_type,
        number_of_days, working_hours, food_resources, accom_resources,
        site_distance, usage, risk_factor, shift, day_night, billing,
        sunday_working, customer_contact, total_rent, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING id, deal_id;
    `;
    
    const values = [
      quotationId,                    // id
      deal.id,                       // deal_id - THIS IS THE KEY TEST
      deal.customer_id,              // customer_id
      'Test Customer Direct',        // customer_name
      'mobile_crane',               // machine_type
      'monthly',                    // order_type
      30,                          // number_of_days
      8,                           // working_hours
      1,                           // food_resources
      1,                           // accom_resources
      10.5,                        // site_distance
      'normal',                    // usage
      'low',                       // risk_factor
      'single',                    // shift
      'day',                       // day_night
      'gst',                       // billing
      'no',                        // sunday_working
      JSON.stringify({name: 'Test', email: 'test@test.com'}), // customer_contact (JSONB)
      50000,                       // total_rent
      user.uid,                    // created_by (valid user ID)
      'draft'                      // status
    ];
    
    console.log('Inserting with deal_id:', deal.id);
    
    const result = await client.query(insertQuery, values);
    const inserted = result.rows[0];
    
    console.log('✅ Direct insert successful!');
    console.log('Inserted ID:', inserted.id);
    console.log('Stored deal_id:', inserted.deal_id);
    
    // Now verify it was stored correctly
    const verifyResult = await client.query('SELECT id, deal_id, customer_name FROM quotations WHERE id = $1', [quotationId]);
    const verified = verifyResult.rows[0];
    
    console.log('\n🔍 Verification:');
    console.log('ID:', verified.id);
    console.log('Deal ID:', verified.deal_id);
    console.log('Customer Name:', verified.customer_name);
    
    if (verified.deal_id === deal.id) {
      console.log('\n🎉 SUCCESS: deal_id is being stored correctly in the database!');
      console.log('The issue must be in the quotation creation API logic.');
    } else {
      console.log('\n❌ FAILED: deal_id is not being stored correctly');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDirectInsert();
