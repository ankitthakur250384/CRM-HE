/**
 * Script to create the lead_metadata table in PostgreSQL
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

async function createLeadMetadataTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating lead_metadata table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Add additional columns to leads table if they don't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'leads' AND column_name = 'assigned_to_name'
        ) THEN
          ALTER TABLE leads ADD COLUMN assigned_to_name VARCHAR(255);
        END IF;
      END
      $$;
    `);
    
    // Create the lead_metadata table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_metadata (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(255) REFERENCES leads(lead_id) ON DELETE CASCADE,
        service_needed VARCHAR(255),
        site_location TEXT,
        start_date TIMESTAMP WITH TIME ZONE,
        rental_days INTEGER,
        shift_timing VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Lead metadata table created successfully!');
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error creating lead_metadata table:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run the function
createLeadMetadataTable()
  .then(() => {
    console.log('Done.');
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err);
    pool.end();
    process.exit(1);
  });
