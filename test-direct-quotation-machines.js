import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'postgres',
  password: 'vedant21',
  host: 'localhost',
  port: 5432,
  database: 'asp_crm'
});

async function testDirectQuotationCreation() {
  const client = await pool.connect();
  
  try {
    console.log('Testing direct quotation creation with multiple machines...');
    
    // First, get some equipment IDs and a real customer ID for testing
    const equipmentResult = await client.query(`
      SELECT id, name, category, base_rate_monthly 
      FROM equipment 
      LIMIT 3
    `);
    
    const customerResult = await client.query(`
      SELECT id, name FROM customers LIMIT 1
    `);
    
    const userResult = await client.query(`
      SELECT uid, display_name FROM users LIMIT 1
    `);
    
    if (equipmentResult.rows.length < 2) {
      console.log('Not enough equipment in database for testing. Need at least 2.');
      return;
    }
    
    if (customerResult.rows.length === 0) {
      console.log('No customers in database for testing.');
      return;
    }
    
    if (userResult.rows.length === 0) {
      console.log('No users in database for testing.');
      return;
    }
    
    const customerId = customerResult.rows[0].id;
    const customerName = customerResult.rows[0].name;
    const userId = userResult.rows[0].uid;
    
    console.log('Available equipment:');
    equipmentResult.rows.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.name} (${eq.category}) - ID: ${eq.id}`);
    });
    
    console.log(`Using customer: ${customerName} (ID: ${customerId})`);
    
    // Create a test quotation directly
    const quotationId = uuidv4();
    const quotationData = {
      id: quotationId,
      leadId: 'lead_6958b3bf',
      customerName: 'Test Customer for Machines',
      machineType: 'multiple_machines',
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
    
    // Insert quotation
    const insertQuery = `
      INSERT INTO quotations (
        id, lead_id, customer_id, customer_name, machine_type, order_type,
        number_of_days, working_hours, food_resources, accom_resources,
        site_distance, usage, risk_factor, shift, day_night, billing,
        include_gst, sunday_working, customer_contact, total_rent,
        version, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      );
    `;
    
    const values = [
      quotationData.id,
      quotationData.leadId,
      customerId, // use real customer ID
      customerName, // use real customer name
      quotationData.machineType,
      quotationData.orderType,
      quotationData.numberOfDays,
      quotationData.workingHours,
      quotationData.foodResources,
      quotationData.accomResources,
      quotationData.siteDistance,
      quotationData.usage,
      quotationData.riskFactor,
      quotationData.shift,
      quotationData.dayNight,
      quotationData.billing,
      true, // include_gst
      'no', // sunday_working
      JSON.stringify(quotationData.customerContact),
      quotationData.totalRent,
      1, // version
      userId, // use real user ID
      'draft' // status
    ];
    
    await client.query(insertQuery, values);
    console.log('✅ Quotation created with ID:', quotationId);
    
    // Insert machines
    console.log('Inserting machines...');
    for (const machine of quotationData.selectedMachines) {
      await client.query(`
        INSERT INTO quotation_machines (
          quotation_id, equipment_id, quantity, base_rate, running_cost_per_km
        ) VALUES ($1, $2, $3, $4, $5);
      `, [
        quotationId,
        machine.id,
        machine.quantity,
        machine.baseRate,
        machine.runningCostPerKm
      ]);
      console.log(`✅ Inserted machine: ${machine.name}`);
    }
    
    // Verify the data
    console.log('\nVerifying stored data...');
    const machinesCheck = await client.query(`
      SELECT qm.*, e.name as equipment_name 
      FROM quotation_machines qm 
      LEFT JOIN equipment e ON qm.equipment_id = e.id 
      WHERE qm.quotation_id = $1
    `, [quotationId]);
    
    console.log(`Machines stored: ${machinesCheck.rows.length}`);
    machinesCheck.rows.forEach((machine, index) => {
      console.log(`${index + 1}. ${machine.equipment_name} - Qty: ${machine.quantity}, Rate: ${machine.base_rate}`);
    });
    
    // Test the API logic by simulating the GET route logic
    console.log('\nTesting GET route logic...');
    const quotationResult = await client.query(`
      SELECT q.*, c.name as customer_name, d.title as deal_title
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN deals d ON q.deal_id = d.id
      WHERE q.id = $1
    `, [quotationId]);
    
    if (quotationResult.rows.length > 0) {
      const q = quotationResult.rows[0];
      
      // Fetch machines for this quotation (same logic as API)
      const machinesResult = await client.query(`
        SELECT qm.*, e.name as equipment_name, e.category as equipment_category
        FROM quotation_machines qm
        LEFT JOIN equipment e ON qm.equipment_id = e.id
        WHERE qm.quotation_id = $1
      `, [q.id]);
      
      const selectedMachines = machinesResult.rows.map(m => ({
        id: m.equipment_id,
        name: m.equipment_name,
        category: m.equipment_category,
        quantity: m.quantity,
        baseRate: m.base_rate,
        runningCostPerKm: m.running_cost_per_km
      }));
      
      console.log('✅ API would return selectedMachines:');
      selectedMachines.forEach((machine, index) => {
        console.log(`${index + 1}. ${machine.name} (${machine.category}) - Qty: ${machine.quantity}, Rate: ${machine.baseRate}`);
      });
    }

  } catch (error) {
    console.error('Error testing direct quotation creation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDirectQuotationCreation();
