/**
 * PostgreSQL Deal Repository
 * Handles database operations for deals using PostgreSQL via API
 */
import { Deal, DealStage } from '../../types/deal';
import { logDealsFromAPI, stageToDatabaseStatus } from '../../utils/dealMappings';
import { api } from '../../lib/apiService';

/**
 * Get all deals from the database via API
 */
export const getDeals = async (): Promise<Deal[]> => {  
  try {
    console.log('Getting all deals via centralized API service');
    
    // Use the improved API service
    const deals = await api.get<Deal[]>('/deals');
    console.log(`Successfully fetched ${deals.length} deals from API`);// Log the structure of the first deal to help debug
    if (deals.length > 0) {
      console.log('Sample deal:', JSON.stringify(deals[0], null, 2));
    }    // Ensure all required fields are present to prevent UI errors
    const validatedDeals = deals.map((deal: any) => {
      // Create a validated deal with all required fields
      return {
        id: deal.id || `unknown-${Math.random()}`,
        title: deal.title || `Deal ${deal.id || 'Unknown'}`,
        description: deal.description || '',
        value: typeof deal.value === 'number' ? deal.value : 0,
        probability: typeof deal.probability === 'number' ? deal.probability : 0,
        stage: deal.stage || 'qualification',
        leadId: deal.leadId || '',
        customerId: deal.customerId || '',
        customer: {
          name: deal.customer?.name || 'Unknown Customer',
          email: deal.customer?.email || '',
          phone: deal.customer?.phone || '',
          company: deal.customer?.company || '',
          address: deal.customer?.address || '',
          designation: deal.customer?.designation || ''
        },
        expectedCloseDate: deal.expectedCloseDate || new Date().toISOString(),
        assignedTo: deal.assignedTo || '',
        assignedToName: deal.assignedToName || '',
        createdAt: deal.createdAt || new Date().toISOString(),
        updatedAt: deal.updatedAt || new Date().toISOString(),
        notes: deal.notes || ''
      };
    });
    logDealsFromAPI(validatedDeals);
    return validatedDeals;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

/**
 * Create a new deal in the database via API
 */
export const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> => {
  try {
    console.log('Creating deal via API:', dealData);
    
    // Use the improved API service
    const createdDeal = await api.post<Deal>('/deals', dealData);
    return createdDeal;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

/**
 * Update a deal's stage in the database via API
 * Note: In the database, the "stage" field is actually called "status"
 */
export const updateDealStage = async (id: string, stage: DealStage): Promise<Deal | null> => {
  try {
    if (!id) {
      console.error('Invalid deal ID provided to updateDealStage');
      throw new Error('Invalid deal ID');
    }
    
    if (!stage || !['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(stage)) {
      console.error(`Invalid stage value provided: "${stage}"`);
      throw new Error('Invalid stage value');
    }
    
    console.log(`Updating deal ${id} stage to ${stage} via API (mapped to status field in DB)`);
    
    // Prepare payload for API call - ensure we're sending what the API expects
    // The API might expect 'status' instead of 'stage'
    const payload = { 
      stage: stageToDatabaseStatus(stage),
      status: stageToDatabaseStatus(stage) // Include both for compatibility
    };
    console.log('Stage update payload:', payload);
    
    try {// First try the standard endpoint format
      try {
        const updatedDeal = await api.put<Deal>(`/deals/${id}/stage`, payload);
        console.log('Deal successfully updated:', updatedDeal);
        return updatedDeal;
      } catch (innerError: any) {
        // If the first attempt fails with a 404, try the alternative endpoint format
        if (innerError?.message?.includes('404')) {
          console.log('First endpoint attempt failed with 404, trying alternative endpoint');
          const updatedDeal = await api.put<Deal>(`/deals/${id}`, { stage, status: stageToDatabaseStatus(stage) });
          console.log('Deal successfully updated with alternative endpoint:', updatedDeal);
          return updatedDeal;
        }
        throw innerError;
      }
    } catch (error: any) {
      // Handle 404 specifically
      if (error?.message?.includes('404')) {
        console.error('Deal not found (404) in both endpoint attempts');
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating deal stage:', error);
    throw error;
  }
};

/**
 * Get a deal by ID from the database via API
 */
export const getDealById = async (id: string): Promise<Deal | null> => {
  try {
    console.log(`Getting deal ${id} via API`);
    
    // Use the improved API service
    try {
      const deal = await api.get<Deal>(`/deals/${id}`);
      return deal;
    } catch (error: any) {
      // Handle 404 specifically
      if (error?.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching deal by ID:', error);
    throw error;
  }
};
