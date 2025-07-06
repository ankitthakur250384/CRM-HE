import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'vedant21',
  host: 'localhost',
  port: 5432,
  database: 'asp_crm'
});

async function updateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Updating schema for multiple machines per quotation...');
    
    // Since quotations can have multiple machines, we should modify the machine_type field
    // to be more generic or nullable since the real machine info is in quotation_machines table
    
    // Check current quotations without machines in junction table
    const orphanQuotations = await client.query(`
      SELECT q.id, q.machine_type, q.customer_name, q.created_at
      FROM quotations q
      LEFT JOIN quotation_machines qm ON q.id = qm.quotation_id
      WHERE qm.quotation_id IS NULL
      ORDER BY q.created_at DESC
    `);
    
    console.log(`\nFound ${orphanQuotations.rows.length} quotations without machine data in junction table:`);
    orphanQuotations.rows.forEach((q, index) => {
      console.log(`${index + 1}. ${q.customer_name} - ${q.machine_type} (${q.created_at.toISOString().split('T')[0]})`);
    });
    
    // For these orphan quotations, we could create default entries in quotation_machines
    // based on their machine_type field
    if (orphanQuotations.rows.length > 0) {
      console.log('\nMigrating orphan quotations to use junction table...');
      
      // Get equipment that matches common machine types
      const equipmentMapping = await client.query(`
        SELECT id, name, category FROM equipment WHERE category IN ('mobile_crane', 'tower_crane')
      `);
      
      const mobileEquipment = equipmentMapping.rows.find(e => e.category === 'mobile_crane');
      const towerEquipment = equipmentMapping.rows.find(e => e.category === 'tower_crane');
      
      for (const quotation of orphanQuotations.rows) {
        let equipmentId = null;
        
        // Map machine_type to equipment
        if (quotation.machine_type.toLowerCase().includes('mobile')) {
          equipmentId = mobileEquipment?.id;
        } else if (quotation.machine_type.toLowerCase().includes('tower')) {
          equipmentId = towerEquipment?.id;
        } else {
          // Default to mobile crane for unknown types
          equipmentId = mobileEquipment?.id;
        }
        
        if (equipmentId) {
          await client.query(`
            INSERT INTO quotation_machines (
              quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            quotation.id,
            equipmentId,
            1, // default quantity
            50000, // default base rate
            50 // default running cost per km
          ]);
          
          console.log(`✅ Migrated: ${quotation.customer_name} - ${quotation.machine_type}`);
        }
      }
    }
    
    // Update the schema to make machine_type nullable and add a comment
    console.log('\nUpdating machine_type column...');
    
    // First check if we need to alter the column
    const columnInfo = await client.query(`
      SELECT is_nullable FROM information_schema.columns 
      WHERE table_name = 'quotations' AND column_name = 'machine_type'
    `);
    
    if (columnInfo.rows[0]?.is_nullable === 'NO') {
      await client.query(`
        ALTER TABLE quotations ALTER COLUMN machine_type DROP NOT NULL
      `);
      console.log('✅ Made machine_type nullable');
    }
    
    // Add a comment to explain the new structure
    await client.query(`
      COMMENT ON COLUMN quotations.machine_type IS 'Legacy field - machine details now stored in quotation_machines table. Used for backward compatibility and simple display.'
    `);
    
    console.log('✅ Added comment to machine_type column');
    
    // Verify final state
    const finalCheck = await client.query(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(qm.quotation_id) as quotations_with_machines
      FROM quotations q
      LEFT JOIN quotation_machines qm ON q.id = qm.quotation_id
    `);
    
    console.log(`\nFinal status:`);
    console.log(`Total quotations: ${finalCheck.rows[0].total_quotations}`);
    console.log(`Quotations with machines: ${finalCheck.rows[0].quotations_with_machines}`);
    
    console.log('\n✅ Schema update completed!');
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
