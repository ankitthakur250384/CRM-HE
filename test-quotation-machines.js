import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'vedant21',
  host: 'localhost',
  port: 5432,
  database: 'asp_crm'
});

async function testQuotationWithMachines() {
  try {
    console.log('Testing quotation creation with multiple machines...');
    
    // First, get some equipment IDs for testing
    const equipmentResult = await pool.query(`
      SELECT id, name, category, base_rate_monthly 
      FROM equipment 
      LIMIT 3
    `);
    
    if (equipmentResult.rows.length < 2) {
      console.log('Not enough equipment in database for testing. Need at least 2.');
      return;
    }
    
    console.log('Available equipment:');
    equipmentResult.rows.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.name} (${eq.category}) - ID: ${eq.id}`);
    });
    
    // Create a test quotation via API
    const quotationData = {
      dealId: null,
      leadId: 'lead_6958b3bf', // Use an existing lead
      customerName: 'Test Customer',
      machineType: 'multiple_machines', // Placeholder
      orderType: 'monthly',
      numberOfDays: 30,
      workingHours: 8,
      foodResources: 2,
      accomResources: 2,
      siteDistance: 50,
      usage: 'normal',
      riskFactor: 'low',
      shift: 'single',
      dayNight: 'day',
      billing: 'gst',
      customerContact: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890'
      },
      totalRent: 100000,
      selectedMachines: [
        {
          id: equipmentResult.rows[0].id,
          name: equipmentResult.rows[0].name,
          quantity: 1,
          baseRate: equipmentResult.rows[0].base_rate_monthly || 45000,
          runningCostPerKm: 50
        },
        {
          id: equipmentResult.rows[1].id,
          name: equipmentResult.rows[1].name,
          quantity: 2,
          baseRate: equipmentResult.rows[1].base_rate_monthly || 90000,
          runningCostPerKm: 75
        }
      ]
    };
    
    console.log('\nSending quotation creation request...');
    
    // Send POST request to create quotation
    const response = await fetch('http://localhost:3001/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotationData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Quotation created successfully:', result.data.id);
      
      // Now check if machines were stored in quotation_machines table
      const machinesCheck = await pool.query(`
        SELECT qm.*, e.name as equipment_name 
        FROM quotation_machines qm 
        LEFT JOIN equipment e ON qm.equipment_id = e.id 
        WHERE qm.quotation_id = $1
      `, [result.data.id]);
      
      console.log(`\nMachines stored in quotation_machines table: ${machinesCheck.rows.length}`);
      machinesCheck.rows.forEach((machine, index) => {
        console.log(`${index + 1}. ${machine.equipment_name} - Qty: ${machine.quantity}, Rate: ${machine.base_rate}`);
      });
      
      // Test fetching the quotation via API
      console.log('\nFetching quotation via API...');
      const fetchResponse = await fetch(`http://localhost:3001/api/quotations/${result.data.id}`);
      const fetchResult = await fetchResponse.json();
      
      if (fetchResult.success) {
        console.log('✅ Quotation fetched successfully');
        console.log('Selected machines in response:', fetchResult.data.selectedMachines?.length || 0);
        fetchResult.data.selectedMachines?.forEach((machine, index) => {
          console.log(`${index + 1}. ${machine.name} - Qty: ${machine.quantity}`);
        });
      } else {
        console.log('❌ Failed to fetch quotation:', fetchResult.message);
      }
      
    } else {
      console.log('❌ Failed to create quotation:', result.message);
    }

  } catch (error) {
    console.error('Error testing quotation with machines:', error);
  } finally {
    await pool.end();
  }
}

testQuotationWithMachines();
