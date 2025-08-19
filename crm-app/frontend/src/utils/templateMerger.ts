// Basic template merger utility for quotations
// This is a minimal implementation. You can expand it as needed.
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string {
  if (!quotation || !template) return '';
  
  // Handle modern templates (with elements) vs legacy templates (with content)
  let content = '';
  
  if (template.elements && Array.isArray(template.elements)) {
    // Modern template - generate HTML from elements
    // For now, return a simple HTML structure since this requires a full renderer
    // TODO: Implement proper modern template rendering
    content = '<div style="padding: 20px;"><h2>Modern Template Preview</h2><p>Template: ' + template.name + '</p><p>Customer: ' + (quotation.customerContact?.name || quotation.customerName || '') + '</p><p>Equipment: ' + (quotation.selectedEquipment?.name || '') + '</p><p>Duration: ' + quotation.numberOfDays + ' days</p><p>Total: ' + (quotation.totalRent?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '') + '</p></div>';
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

// Export as default as well for compatibility
export default { mergeQuotationWithTemplate };
