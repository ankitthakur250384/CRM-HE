// Test quotation creation with authentication to see the detailed logs
import fetch from 'node-fetch';

async function testQuotationCreation() {
  try {
    console.log('Testing quotation creation with authentication...');
    
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@aspcranes.com',
        password: 'securepassword123'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.message);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login successful');
    
    // Now create a quotation with multiple machines (simulating frontend data)
    const quotationData = {
      dealId: 'deal_61f13490',
      leadId: 'lead_6958b3bf',
      customerName: 'Vedant Thakur',
      customerId: 'cust_d05',
      customerContact: {
        name: 'Vedant Thakur',
        email: 'vedant@example.com',
        phone: '1234567890',
        company: 'AVARIQ',
        address: 'Test Address'
      },
      // Multiple machines data
      selectedMachines: [
        {
          id: 'equ_6c50d7b1',
          name: 'Mobile Crane Test 25T',
          category: 'mobile_crane',
          quantity: 1,
          baseRate: 45000,
          runningCostPerKm: 50
        },
        {
          id: 'equ_d6754914',
          name: 'Test Crane YYYY-MM-DD Format',
          category: 'mobile_crane',
          quantity: 1,
          baseRate: 90000,
          runningCostPerKm: 75
        }
      ],
      // Basic quotation fields
      orderType: 'monthly',
      numberOfDays: 27,
      workingHours: 8,
      foodResources: 0,
      accomResources: 0,
      siteDistance: 0,
      usage: 'normal',
      riskFactor: 'low',
      shift: 'single',
      dayNight: 'day',
      billing: 'gst',
      includeGst: true,
      sundayWorking: 'no',
      totalRent: 215561,
      mobDemob: 12000,
      extraCharge: 1000,
      incidentalCharges: [],
      otherFactors: [],
      otherFactorsCharge: 40000
    };
    
    console.log('Sending quotation creation request...');
    console.log('Quotation data:', {
      hasSelectedMachines: !!(quotationData.selectedMachines && quotationData.selectedMachines.length > 0),
      machinesCount: quotationData.selectedMachines?.length || 0,
      dealId: quotationData.dealId,
      customerName: quotationData.customerName
    });
    
    const quotationResponse = await fetch('http://localhost:3001/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(quotationData)
    });
    
    const quotationResult = await quotationResponse.json();
    
    console.log('Response status:', quotationResponse.status);
    console.log('Response:', quotationResult);
    
    if (quotationResult.success) {
      console.log('✅ Quotation created successfully!');
    } else {
      console.log('❌ Quotation creation failed:', quotationResult.message);
    }

  } catch (error) {
    console.error('❌ Error testing quotation creation:', error.message);
  }
}

testQuotationCreation();
