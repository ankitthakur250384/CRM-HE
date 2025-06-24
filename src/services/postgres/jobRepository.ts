/**
 * PostgreSQL Job Repository
 * Handles database operations for jobs using PostgreSQL
 */
import { Job, JobStatus } from '../../types/job';

/**
 * Get all jobs from the database
 */
export const getJobs = async (): Promise<Job[]> => {
  try {
    console.log('Getting all jobs from PostgreSQL');
    
    // Mock data for development
    return [
      {
        id: 'job-1',
        title: 'Mobile Crane Installation',
        dealId: 'deal-1',
        leadId: 'lead-1',
        customerId: 'customer-1',
        customerName: 'ABC Construction',
        equipmentIds: ['eq-1'],
        operatorIds: ['op-1', 'op-2'],
        location: {
          address: '123 Main St, Anytown',
          coordinates: {
            latitude: 18.52043,
            longitude: 73.85674
          }
        },
        scheduledStartDate: new Date('2025-07-10').toISOString(),
        scheduledEndDate: new Date('2025-07-20').toISOString(),
        actualStartDate: new Date('2025-07-10').toISOString(),
        actualEndDate: null,
        status: 'in_progress',
        notes: 'Regular communication with site manager required',
        createdBy: 'ops-uid-789',
        createdAt: new Date('2025-06-15').toISOString(),
        updatedAt: new Date('2025-07-10').toISOString(),
        assignedTo: 'ops-uid-789'
      },
      {
        id: 'job-2',
        title: 'Tower Crane Setup',
        dealId: 'deal-2',
        leadId: 'lead-2',
        customerId: 'customer-2',
        customerName: 'XYZ Developers',
        equipmentIds: ['eq-2'],
        operatorIds: ['op-3'],
        location: {
          address: '456 Oak Ave, Somewhere',
          coordinates: {
            latitude: 18.53043,
            longitude: 73.86674
          }
        },
        scheduledStartDate: new Date('2025-07-25').toISOString(),
        scheduledEndDate: new Date('2025-08-15').toISOString(),
        actualStartDate: null,
        actualEndDate: null,
        status: 'scheduled',
        notes: 'Special permits required for this job',
        createdBy: 'ops-uid-789',
        createdAt: new Date('2025-06-20').toISOString(),
        updatedAt: new Date('2025-06-20').toISOString(),
        assignedTo: 'ops-uid-789'
      },
      {
        id: 'job-3',
        title: 'Crawler Crane Operation',
        dealId: 'deal-3',
        leadId: 'lead-3',
        customerId: 'customer-3',
        customerName: 'Metro Infrastructure',
        equipmentIds: ['eq-3'],
        operatorIds: ['op-4', 'op-5'],
        location: {
          address: '789 Park Rd, Bigcity',
          coordinates: {
            latitude: 18.54043,
            longitude: 73.87674
          }
        },
        scheduledStartDate: new Date('2025-06-05').toISOString(),
        scheduledEndDate: new Date('2025-06-15').toISOString(),
        actualStartDate: new Date('2025-06-05').toISOString(),
        actualEndDate: new Date('2025-06-18').toISOString(),
        status: 'completed',
        notes: 'Project completed with slight delay due to weather',
        createdBy: 'ops-uid-789',
        createdAt: new Date('2025-05-20').toISOString(),
        updatedAt: new Date('2025-06-18').toISOString(),
        assignedTo: 'ops-uid-789'
      }
    ];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * Get jobs for a specific customer
 */
export const getJobsForCustomer = async (customerId: string): Promise<Job[]> => {
  try {
    console.log(`Getting jobs for customer ${customerId} from PostgreSQL`);
    
    const jobs = await getJobs();
    return jobs.filter(job => job.customerId === customerId);
  } catch (error) {
    console.error(`Error fetching jobs for customer ${customerId}:`, error);
    throw error;
  }
};

/**
 * Get jobs for a specific lead
 */
export const getJobsForLead = async (leadId: string): Promise<Job[]> => {
  try {
    console.log(`Getting jobs for lead ${leadId} from PostgreSQL`);
    
    const jobs = await getJobs();
    return jobs.filter(job => job.leadId === leadId);
  } catch (error) {
    console.error(`Error fetching jobs for lead ${leadId}:`, error);
    throw error;
  }
};

/**
 * Get jobs for a specific deal
 */
export const getJobsForDeal = async (dealId: string): Promise<Job[]> => {
  try {
    console.log(`Getting jobs for deal ${dealId} from PostgreSQL`);
    
    const jobs = await getJobs();
    return jobs.filter(job => job.dealId === dealId);
  } catch (error) {
    console.error(`Error fetching jobs for deal ${dealId}:`, error);
    throw error;
  }
};

/**
 * Get a job by ID
 */
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    console.log(`Getting job ${id} from PostgreSQL`);
    
    const jobs = await getJobs();
    const job = jobs.find(j => j.id === id);
    
    return job || null;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new job
 */
export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  try {
    console.log('Creating job in PostgreSQL:', jobData);
    
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newJob;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Update a job
 */
export const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job | null> => {
  try {
    console.log(`Updating job ${id} in PostgreSQL`);
    
    const job = await getJobById(id);
    
    if (!job) {
      return null;
    }
    
    const updatedJob = {
      ...job,
      ...jobData,
      updatedAt: new Date().toISOString()
    };
    
    return updatedJob;
  } catch (error) {
    console.error(`Error updating job ${id}:`, error);
    throw error;
  }
};

/**
 * Update a job's status
 */
export const updateJobStatus = async (id: string, status: JobStatus): Promise<Job | null> => {
  try {
    console.log(`Updating job ${id} status to ${status} in PostgreSQL`);
    
    return updateJob(id, { status });
  } catch (error) {
    console.error(`Error updating job ${id} status:`, error);
    throw error;
  }
};

/**
 * Delete a job
 */
export const deleteJob = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting job ${id} from PostgreSQL`);
    
    // In a real implementation, we would delete from the database
    // For this mock, we just return true to indicate success
    
    return true;
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    throw error;
  }
};

/**
 * Get jobs for a specific operator
 */
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  try {
    console.log(`Getting jobs for operator ${operatorId} from PostgreSQL`);
    
    const jobs = await getJobs();
    return jobs.filter(job => job.operatorIds && job.operatorIds.includes(operatorId));
  } catch (error) {
    console.error(`Error fetching jobs for operator ${operatorId}:`, error);
    throw error;
  }
};
