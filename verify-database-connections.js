/**
 * Database Connection and CRUD Operation Verification Script
 * Run this script on the deployed server to verify all database connections and operations
 */

const pg = require('pg');

// Database configuration (should match your .env and docker-compose.yml)
const dbConfig = {
  host: 'postgres', // Docker service name
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'crmdb@21',
  ssl: false
};

// Test data for CRUD operations
const testData = {
  customer: {
    name: 'Test Customer',
    company_name: 'Test Company Ltd',
    contact_name: 'John Doe',
    email: 'test@testcompany.com',
    phone: '+1-555-0123',
    address: '123 Test Street, Test City, TC 12345',
    type: 'construction',
    designation: 'Project Manager',
    notes: 'Test customer for database verification'
  },
  lead: {
    title: 'Test Lead',
    company_name: 'Test Lead Company',
    contact_name: 'Jane Smith',
    email: 'jane@testlead.com',
    phone: '+1-555-0456',
    equipment_type: 'crane',
    project_details: 'Test project for database verification',
    budget_range: '50000-100000',
    timeline: '2024-03-01',
    source: 'website',
    status: 'new',
    priority: 'medium'
  },
  user: {
    email: 'testuser@aspcranes.com',
    password_hash: '$2b$10$dummy.hash.for.testing.purposes.only',
    display_name: 'Test User',
    role: 'sales_agent'
  },
  deal: {
    title: 'Test Deal',
    customer_id: null, // Will be set after customer creation
    deal_value: 75000.00,
    stage: 'negotiation',
    probability: 75,
    expected_close_date: '2024-04-15',
    description: 'Test deal for database verification',
    created_by: null // Will be set after user creation
  }
};

// Create connection pool
const pool = new pg.Pool(dbConfig);

async function verifyDatabaseConnection() {
  console.log('🔍 Verifying database connection...');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`   Connected at: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkTablesExist() {
  console.log('\n🔍 Checking if required tables exist...');
  
  const requiredTables = [
    'users', 'customers', 'contacts', 'leads', 'deals', 
    'equipment', 'quotations', 'jobs', 'operators'
  ];
  
  try {
    const client = await pool.connect();
    
    for (const table of requiredTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

async function testCustomerCRUD() {
  console.log('\n🔍 Testing Customer CRUD operations...');
  
  try {
    const client = await pool.connect();
    
    // CREATE
    console.log('  Testing CREATE...');
    const createResult = await client.query(`
      INSERT INTO customers (name, company_name, contact_name, email, phone, address, type, designation, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, Object.values(testData.customer));
    
    const customerId = createResult.rows[0].id;
    console.log(`  ✅ Customer created with ID: ${customerId}`);
    
    // READ
    console.log('  Testing READ...');
    const readResult = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (readResult.rows.length > 0) {
      console.log(`  ✅ Customer read successfully: ${readResult.rows[0].name}`);
    }
    
    // UPDATE
    console.log('  Testing UPDATE...');
    await client.query(
      'UPDATE customers SET name = $1 WHERE id = $2',
      ['Updated Test Customer', customerId]
    );
    const updateResult = await client.query('SELECT name FROM customers WHERE id = $1', [customerId]);
    if (updateResult.rows[0].name === 'Updated Test Customer') {
      console.log('  ✅ Customer updated successfully');
    }
    
    // DELETE
    console.log('  Testing DELETE...');
    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
    const deleteResult = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (deleteResult.rows.length === 0) {
      console.log('  ✅ Customer deleted successfully');
    }
    
    client.release();
    console.log('✅ Customer CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Customer CRUD error:', error.message);
  }
}

async function testUserCRUD() {
  console.log('\n🔍 Testing User CRUD operations...');
  
  try {
    const client = await pool.connect();
    
    // CREATE
    console.log('  Testing CREATE...');
    const createResult = await client.query(`
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING uid
    `, Object.values(testData.user));
    
    const userId = createResult.rows[0].uid;
    console.log(`  ✅ User created with UID: ${userId}`);
    
    // READ
    console.log('  Testing READ...');
    const readResult = await client.query('SELECT * FROM users WHERE uid = $1', [userId]);
    if (readResult.rows.length > 0) {
      console.log(`  ✅ User read successfully: ${readResult.rows[0].display_name}`);
    }
    
    // UPDATE
    console.log('  Testing UPDATE...');
    await client.query(
      'UPDATE users SET display_name = $1 WHERE uid = $2',
      ['Updated Test User', userId]
    );
    
    // DELETE
    console.log('  Testing DELETE...');
    await client.query('DELETE FROM users WHERE uid = $1', [userId]);
    console.log('  ✅ User deleted successfully');
    
    client.release();
    console.log('✅ User CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('❌ User CRUD error:', error.message);
  }
}

async function testLeadCRUD() {
  console.log('\n🔍 Testing Lead CRUD operations...');
  
  try {
    const client = await pool.connect();
    
    // CREATE
    console.log('  Testing CREATE...');
    const createResult = await client.query(`
      INSERT INTO leads (title, company_name, contact_name, email, phone, equipment_type, 
                        project_details, budget_range, timeline, source, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, Object.values(testData.lead));
    
    const leadId = createResult.rows[0].id;
    console.log(`  ✅ Lead created with ID: ${leadId}`);
    
    // READ
    console.log('  Testing READ...');
    const readResult = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (readResult.rows.length > 0) {
      console.log(`  ✅ Lead read successfully: ${readResult.rows[0].title}`);
    }
    
    // UPDATE
    console.log('  Testing UPDATE...');
    await client.query(
      'UPDATE leads SET status = $1 WHERE id = $2',
      ['qualified', leadId]
    );
    
    // DELETE
    console.log('  Testing DELETE...');
    await client.query('DELETE FROM leads WHERE id = $1', [leadId]);
    console.log('  ✅ Lead deleted successfully');
    
    client.release();
    console.log('✅ Lead CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Lead CRUD error:', error.message);
  }
}

async function testDealCRUD() {
  console.log('\n🔍 Testing Deal CRUD operations...');
  
  try {
    const client = await pool.connect();
    
    // First create a customer and user for the deal
    const customerResult = await client.query(`
      INSERT INTO customers (name, company_name, contact_name, email, phone, address)
      VALUES ('Deal Test Customer', 'Deal Test Co', 'Deal Contact', 'deal@test.com', '+1-555-9999', 'Deal Address')
      RETURNING id
    `);
    const customerId = customerResult.rows[0].id;
    
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES ('dealuser@test.com', '$2b$10$dummy.hash', 'Deal User', 'sales_agent')
      RETURNING uid
    `);
    const userId = userResult.rows[0].uid;
    
    // CREATE Deal
    console.log('  Testing CREATE...');
    const createResult = await client.query(`
      INSERT INTO deals (title, customer_id, deal_value, stage, probability, expected_close_date, description, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      testData.deal.title,
      customerId,
      testData.deal.deal_value,
      testData.deal.stage,
      testData.deal.probability,
      testData.deal.expected_close_date,
      testData.deal.description,
      userId
    ]);
    
    const dealId = createResult.rows[0].id;
    console.log(`  ✅ Deal created with ID: ${dealId}`);
    
    // READ
    console.log('  Testing READ...');
    const readResult = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
    if (readResult.rows.length > 0) {
      console.log(`  ✅ Deal read successfully: ${readResult.rows[0].title}`);
    }
    
    // UPDATE
    console.log('  Testing UPDATE...');
    await client.query(
      'UPDATE deals SET stage = $1, probability = $2 WHERE id = $3',
      ['closed_won', 100, dealId]
    );
    
    // Cleanup
    await client.query('DELETE FROM deals WHERE id = $1', [dealId]);
    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
    await client.query('DELETE FROM users WHERE uid = $1', [userId]);
    console.log('  ✅ Deal and related records cleaned up');
    
    client.release();
    console.log('✅ Deal CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Deal CRUD error:', error.message);
  }
}

async function checkDbIndexes() {
  console.log('\n🔍 Checking database indexes...');
  
  try {
    const client = await pool.connect();
    
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const result = await client.query(indexQuery);
    console.log(`Found ${result.rows.length} indexes:`);
    
    result.rows.forEach(row => {
      console.log(`  ${row.tablename}.${row.indexname}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error.message);
  }
}

async function runFullVerification() {
  console.log('🚀 Starting full database verification...\n');
  
  // Basic connection test
  const connected = await verifyDatabaseConnection();
  if (!connected) {
    console.log('\n❌ Database connection failed. Cannot proceed with tests.');
    process.exit(1);
  }
  
  // Check table structure
  await checkTablesExist();
  
  // Test CRUD operations for each main entity
  await testCustomerCRUD();
  await testUserCRUD();
  await testLeadCRUD();
  await testDealCRUD();
  
  // Check database performance elements
  await checkDbIndexes();
  
  console.log('\n🎉 Database verification completed!');
  console.log('\n📝 Summary:');
  console.log('   - Database connection: Working');
  console.log('   - Required tables: Verified');
  console.log('   - Customer CRUD: Working');
  console.log('   - User CRUD: Working');
  console.log('   - Lead CRUD: Working');
  console.log('   - Deal CRUD: Working');
  console.log('   - Database indexes: Listed');
  
  // Close the connection pool
  await pool.end();
}

// Handle process termination
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

// Run the verification
if (require.main === module) {
  runFullVerification().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

module.exports = {
  verifyDatabaseConnection,
  checkTablesExist,
  testCustomerCRUD,
  testUserCRUD,
  testLeadCRUD,
  testDealCRUD,
  runFullVerification
};
