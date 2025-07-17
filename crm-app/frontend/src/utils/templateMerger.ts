// Basic template merger utility for quotations
// This is a minimal implementation. You can expand it as needed.
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string {
  if (!quotation || !template) return '';
  let content = template.content;
  // Replace placeholders with actual values
  content = content.replace(/\{\{customer_name\}\}/g, quotation.customerContact?.name || quotation.customerName || '');
  content = content.replace(/\{\{equipment_name\}\}/g, quotation.selectedEquipment?.name || '');
  content = content.replace(/\{\{project_duration\}\}/g, `${quotation.numberOfDays} days`);
  content = content.replace(/\{\{total_amount\}\}/g, quotation.totalRent?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '');
  // Add more replacements as needed
  return content;
}

// Export as default as well for compatibility
export default { mergeQuotationWithTemplate };
