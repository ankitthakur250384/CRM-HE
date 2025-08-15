import { getHeaders } from './apiHeaders';
// Alias for getTemplateById for compatibility with imports expecting getTemplate
export const getTemplate = getTemplateById;
// API client object for template-related functions
export const templateApiClient = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
// Create a new template via backend API
export async function createTemplate(template: Partial<Template>): Promise<Template> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to create template');
  }
  const result = await response.json();
  return result.data || result;
}

// Update an existing template via backend API
export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/${templateId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update template');
  }
  const result = await response.json();
  return result.data || result;
}

// Delete a template by ID via backend API
export async function deleteTemplate(templateId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/${templateId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete template');
  }
}

// Fetch a single template by ID from backend API
export async function getTemplateById(templateId: string): Promise<Template> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/${templateId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch template by ID');
  }
  const result = await response.json();
  // Support both direct object and {data: object} responses
  return result.data || result;
}
// Fetch all templates from backend API
export async function getTemplates(): Promise<Template[]> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    console.log('Fetching templates from:', `${apiUrl}/templates`);
    
    const response = await fetch(`${apiUrl}/templates`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    
    console.log('Template fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch templates:', response.status, response.statusText);
      throw new Error(`Failed to fetch templates: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Template fetch result:', result);
    
    // Support both array and {data: array} responses
    const templates = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];
    
    console.log('Processed templates:', templates);
    return templates;
  } catch (error) {
    console.error('Error in getTemplates:', error);
    throw error;
  }
}
export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string; // Template content with {{placeholders}}
  styles?: string | object;
  elements?: any[]; // Drag-and-drop template elements
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  createdBy?: string;
  isDefault: boolean;
}