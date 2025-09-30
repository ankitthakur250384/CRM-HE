// Test file to validate Risk & Usage calculation logic
// This demonstrates the new calculation method: X% of Monthly Base Rate of Equipment

const testQuotationData = {
  selectedMachines: [
    {
      id: "1",
      name: "Telescopic Mobile Crane XCMG QY 130K",
      quantity: 1,
      baseRates: {
        micro: 7000,
        small: 8500,
        monthly: 9792.96, // Monthly rate per day
        yearly: 11000
      }
    },
    {
      id: "2", 
      name: "Tower Crane",
      quantity: 2,
      baseRates: {
        micro: 5000,
        small: 6000,
        monthly: 7500, // Monthly rate per day
        yearly: 8500
      }
    }
  ],
  riskUsagePercentage: 5.0 // 5% from database config
};

function calculateRiskUsage(data) {
  // Calculate total monthly base rate for all selected equipment
  const totalMonthlyBaseRate = data.selectedMachines.reduce((total, machine) => {
    const monthlyRate = machine.baseRates?.monthly || 0;
    return total + (monthlyRate * machine.quantity);
  }, 0);

  // Calculate Risk & Usage as X% of Monthly Base Rate
  const riskUsageTotal = totalMonthlyBaseRate * (data.riskUsagePercentage / 100);

  return {
    totalMonthlyBaseRate,
    riskUsagePercentage: data.riskUsagePercentage,
    riskUsageTotal,
    breakdown: data.selectedMachines.map(m => ({
      name: m.name,
      quantity: m.quantity,
      monthlyRate: m.baseRates?.monthly || 0,
      subtotal: (m.baseRates?.monthly || 0) * m.quantity
    }))
  };
}

// Test the calculation
const result = calculateRiskUsage(testQuotationData);

console.log("=== Risk & Usage Calculation Test ===");
console.log("Equipment Breakdown:");
result.breakdown.forEach(item => {
  console.log(`  ${item.name}: ${item.quantity} × ₹${item.monthlyRate} = ₹${item.subtotal}`);
});

console.log(`\nTotal Monthly Base Rate: ₹${result.totalMonthlyBaseRate}`);
console.log(`Risk & Usage Percentage: ${result.riskUsagePercentage}%`);
console.log(`Risk & Usage Total: ₹${result.riskUsageTotal}`);

console.log("\n=== Expected Result ===");
console.log("Equipment 1: 1 × ₹9,792.96 = ₹9,792.96");
console.log("Equipment 2: 2 × ₹7,500 = ₹15,000");  
console.log("Total Monthly Base Rate: ₹24,792.96");
console.log("Risk & Usage (5%): ₹1,239.65");

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { calculateRiskUsage, testQuotationData };
}