/**
 * Quotation Service
 * 
 * This file serves as a wrapper around the PostgreSQL quotation repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as quotationRepository from './postgres/quotationRepository';
import { Quotation, QuotationInputs } from '../types/quotation';

// Extending the QuotationStatus type to match the Quotation status field
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

/**
 * Get all quotations
 */
export const getQuotations = async (): Promise<Quotation[]> => {
  return quotationRepository.getQuotations();
};

/**
 * Create a new quotation
 * @param quotationInputs - The quotation data
 * @param leadId - Optional lead ID
 * @param dealId - Optional deal ID
 * @param customerId - Optional customer ID
 * @param customerName - Optional customer name
 * @param customerContact - Optional customer contact details
 */
export const createQuotation = async (
  quotationInputs: QuotationInputs,
  leadId?: string,
  dealId?: string,
  customerId?: string,
  customerName?: string,
  customerContact?: any
): Promise<Quotation> => {
  try {
    // For future implementation - could fetch lead, deal and customer data here
    // if needed before passing to repository
  
    return quotationRepository.createQuotation({
      ...quotationInputs,
      leadId,
      dealId,
      customerId,
      customerName,
      customerContact
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

/**
 * Get a quotation by ID
 */
export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  return quotationRepository.getQuotationById(id);
};

/**
 * Update a quotation's status
 */
export const updateQuotationStatus = async (
  id: string, 
  status: QuotationStatus
): Promise<Quotation | null> => {
  return quotationRepository.updateQuotationStatus(id, status);
};

/**
 * Update a quotation's data
 */
export const updateQuotation = async (
  id: string,
  quotationData: Partial<Quotation>
): Promise<Quotation | null> => {
  return quotationRepository.updateQuotation(id, quotationData);
};

/**
 * Delete a quotation
 */
export const deleteQuotation = async (id: string): Promise<boolean> => {
  return quotationRepository.deleteQuotation(id);
};

/**
 * Get all quotations for a specific lead
 */
export const getQuotationsForLead = async (leadId: string): Promise<Quotation[]> => {
  console.log(`Getting quotations for lead ${leadId}`);
  const allQuotations = await getQuotations();
  return allQuotations.filter(quotation => quotation.leadId === leadId);
};
