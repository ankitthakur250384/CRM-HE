/**
 * PostgreSQL Lead Repository
 * Handles database operations for leads using PostgreSQL
 */
import { Lead, LeadStatus, LeadSource } from '../../types/lead';
import { api } from '../../lib/apiService';

/**
 * Get all leads from the database via API
 */
export const getLeads = async (): Promise<Lead[]> => {  try {
    console.log('Getting all leads via centralized API service');
    
    // DEVELOPMENT FALLBACK: Use local schema in development mode if API fails
    // This provides sample data when the API is unavailable
    if (import.meta.env.DEV) {
      console.log('🔧 DEV MODE: Attempting to get leads from API with fallback to local data');      try {
        // Try the API first - with specific debug info
        console.log('🔍 Attempting to fetch leads from API at: /leads');
        console.log('💡 TIP: API server should be running at http://localhost:3001/api');
        const leads = await api.get<Lead[]>('/leads');
        console.log(`✅ Successfully retrieved ${leads.length} leads from REAL DATABASE via API`);
        
        // Add a marker to indicate these are real database leads
        const markedLeads = leads.map(lead => ({
          ...lead,
          _source: 'database'
        }));
        
        console.log('%c ✅ USING REAL DATABASE DATA ✅ ', 
          'background: #4CAF50; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
        
        return markedLeads;
      } catch (error) {
        const apiError = error as Error;
        console.warn('⚠️ API request failed in dev mode, using MOCK DATA instead:', apiError.message);
        console.log('❓ To diagnose API connection issues, run: npm run diagnose');
        
        // Check if server is down vs other errors
        const isServerDown = apiError.message.includes('fetch failed') || 
                            apiError.message.includes('ECONNREFUSED') ||
                            apiError.message.includes('Failed to fetch');
        
        if (isServerDown) {
          console.error('🛑 API SERVER APPEARS TO BE DOWN. Run: npm run server:improved');
        } else {
          console.error('⚠️ API SERVER MIGHT BE RUNNING BUT RETURNED AN ERROR:', apiError.message);
        }
        
        try {
          // Use local schema as fallback
          console.log('Loading mock data schema...');
          const schema = await import('../../models/leads-schema.json');
          console.log(`✅ Loaded ${schema.leads.length} leads from MOCK DATA`);
          
          // Add a clear marker to indicate mock data
          const mockLeads = schema.leads.map(lead => ({
            ...lead,
            _source: 'mock_data',
            _mockFlag: true
          }));
          
          // Log a very clear message to the console
          console.log('%c ⚠️ USING MOCK LEAD DATA - NOT FROM DATABASE ⚠️ ', 
            'background: #FFA500; color: #000; font-size: 14px; font-weight: bold; padding: 5px;');
          console.log('%c 📋 RUN "npm run dev:full" TO START BOTH FRONTEND AND API TOGETHER 📋 ', 
            'background: #2196F3; color: white; font-size: 12px; font-weight: bold; padding: 5px;');
          
          return mockLeads as Lead[];
        } catch (schemaError) {
          console.error('❌ Failed to load mock data schema:', schemaError);
          throw apiError; // Re-throw the original API error
        }
      }
    }
    
    // Log the API endpoint being called
    console.log('Calling API endpoint: /leads');
    
    // Use the improved API service with extra debugging
    try {
      const leads = await api.get<Lead[]>('/leads');
      console.log(`Successfully retrieved ${leads.length} leads from API`);
      return leads;
    } catch (apiError) {
      console.error('API error in getLeads:', apiError);
      console.error('API error details:', JSON.stringify(apiError));
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * Create a new lead in the database via API
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  try {
    console.log('Creating lead via API:', lead);
    
    // Use the improved API service
    const createdLead = await api.post<Lead>('/leads', lead);
    return createdLead;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

/**
 * Update a lead's status in the database via API
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  try {
    console.log(`Updating lead ${id} status to ${status} via API`);
    
    // Use the improved API service
    try {
      const updatedLead = await api.put<Lead>(`/leads/${id}/status`, { status });
      return updatedLead;
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

/**
 * Update a lead's assignment in the database via API
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  try {
    // Log whether we're assigning or unassigning
    const actionType = salesAgentId === '' ? 'Unassigning' : 'Assigning';
    console.log(`${actionType} lead ${leadId} ${salesAgentId === '' ? '' : `to ${salesAgentName}`} via API`);
    
    // Use the improved API service
    try {
      const updatedLead = await api.put<Lead>(`/leads/${leadId}/assignment`, { 
        salesAgentId, 
        salesAgentName 
      });
      return updatedLead;
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating lead assignment:', error);
    throw error;
  }
};

/**
 * Get a lead by ID from the database via API
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    console.log(`Getting lead ${id} via API`);
    
    // Use the improved API service
    try {
      const lead = await api.get<Lead>(`/leads/${id}`);
      return lead;
    } catch (error: any) {
      // Handle 404 specifically
      if (error?.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    throw error;
  }
};