/**
 * Professional Template Renderer for ASP Cranes
 * Handles Template Builder elements and legacy templates
 */

import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

export interface QuotationCalculations {
  workingCost: number;
  foodAccomCost: number;
  transportCost: number;
  mobDemobCost: number;
  riskAdjustment: number;
  usageLoadFactor: number;
  extraCharges: number;
  incidentalCost: number;
  otherFactorsCost: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
}

export function calculateQuotationTotals(quotation: Quotation): QuotationCalculations {
  console.log('💰 Calculating quotation totals:', quotation.id);
  
  const workingCost = quotation.workingCost || (quotation.totalRent || 0);
  const foodRate = 2500;
  const accomRate = 4000;
  const foodAccomCost = ((quotation.foodResources || 0) * foodRate + 
                        (quotation.accomResources || 0) * accomRate) * 
                        (quotation.numberOfDays || 1);
  
  const transportCost = (quotation.siteDistance || 0) * (quotation.runningCostPerKm || 100);
  const mobDemobCost = quotation.mobDemob || 0;
  
  let riskAdjustment = 0;
  if (quotation.riskFactor === 'high') riskAdjustment = 15000;
  else if (quotation.riskFactor === 'medium') riskAdjustment = 8000;
  
  let usageLoadFactor = 0;
  if (quotation.usage === 'heavy') usageLoadFactor = Math.round(workingCost * 0.5);
  
  const extraCharges = quotation.extraCharge || 0;
  
  const incidentalRates = { incident1: 5000, incident2: 10000, incident3: 15000 };
  const incidentalCost = (quotation.incidentalCharges || [])
    .reduce((sum, inc) => sum + (incidentalRates[inc as keyof typeof incidentalRates] || 0), 0);
  
  let otherFactorsCost = 0;
  if (quotation.otherFactors?.includes('rigger')) otherFactorsCost += 40000;
  if (quotation.otherFactors?.includes('helper')) otherFactorsCost += 12000;
  
  const subtotal = workingCost + foodAccomCost + transportCost + mobDemobCost + 
                  riskAdjustment + usageLoadFactor + extraCharges + 
                  incidentalCost + otherFactorsCost;
  
  const gstAmount = quotation.includeGst ? Math.round(subtotal * 0.18) : 0;
  const totalAmount = subtotal + gstAmount;
  
  return {
    workingCost, foodAccomCost, transportCost, mobDemobCost,
    riskAdjustment, usageLoadFactor, extraCharges,
    incidentalCost, otherFactorsCost, subtotal, gstAmount, totalAmount
  };
}

export function renderProfessionalTemplate(quotation: Quotation, template?: Template): string {
  console.log('🎨 Rendering professional template for quotation:', quotation.id);
  
  const calculations = calculateQuotationTotals(quotation);
  const quoteNumber = `ASP-${new Date().getFullYear()}-${quotation.id.slice(-6).toUpperCase()}`;
  const quoteDate = new Date().toLocaleDateString('en-IN');
  const validUntil = new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN');

  // Check if we have Template Builder elements
  if (template?.elements && template.elements.length > 0) {
    console.log('🏗️ Using Template Builder elements:', template.elements.length);
    return renderTemplateBuilderTemplate(quotation, template, calculations, quoteNumber, quoteDate, validUntil);
  }

  // Check if we have legacy template content
  if (template?.content) {
    console.log('📰 Using legacy template content');
    return renderLegacyTemplate(quotation, template, calculations);
  }

  // Default professional template
  console.log('🎯 Using default professional template');
  return renderDefaultTemplate(quotation, calculations, quoteNumber, quoteDate, validUntil);
}

function renderTemplateBuilderTemplate(
  quotation: Quotation, 
  template: Template, 
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  let html = getBaseStyles() + '<div class="quotation-container">';

  // Process each element from Template Builder
  template.elements?.forEach((element) => {
    html += processTemplateElement(element, quotation, calculations, quoteNumber, quoteDate, validUntil);
  });

  // Add cost summary if not included
  if (!template.elements?.some(e => e.type === 'total' || e.type === 'cost_summary')) {
    html += `<div class="cost-summary">
      <h3>💰 Cost Summary</h3>
      ${generateCostBreakdown(calculations, quotation)}
    </div>`;
  }

  html += '</div>';
  return html;
}

function processTemplateElement(
  element: any, 
  quotation: Quotation, 
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  switch (element.type) {
    case 'header':
      return `<div class="template-header">
        <div class="company-section">
          <div class="company-logo">ASP</div>
          <div class="company-details">
            <h1>${element.content || 'ASP CRANES'}</h1>
            <div class="tagline">Professional Crane Rental & Equipment Solutions</div>
            <div class="contact-info">📧 contact@aspcranes.com<br>📞 +91-7898168580</div>
          </div>
        </div>
        <div class="quote-info">
          <h2>QUOTATION</h2>
          <div><strong>Quote No:</strong> ${quoteNumber}</div>
          <div><strong>Date:</strong> ${quoteDate}</div>
          <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
      </div>`;
      
    case 'customer':
    case 'customer_details':
      return `<div class="customer-section">
        <h3>📋 Bill To</h3>
        <div><strong>${quotation.customerContact?.company || quotation.customerName || 'Valued Customer'}</strong></div>
        <div>Contact: ${quotation.customerContact?.name || 'N/A'}</div>
        <div>Address: ${quotation.customerContact?.address || 'Address not provided'}</div>
        <div>Phone: ${quotation.customerContact?.phone || 'N/A'}</div>
        <div>Email: ${quotation.customerContact?.email || 'N/A'}</div>
      </div>`;
      
    case 'table':
    case 'equipment_table':
      return `<div class="equipment-section">
        <h3>🏗️ Equipment & Services</h3>
        ${generateEquipmentTable(quotation)}
      </div>`;
      
    case 'total':
    case 'cost_summary':
      return `<div class="cost-summary">
        <h3>💰 Cost Summary</h3>
        ${generateCostBreakdown(calculations, quotation)}
      </div>`;
      
    case 'terms':
    case 'terms_conditions':
      return `<div class="terms-section">
        <h3>⚖️ Terms & Conditions</h3>
        <div class="terms-content">${element.content || getDefaultTerms()}</div>
      </div>`;
      
    case 'text':
    default:
      if (element.content) {
        return `<div class="text-content">${replaceTemplatePlaceholders(element.content, quotation, quoteNumber, quoteDate)}</div>`;
      }
      return '';
  }
}

function renderLegacyTemplate(quotation: Quotation, template: Template, _calculations: QuotationCalculations): string {
  let content = template.content || '';
  const quoteNumber = `ASP-${new Date().getFullYear()}-${quotation.id.slice(-6)}`;
  const quoteDate = new Date().toLocaleDateString('en-IN');
  
  content = replaceTemplatePlaceholders(content, quotation, quoteNumber, quoteDate);
  
  return `<style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .legacy-template { background: white; padding: 20px; }
  </style>
  <div class="legacy-template">${content}</div>`;
}

function renderDefaultTemplate(
  quotation: Quotation, 
  calculations: QuotationCalculations,
  quoteNumber: string,
  quoteDate: string,
  validUntil: string
): string {
  return getBaseStyles() + `
    <div class="quotation-container">
      <div class="template-header">
        <div class="company-section">
          <div class="company-logo">ASP</div>
          <div class="company-details">
            <h1>ASP CRANES</h1>
            <div class="tagline">Professional Crane Rental & Equipment Solutions</div>
            <div class="contact-info">📧 contact@aspcranes.com<br>📞 +91-7898168580</div>
          </div>
        </div>
        <div class="quote-info">
          <h2>QUOTATION</h2>
          <div><strong>Quote No:</strong> ${quoteNumber}</div>
          <div><strong>Date:</strong> ${quoteDate}</div>
          <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
      </div>
      
      <div class="customer-section">
        <h3>📋 Bill To</h3>
        <div><strong>${quotation.customerContact?.company || quotation.customerName || 'Valued Customer'}</strong></div>
        <div>Contact: ${quotation.customerContact?.name || 'N/A'}</div>
        <div>Address: ${quotation.customerContact?.address || 'Address not provided'}</div>
        <div>Phone: ${quotation.customerContact?.phone || 'N/A'}</div>
        <div>Email: ${quotation.customerContact?.email || 'N/A'}</div>
      </div>
      
      <div class="equipment-section">
        <h3>🏗️ Equipment & Services</h3>
        ${generateEquipmentTable(quotation)}
      </div>
      
      <div class="cost-summary">
        <h3>💰 Cost Summary</h3>
        ${generateCostBreakdown(calculations, quotation)}
      </div>
      
      <div class="terms-section">
        <h3>⚖️ Terms & Conditions</h3>
        <div class="terms-content">${getDefaultTerms()}</div>
      </div>
    </div>
  `;
}

function getBaseStyles(): string {
  return `<style>
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0; 
      padding: 0; 
      background: white;
      color: #1f2937;
      line-height: 1.5;
      font-size: 14px;
    }
    
    .quotation-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      min-height: 297mm;
    }
    
    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    .company-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    
    .company-details h1 {
      margin: 0 0 5px 0;
      color: #2563eb;
      font-size: 32px;
      font-weight: 700;
    }
    
    .company-details .tagline {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .company-details .contact-info {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
    }
    
    .quote-info {
      text-align: right;
      color: #374151;
      font-size: 13px;
    }
    
    .quote-info h2 {
      margin: 0 0 10px 0;
      color: #2563eb;
      font-size: 28px;
      font-weight: 600;
    }
    
    .customer-section, .equipment-section, .cost-summary, .terms-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #2563eb;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    
    .customer-section h3, .equipment-section h3, .cost-summary h3, .terms-section h3 {
      color: #2563eb;
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .equipment-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .equipment-table th {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    
    .equipment-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      font-size: 13px;
    }
    
    .equipment-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .amount-cell {
      text-align: right;
      font-weight: 600;
      color: #1f2937;
    }
    
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .cost-row.total {
      background: #eff6ff;
      padding: 12px;
      margin: 15px -20px -20px -20px;
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
      border-top: 3px solid #2563eb;
    }
    
    .terms-section {
      background: #fffbeb;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f59e0b;
    }
    
    .terms-section h3 {
      color: #92400e;
    }
    
    .terms-content {
      font-size: 12px;
      line-height: 1.6;
      color: #78350f;
      white-space: pre-line;
    }
    
    .text-content {
      margin: 15px 0;
      line-height: 1.6;
    }
    
    @media print {
      body { 
        margin: 0; 
        padding: 0; 
        font-size: 12px;
      }
      
      .quotation-container {
        padding: 15mm;
      }
      
      .equipment-table {
        box-shadow: none;
      }
    }
  </style>`;
}

function generateEquipmentTable(quotation: Quotation): string {
  const machines = quotation.selectedMachines || [];
  
  if (machines.length === 0 && quotation.selectedEquipment) {
    machines.push({
      id: quotation.selectedEquipment.id,
      machineType: quotation.machineType || 'mobile_crane',
      equipmentId: quotation.selectedEquipment.equipmentId,
      name: quotation.selectedEquipment.name,
      baseRates: quotation.selectedEquipment.baseRates,
      baseRate: quotation.workingCost || quotation.totalRent || 0,
      runningCostPerKm: quotation.runningCostPerKm || 100,
      quantity: 1
    });
  }

  let tableRows = '';
  machines.forEach((machine, index) => {
    const dailyRate = machine.baseRate || 0;
    const totalDays = quotation.numberOfDays || 1;
    const quantity = machine.quantity || 1;
    const lineTotal = dailyRate * totalDays * quantity;
    
    tableRows += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${machine.name}</strong></td>
        <td>Professional Hydraulic Mobile Crane</td>
        <td>${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}</td>
        <td style="text-align: center;">${quantity}</td>
        <td class="amount-cell">₹${dailyRate.toLocaleString('en-IN')}</td>
        <td class="amount-cell">₹${lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  });

  return `
    <table class="equipment-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Equipment</th>
          <th>Description</th>
          <th>Duration</th>
          <th>Qty</th>
          <th>Rate/Day</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function generateCostBreakdown(calculations: QuotationCalculations, quotation: Quotation): string {
  let html = `
    <div class="cost-row">
      <span>Equipment Rental (${quotation.numberOfDays} days)</span>
      <span>₹${calculations.workingCost.toLocaleString('en-IN')}</span>
    </div>
  `;
  
  if (calculations.foodAccomCost > 0) {
    html += `<div class="cost-row">
      <span>Food & Accommodation</span>
      <span>₹${calculations.foodAccomCost.toLocaleString('en-IN')}</span>
    </div>`;
  }
  
  if (calculations.transportCost > 0) {
    html += `<div class="cost-row">
      <span>Transportation</span>
      <span>₹${calculations.transportCost.toLocaleString('en-IN')}</span>
    </div>`;
  }
  
  if (calculations.mobDemobCost > 0) {
    html += `<div class="cost-row">
      <span>Mobilization & Demobilization</span>
      <span>₹${calculations.mobDemobCost.toLocaleString('en-IN')}</span>
    </div>`;
  }
  
  if (calculations.extraCharges > 0) {
    html += `<div class="cost-row">
      <span>Additional Charges</span>
      <span>₹${calculations.extraCharges.toLocaleString('en-IN')}</span>
    </div>`;
  }
  
  html += `
    <div class="cost-row" style="font-weight: 600; border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px;">
      <span>Subtotal</span>
      <span>₹${calculations.subtotal.toLocaleString('en-IN')}</span>
    </div>
  `;
  
  if (calculations.gstAmount > 0) {
    html += `<div class="cost-row">
      <span>GST @ 18%</span>
      <span>₹${calculations.gstAmount.toLocaleString('en-IN')}</span>
    </div>`;
  }
  
  html += `
    <div class="cost-row total">
      <span>Total Amount</span>
      <span>₹${calculations.totalAmount.toLocaleString('en-IN')}</span>
    </div>
  `;
  
  return html;
}

function replaceTemplatePlaceholders(content: string, quotation: Quotation, quoteNumber: string, quoteDate: string): string {
  return content
    .replace(/\{\{customer_name\}\}/g, quotation.customerContact?.name || quotation.customerName || 'Valued Customer')
    .replace(/\{\{customer_company\}\}/g, quotation.customerContact?.company || 'Customer Company')
    .replace(/\{\{customer_phone\}\}/g, quotation.customerContact?.phone || 'N/A')
    .replace(/\{\{customer_email\}\}/g, quotation.customerContact?.email || 'N/A')
    .replace(/\{\{equipment_name\}\}/g, quotation.selectedEquipment?.name || 'Equipment')
    .replace(/\{\{total_amount\}\}/g, `₹${quotation.totalRent?.toLocaleString('en-IN') || '0'}`)
    .replace(/\{\{project_duration\}\}/g, `${quotation.numberOfDays} ${quotation.numberOfDays === 1 ? 'Day' : 'Days'}`)
    .replace(/\{\{quote_date\}\}/g, quoteDate)
    .replace(/\{\{quote_number\}\}/g, quoteNumber);
}

function getDefaultTerms(): string {
  return `1. Payment Terms: 30 days from invoice date
2. All rates are inclusive of operator charges  
3. Fuel, maintenance, and insurance included
4. Site access and working conditions to be provided by client
5. Any additional work beyond scope will be charged separately
6. Cancellation charges may apply as per terms
7. Equipment to be used strictly as per manufacturer guidelines
8. Client responsible for site safety and security
9. Force majeure conditions will be considered for delays
10. All disputes subject to local jurisdiction`;
}
