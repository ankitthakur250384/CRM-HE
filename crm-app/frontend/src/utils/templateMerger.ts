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
  let html = '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">';
  
  elements.forEach(element => {
    const styles = element.style || {};
    const styleStr = Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
    
    switch (element.type) {
      case 'header':
        html += `<div style="text-align: center; margin: 20px 0; padding: 20px; border-bottom: 2px solid #2563eb; ${styleStr}">`;
        html += `<h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">${element.content || 'ASP Cranes Quotation'}</h1>`;
        html += `</div>`;
        break;
        
      case 'text':
        html += `<div style="margin: 15px 0; ${styleStr}">`;
        const textContent = (element.content || '').replace(/\n/g, '<br>');
        html += textContent;
        html += `</div>`;
        break;
        
      case 'table':
        if (element.config && element.config.rows) {
          html += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; ${styleStr}">`;
          
          // Header
          if (element.config.showHeader && element.config.columns) {
            html += '<thead><tr style="background: #2563eb; color: white;">';
            element.config.columns.forEach((col: string) => {
              html += `<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">${col}</th>`;
            });
            html += '</tr></thead>';
          }
          
          // Body
          html += '<tbody>';
          element.config.rows.forEach((row: string[], index: number) => {
            const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
            html += `<tr style="background: ${bgColor};">`;
            row.forEach(cell => {
              // Replace template variables in table cells
              let cellContent = cell;
              cellContent = cellContent.replace(/\{\{item_name\}\}/g, quotation.selectedEquipment?.name || 'Equipment');
              cellContent = cellContent.replace(/\{\{item_capacity\}\}/g, quotation.selectedEquipment?.name || 'N/A');
              cellContent = cellContent.replace(/\{\{item_duration\}\}/g, `${quotation.numberOfDays} days`);
              cellContent = cellContent.replace(/\{\{item_rate\}\}/g, quotation.totalRent?.toLocaleString('en-IN') || '0');
              cellContent = cellContent.replace(/\{\{item_amount\}\}/g, quotation.totalRent?.toLocaleString('en-IN') || '0');
              
              html += `<td style="padding: 12px; border: 1px solid #ddd;">${cellContent}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
        }
        break;
        
      case 'terms':
        html += `<div style="margin: 30px 0; padding: 20px; background: #fefefe; border: 1px solid #e5e7eb; border-radius: 8px; ${styleStr}">`;
        html += `<h3 style="color: #2563eb; margin: 0 0 15px 0;">Terms & Conditions</h3>`;
        if (element.content) {
          const termsContent = element.content.replace(/\n/g, '<br>');
          html += `<div style="white-space: pre-line;">${termsContent}</div>`;
        }
        html += `</div>`;
        break;
        
      default:
        html += `<div style="margin: 10px 0; ${styleStr}">${element.content || ''}</div>`;
    }
  });
  
  html += '</div>';
  return html;
}

// Export as default as well for compatibility
export default { mergeQuotationWithTemplate };
