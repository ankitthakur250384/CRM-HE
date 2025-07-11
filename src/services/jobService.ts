/**
 * Job Service
 * 
 * This file serves as a wrapper around the job API client.
 * It provides a clean interface for job-related operations.
 */

import { jobApiClient } from './jobApiClient';
import { Job, JobStatus, Equipment as JobEquipment, Operator } from '../types/job';
import { getLeadById } from './leadService';

// Get all jobs
export const getJobs = async (): Promise<Job[]> => {
  return jobApiClient.getAllJobs();
};

// Get job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
  return jobApiClient.getJobById(id);
};

// Get jobs for an operator
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  // This would need to be implemented in the API
  // For now, get all jobs and filter client-side
  const jobs = await getJobs();
  return jobs.filter(job => job.operatorIds && job.operatorIds.includes(operatorId));
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
  return jobApiClient.createJob({
    ...jobData,
    customerName
  });
};

// Update job
export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job | null> => {
  return jobApiClient.updateJob(id, updates);
};

// Update job status
export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job | null> => {
  return jobApiClient.updateJob(id, { status });
};

// Get all equipment
export const getAllEquipment = async (): Promise<JobEquipment[]> => {
  return jobApiClient.getAllEquipment();
};

// Get equipment by ID
export const getEquipmentById = async (id: string): Promise<JobEquipment | null> => {
  const equipmentList = await getAllEquipment();
  return equipmentList.find(eq => eq.id === id) || null;
};

// Get all operators
export const getAllOperators = async (): Promise<Operator[]> => {
  return jobApiClient.getAllOperators();
};