/**
 * Check Database Constraints
 * Checks what valid values are allowed for enum fields
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vedant21',
  ssl: process.env.DB_SSL === 'true' ? true : false
});

async function checkConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database constraints...');
    
    // Check constraints for leads table
    const constraintsResult = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'leads'::regclass
      AND contype = 'c';
    `);
    
    console.log('📋 Leads table constraints:');
    for (const constraint of constraintsResult.rows) {
      console.log(`- ${constraint.constraint_name}:`);
      console.log(`  ${constraint.constraint_definition}`);
    }
    
    // Check constraints for deals table
    const dealsConstraintsResult = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'deals'::regclass
      AND contype = 'c';
    `);
    
    console.log('\n💼 Deals table constraints:');
    for (const constraint of dealsConstraintsResult.rows) {
      console.log(`- ${constraint.constraint_name}:`);
      console.log(`  ${constraint.constraint_definition}`);
    }
    
    // Check constraints for equipment table
    const equipmentConstraintsResult = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'equipment'::regclass
      AND contype = 'c';
    `);
    
    console.log('\n🏗️ Equipment table constraints:');
    for (const constraint of equipmentConstraintsResult.rows) {
      console.log(`- ${constraint.constraint_name}:`);
      console.log(`  ${constraint.constraint_definition}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the constraint check
checkConstraints().catch(console.error);
