/**
 * Insert Sample Deals
 * 
 * This script inserts sample deals into the database for testing
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Sample deal statuses matching the DealStage type
const DEAL_STATUSES = ['qualification', 'proposal', 'negotiation', 'won', 'lost'];

// Generate a random deal ID
const generateDealId = () => `deal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// Generate a random amount between min and max
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Get a random item from an array
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Format date for SQL
const formatDate = (date) => date.toISOString();

const main = async () => {
  // Create database connection
  const pool = new pg.Pool({
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
    database: process.env.VITE_DB_NAME || 'asp_crm',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || '',
    ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();
  
  try {
    // First, let's check if we have customers
    console.log('🔍 Checking for customers...');
    const customerResult = await client.query('SELECT customer_id FROM customers LIMIT 10');
    
    if (customerResult.rows.length === 0) {
      console.error('❌ No customers found. Please add customers first.');
      return;
    }
    
    const customerIds = customerResult.rows.map(row => row.customer_id);
    console.log(`✅ Found ${customerIds.length} customers`);
    
    // Get sales agents (users with role 'sales_agent' or 'admin')
    console.log('🔍 Checking for sales agents...');
    const userResult = await client.query("SELECT user_id FROM users WHERE role IN ('sales_agent', 'admin')");
    
    if (userResult.rows.length === 0) {
      console.error('❌ No sales agents found. Please add users with role "sales_agent" or "admin" first.');
      return;
    }
    
    const userIds = userResult.rows.map(row => row.user_id);
    console.log(`✅ Found ${userIds.length} sales agents`);
    
    // Check current deal count
    const dealCountResult = await client.query('SELECT COUNT(*) FROM deals');
    const currentDealCount = parseInt(dealCountResult.rows[0].count);
    console.log(`📊 Current deal count: ${currentDealCount}`);
    
    // Ask how many deals to create
    const dealCount = 15; // You can change this number
    
    console.log(`🔧 Creating ${dealCount} sample deals...`);
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Insert sample deals
    for (let i = 0; i < dealCount; i++) {
      const dealId = generateDealId();
      const customerId = randomItem(customerIds);
      const status = randomItem(DEAL_STATUSES);
      const amount = randomAmount(1000, 50000);
      const notes = `Sample deal ${i + 1} notes`;
      const assignedTo = randomItem(userIds);
      const createdAt = formatDate(new Date());
      const updatedAt = createdAt;
      
      await client.query(`
        INSERT INTO deals (deal_id, customer_id, status, amount, notes, assigned_to, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [dealId, customerId, status, amount, notes, assignedTo, createdAt, updatedAt]);
      
      console.log(`Created deal ${i + 1}/${dealCount}: ${dealId} - ${status} - $${amount}`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('✅ Successfully created sample deals!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch(console.error);
