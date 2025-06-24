/**
 * Script to update legacy leads with missing metadata
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Create a PostgreSQL client
const pool = new pg.Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

/**
 * Update legacy leads with proper metadata
 */
async function updateLegacyLeads() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Fetching existing leads...');
    const leadsResult = await client.query('SELECT lead_id FROM leads');
    const leads = leadsResult.rows;
    
    console.log(`Found ${leads.length} leads to update`);
    
    // Check if lead_metadata table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lead_metadata'
      );
    `);
    
    // Create lead_metadata table if it doesn't exist
    if (!checkTable.rows[0].exists) {
      console.log('Creating lead_metadata table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS lead_metadata (
          id SERIAL PRIMARY KEY,
          lead_id VARCHAR(255) REFERENCES leads(lead_id),
          service_needed VARCHAR(255),
          site_location TEXT,
          start_date TIMESTAMP WITH TIME ZONE,
          rental_days INTEGER,
          shift_timing VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    
    // Check if customer_info table exists and get customer data
    let customers = [];
    try {
      const customersResult = await client.query('SELECT customer_id, name, company, email, phone FROM customers');
      customers = customersResult.rows;
      console.log(`Found ${customers.length} customers`);
    } catch (error) {
      console.log('No customer data found or table does not exist');
    }
    
    // Process each lead
    for (const lead of leads) {
      const leadId = lead.lead_id;
      
      // Check if metadata already exists for this lead
      const metadataExists = await client.query(
        'SELECT 1 FROM lead_metadata WHERE lead_id = $1',
        [leadId]
      );
      
      if (metadataExists.rowCount === 0) {
        console.log(`Creating metadata for lead ${leadId}`);
        
        // Get customer info for this lead
        const customerQuery = await client.query(
          'SELECT customer_id FROM leads WHERE lead_id = $1',
          [leadId]
        );
        
        let customerData = null;
        if (customerQuery.rows.length > 0 && customerQuery.rows[0].customer_id) {
          const customerId = customerQuery.rows[0].customer_id;
          customerData = customers.find(c => c.customer_id === customerId);
        }
        
        // Default values for metadata
        const serviceNeeded = 'Crane rental';
        const siteLocation = 'To be determined';
        const startDate = new Date();
        const rentalDays = 30;
        const shiftTiming = 'day';
        
        // Insert metadata
        await client.query(
          `INSERT INTO lead_metadata 
           (lead_id, service_needed, site_location, start_date, rental_days, shift_timing) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [leadId, serviceNeeded, siteLocation, startDate, rentalDays, shiftTiming]
        );
        
        // Update lead with customer info if available
        if (customerData) {
          // Update leads with customer name and company
          await client.query(`
            UPDATE leads 
            SET notes = CASE WHEN notes IS NULL OR notes = '' THEN 'Imported from legacy data' ELSE notes END
            WHERE lead_id = $1`,
            [leadId]
          );
        }
      } else {
        console.log(`Metadata already exists for lead ${leadId}, skipping`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Lead metadata updated successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error updating lead metadata:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run the function
updateLegacyLeads()
  .then(() => {
    console.log('Done.');
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err);
    pool.end();
    process.exit(1);
  });
