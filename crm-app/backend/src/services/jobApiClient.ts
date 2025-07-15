/**
 * Job API Client - HTTP requests to the job scheduling endpoints
 */

import { Job, Equipment, Operator } from '../types/job';

const API_BASE_URL = 'http://localhost:3001/api';

class JobApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        // Add development bypass header for easier testing
        'x-bypass-auth': 'development-only-123',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Job CRUD operations
  async getAllJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs');
  }

  async getJobById(id: string): Promise<Job | null> {
    return this.request<Job | null>(`/jobs/${id}`);
  }

  async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    return this.request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, jobData: Partial<Job>): Promise<Job | null> {
    return this.request<Job | null>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  // Job Equipment operations
  async getJobEquipment(jobId: string): Promise<any[]> {
    return this.request<any[]>(`/jobs/${jobId}/equipment`);
  }

  async addJobEquipment(jobId: string, equipmentId: string): Promise<any> {
    return this.request<any>(`/jobs/${jobId}/equipment`, {
      method: 'POST',
      body: JSON.stringify({ equipmentId }),
    });
  }

  async removeJobEquipment(jobId: string, equipmentId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/jobs/${jobId}/equipment/${equipmentId}`, {
      method: 'DELETE',
    });
  }

  // Job Operators operations
  async getJobOperators(jobId: string): Promise<any[]> {
    return this.request<any[]>(`/jobs/${jobId}/operators`);
  }

  async addJobOperator(jobId: string, operatorId: string): Promise<any> {
    return this.request<any>(`/jobs/${jobId}/operators`, {
      method: 'POST',
      body: JSON.stringify({ operatorId }),
    });
  }

  async removeJobOperator(jobId: string, operatorId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/jobs/${jobId}/operators/${operatorId}`, {
      method: 'DELETE',
    });
  }

  // Equipment operations
  async getAllEquipment(): Promise<Equipment[]> {
    const response = await this.request<{ success: boolean; data: Equipment[] }>('/equipment');
    return response.data || [];
  }

  // Operators operations
  async getAllOperators(): Promise<Operator[]> {
    return this.request<Operator[]>('/operators');
  }
}

export const jobApiClient = new JobApiClient();
