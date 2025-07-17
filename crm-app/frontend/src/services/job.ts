import { getHeaders } from './apiHeaders';
// Get a job by its ID from the backend API
export async function getJobById(jobId: string): Promise<Job> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/jobs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch job by ID');
  }
  return response.json();
}
// API client object for job-related functions
export const jobApiClient = {
  getJobsByOperator,
  getEquipmentById,
  getAllEquipment,
  getJobs,
  getAllOperators,
  createJob,
};
// Create a new job via backend API
export async function createJob(job: Partial<Job>): Promise<Job> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/jobs`, {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to create job');
  }
  return response.json();
}
// Fetch jobs by operator from backend API
export async function getJobsByOperator(operatorId: string): Promise<Job[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs?operatorId=${encodeURIComponent(operatorId)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs by operator');
  return await res.json();
}
// Fetch equipment by ID from backend API
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/equipment/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch equipment by id');
  return await res.json();
}
// Fetch all equipment from backend API
export async function getAllEquipment(): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/equipment`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch equipment');
  return await res.json();
}
// Fetch all jobs from backend API
export async function getJobs(): Promise<Job[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/jobs`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return await res.json();
}
// Fetch all operators from backend API
export async function getAllOperators(): Promise<Operator[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${apiUrl}/operators`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch operators');
  return await res.json();
}
export type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type OperatorAvailability = 'available' | 'assigned' | 'on_leave' | 'inactive';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
  baseRate: number;
}

export interface Operator {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  certifications?: string[];
  availability?: OperatorAvailability;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobLocation {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  }
}

export interface Job {
  id: string;
  title: string;
  leadId: string;
  customerId: string;
  customerName: string;
  equipmentIds: string[];
  operatorIds: string[];
  dealId?: string;
  status: JobStatus;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  location: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}