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

// Import specific implementation based on environment
let apiImpl: any;
let dbImpl: any;

// Initialize the implementations
if (isBrowser) {
  try {
    // In browser environment, use API implementation
    apiImpl = require('./api/dealService');
    console.log('🌐 Using API-based deal service (browser)');
  } catch (err) {
    console.error('Failed to load API implementation:', err);
    // Fallback to mock implementation or show error
  }
} else {
  try {
    // In server/Node environment, use PostgreSQL repository directly
    dbImpl = require('./postgres/dealRepository');
    console.log('🗄️ Using direct PostgreSQL deal repository (server)');
  } catch (err) {
    console.error('Failed to load DB implementation:', err);
  }
}

// Get the appropriate implementation
const implementation = isBrowser ? apiImpl : dbImpl;

/**
 * Get all deals
 */
export const getDeals = async (): Promise<Deal[]> => {
  if (!implementation) {
    console.error('No deal service implementation available');
    return []; // Return empty array as fallback
  }
  
  try {
    return await implementation.getDeals();
  } catch (error) {
    console.error('Error in getDeals:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get deal by ID
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  if (!implementation) {
    console.error('No deal service implementation available');
    return null;
  }
  
  try {
    return await implementation.getDealById(id);
  } catch (error) {
    console.error(`Error in getDealById for ID ${id}:`, error);
    return null;
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  if (!implementation) {
    console.error('No deal service implementation available');
    throw new DealServiceError('Deal service unavailable');
  }
  
  try {
    return await implementation.createDeal(deal);
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
  if (!implementation) {
    console.error('No deal service implementation available');
    return null;
  }
  
  try {
    return await implementation.updateDeal(id, dealData);
  } catch (error) {
    console.error(`Error in updateDeal for ID ${id}:`, error);
    return null;
  }
};

/**
 * Update a deal's stage
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  if (!implementation) {
    console.error('No deal service implementation available');
    return null;
  }
  
  if (!id) {
    throw new DealServiceError('Deal ID is required for update');
  }
  
  if (!stage || !['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) {
    throw new DealServiceError(`Invalid stage value: "${stage}"`);
  }
  
  try {
    return await implementation.updateDealStage(id, stage);
  } catch (error) {
    console.error(`Error in updateDealStage for ID ${id}:`, error);
    return null;
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
  if (!implementation) {
    console.error('No deal service implementation available');
    return false;
  }
  
  try {
    return await implementation.deleteDeal(id);
  } catch (error) {
    console.error(`Error in deleteDeal for ID ${id}:`, error);
    return false;
  }
};
