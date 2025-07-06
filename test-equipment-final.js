/**
 * Final Equipment Date Format Test
 * Tests equipment creation with both YYYY-MM and YYYY-MM-DD date formats
 */

const API_BASE = 'http://localhost:3001/api';

async function testFinalDateFormats() {
  console.log('🚀 Final Equipment Date Format Test\n');
  
  // Test 1: YYYY-MM format
  console.log('=== Testing YYYY-MM format ===');
  const testYYYYMM = {
    equipmentId: `EQ-YYYY-MM-${Date.now()}`,
    name: 'Test Crane YYYY-MM Format',
    category: 'mobile_crane',
    manufacturingDate: '2020-08', // YYYY-MM format
    registrationDate: '2021-02', // YYYY-MM format
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
    description: 'Test equipment with YYYY-MM date format',
    status: 'available'
  };

  try {
    const response1 = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      },
      body: JSON.stringify(testYYYYMM)
    });

    const result1 = await response1.json();

    if (response1.ok) {
      console.log('✅ YYYY-MM format SUCCESS:', {
        id: result1.data.id,
        equipmentId: result1.data.equipmentId,
        manufacturingDate: result1.data.manufacturingDate,
        registrationDate: result1.data.registrationDate
      });
    } else {
      console.error('❌ YYYY-MM format FAILED:', result1);
    }
  } catch (error) {
    console.error('❌ YYYY-MM format ERROR:', error.message);
  }

  // Wait a moment to ensure unique timestamp
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Test 2: YYYY-MM-DD format
  console.log('\n=== Testing YYYY-MM-DD format ===');
  const testYYYYMMDD = {
    equipmentId: `EQ-YYYY-MM-DD-${Date.now()}`,
    name: 'Test Crane YYYY-MM-DD Format',
    category: 'tower_crane',
    manufacturingDate: '2020-08-15', // YYYY-MM-DD format
    registrationDate: '2021-02-20', // YYYY-MM-DD format
    maxLiftingCapacity: 30.0,
    unladenWeight: 40.0,
    baseRates: {
      micro: 1800,
      small: 3000,
      monthly: 90000,
      yearly: 1000000
    },
    runningCostPerKm: 60,
    runningCost: 1500,
    description: 'Test equipment with YYYY-MM-DD date format',
    status: 'available'
  };

  try {
    const response2 = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      },
      body: JSON.stringify(testYYYYMMDD)
    });

    const result2 = await response2.json();

    if (response2.ok) {
      console.log('✅ YYYY-MM-DD format SUCCESS:', {
        id: result2.data.id,
        equipmentId: result2.data.equipmentId,
        manufacturingDate: result2.data.manufacturingDate,
        registrationDate: result2.data.registrationDate
      });
    } else {
      console.error('❌ YYYY-MM-DD format FAILED:', result2);
    }
  } catch (error) {
    console.error('❌ YYYY-MM-DD format ERROR:', error.message);
  }

  console.log('\n🎯 Test completed!');
}

testFinalDateFormats();
