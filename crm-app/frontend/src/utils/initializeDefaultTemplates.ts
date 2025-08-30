/**
 * Create Default Responsive Template
 * Script to add the responsive professional template as a default template
 */

import { responsiveQuotationTemplate, responsiveQuotationTemplateMetadata } from '../templates/responsiveQuotationTemplate';
import { createModernTemplate } from '../services/modernTemplateService';

export async function createDefaultResponsiveTemplate() {
  try {
    const templateData = {
      name: responsiveQuotationTemplateMetadata.name,
      description: responsiveQuotationTemplateMetadata.description,
      elements: responsiveQuotationTemplate,
      styles: responsiveQuotationTemplateMetadata.styles,
      layout: responsiveQuotationTemplateMetadata.layout,
      tags: responsiveQuotationTemplateMetadata.tags,
      category: responsiveQuotationTemplateMetadata.category,
      thumbnail: responsiveQuotationTemplateMetadata.thumbnail || undefined,
      createdBy: 'System'
    };

    const createdTemplate = await createModernTemplate(templateData);
    console.log('✅ Default responsive template created:', createdTemplate);
    return createdTemplate;
  } catch (error) {
    console.error('❌ Error creating default responsive template:', error);
    throw error;
  }
}

// Function to be called when initializing the app or from admin panel
export async function initializeDefaultTemplates() {
  try {
    await createDefaultResponsiveTemplate();
    console.log('🎉 All default templates initialized successfully');
  } catch (error) {
    console.error('Failed to initialize default templates:', error);
  }
}
