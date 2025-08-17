import { getHeaders } from './apiHeaders';

// Enhanced modern template interface with all best-in-class features
export interface ModernTemplate {
  id: string;
  name: string;
  description?: string;
  content?: string;
  elements: TemplateElement[];
  styles?: Record<string, any>;
  layout?: Record<string, any>;
  tags?: string[];
  thumbnail?: string;
  category?: string;
  usage_count?: number;
  isDefault?: boolean;
  isActive?: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced template element interface with styling support
export interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'table' | 'image' | 'spacer' | 'header' | 'terms';
  content?: string;
  fieldType?: string;
  styles?: Record<string, any>;
  config?: Record<string, any>;
}

// Template search and filter options
export interface TemplateSearchOptions {
  search?: string;
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'usage_count';
  sortOrder?: 'ASC' | 'DESC';
}

// Template history entry
export interface TemplateHistoryEntry {
  id: number;
  templateId: string;
  snapshot: ModernTemplate;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changeSummary: string;
  changedBy: string;
  changedAt: string;
  versionNumber: number;
}

// Template category
export interface TemplateCategory {
  category: string;
  count: number;
}

// Template statistics
export interface TemplateStatistics {
  total_templates: number;
  active_templates: number;
  default_templates: number;
  avg_usage: number;
  max_usage: number;
  total_categories: number;
}

// Fetch templates with search, filtering, and pagination
export async function getModernTemplates(options: TemplateSearchOptions = {}): Promise<{
  data: ModernTemplate[];
  pagination: { limit: number; offset: number; hasMore: boolean };
}> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const searchParams = new URLSearchParams();
  if (options.search) searchParams.set('search', options.search);
  if (options.category) searchParams.set('category', options.category);
  if (options.isActive !== undefined) searchParams.set('isActive', String(options.isActive));
  if (options.limit) searchParams.set('limit', String(options.limit));
  if (options.offset) searchParams.set('offset', String(options.offset));
  if (options.sortBy) searchParams.set('sortBy', options.sortBy);
  if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder);
  
  const response = await fetch(`${apiUrl}/templates/modern?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch modern templates: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Get template categories
export async function getTemplateCategories(): Promise<TemplateCategory[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/categories`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch template categories');
  }
  
  const result = await response.json();
  return result.data || [];
}

// Get template statistics
export async function getTemplateStatistics(): Promise<TemplateStatistics> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/statistics`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch template statistics');
  }
  
  const result = await response.json();
  return result.data;
}

// Create a new modern template with validation
export async function createModernTemplate(template: Omit<ModernTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  // Client-side validation
  if (!template.name || !template.name.trim()) {
    throw new Error('Template name is required');
  }
  
  if (!template.elements || !Array.isArray(template.elements)) {
    throw new Error('Template elements must be an array');
  }
  
  const response = await fetch(`${apiUrl}/templates/modern`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(template),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create modern template');
  }
  
  const result = await response.json();
  return result.data;
}

// Update an existing modern template with optimistic locking
export async function updateModernTemplate(
  templateId: string, 
  updates: Partial<ModernTemplate>, 
  expectedVersion?: number
): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const updateData = { ...updates };
  if (expectedVersion !== undefined) {
    updateData.version = expectedVersion;
  }
  
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 409) {
      throw new Error('Template was modified by another user. Please refresh and try again.');
    }
    
    throw new Error(errorData.message || 'Failed to update modern template');
  }
  
  const result = await response.json();
  return result.data;
}

// Set template as default
export async function setDefaultTemplate(templateId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}/default`, {
    method: 'PUT',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to set default template');
  }
}

// Increment template usage count
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}/usage`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    // Don't throw error for usage tracking failure
    console.warn('Failed to increment template usage count');
  }
}

// Delete a modern template (soft delete)
export async function deleteModernTemplate(templateId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete modern template');
  }
}

// Fetch a single modern template by ID with optional usage tracking
export async function getModernTemplateById(templateId: string, incrementUsage = false): Promise<ModernTemplate> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const searchParams = new URLSearchParams();
  if (incrementUsage) {
    searchParams.set('incrementUsage', 'true');
  }
  
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Template not found');
    }
    throw new Error(errorData.message || 'Failed to fetch modern template');
  }
  
  const result = await response.json();
  return result.data;
}

// Get template history
export async function getTemplateHistory(
  templateId: string, 
  limit = 10, 
  offset = 0
): Promise<{
  data: TemplateHistoryEntry[];
  pagination: { limit: number; offset: number; hasMore: boolean };
}> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  const searchParams = new URLSearchParams();
  searchParams.set('limit', String(limit));
  searchParams.set('offset', String(offset));
  
  const response = await fetch(`${apiUrl}/templates/modern/${templateId}/history?${searchParams.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch template history');
  }
  
  return await response.json();
}


