// Test the updated quotations API to verify selectedMachines are returned
async function testQuotationsAPI() {
  try {
    console.log('Testing quotations API...');
    
    // Test the GET /api/quotations endpoint
    const response = await fetch('http://localhost:3001/api/quotations');
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ API request successful');
      console.log(`Found ${result.data.length} quotations`);
      
      // Check each quotation for selectedMachines
      result.data.forEach((quotation, index) => {
        console.log(`\n--- Quotation ${index + 1} ---`);
        console.log(`ID: ${quotation.id.substring(0, 8)}...`);
        console.log(`Customer: ${quotation.customerName}`);
        console.log(`Machine Type: ${quotation.machineType}`);
        
        if (quotation.selectedMachines && quotation.selectedMachines.length > 0) {
          console.log(`✅ Selected Machines (${quotation.selectedMachines.length}):`);
          quotation.selectedMachines.forEach((machine, idx) => {
            console.log(`  ${idx + 1}. ${machine.name} (${machine.category}) - Qty: ${machine.quantity}, Rate: ${machine.baseRate}`);
          });
        } else if (quotation.selectedEquipment) {
          console.log(`✅ Selected Equipment: ${quotation.selectedEquipment.name}`);
        } else {
          console.log(`⚠️ No equipment data (only machineType: ${quotation.machineType})`);
        }
      });
      
      // Find the test quotation we created
      const testQuotation = result.data.find(q => q.machineType === 'multiple_machines');
      if (testQuotation) {
        console.log('\n🎯 Found test quotation with multiple machines!');
        console.log(`Test quotation has ${testQuotation.selectedMachines?.length || 0} machines`);
      }
      
    } else {
      console.log('❌ API returned error:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testQuotationsAPI();
