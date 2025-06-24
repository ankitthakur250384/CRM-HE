/**
 * Create Deals Table Script
 * 
 * This script creates or updates the deals table in the PostgreSQL database
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const pool = new pg.Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Create deals table
const createDealsTable = async () => {
  const client = await pool.connect();
  try {
    console.log('Creating deals table...');
    
    // Create the deals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        deal_id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        customer_id VARCHAR(255) REFERENCES customers(customer_id),
        lead_id VARCHAR(255) REFERENCES leads(lead_id),
        value DECIMAL(12, 2) DEFAULT 0,
        probability DECIMAL(5, 2) DEFAULT 0,
        stage VARCHAR(50) NOT NULL,
        assigned_to VARCHAR(255) REFERENCES users(user_id),
        expected_close_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_by VARCHAR(255) REFERENCES users(user_id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Deals table created or already exists');
    
    // Check if there are any deals in the table
    const existingDeals = await client.query(`
      SELECT COUNT(*) FROM deals;
    `);
    
    if (parseInt(existingDeals.rows[0].count) === 0) {
      console.log('No deals found in the table. Adding sample deals...');
      
      // Add sample deals for testing
      await client.query(`
        INSERT INTO deals (
          deal_id, title, description, customer_id, stage, value, probability, 
          assigned_to, expected_close_date, notes
        ) VALUES (
          'deal-sample-1', 
          'Mobile Crane Rental', 
          'Monthly crane rental for construction project',
          (SELECT customer_id FROM customers LIMIT 1),
          'qualification',
          5000.00,
          70.00,
          (SELECT user_id FROM users WHERE role = 'sales_agent' LIMIT 1),
          CURRENT_TIMESTAMP + INTERVAL '30 days',
          'This is a sample deal for testing'
        ), (
          'deal-sample-2', 
          'Equipment Package', 
          'Long-term rental of multiple equipment pieces',
          (SELECT customer_id FROM customers ORDER BY created_at DESC LIMIT 1),
          'proposal',
          8500.00,
          50.00,
          (SELECT user_id FROM users WHERE role = 'sales_agent' LIMIT 1),
          CURRENT_TIMESTAMP + INTERVAL '45 days',
          'This is another sample deal for testing'
        );
      `);
      
      console.log('✅ Sample deals added');
    } else {
      console.log(`${existingDeals.rows[0].count} existing deals found in the table`);
    }
    
    console.log('Deals table setup complete!');
  } catch (error) {
    console.error('Error creating deals table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the script
createDealsTable()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
