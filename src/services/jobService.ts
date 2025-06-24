/**
 * Job Service
 * 
 * This file serves as a wrapper around the PostgreSQL job repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as jobRepository from './postgres/jobRepository';
import * as equipmentRepository from './postgres/equipmentRepository';
import * as operatorRepository from './postgres/operatorRepository';
import { Job, JobStatus, Equipment as JobEquipment, Operator } from '../types/job';
import { Equipment as DatabaseEquipment } from '../types/equipment';
import { getLeadById } from './leadService';

// Get all jobs
export const getJobs = async (): Promise<Job[]> => {
  return jobRepository.getJobs();
};

// Get job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
  return jobRepository.getJobById(id);
};

// Get jobs for an operator
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  return jobRepository.getJobsByOperator(operatorId);
};

// Create job
export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  // If no customer name is provided, get it from the lead
  let customerName = jobData.customerName;
  if (!customerName && jobData.leadId) {
    const lead = await getLeadById(jobData.leadId);
    customerName = lead?.customerName || 'Unknown Customer';
  }
  
  // Create job with the updated customer name
  return jobRepository.createJob({
    ...jobData,
    customerName
  });
};

// Update job
export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job | null> => {
  return jobRepository.updateJob(id, updates);
};

// Update job status
export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job | null> => {
  return jobRepository.updateJobStatus(id, status);
};

// Helper function to adapt equipment type from database to job format
const adaptEquipmentToJobFormat = (equipment: DatabaseEquipment | null): JobEquipment | null => {
  if (!equipment) return null;
  
  return {
    id: equipment.id,
    name: equipment.name,
    type: equipment.category, // Map category to type
    description: equipment.description || '',
    baseRate: equipment.baseRates.monthly // Default to monthly rate
  };
};

// Get equipment by ID
export const getEquipmentById = async (id: string): Promise<JobEquipment | null> => {
  const equipment = await equipmentRepository.getEquipmentById(id);
  return adaptEquipmentToJobFormat(equipment);
};

// Get all equipment
export const getAllEquipment = async (): Promise<JobEquipment[]> => {
  const equipmentList = await equipmentRepository.getEquipment();
  return equipmentList.map(equipment => adaptEquipmentToJobFormat(equipment)!).filter(Boolean); // Filter out any null values (shouldn't happen, but for safety)
};

// Get operator by ID
export const getOperatorById = async (id: string): Promise<Operator | null> => {
  return operatorRepository.getOperatorById(id);
};

// Get all operators
export const getAllOperators = async (): Promise<Operator[]> => {
  return operatorRepository.getOperators();
};