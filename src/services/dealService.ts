/**
 * Deal Service - Enhanced Version
 * 
 * This service handles all deal-related operations with improved error handling,
 * logging, and type safety.
 */

import { Deal, DealStage } from '../types/deal';

// Base API URL from environment
const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEBUG = true;

// Custom error class for deal service errors
export class DealServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DealServiceError';
  }
}

// Function to get authorization token
const getToken = (): string => {
  const token = localStorage.getItem('jwt-token');
  if (!token) {
    throw new DealServiceError('Authentication required. Please log in again.');
  }
  return token;
};

// API request function with error handling
const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<T> => {
  try {
    DEBUG && console.log(`[Deal Service] ${method} ${endpoint}`);
    if (data) {
      DEBUG && console.log('[Deal Service] Request data:', data);
    }

    const token = getToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: 'same-origin',
      body: data ? JSON.stringify(data) : undefined
    };

    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    DEBUG && console.log(`[Deal Service] Requesting ${fullUrl}`);
    
    const response = await fetch(fullUrl, requestOptions);
    
    // Log detailed information about the response
    DEBUG && console.log(`[Deal Service] Response status: ${response.status}`);
    DEBUG && console.log(`[Deal Service] Response headers:`, {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      // Try to get detailed error message from response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += `: ${errorText.substring(0, 200)}`;
          }
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new DealServiceError(errorMessage);
    }

    const responseData = await response.json();
    DEBUG && console.log('[Deal Service] Response data:', responseData);
    
    return responseData as T;
  } catch (error) {
    if (error instanceof DealServiceError) {
      throw error;
    }
    
    // Convert other errors to DealServiceError
    const message = error instanceof Error 
      ? `API request failed: ${error.message}` 
      : 'Unknown API error occurred';
      
    throw new DealServiceError(message, error);
  }
};

/**
 * Get all deals
 */
export const getDeals = async (): Promise<Deal[]> => {
  try {
    // DEVELOPMENT FALLBACK: Use local schema in development mode if API fails
    if (import.meta.env.DEV) {
      DEBUG && console.log('🔧 DEV MODE: Attempting to get deals from API with fallback to local data');
      try {
        // Try the API first
        const deals = await apiRequest<Deal[]>('/deals');
        
        // Validate deals to prevent UI errors
        const validatedDeals = deals.map(deal => ({
          ...deal,
          id: deal.id || `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: deal.title || `Deal ${deal.id || 'Untitled'}`,
          value: typeof deal.value === 'number' ? deal.value : 0,
          probability: typeof deal.probability === 'number' ? deal.probability : 50,
          stage: deal.stage || 'qualification',
          customer: {
            name: deal.customer?.name || 'Unknown Customer',
            email: deal.customer?.email || '',
            phone: deal.customer?.phone || '',
            company: deal.customer?.company || '',
            address: deal.customer?.address || '',
            designation: deal.customer?.designation || ''
          },
          createdAt: deal.createdAt || new Date().toISOString(),
          updatedAt: deal.updatedAt || new Date().toISOString()
        }));
        
        DEBUG && console.log(`✅ Successfully retrieved ${validatedDeals.length} deals from API`);
        return validatedDeals;
      } catch (apiError) {
        DEBUG && console.warn('⚠️ API request failed in dev mode, using local schema data instead:', 
          apiError instanceof Error ? apiError.message : 'Unknown error');
        
        try {
          // Use local schema as fallback
          DEBUG && console.log('Loading local schema data for deals...');
          const schema = await import('../models/deal-schema.json');
          DEBUG && console.log(`✅ Loaded ${schema.deals.length} deals from local schema`);
          return schema.deals as unknown as Deal[];
        } catch (schemaError) {
          DEBUG && console.error('❌ Failed to load local deals schema:', schemaError);
          throw apiError; // Re-throw the original API error
        }
      }
    }
    
    // PRODUCTION MODE: Standard API call
    const deals = await apiRequest<Deal[]>('/deals');
    
    // Validate deals to prevent UI errors
    const validatedDeals = deals.map(deal => ({
      ...deal,
      id: deal.id || `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: deal.title || `Deal ${deal.id || 'Untitled'}`,
      value: typeof deal.value === 'number' ? deal.value : 0,
      probability: typeof deal.probability === 'number' ? deal.probability : 50,
      stage: deal.stage || 'qualification',
      customer: {
        name: deal.customer?.name || 'Unknown Customer',
        email: deal.customer?.email || '',
        phone: deal.customer?.phone || '',
        company: deal.customer?.company || '',
        address: deal.customer?.address || '',
        designation: deal.customer?.designation || ''
      },
      createdAt: deal.createdAt || new Date().toISOString(),
      updatedAt: deal.updatedAt || new Date().toISOString()
    }));
    
    DEBUG && console.log(`[Deal Service] Retrieved ${validatedDeals.length} deals`);
    return validatedDeals;
  } catch (error) {
    if (error instanceof DealServiceError) {
      throw error;
    }
    throw new DealServiceError('Failed to fetch deals', error);
  }
};

/**
 * Get a deal by ID
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    // DEVELOPMENT FALLBACK: Use local schema in development mode if API fails
    if (import.meta.env.DEV) {
      DEBUG && console.log(`🔧 DEV MODE: Attempting to get deal ${id} from API with fallback to local data`);
      try {
        // Try the API first
        const deal = await apiRequest<Deal>(`/deals/${id}`);
        DEBUG && console.log(`✅ Successfully retrieved deal ${id} from API`);
        return deal;
      } catch (error) {
        // Only use fallback if it's not a 404 (missing resource)
        if (!(error instanceof DealServiceError && error.message.includes('404'))) {
          DEBUG && console.warn(`⚠️ API request failed for deal ${id}, trying local schema:`, 
            error instanceof Error ? error.message : 'Unknown error');
          
          try {
            // Use local schema as fallback
            DEBUG && console.log('Loading local schema data for deals...');
            const schema = await import('../models/deal-schema.json');
            const foundDeal = schema.deals.find(d => d.id === id);
            
            if (foundDeal) {
              DEBUG && console.log(`✅ Found deal ${id} in local schema`);
              return foundDeal as unknown as Deal;
            } else {
              DEBUG && console.log(`❌ Deal ${id} not found in local schema`);
              return null;
            }
          } catch (schemaError) {
            DEBUG && console.error('❌ Failed to load local deals schema:', schemaError);
            throw error; // Re-throw the original API error
          }
        }
        
        // It's a 404, just return null
        return null;
      }
    }
    
    // PRODUCTION MODE: Standard API call
    return await apiRequest<Deal>(`/deals/${id}`);
  } catch (error) {
    // Return null for 404 errors
    if (error instanceof DealServiceError && 
        error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  try {
    return await apiRequest<Deal>('/deals', 'POST', dealData);
  } catch (error) {
    throw new DealServiceError('Failed to create deal', error);
  }
};

/**
 * Update a deal's stage
 * 
 * This function first tries the dedicated endpoint for stage updates,
 * and if that fails, falls back to the general update endpoint.
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  if (!id) {
    throw new DealServiceError('Deal ID is required for update');
  }
  
  if (!stage || !['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) {
    throw new DealServiceError(`Invalid stage value: "${stage}"`);
  }
  
  DEBUG && console.log(`[Deal Service] Updating deal ${id} to stage: ${stage}`);
  
  const payload = { 
    stage, 
    status: stage // Include both for backend compatibility
  };
  
  try {
    // First attempt: Use the dedicated stage update endpoint
    try {
      DEBUG && console.log('[Deal Service] Trying dedicated stage update endpoint');
      return await apiRequest<Deal>(`/deals/${id}/stage`, 'PUT', payload);
    } catch (error) {
      // If the first attempt fails with 404, try the general update endpoint
      if (error instanceof DealServiceError && error.message.includes('404')) {
        DEBUG && console.log('[Deal Service] Stage update endpoint not found, trying general update endpoint');
        return await apiRequest<Deal>(`/deals/${id}`, 'PUT', payload);
      }
      throw error;
    }
  } catch (error) {
    // Handle 404 specifically
    if (error instanceof DealServiceError && error.message.includes('404')) {
      DEBUG && console.log(`[Deal Service] Deal not found: ${id}`);
      return null;
    }
    
    if (error instanceof DealServiceError) {
      throw error;
    }
    
    throw new DealServiceError(`Failed to update stage for deal ${id}`, error);
  }
};

/**
 * Update a deal
 */
export const updateDeal = async (id: string, dealData: Partial<Deal>): Promise<Deal | null> => {
  try {
    return await apiRequest<Deal>(`/deals/${id}`, 'PUT', dealData);
  } catch (error) {
    // Return null for 404 errors
    if (error instanceof DealServiceError && error.message.includes('404')) {
      return null;
    }
    throw new DealServiceError(`Failed to update deal ${id}`, error);
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (id: string): Promise<boolean> => {
  try {
    await apiRequest<void>(`/deals/${id}`, 'DELETE');
    return true;
  } catch (error) {
    if (error instanceof DealServiceError && error.message.includes('404')) {
      return false;
    }
    throw new DealServiceError(`Failed to delete deal ${id}`, error);
  }
};
