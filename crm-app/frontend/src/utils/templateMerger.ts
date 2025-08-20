import { renderProfessionalTemplate } from './professionalTemplateRenderer';
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';

// Re-export types for compatibility
export type { Quotation, Template };

/**
 * Main function to merge quotation data with template
 * Uses the new comprehensive template renderer
 */
export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string {
  console.log('🔄 Template Merger: Starting merge process');
  console.log('📋 Quotation ID:', quotation?.id);
  console.log('📄 Template ID:', template?.id, 'Name:', template?.name);

  try {
    // Validate inputs
    if (!quotation) {
      console.error('❌ No quotation data provided');
      return '<div style="padding: 20px; color: red;">No quotation data available</div>';
    }

    if (!template) {
      console.error('❌ No template data provided');
      return '<div style="padding: 20px; color: red;">No template available</div>';
    }

    // For now, always use the professional template renderer
    // This ensures consistent, high-quality output regardless of template type
    console.log('🎨 Using professional template renderer');
    const result = renderProfessionalTemplate(quotation, template);
    
    console.log('✅ Template merge successful, content length:', result.length);
    return result;

  } catch (error) {
    console.error('❌ Template merger error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return `<div style="padding: 20px; color: red;">
      <h3>Template Rendering Error</h3>
      <p>Failed to generate template: ${errorMessage}</p>
      <p>Please try refreshing the page or contact support.</p>
    </div>`;
  }
}

// Export as default as well for compatibility
export default { mergeQuotationWithTemplate };
