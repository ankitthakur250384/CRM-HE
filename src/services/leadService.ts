/**
 * Lead Service
 * 
 * This file serves as a wrapper that conditionally uses:
 * - API service in browser environments
 * - Direct PostgreSQL repository on the server
 * 
 * This ensures proper separation between frontend and backend,
 * preventing frontend components from trying to access PostgreSQL directly.
 */

import { Lead, LeadStatus } from '../types/lead';

// Conditionally import the appropriate implementation
// Based on the execution environment
const isBrowser = typeof window !== 'undefined';

// Promise to track when implementation is loaded
let implementationPromise: Promise<any>;

// Different implementation based on environment
if (isBrowser) {
  // In browser environment, use API implementation
  console.log('🌐 Loading API-based lead service (browser)');
  implementationPromise = import('./api/leadService');
} else {
  // In server/Node environment, use PostgreSQL repository directly
  console.log('🗄️ Loading direct PostgreSQL lead repository (server)');
  implementationPromise = import('./postgres/leadRepository');
}

// Helper to get implementation
const getImplementation = async () => {
  try {
    const impl = await implementationPromise;
    return impl;
  } catch (error) {
    console.error('Failed to load lead service implementation:', error);
    throw new Error('Lead service unavailable');
  }
};

/**
 * Get all leads
 */
export const getLeads = async (): Promise<Lead[]> => {
  try {
    const impl = await getImplementation();
    return impl.getLeads();
  } catch (error) {
    console.error('Failed to get leads:', error);
    return [];
  }
};

/**
 * Get a lead by ID
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const impl = await getImplementation();
    return impl.getLeadById(id);
  } catch (error) {
    console.error(`Failed to get lead ${id}:`, error);
    return null;
  }
};

/**
 * Create a new lead
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  const impl = await getImplementation();
  return impl.createLead(lead);
};

/**
 * Update a lead's status
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  try {
    const impl = await getImplementation();
    return impl.updateLeadStatus(id, status);
  } catch (error) {
    console.error(`Failed to update lead status ${id}:`, error);
    return null;
  }
};

/**
 * Update a lead's assignment
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  try {
    const impl = await getImplementation();
    return impl.updateLeadAssignment(leadId, salesAgentId, salesAgentName);
  } catch (error) {
    console.error(`Failed to update lead assignment ${leadId}:`, error);
    return null;
  }
};

/**
 * Update a lead's details
 */
export const updateLead = async (id: string, leadData: Partial<Lead>): Promise<Lead | null> => {
  try {
    console.log('🔧 Lead service - updating lead:', { id, leadData });
    const impl = await getImplementation();
    const result = await impl.updateLead(id, leadData);
    console.log('🔧 Lead service - update result:', result);
    return result;
  } catch (error) {
    console.error('🔧 Lead service - update error:', error);
    throw error;
  }
};