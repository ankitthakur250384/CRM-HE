import templateRepository from './postgres/templateRepository.js';

/**
 * Get all quotation templates
 */
export const getTemplates = async () => {
  try {
    return await templateRepository.getTemplates();
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

/**
 * Get a template by ID
 */
export const getTemplate = async (id) => {
  try {
    return await templateRepository.getTemplateById(id);
  } catch (error) {
    console.error(`Error fetching template ${id}:`, error);
    return null;
  }
};

/**
 * Create a new template
 */
export const createTemplate = async (templateData) => {
  try {
    return await templateRepository.createTemplate(templateData);
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

/**
 * Update an existing template
 */
export const updateTemplate = async (id, templateData) => {
  try {
    return await templateRepository.updateTemplate(id, templateData);
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id) => {
  try {
    await templateRepository.deleteTemplate(id);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    throw error;
  }
};
