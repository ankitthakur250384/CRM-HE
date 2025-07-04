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

// Use dynamic imports for backend/API implementations
let leadImplementation: {
  getLeads: () => Promise<Lead[]>;
  getLeadById: (id: string) => Promise<Lead | null>;
  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lead>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<Lead | null>;
  updateLeadAssignment: (leadId: string, salesAgentId: string, salesAgentName: string) => Promise<Lead | null>;
};

// Different implementation based on environment
if (isBrowser) {
  // In browser environment, use API implementation
  // This ensures frontend never tries to access PostgreSQL directly
  import('./api/leadService').then(apiImpl => {
    leadImplementation = apiImpl;
    console.log('🌐 Using API-based lead service (browser)');
  }).catch(err => {
    console.error('Failed to load API implementation:', err);
  });
} else {
  // In server/Node environment, use PostgreSQL repository directly
  import('./postgres/leadRepository').then(dbImpl => {
    leadImplementation = dbImpl;
    console.log('🗄️ Using direct PostgreSQL lead repository (server)');
  }).catch(err => {
    console.error('Failed to load DB implementation:', err);
  });
}

/**
 * Get all leads
 */
export const getLeads = async (): Promise<Lead[]> => {
  if (!leadImplementation) {
    console.warn('Lead service implementation not loaded yet, returning empty array');
    return [];
  }
  return leadImplementation.getLeads();
};

/**
 * Get a lead by ID
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  if (!leadImplementation) {
    console.warn(`Lead service implementation not loaded yet, can't get lead ${id}`);
    return null;
  }
  return leadImplementation.getLeadById(id);
};

/**
 * Create a new lead
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  if (!leadImplementation) {
    console.error('Lead service implementation not loaded yet, cannot create lead');
    throw new Error('Lead service unavailable');
  }
  return leadImplementation.createLead(lead);
};

/**
 * Update a lead's status
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  if (!leadImplementation) {
    console.warn(`Lead service implementation not loaded yet, can't update lead status ${id}`);
    return null;
  }
  return leadImplementation.updateLeadStatus(id, status);
};

/**
 * Update a lead's assignment
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  if (!leadImplementation) {
    console.warn(`Lead service implementation not loaded yet, can't update lead assignment ${leadId}`);
    return null;
  }
  return leadImplementation.updateLeadAssignment(leadId, salesAgentId, salesAgentName);
};