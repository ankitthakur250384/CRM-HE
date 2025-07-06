/**
 * Test Equipment Creation
 * Tests equipment creation with proper date formatting
 */

const API_BASE = 'http://localhost:3001/api';

async function testEquipmentCreation() {
  const testEquipmentData = {
    name: 'Test Mobile Crane 25T',
    category: 'mobile_crane',
    manufacturingDate: '2018-09', // YYYY-MM format
    registrationDate: '2019-03', // YYYY-MM format
    maxLiftingCapacity: 25.0,
    unladenWeight: 35.5,
    baseRates: {
      micro: 1500,
      small: 2500,
      monthly: 75000,
      yearly: 850000
    },
    runningCostPerKm: 50,
    runningCost: 1200,
    description: 'Test equipment for date format validation',
    status: 'available'
  };

  console.log('Testing equipment creation with data:', JSON.stringify(testEquipmentData, null, 2));

  try {
    const response = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      },
      body: JSON.stringify(testEquipmentData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Equipment created successfully:', result);
    } else {
      console.error('❌ Equipment creation failed:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test with various date formats
async function testDifferentDateFormats() {
  const testCases = [
    {
      name: 'YYYY-MM format',
      manufacturingDate: '2018-09',
      registrationDate: '2019-03'
    },
    {
      name: 'YYYY-MM-DD format',
      manufacturingDate: '2018-09-15',
      registrationDate: '2019-03-10'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing ${testCase.name} ===`);
    
    const testData = {
      name: `Test Crane - ${testCase.name}`,
      category: 'mobile_crane',
      manufacturingDate: testCase.manufacturingDate,
      registrationDate: testCase.registrationDate,
      maxLiftingCapacity: 25.0,
      unladenWeight: 35.5,
      baseRates: {
        micro: 1500,
        small: 2500,
        monthly: 75000,
        yearly: 850000
      },
      runningCostPerKm: 50,
      runningCost: 1200,
      description: `Test equipment with ${testCase.name}`,
      status: 'available'
    };

    try {
      const response = await fetch(`${API_BASE}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-auth': 'development-only-123'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ ${testCase.name} test passed:`, {
          id: result.data?.id,
          equipmentId: result.data?.equipmentId,
          manufacturingDate: result.data?.manufacturingDate,
          registrationDate: result.data?.registrationDate
        });
      } else {
        console.error(`❌ ${testCase.name} test failed:`, result);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name} network error:`, error);
    }
  }
}

console.log('🚀 Testing Equipment Creation with Date Formats');
testDifferentDateFormats();
