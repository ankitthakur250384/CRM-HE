/**
 * Lead API Service
 * 
 * Browser-side implementation that uses API requests instead of direct database access.
 * This service will be used by the frontend to interact with the backend API.
 */

import { Lead, LeadStatus } from '../../types/lead';
import { api } from '../../lib/apiClient';

/**
 * Get all leads from the API
 */
export const getLeads = async (): Promise<Lead[]> => {
  const response = await api.get<Lead[]>('/leads');
  
  if (!response.success || !response.data) {
    console.error('Failed to fetch leads:', response.error);
    // Return empty array as fallback
    return [];
  }
  
  return response.data;
};

/**
 * Get a lead by ID from the API
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  const response = await api.get<Lead>(`/leads/${id}`);
  
  if (!response.success || !response.data) {
    console.error(`Failed to fetch lead ${id}:`, response.error);
    return null;
  }
  
  return response.data;
};

/**
 * Create a new lead via the API
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  const response = await api.post<Lead>('/leads', lead);
  
  if (!response.success || !response.data) {
    console.error('Failed to create lead:', response.error);
    throw new Error(response.error?.message || 'Failed to create lead');
  }
  
  return response.data;
};

/**
 * Update a lead's status via the API
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  const response = await api.patch<Lead>(`/leads/${id}/status`, { status });
  
  if (!response.success || !response.data) {
    console.error(`Failed to update lead ${id} status:`, response.error);
    return null;
  }
  
  return response.data;
};

/**
 * Update a lead's assignment via the API
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  const response = await api.patch<Lead>(`/leads/${leadId}/assign`, { 
    salesAgentId, 
    salesAgentName 
  });
  
  if (!response.success || !response.data) {
    console.error(`Failed to update lead ${leadId} assignment:`, response.error);
    return null;
  }
  
  return response.data;
};
