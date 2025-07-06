/**
 * Test and Verify Quotation with Deal Info
 * Creates a quotation and verifies customer info is auto-populated
 */

const API_BASE = 'http://localhost:3001/api';

async function testAndVerifyQuotation() {
  console.log('🚀 Testing Quotation Creation and Verification\n');
  
  try {
    // First, get a deal to work with
    console.log('=== Getting a deal ===');
    const dealsResponse = await fetch(`${API_BASE}/deals`, {
      headers: {
        'x-bypass-auth': 'development-only-123'
      }
    });
    
    const dealsResult = await dealsResponse.json();
    
    if (!dealsResult.success || dealsResult.data.length === 0) {
      console.log('❌ No deals found to test with');
      return;
    }
    
    const deal = dealsResult.data[0];
    console.log('✅ Using deal:', {
      id: deal.id,
      title: deal.title
    });
    
    // Get the full deal info including customer
    console.log('\n=== Getting full deal details ===');
    const dealDetailResponse = await fetch(`${API_BASE}/deals/${deal.id}`, {
      headers: {
        'x-bypass-auth': 'development-only-123'
      }
    });
    
    const dealDetail = await dealDetailResponse.json();
    console.log('Deal details:', dealDetail.data);
    
    // Create quotation with dealId
    console.log('\n=== Creating quotation with dealId ===');
    
    const quotationData = {
      dealId: deal.id,
      machineType: 'mobile_crane',
      orderType: 'monthly',
      numberOfDays: 30,
      workingHours: 8,
      foodResources: 2,
      accomResources: 2,
      siteDistance: 15,
      usage: 'normal',
      riskFactor: 'medium',
      shift: 'single',
      dayNight: 'day',
      mobDemob: 2000,
      mobRelaxation: 15,
      extraCharge: 1500,
      otherFactorsCharge: 500,
      billing: 'gst',
      includeGst: true,
      sundayWorking: 'yes',
      totalRent: 125000,
      workingCost: 50000,
      mobDemobCost: 2500,
      foodAccomCost: 2000,
      usageLoadFactor: 2500,
      riskAdjustment: 3000,
      gstAmount: 18750,
      version: 1,
      createdBy: 'usr_admin',
      status: 'draft',
      incidentalCharges: ['fuel', 'maintenance'],
      otherFactors: ['crane_operator', 'rigger']
    };
    
    const quotationResponse = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      },
      body: JSON.stringify(quotationData)
    });
    
    const quotationResult = await quotationResponse.json();
    
    if (quotationResponse.ok) {
      console.log('✅ Quotation created successfully!');
      console.log('Quotation ID:', quotationResult.data?.id);
      
      // Now get the created quotation to verify customer info was populated
      if (quotationResult.data?.id) {
        console.log('\n=== Verifying created quotation ===');
        
        const quotationDetailResponse = await fetch(`${API_BASE}/quotations/${quotationResult.data.id}`, {
          headers: {
            'x-bypass-auth': 'development-only-123'
          }
        });
        
        const quotationDetailResult = await quotationDetailResponse.json();
        
        if (quotationDetailResponse.ok) {
          const quotation = quotationDetailResult.data;
          console.log('✅ Quotation verification successful:');
          console.log('- Deal ID:', quotation.dealId || quotation.deal_id);
          console.log('- Customer Name:', quotation.customerName || quotation.customer_name);
          console.log('- Customer ID:', quotation.customerId || quotation.customer_id);
          console.log('- Customer Contact:', quotation.customerContact || quotation.customer_contact);
          
          if (quotation.customerName || quotation.customer_name) {
            console.log('\n🎉 SUCCESS: Customer information was auto-populated from deal!');
          } else {
            console.log('\n⚠️  WARNING: Customer information may not have been auto-populated');
          }
        } else {
          console.error('❌ Failed to retrieve quotation:', quotationDetailResult);
        }
      }
    } else {
      console.error('❌ Quotation creation failed:', quotationResult);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
}

testAndVerifyQuotation();
