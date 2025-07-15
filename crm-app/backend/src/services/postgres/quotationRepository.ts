/**
 * PostgreSQL Quotation Repository
 * Handles database operations for quotations using PostgreSQL API
 */
import { Quotation, QuotationInputs } from '../../types/quotation';
import { api } from '../../lib/apiService'; 

// Using the status values directly
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

// Type for the local schema file structure
interface QuotationsSchema {
  timestamp: string;
  count: number;
  quotations: any[];
}

/**
 * Get all quotations from the database
 */
export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    console.log('🔍 getQuotations: Requesting quotations from API...');
    
    // DEVELOPMENT FALLBACK: Use local schema in development mode if API fails
    // This provides sample data when the API is unavailable
    if (import.meta.env.DEV) {
      console.log('🔧 DEV MODE: Attempting to get quotations from API with fallback to local data');      try {
        // Try the API first
        const quotations = await api.get<Quotation[]>('/quotations');
        console.log(`✅ Successfully retrieved ${quotations.length} quotations from API`);
        return quotations;
      } catch (error) {
        const apiError = error as Error;
        console.warn('⚠️ API request failed in dev mode, using local schema data instead:', apiError.message);
        
        try {
          // Use local schema as fallback
          console.log('Loading local schema data for quotations...');
          const schema = await import('../../models/quotations-schema.json');
          console.log(`✅ Loaded ${schema.quotations.length} quotations from local schema`);
          // First convert to unknown then to Quotation[] to satisfy TypeScript
          return schema.quotations as unknown as Quotation[];
        } catch (schemaError) {
          console.error('❌ Failed to load local quotations schema:', schemaError);
          throw apiError; // Re-throw the original API error
        }
      }
    }
    
    // Standard API call for production
    const response = await api.get<Quotation[]>('/quotations');
    console.log(`✅ getQuotations: Received ${response?.length || 0} quotations from API`);
    if (!response || response.length === 0) {
      console.log('⚠️ getQuotations: No quotations received from API');
    } else {
      // Log first item as example
      console.log('📋 getQuotations: First quotation sample:', JSON.stringify(response[0], null, 2));
    }
    return response;
  } catch (error) {
    console.error('❌ getQuotations: Error fetching quotations:', error);
    throw error;
  }
};

/**
 * Create a new quotation in the database
 */
export const createQuotation = async (quotationData: any): Promise<Quotation> => {
  try {
    console.log('Creating quotation via API:', quotationData);
    const response = await api.post<Quotation>('/quotations', quotationData);
    return response;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

/**
 * Get a quotation by ID from the database
 */
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  try {
    console.log(`Getting quotation ${id} via API`);
    
    // DEVELOPMENT FALLBACK: Use local schema in development mode if API fails
    if (import.meta.env.DEV) {
      try {
        // Try the API first
        const quotation = await api.get<Quotation>(`/quotations/${id}`);
        return quotation;
      } catch (error) {
        const apiError = error as Error;
        // Only use fallback if we get a real error (not 404)
        if (!apiError.message.includes('404')) {
          console.warn(`⚠️ API request failed for quotation ${id}, trying local schema:`, apiError.message);
          
          try {
            // Use local schema as fallback
            console.log('Loading local schema data for quotations...');
            const schema = await import('../../models/quotations-schema.json');
            const foundQuotation = schema.quotations.find(q => q.id === id);
            
            if (foundQuotation) {
              console.log(`✅ Found quotation ${id} in local schema`);
              return foundQuotation as unknown as Quotation;
            } else {
              console.log(`❌ Quotation ${id} not found in local schema`);
              return null;
            }
          } catch (schemaError) {
            console.error('❌ Failed to load local quotations schema:', schemaError);
            throw apiError; // Re-throw the original API error
          }
        } else {
          // It's a 404, just return null
          return null;
        }
      }
    }
    
    // Standard API call for production
    const response = await api.get<Quotation>(`/quotations/${id}`);
    return response;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      console.log(`Quotation with ID ${id} not found`);
      return null;
    }
    console.error('Error fetching quotation by ID:', error);
    throw error;
  }
};

/**
 * Update a quotation's status in the database
 */
export const updateQuotationStatus = async (
  id: string, 
  status: QuotationStatus
): Promise<Quotation | null> => {
  try {
    console.log(`Updating quotation ${id} status to ${status} via API`);
    // Use the PUT method since our API doesn't directly support PATCH
    const response = await api.put<Quotation>(`/quotations/${id}/status`, { status });
    return response;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      console.log(`Quotation with ID ${id} not found`);
      return null;
    }
    console.error('Error updating quotation status:', error);
    throw error;
  }
};

/**
 * Update a quotation in the database
 */
export const updateQuotation = async (
  id: string,
  quotationData: Partial<Quotation>
): Promise<Quotation | null> => {
  try {
    console.log(`Updating quotation ${id} via API`);
    const response = await api.put<Quotation>(`/quotations/${id}`, quotationData);
    return response;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      console.log(`Quotation with ID ${id} not found`);
      return null;
    }
    console.error('Error updating quotation:', error);
    throw error;
  }
};

/**
 * Delete a quotation from the database
 */
export const deleteQuotation = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting quotation ${id} via API`);
    await api.delete(`/quotations/${id}`);
    return true;
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      console.log(`Quotation with ID ${id} not found`);
      return false;
    }
    console.error('Error deleting quotation:', error);
    throw error;
  }
};

/**
 * Get all quotations for a specific lead from the database
 */
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  try {
    console.log(`Getting quotations for lead ${leadId} via API`);
    const response = await api.get<Quotation[]>(`/quotations/lead/${leadId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching quotations for lead ${leadId}:`, error);
    throw error;
  }
};
