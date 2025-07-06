import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'vedant21',
  host: 'localhost',
  port: 5432,
  database: 'asp_crm'
});

async function checkQuotationMachinesTable() {
  try {
    console.log('Checking quotation_machines table...');
    
    // Check if quotation_machines table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotation_machines'
      );
    `);
    
    console.log(`quotation_machines table exists: ${tableExists.rows[0].exists}`);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'quotation_machines' 
        ORDER BY ordinal_position
      `);
      
      console.log('\nquotation_machines table structure:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there's any data
      const dataResult = await pool.query(`
        SELECT COUNT(*) as count FROM quotation_machines
      `);
      
      console.log(`\nRecords in quotation_machines: ${dataResult.rows[0].count}`);
      
      // If there's data, show some samples
      if (dataResult.rows[0].count > 0) {
        const sampleResult = await pool.query(`
          SELECT qm.*, e.name as equipment_name 
          FROM quotation_machines qm 
          LEFT JOIN equipment e ON qm.equipment_id = e.id 
          LIMIT 5
        `);
        
        console.log('\nSample quotation_machines data:');
        sampleResult.rows.forEach((row, index) => {
          console.log(`${index + 1}. Quotation: ${row.quotation_id}, Equipment: ${row.equipment_name}, Qty: ${row.quantity}, Rate: ${row.base_rate}`);
        });
      }
    } else {
      console.log('quotation_machines table does not exist. Creating it...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE quotation_machines (
          id SERIAL PRIMARY KEY,
          quotation_id VARCHAR(50) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
          equipment_id VARCHAR(50) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          base_rate NUMERIC(10, 2) NOT NULL CHECK (base_rate >= 0),
          running_cost_per_km NUMERIC(10, 2) CHECK (running_cost_per_km >= 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_quotation_machines_quotation_id ON quotation_machines(quotation_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_quotation_machines_equipment_id ON quotation_machines(equipment_id);
      `);
      
      console.log('quotation_machines table created successfully.');
    }

  } catch (error) {
    console.error('Error checking quotation_machines table:', error);
  } finally {
    await pool.end();
  }
}

checkQuotationMachinesTable();
