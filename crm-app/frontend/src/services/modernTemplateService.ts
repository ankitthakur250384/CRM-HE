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
  type: 'text' | 'field' | 'table' | 'image' | 'spacer' | 'line' | 'signature';
  content?: string;
  fieldType?: string;
  styles?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    padding?: number;
    margin?: number;
  };
  props?: Record<string, any>;
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
    // If the modern endpoint doesn't exist, fall back to mock data
    console.warn('Modern templates endpoint not available, using mock data');
    return getMockTemplates();
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

// Mock data for testing until backend is updated
function getMockTemplates(): ModernTemplate[] {
  return [
    {
      id: '1',
      name: 'Standard Quotation',
      description: 'Default template for equipment quotations',
      elements: [
        {
          id: 'element_1',
          type: 'text',
          content: 'ASP CRANES - QUOTATION',
          styles: {
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#0052CC'
          }
        },
        {
          id: 'element_2',
          type: 'field',
          fieldType: 'customer.name',
          styles: {
            fontSize: 16,
            textAlign: 'left'
          }
        },
        {
          id: 'element_3',
          type: 'table',
          styles: {
            fontSize: 14
          }
        }
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      createdBy: 'Admin',
      isDefault: true,
      usage_count: 45,
      tags: ['standard', 'equipment']
    },
    {
      id: '2',
      name: 'Premium Service Quote',
      description: 'Template for premium service quotations',
      elements: [
        {
          id: 'element_1',
          type: 'text',
          content: 'Premium Service Quotation',
          styles: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }
        },
        {
          id: 'element_2',
          type: 'field',
          fieldType: 'quotation.totalAmount',
          styles: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FF6B35'
          }
        }
      ],
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-22T09:15:00Z',
      createdBy: 'John Doe',
      usage_count: 23,
      tags: ['premium', 'service']
    },
    {
      id: '3',
      name: 'Maintenance Contract',
      description: 'Template for maintenance service contracts',
      elements: [
        {
          id: 'element_1',
          type: 'text',
          content: 'Maintenance Service Contract',
          styles: {
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center'
          }
        },
        {
          id: 'element_2',
          type: 'field',
          fieldType: 'quotation.workingCost',
          styles: {
            fontSize: 14
          }
        }
      ],
      createdAt: '2024-02-01T16:45:00Z',
      updatedAt: '2024-02-01T16:45:00Z',
      createdBy: 'Jane Smith',
      usage_count: 12,
      tags: ['maintenance', 'contract']
    }
  ];
}
