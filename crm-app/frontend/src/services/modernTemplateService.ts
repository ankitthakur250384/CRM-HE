import { getHeaders } from './apiHeaders';

// Modern template interface for the drag-and-drop builder
export interface ModernTemplate {
  id: string;
  name: string;
  description?: string;
  elements: TemplateElement[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault?: boolean;
  usage_count?: number;
  tags?: string[];
}

// Template element interface for drag-and-drop builder
export interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'table' | 'image' | 'spacer' | 'header' | 'terms';
  content?: string;
  fieldType?: string;
}

// Fetch all modern templates from backend API
export async function getModernTemplates(): Promise<ModernTemplate[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch modern templates: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  const templates = Array.isArray(result) ? result : (result.data || []);
  return templates;
}

// Create a new modern template via backend API
export async function createModernTemplate(template: Omit<ModernTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to create modern template');
  }
  
  const result = await response.json();
  return result.data || result;
}

// Update an existing modern template via backend API
export async function updateModernTemplate(templateId: string, updates: Partial<ModernTemplate>): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to update modern template');
  }
  
  const result = await response.json();
  return result.data || result;
}

// Delete a modern template by ID via backend API
export async function deleteModernTemplate(templateId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete modern template');
  }
}

// Fetch a single modern template by ID from backend API
export async function getModernTemplateById(templateId: string): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch modern template by ID');
  }
  
  const result = await response.json();
  return result.data || result;
}


