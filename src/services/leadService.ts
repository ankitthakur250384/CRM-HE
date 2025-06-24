/**
 * Lead Service
 * 
 * This file serves as a wrapper around the PostgreSQL lead repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as leadRepository from './postgres/leadRepository';
import { Lead, LeadStatus } from '../types/lead';

/**
 * Get all leads
 */
export const getLeads = async (): Promise<Lead[]> => {
  return leadRepository.getLeads();
};

/**
 * Get a lead by ID
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  return leadRepository.getLeadById(id);
};

/**
 * Create a new lead
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  return leadRepository.createLead(lead);
};

/**
 * Update a lead's status
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  return leadRepository.updateLeadStatus(id, status);
};

/**
 * Update a lead's assignment
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  return leadRepository.updateLeadAssignment(leadId, salesAgentId, salesAgentName);
};