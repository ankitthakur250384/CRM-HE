// Basic template merger utility for quotations
// This is a minimal implementation. You can expand it as needed.
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string {
  if (!quotation || !template) return '';
  
  // Handle modern templates (with elements) vs legacy templates (with content)
  let content = '';
  
  if (template.elements && Array.isArray(template.elements)) {
    // Modern template - render elements to HTML
    content = renderModernTemplate(template.elements, quotation);
  } else if (template.content) {
    // Legacy template - use content field
    content = template.content;
    // Replace placeholders with actual values
    content = content.replace(/\{\{customer_name\}\}/g, quotation.customerContact?.name || quotation.customerName || '');
    content = content.replace(/\{\{equipment_name\}\}/g, quotation.selectedEquipment?.name || '');
    content = content.replace(/\{\{project_duration\}\}/g, `${quotation.numberOfDays} days`);
    content = content.replace(/\{\{total_amount\}\}/g, quotation.totalRent?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '');
    // Add more replacements as needed
  } else {
    content = '<div style="padding: 20px;">Template content not available</div>';
  }
  
  return content;
}

// Function to render modern template elements to HTML
function renderModernTemplate(elements: any[], quotation: Quotation): string {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>ASP Cranes Quotation</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
                color: #333;
                line-height: 1.4;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 30px; 
                padding-bottom: 20px; 
                border-bottom: 3px solid #2563eb;
            }
            .logo-section { 
                display: flex; 
                align-items: center; 
                gap: 15px;
            }
            .logo { 
                width: 80px; 
                height: 80px; 
                background: #2563eb; 
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
            }
            .company-info h1 { 
                margin: 0; 
                color: #2563eb; 
                font-size: 28px; 
                font-weight: bold;
            }
            .company-info p { 
                margin: 5px 0; 
                color: #666; 
                font-size: 14px;
            }
            .quotation-info { 
                text-align: right; 
                color: #333;
            }
            .quotation-info h2 { 
                margin: 0; 
                color: #2563eb; 
                font-size: 24px;
            }
            .content-section { 
                margin: 30px 0;
            }
            .equipment-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .equipment-table th { 
                background: #2563eb; 
                color: white; 
                padding: 12px; 
                text-align: left; 
                font-weight: bold;
                font-size: 14px;
                border: 1px solid #2563eb;
            }
            .equipment-table td { 
                padding: 12px; 
                border: 1px solid #e5e7eb; 
                color: #374151;
            }
            .equipment-table tr:nth-child(even) { 
                background: #f9fafb;
            }
            .terms-section { 
                margin: 30px 0; 
                padding: 20px; 
                background: #fefefe; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px;
                white-space: pre-line;
                font-size: 12px;
                line-height: 1.5;
            }
            @media print {
                body { margin: 0; padding: 15px; }
            }
        </style>
    </head>
    <body>`;
  
  elements.forEach(element => {
    switch (element.type) {
      case 'header':
        html += `
        <div class="header">
            <div class="logo-section">
                <div class="logo">ASP</div>
                <div class="company-info">
                    <h1>${element.content || 'ASP CRANES'}</h1>
                    <p>Crane Rental & Equipment Solutions</p>
                    <p>📧 contact@aspcranes.com | 📞 +91-7898168580</p>
                </div>
            </div>
            <div class="quotation-info">
                <h2>QUOTATION</h2>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p><strong>Quote #:</strong> QT-${Date.now().toString().slice(-6)}</p>
            </div>
        </div>`;
        break;
        
      case 'text':
        // Handle customer information and other text content
        let textContent = element.content || '';
        
        // Replace placeholders with actual quotation data
        textContent = textContent.replace(/\{\{customer_name\}\}/g, quotation.customerContact?.name || quotation.customerName || 'Customer Name');
        textContent = textContent.replace(/\{\{customer_phone\}\}/g, quotation.customerContact?.phone || 'Phone Number');
        textContent = textContent.replace(/\{\{project_location\}\}/g, 'Project Location');
        
        html += `<div class="content-section" style="white-space: pre-line; line-height: 1.6;">${textContent}</div>`;
        break;
        
      case 'table':
        if (element.config && element.config.columns && element.config.rows) {
          html += `<table class="equipment-table">`;
          
          // Header
          if (element.config.showHeader) {
            html += '<thead><tr>';
            element.config.columns.forEach((col: string) => {
              html += `<th>${col}</th>`;
            });
            html += '</tr></thead>';
          }
          
          // Body
          html += '<tbody>';
          element.config.rows.forEach((row: string[], index: number) => {
            if (index === 0) return; // Skip the first template row
            
            html += '<tr>';
            row.forEach((cell: string, cellIndex: number) => {
              let cellContent = cell;
              
              // Replace placeholders based on cell position
              if (cellIndex === 1) { // Equipment description
                cellContent = quotation.selectedEquipment?.name || 'Mobile Crane with Operator';
              } else if (cellIndex === 2) { // Capacity
                cellContent = `${quotation.selectedEquipment?.name || '100MT'} Hydraulic`;
              } else if (cellIndex === 3) { // Duration
                cellContent = `${quotation.numberOfDays} ${quotation.numberOfDays === 1 ? 'Day' : 'Days'}`;
              } else if (cellIndex === 4) { // Rate
                cellContent = `₹${quotation.totalRent?.toLocaleString('en-IN') || '0'}`;
              } else if (cellIndex === 5) { // Amount
                cellContent = `₹${quotation.totalRent?.toLocaleString('en-IN') || '0'}`;
              }
              
              html += `<td>${cellContent}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
        }
        break;
        
      case 'terms':
        html += `<div class="terms-section">`;
        if (element.content) {
          html += element.content;
        }
        html += `</div>`;
        break;
        
      default:
        if (element.content) {
          html += `<div class="content-section">${element.content}</div>`;
        }
    }
  });
  
  html += `
    </body>
    </html>`;
    
  return html;
}

// Export as default as well for compatibility
export default { mergeQuotationWithTemplate };
