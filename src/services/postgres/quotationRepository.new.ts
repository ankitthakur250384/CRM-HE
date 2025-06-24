/**
 * PostgreSQL Quotation Repository
 * Handles database operations for quotations using PostgreSQL API
 */
import { Quotation, QuotationInputs } from '../../types/quotation';
import { api } from '../../lib/apiService'; 

// Using the status values directly
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

/**
 * Get all quotations from the database
 */
export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    console.log('Getting all quotations via API');
    const response = await api.get<Quotation[]>('/quotations');
    return response;
  } catch (error) {
    console.error('Error fetching quotations:', error);
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
    const response = await api.post<Quotation>(`/quotations/${id}/status`, { status });
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
