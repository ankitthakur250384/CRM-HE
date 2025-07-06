import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'vedant21',
  host: 'localhost',
  port: 5432,
  database: 'asp_crm'
});

async function checkQuotationEquipmentData() {
  try {
    console.log('Checking quotation equipment data...');
    
    // First, check what columns exist in the quotations table
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'quotations' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nQuotations table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get recent quotations with basic data first
    const result = await pool.query(`
      SELECT * 
      FROM quotations 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log(`\nFound ${result.rows.length} recent quotations:\n`);
    
    result.rows.forEach((quotation, index) => {
      console.log(`--- Quotation ${index + 1} ---`);
      console.log(`ID: ${quotation.id}`);
      console.log(`Deal ID: ${quotation.deal_id || 'None'}`);
      console.log(`Lead ID: ${quotation.lead_id || 'None'}`);
      console.log(`Customer: ${quotation.customer_name || 'None'}`);
      console.log(`Created: ${quotation.created_at}`);
      
      // Check for equipment-related fields
      Object.keys(quotation).forEach(key => {
        if (key.toLowerCase().includes('equipment') || key.toLowerCase().includes('machine')) {
          console.log(`${key}:`, quotation[key]);
        }
      });
      console.log('');
    });

    // Check if we have any quotations with equipment data
    const withEquipment = await pool.query(`
      SELECT COUNT(*) as count 
      FROM quotations 
    `);
    
    console.log(`Total quotations: ${withEquipment.rows[0].count}`);
    
    // Check equipment table structure
    const equipmentResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nEquipment table structure:');
    equipmentResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get some sample equipment data
    const sampleEquipment = await pool.query(`
      SELECT id, name, category, max_lifting_capacity 
      FROM equipment 
      LIMIT 5
    `);
    
    console.log('\nSample equipment data:');
    sampleEquipment.rows.forEach(eq => {
      console.log(`- ${eq.name} (${eq.category}) - Capacity: ${eq.max_lifting_capacity}T`);
    });

  } catch (error) {
    console.error('Error checking quotation equipment data:', error);
  } finally {
    await pool.end();
  }
}

checkQuotationEquipmentData();
