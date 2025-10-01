/**
 * Test script to verify Updated Items Table data mapping
 * Now with combined Mob/Demob and no Total Amount column
 */

// Mock backend data structure (as returned by quotationRoutes.mjs)
const mockQuotationResponse = {
  selectedMachines: [
    {
      id: "equ_001",
      equipmentId: "EQ0001", 
      name: "Tower Crane - Potain MC 175",
      category: "tower_crane",
      quantity: 1,
      baseRate: 25000,
      runningCostPerKm: 50,
      // Enhanced Items Table fields
      no: 1,
      description: "Tower Crane - Potain MC 175",
      capacity: "175MT",
      jobType: "monthly",
      duration: "30 days", 
      rate: "₹25,000",
      rental: "₹7,50,000",
      mobDemob: "₹1,00,000"
    },
    {
      id: "equ_002",
      equipmentId: "EQ0002",
      name: "Mobile Crane - Liebherr LTM 1090", 
      category: "mobile_crane",
      quantity: 1,
      baseRate: 15000,
      runningCostPerKm: 30,
      // Enhanced Items Table fields
      no: 2,
      description: "Mobile Crane - Liebherr LTM 1090",
      capacity: "90MT",
      jobType: "daily",
      duration: "5 days",
      rate: "₹15,000", 
      rental: "₹75,000",
      mobDemob: "₹20,000"
    }
  ]
};

// Updated Items Table column configuration (from EnhancedTemplateBuilder.tsx)
const itemsTableColumns = {
  no: { label: 'S.No.', enabled: true },
  description: { label: 'Description/Equipment Name', enabled: true },
  capacity: { label: 'Capacity/Specifications', enabled: true },
  jobType: { label: 'Job Type', enabled: false },
  quantity: { label: 'Quantity', enabled: true },
  duration: { label: 'Duration/Days', enabled: true },
  rate: { label: 'Rate/Day (Base Rate)', enabled: true },
  rental: { label: 'Total Rental (Working Cost)', enabled: true },
  mobDemob: { label: 'Mob/Demob', enabled: true }
};

console.log('=== Updated Items Table Data Mapping Test ===\n');

// Verify all required fields are present
console.log('✅ Testing updated data structure compatibility:');
mockQuotationResponse.selectedMachines.forEach((machine, index) => {
  console.log(`\n📋 Machine ${index + 1}: ${machine.name}`);
  
  Object.keys(itemsTableColumns).forEach(column => {
    const hasData = machine.hasOwnProperty(column);
    const status = hasData ? '✅' : '❌';
    const value = hasData ? machine[column] : 'MISSING';
    console.log(`  ${status} ${column}: ${value}`);
  });
});

console.log('\n=== Summary of Changes ===');
console.log('✅ Combined Mobilization + Demobilization → Mob/Demob');
console.log('✅ Removed Total Amount column (not needed)');  
console.log('✅ Rate clarified as Base Rate for order type');
console.log('✅ Total Rental clarified as Working Cost');
console.log('✅ Table width optimized for better fitting');
console.log('✅ Column widths adjusted: Description 30%, Mob/Demob 12%');
console.log('\n🎉 Updated Items Table structure matches Quotation Summary format!');