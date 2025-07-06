import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

async function testArrayHandling() {
  const client = await pool.connect();
  
  try {
    console.log('Testing TEXT[] array handling...');
    
    // Test 1: Insert with NULL for empty arrays
    console.log('\n1. Testing NULL for empty arrays:');
    await client.query(`
      INSERT INTO quotations (
        id, customer_name, machine_type, order_type, number_of_days,
        working_hours, site_distance, usage, risk_factor, shift, day_night,
        billing, sunday_working, customer_contact, incidental_charges, other_factors, total_rent
      ) VALUES (
        'test-null-arrays', 'Test Customer', 'Crane', 'micro', 1,
        8, 10.5, 'normal', 'low', 'single', 'day',
        'gst', 'no', '{"name": "Test"}', NULL, NULL, 1000
      );
    `);
    console.log('✅ NULL arrays work');
    
    // Test 2: Insert with actual array values
    console.log('\n2. Testing actual array values:');
    await client.query(`
      INSERT INTO quotations (
        id, customer_name, machine_type, order_type, number_of_days,
        working_hours, site_distance, usage, risk_factor, shift, day_night,
        billing, sunday_working, customer_contact, incidental_charges, other_factors, total_rent
      ) VALUES (
        'test-real-arrays', 'Test Customer 2', 'Crane', 'micro', 1,
        8, 10.5, 'normal', 'low', 'single', 'day',
        'gst', 'no', '{"name": "Test"}', $1, $2, 1000
      );
    `, [['Transport charge', 'Loading charge'], ['Weather factor', 'Site condition']]);
    console.log('✅ Real arrays work');
    
    // Test 3: Try to insert empty JS array [] (this should fail)
    console.log('\n3. Testing empty JS array [] (should fail):');
    try {
      await client.query(`
        INSERT INTO quotations (
          id, customer_name, machine_type, order_type, number_of_days,
          working_hours, site_distance, usage, risk_factor, shift, day_night,
          billing, sunday_working, customer_contact, incidental_charges, other_factors, total_rent
        ) VALUES (
          'test-empty-arrays', 'Test Customer 3', 'Crane', 'micro', 1,
          8, 10.5, 'normal', 'low', 'single', 'day',
          'gst', 'no', '{"name": "Test"}', $1, $2, 1000
        );
      `, [[], []]);
      console.log('❌ Empty arrays should have failed but didn\'t');
    } catch (error) {
      console.log('✅ Empty arrays failed as expected:', error.message);
    }
    
    // Cleanup
    console.log('\n4. Cleaning up test data...');
    await client.query("DELETE FROM quotations WHERE id LIKE 'test-%'");
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testArrayHandling();
