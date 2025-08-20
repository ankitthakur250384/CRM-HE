import { renderProfessionalTemplate, calculateQuotationTotals } from './professionalTemplateRenderer';

// Test template rendering
const SAMPLE_QUOTATION = {
  id: 'test-123',
  leadId: 'test-lead',
  customerId: 'test-customer',
  customerName: 'Test Company',
  customerContact: {
    name: 'John Test',
    email: 'john@test.com',
    phone: '+91 12345 67890',
    company: 'Test Company Ltd.',
    address: '123 Test Street, Test City - 123456'
  },
  orderType: 'monthly',
  numberOfDays: 30,
  workingHours: 8,
  selectedMachines: [
    {
      id: 'test-machine',
      machineType: 'mobile_crane',
      name: '50T Mobile Crane',
      baseRate: 5000,
      quantity: 1
    }
  ],
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'medium',
  extraCharge: 5000,
  workingCost: 150000,
  includeGst: true,
  mobDemob: 25000,
  totalRent: 150000,
  status: 'draft',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'test'
};

const SAMPLE_TEMPLATE = {
  id: 'test-template',
  name: 'Test Template',
  elements: [
    { type: 'header', content: 'ASP CRANES' },
    { type: 'customer_details' },
    { type: 'equipment_table' },
    { type: 'cost_summary' }
  ]
};

console.log('Testing template rendering...');
const calculations = calculateQuotationTotals(SAMPLE_QUOTATION);
console.log('Calculations:', calculations);

const html = renderProfessionalTemplate(SAMPLE_QUOTATION, SAMPLE_TEMPLATE);
console.log('Generated HTML length:', html.length);
console.log('HTML preview:', html.substring(0, 300) + '...');

export { html, calculations };
