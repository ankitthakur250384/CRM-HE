/**
 * Test Quotation Creation from Deal
 * Tests creating a quotation with dealId to verify auto-population works
 */

const API_BASE = 'http://localhost:3001/api';

async function testQuotationFromDeal() {
  console.log('🚀 Testing Quotation Creation from Deal\n');
  
  // First, let's get a deal ID to test with
  console.log('=== Getting available deals ===');
  try {
    const dealsResponse = await fetch(`${API_BASE}/deals`, {
      headers: {
        'x-bypass-auth': 'development-only-123'
      }
    });
    
    const dealsResult = await dealsResponse.json();
    
    if (dealsResult.success && dealsResult.data.length > 0) {
      const deal = dealsResult.data[0];
      console.log('✅ Found deal:', {
        id: deal.id,
        title: deal.title,
        customerName: deal.customer_name || deal.customerName
      });
      
      // Now test quotation creation with dealId
      console.log('\n=== Creating quotation with dealId ===');
      
      const quotationData = {
        dealId: deal.id,  // This should auto-populate customer info
        machineType: 'mobile_crane',
        orderType: 'monthly',
        numberOfDays: 27,
        workingHours: 8,
        foodResources: 1,
        accomResources: 1,
        siteDistance: 10,
        usage: 'normal',
        riskFactor: 'low',
        shift: 'single',
        dayNight: 'day',
        mobDemob: 1000,
        mobRelaxation: 10,
        extraCharge: 1000,
        otherFactorsCharge: 0,
        billing: 'gst',
        includeGst: true,
        sundayWorking: 'no',
        baseRate: 45000,
        totalRent: 115969.22,
        workingCost: 45000,
        mobDemobCost: 1279,
        foodAccomCost: 1500,
        usageLoadFactor: 2250,
        riskAdjustment: 2250,
        gstAmount: 17690.22,
        version: 1,
        createdBy: 'usr_admin',
        status: 'draft',
        incidentalCharges: ['incident1'],
        otherFactors: ['rigger']
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
        console.log('✅ Quotation created successfully:', {
          id: quotationResult.data?.id,
          message: quotationResult.message
        });
      } else {
        console.error('❌ Quotation creation failed:', quotationResult);
      }
      
    } else {
      console.log('❌ No deals found to test with');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
}

testQuotationFromDeal();
