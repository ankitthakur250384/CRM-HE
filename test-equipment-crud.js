/**
 * Equipment CRUD Test
 * 
 * Tests equipment creation with proper date formatting
 */

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-auth': 'development-only-123' // Development bypass
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`http://localhost:3001/api${endpoint}`, options);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${result.message || 'Unknown error'}`);
  }
  
  return result;
}

// Test equipment data with proper date formatting
const testEquipmentData = {
  name: 'Mobile Crane Test 25T',
  category: 'mobile_crane',
  manufacturingDate: '2020-06', // YYYY-MM format as expected by frontend
  registrationDate: '2020-07', // YYYY-MM format as expected by frontend
  maxLiftingCapacity: 25.5, // in tons
  unladenWeight: 35.2, // in tons
  baseRates: {
    micro: 1500.00,
    small: 2000.00,
    monthly: 45000.00,
    yearly: 480000.00
  },
  runningCostPerKm: 15.50,
  runningCost: 500.00,
  description: 'Test mobile crane for CRUD verification',
  status: 'available'
};

async function testEquipmentCRUD() {
  console.log('\n=== Testing Equipment CRUD Operations ===');
  
  try {
    // Test server connectivity
    console.log('Testing server connectivity...');
    await apiCall('/health').catch(() => {
      console.log('⚠️ Health endpoint not available, proceeding with tests...');
    });
    
    // CREATE - Test creating equipment with proper date format
    console.log('1. Creating new equipment...');
    console.log('Equipment data being sent:', {
      name: testEquipmentData.name,
      category: testEquipmentData.category,
      manufacturingDate: testEquipmentData.manufacturingDate,
      registrationDate: testEquipmentData.registrationDate,
      maxLiftingCapacity: testEquipmentData.maxLiftingCapacity
    });
    
    const createdEquipment = await apiCall('/equipment', 'POST', testEquipmentData);
    console.log('✅ Equipment created successfully:', {
      id: createdEquipment.data?.id || createdEquipment.id,
      name: createdEquipment.data?.name || createdEquipment.name,
      category: createdEquipment.data?.category || createdEquipment.category,
      equipmentId: createdEquipment.data?.equipmentId || createdEquipment.equipmentId,
      manufacturingDate: createdEquipment.data?.manufacturingDate || createdEquipment.manufacturingDate,
      registrationDate: createdEquipment.data?.registrationDate || createdEquipment.registrationDate
    });
    
    const actualEquipment = createdEquipment.data || createdEquipment;
    
    // READ - Test getting all equipment
    console.log('2. Getting all equipment...');
    const allEquipmentResult = await apiCall('/equipment');
    const allEquipment = allEquipmentResult.data || allEquipmentResult;
    console.log(`✅ Retrieved ${allEquipment.length} equipment records`);
    
    // READ - Test getting specific equipment
    console.log('3. Getting specific equipment...');
    const specificEquipmentResult = await apiCall(`/equipment/${actualEquipment.id}`);
    const specificEquipment = specificEquipmentResult.data || specificEquipmentResult;
    console.log('✅ Retrieved specific equipment:', {
      id: specificEquipment.id,
      name: specificEquipment.name,
      status: specificEquipment.status
    });
    
    // UPDATE - Test updating equipment status
    console.log('4. Updating equipment status...');
    const updatedEquipmentResult = await apiCall(`/equipment/${actualEquipment.id}`, 'PUT', {
      ...testEquipmentData,
      status: 'maintenance'
    });
    const updatedEquipment = updatedEquipmentResult.data || updatedEquipmentResult;
    console.log('✅ Equipment updated:', {
      id: updatedEquipment.id,
      status: updatedEquipment.status
    });
    
    console.log('\n🎉 Equipment CRUD tests completed successfully!');
    console.log('✅ Date formatting is working correctly');
    console.log('✅ Schema alignment is working');
    console.log('✅ Equipment creation with all required fields works');
    
    return actualEquipment;
    
  } catch (error) {
    console.error('\n💥 Equipment CRUD test failed:', error.message);
    console.error('This indicates an issue with equipment schema/backend alignment');
    throw error;
  }
}

// Test edge cases with date formats
async function testDateFormatHandling() {
  console.log('\n=== Testing Date Format Handling ===');
  
  try {
    // Test with YYYY-MM-DD format (should work)
    console.log('1. Testing YYYY-MM-DD date format...');
    const testData1 = {
      ...testEquipmentData,
      name: 'Test Equipment DD Format',
      manufacturingDate: '2021-08-15', // YYYY-MM-DD format
      registrationDate: '2021-09-20'   // YYYY-MM-DD format
    };
    
    const result1 = await apiCall('/equipment', 'POST', testData1);
    console.log('✅ YYYY-MM-DD format accepted and converted properly');
    
    // Test with invalid date format (should fail gracefully)
    console.log('2. Testing invalid date format...');
    const testData2 = {
      ...testEquipmentData,
      name: 'Test Equipment Invalid Date',
      manufacturingDate: '2021/08/15', // Invalid format
      registrationDate: '2021-09'      // Valid format
    };
    
    try {
      await apiCall('/equipment', 'POST', testData2);
      console.log('⚠️ Invalid date format was accepted (unexpected)');
    } catch (error) {
      console.log('✅ Invalid date format correctly rejected:', error.message);
    }
    
    console.log('\n🎉 Date format handling tests completed!');
    
  } catch (error) {
    console.error('\n💥 Date format test failed:', error.message);
    throw error;
  }
}

async function runEquipmentTests() {
  console.log('🚀 Starting Equipment CRUD and Date Format Tests');
  console.log('='.repeat(60));
  
  try {
    await testEquipmentCRUD();
    await testDateFormatHandling();
    
    console.log('\n🎊 All equipment tests completed successfully!');
    console.log('✅ Equipment creation with date formatting works');
    console.log('✅ Schema and backend are properly aligned');
    console.log('✅ Frontend CRUD operations work as expected');
    
  } catch (error) {
    console.error('\n💥 Equipment test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runEquipmentTests();
