/**
 * Update configuration values to fix calculation logic
 * This script updates the additionalParams configuration through the API
 */

const baseURL = 'http://localhost:5000'; // Update if different

const updatedConfig = {
  riggerAmount: 40000,
  helperAmount: 12000,
  incidentalOptions: [
    {"value": "incident1", "label": "Incident 1 - ₹5,000", "amount": 5000},
    {"value": "incident2", "label": "Incident 2 - ₹10,000", "amount": 10000},
    {"value": "incident3", "label": "Incident 3 - ₹15,000", "amount": 15000}
  ],
  usageFactors: {
    normal: 0,
    medium: 20,
    heavy: 50
  },
  riskFactors: {
    low: 0,
    medium: 10,
    high: 20
  },
  shiftFactors: {
    single: 0,
    double: 80
  },
  dayNightFactors: {
    day: 0,
    night: 30
  }
};

async function updateConfig() {
  try {
    console.log('🔧 Updating configuration...');
    
    const response = await fetch(`${baseURL}/api/config/additionalParams`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      },
      body: JSON.stringify(updatedConfig)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Configuration updated successfully:', result);
    
    // Verify the update
    const verifyResponse = await fetch(`${baseURL}/api/config/additionalParams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-auth': 'development-only-123'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      console.log('🔍 Configuration verification:', verifyResult.data);
      
      // Check if riskFactors.low is now 0
      if (verifyResult.data?.riskFactors?.low === 0) {
        console.log('🎉 SUCCESS: Low risk factor is now 0% (was 5%)');
        console.log('🎉 SUCCESS: Configuration fix applied successfully!');
      } else {
        console.log('⚠️  WARNING: Low risk factor may not have updated correctly');
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
  }
}

// Run the update
updateConfig();