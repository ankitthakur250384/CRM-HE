/**
 * Deal Service
 * 
 * This file serves as a wrapper that conditionally uses:
 * - API service in browser environments
 * - Direct PostgreSQL repository on the server
 * 
 * This ensures proper separation between frontend and backend,
 * preventing frontend components from trying to access PostgreSQL directly.
 */

import { Deal, DealStage } from '../types/deal';

// Conditionally import the appropriate implementation
// Based on the execution environment
const isBrowser = typeof window !== 'undefined';

// Custom error class for Deal service
class DealServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DealServiceError';
    // Set the prototype explicitly to avoid issues with instanceof
    Object.setPrototypeOf(this, DealServiceError.prototype);
  }
}

// Promise to track when implementation is loaded
let implementationPromise: Promise<any>;

// Different implementation based on environment
if (isBrowser) {
  // In browser environment, use API implementation
  console.log('🌐 Loading API-based deal service (browser)');
  implementationPromise = import('./api/dealService');
} else {
  // In server/Node environment, use PostgreSQL repository directly
  console.log('🗄️ Loading direct PostgreSQL deal repository (server)');
  implementationPromise = import('./postgres/dealRepository');
}

// Helper to get implementation
const getImplementation = async () => {
  try {
    const impl = await implementationPromise;
    return impl;
  } catch (error) {
    console.error('Failed to load deal service implementation:', error);
    throw new Error('Deal service unavailable');
  }
};

// API functions are now moved to implementation-specific files
// and are dynamically imported based on environment

/**
 * Get all deals
 */
export const getDeals = async (): Promise<Deal[]> => {
  try {
    const impl = await getImplementation();
    return await impl.getDeals();
  } catch (error) {
    console.error('Error in getDeals:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get deal by ID
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    const impl = await getImplementation();
    return await impl.getDealById(id);
  } catch (error) {
    console.error(`Error in getDealById for ID ${id}:`, error);
    return null;
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  try {
    const impl = await getImplementation();
    return await impl.createDeal(deal);
  } catch (error) {
    console.error('Error in createDeal:', error);
    throw new DealServiceError(error instanceof Error ? error.message : 'Failed to create deal', error);
  }
};

/**
 * Update a deal
 */
export const updateDeal = async (
  id: string,
  dealData: Partial<Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Deal | null> => {
  try {
    const impl = await getImplementation();
    return await impl.updateDeal(id, dealData);
  } catch (error) {
    console.error(`Error in updateDeal for ID ${id}:`, error);
    return null;
  }
};

/**
 * Update a deal's stage
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  if (!id) {
    throw new DealServiceError('Deal ID is required for update');
  }
  
  if (!stage || !['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) {
    throw new DealServiceError(`Invalid stage value: "${stage}"`);
  }
  
  try {
    const impl = await getImplementation();
    return await impl.updateDealStage(id, stage);
  } catch (error) {
    console.error(`Error in updateDealStage for ID ${id}:`, error);
    return null;
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
  try {
    const impl = await getImplementation();
    return await impl.deleteDeal(id);
  } catch (error) {
    console.error(`Error in deleteDeal for ID ${id}:`, error);
    return false;
  }
};
