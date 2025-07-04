/**
 * Deal API Service
 * 
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Deal, DealStage } from '../../types/deal';
import { api } from '../../lib/apiClient';

/**
 * Get all deals from the API
 */
export const getDeals = async (): Promise<Deal[]> => {
  const response = await api.get<Deal[]>('/deals');
  
  if (!response.success || !response.data) {
    console.error('Failed to fetch deals:', response.error);
    // Return empty array as fallback
    return [];
  }
  
  return response.data;
};

/**
 * Get a deal by ID from the API
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  const response = await api.get<Deal>(`/deals/${id}`);
  
  if (!response.success || !response.data) {
    console.error(`Failed to fetch deal ${id}:`, response.error);
    return null;
  }
  
  return response.data;
};

/**
 * Create a new deal via the API
 */
export const createDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  const response = await api.post<Deal>('/deals', deal);
  
  if (!response.success || !response.data) {
    console.error('Failed to create deal:', response.error);
    throw new Error(response.error?.message || 'Failed to create deal');
  }
  
  return response.data;
};

/**
 * Update a deal via the API
 */
export const updateDeal = async (
  id: string,
  dealData: Partial<Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Deal | null> => {
  const response = await api.put<Deal>(`/deals/${id}`, dealData);
  
  if (!response.success || !response.data) {
    console.error(`Failed to update deal ${id}:`, response.error);
    return null;
  }
  
  return response.data;
};

/**
 * Update a deal's stage via the API
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  const response = await api.patch<Deal>(`/deals/${id}/stage`, { stage });
  
  if (!response.success || !response.data) {
    console.error(`Failed to update deal ${id} stage:`, response.error);
    return null;
  }
  
  return response.data;
};

/**
 * Delete a deal via the API
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
  const response = await api.delete<void>(`/deals/${id}`);
  
  if (!response.success) {
    console.error(`Failed to delete deal ${id}:`, response.error);
    return false;
  }
  
  return true;
};
