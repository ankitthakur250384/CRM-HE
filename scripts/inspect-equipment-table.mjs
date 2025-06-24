/**
 * Database Column Inspector
 * Prints the actual columns in the equipment table
 */
import pg from 'pg';

// Database configuration
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  password: 'vedant21',
  ssl: false
});

const inspectEquipmentTable = async () => {
  console.log('Inspecting equipment table structure...\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'equipment'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Equipment table does not exist!');
      return;
    }
    
    console.log('✅ Equipment table exists\n');
    
    // 2. Get exact column list with data types
    console.log('Table columns:');
    console.log('-------------------------');
    
    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'equipment'
      ORDER BY ordinal_position;
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type}${
        col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      } | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n');
    
    // 3. Sample a record to see the actual data
    const sampleResult = await client.query('SELECT * FROM equipment LIMIT 1');
    
    if (sampleResult.rows.length > 0) {
      console.log('Sample equipment record:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
      
      // List keys specifically for clarity
      console.log('\nColumn names from sample record:');
      console.log(Object.keys(sampleResult.rows[0]).join(', '));
    } else {
      console.log('No equipment records found in database.');
      
      // Try to create a sample record
      console.log('\nCreating a sample equipment record for testing...');
      
      try {
        // Use only the columns that definitely exist
        await client.query(`
          INSERT INTO equipment (
            id, 
            name, 
            status
          ) VALUES (
            'test-id', 
            'Test Equipment', 
            'available'
          );
        `);
        
        console.log('Sample record created. Retrieving...');
        
        // Get the record we just created
        const newSampleResult = await client.query("SELECT * FROM equipment WHERE id = 'test-id'");
        console.log('Created sample record:');
        console.log(JSON.stringify(newSampleResult.rows[0], null, 2));
        
        // List keys specifically for clarity
        console.log('\nColumn names from created record:');
        console.log(Object.keys(newSampleResult.rows[0]).join(', '));
      } catch (error) {
        console.error('Error creating sample record:', error.message);
      }
    }
    
    // 4. Get table creation SQL
    console.log('\nAttempting to get table definition...');
    
    try {
      // This works on PostgreSQL to get the table definition
      const tableDefResult = await client.query(`
        SELECT pg_get_tabledef('equipment');
      `).catch(e => null);
      
      if (tableDefResult && tableDefResult.rows.length > 0) {
        console.log('Table definition SQL:');
        console.log(tableDefResult.rows[0].pg_get_tabledef);
      } else {
        // Alternative approach
        const tableSchemaResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'equipment'
          ORDER BY ordinal_position;
        `);
        
        console.log('Table schema:');
        tableSchemaResult.rows.forEach(col => {
          console.log(`${col.column_name} ${col.data_type} ${col.is_nullable === 'YES' ? '' : 'NOT NULL'}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
        });
      }
    } catch (error) {
      console.log('Could not retrieve table definition SQL:', error.message);
    }
    
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

inspectEquipmentTable().catch(console.error);
