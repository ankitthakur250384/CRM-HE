// If mergeQuotationWithTemplate is imported anywhere, throw an error to indicate migration to backend
export function mergeQuotationWithTemplate() {
  throw new Error('mergeQuotationWithTemplate is now handled by backend. Please update your code to use mergeTemplateViaAPI or the backend API.');
}
// If getAvailablePlaceholders is imported anywhere, throw an error to indicate migration to backend
export function getAvailablePlaceholders() {
  throw new Error('getAvailablePlaceholders is now handled by backend. Please update your code to fetch placeholders from the backend API.');
}

// Production: Use backend API for template merging
import { getHeaders } from '../lib/apiClient';

export async function mergeTemplateViaAPI(templateId: string, data: Record<string, any>): Promise<string> {
  const response = await fetch(`/api/templates/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({ templateId, data }),
  });
  if (!response.ok) {
    throw new Error('Failed to merge template');
  }
  const result = await response.json();
  return result.mergedContent || '';
}