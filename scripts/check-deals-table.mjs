/**
 * Check Deals Table
 * 
 * This script checks if the deals table exists and has the correct structure
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const main = async () => {  // Create database connection
  const pool = new pg.Pool({
    host: process.env.VITE_DB_HOST || 'localhost',
    port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
    database: process.env.VITE_DB_NAME || 'asp_crm',
    user: process.env.VITE_DB_USER || 'postgres',
    password: process.env.VITE_DB_PASSWORD || 'vedant21',
    ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    console.log('🔍 Checking if deals table exists...');
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deals'
      );
    `);

    if (tableResult.rows[0].exists) {
      console.log('✅ Deals table exists');
      
      // Check table structure
      console.log('🔍 Checking deals table structure...');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'deals';
      `);
      
      console.log('📋 Deals table columns:');
      columnsResult.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
      
      // Count records
      const countResult = await pool.query('SELECT COUNT(*) FROM deals');
      console.log(`📊 Found ${countResult.rows[0].count} deals in the database`);
      
      // Show sample deal
      if (parseInt(countResult.rows[0].count) > 0) {
        const sampleDeal = await pool.query(`
          SELECT d.*, c.name as customer_name
          FROM deals d
          LEFT JOIN customers c ON d.customer_id = c.customer_id
          LIMIT 1
        `);
        
        if (sampleDeal.rows.length > 0) {
          console.log('📝 Sample deal:');
          console.log(JSON.stringify(sampleDeal.rows[0], null, 2));
        }
      } else {
        console.log('⚠️ No deals found in the database');
      }
    } else {
      console.error('❌ Deals table does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
};

main().catch(console.error);
