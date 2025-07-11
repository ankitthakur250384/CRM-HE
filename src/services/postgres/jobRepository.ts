/**
 * PostgreSQL Job Repository
 * Handles database operations for jobs using PostgreSQL
 */
import { Job, JobStatus } from '../../types/job';
import { db } from '../../lib/db';

/**
 * Transform database row to camelCase format with populated equipment and operator IDs
 */
const transformJobRow = async (row: any): Promise<Job | null> => {
  if (!row) return null;
  
  // Fetch equipment IDs for this job
  const equipmentRows = await db.any('SELECT equipment_id FROM job_equipment WHERE job_id = $1', [row.id]);
  const equipmentIds = equipmentRows.map((e: any) => e.equipment_id);
  
  // Fetch operator IDs for this job
  const operatorRows = await db.any('SELECT operator_id FROM job_operators WHERE job_id = $1', [row.id]);
  const operatorIds = operatorRows.map((o: any) => o.operator_id);
  
  return {
    id: row.id,
    title: row.title,
    leadId: row.lead_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    equipmentIds: equipmentIds,
    operatorIds: operatorIds,
    dealId: row.deal_id,
    status: row.status,
    scheduledStartDate: row.scheduled_start_date,
    scheduledEndDate: row.scheduled_end_date,
    actualStartDate: row.actual_start_date,
    actualEndDate: row.actual_end_date,
    location: row.location,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedTo: row.assigned_to
  };
};

/**
 * Get all jobs from the database (real Postgres query)
 */
export const getJobs = async (): Promise<Job[]> => {
  try {
    const jobs = await db.any('SELECT * FROM jobs');
    const transformedJobs = await Promise.all(jobs.map(transformJobRow));
    return transformedJobs.filter(job => job !== null) as Job[];
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
    const jobs = await db.any('SELECT * FROM jobs WHERE customer_id = $1', [customerId]);
    const transformedJobs = await Promise.all(jobs.map(transformJobRow));
    return transformedJobs.filter(job => job !== null) as Job[];
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
    const jobs = await db.any('SELECT * FROM jobs WHERE lead_id = $1', [leadId]);
    const transformedJobs = await Promise.all(jobs.map(transformJobRow));
    return transformedJobs.filter(job => job !== null) as Job[];
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
    const jobs = await db.any('SELECT * FROM jobs WHERE deal_id = $1', [dealId]);
    const transformedJobs = await Promise.all(jobs.map(transformJobRow));
    return transformedJobs.filter(job => job !== null) as Job[];
  } catch (error) {
    console.error(`Error fetching jobs for deal ${dealId}:`, error);
    throw error;
  }
};

/**
 * Get jobs for a specific operator
 */
export const getJobsByOperator = async (operatorId: string): Promise<Job[]> => {
  try {
    const jobs = await db.any(`
      SELECT j.* FROM jobs j
      JOIN job_operators jo ON j.id = jo.job_id
      WHERE jo.operator_id = $1
    `, [operatorId]);
    const transformedJobs = await Promise.all(jobs.map(transformJobRow));
    return transformedJobs.filter(job => job !== null) as Job[];
  } catch (error) {
    console.error(`Error fetching jobs for operator ${operatorId}:`, error);
    throw error;
  }
};

/**
 * Get a job by ID (real Postgres query)
 */
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    const job = await db.oneOrNone('SELECT * FROM jobs WHERE id = $1', [id]);
    return job ? await transformJobRow(job) : null;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new job (real Postgres query)
 */
export const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  try {
    // Start a transaction
    const result = await db.tx(async (t: any) => {
      // Create the job first
      const job = await t.one(
        `INSERT INTO jobs (title, deal_id, lead_id, customer_id, customer_name, location, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [jobData.title, jobData.dealId, jobData.leadId, jobData.customerId, jobData.customerName, jobData.location, jobData.scheduledStartDate, jobData.scheduledEndDate, jobData.actualStartDate, jobData.actualEndDate, jobData.status, jobData.notes, jobData.createdBy]
      );

      // Insert equipment associations
      if (jobData.equipmentIds && jobData.equipmentIds.length > 0) {
        for (const equipmentId of jobData.equipmentIds) {
          await t.none('INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2)', [job.id, equipmentId]);
        }
      }

      // Insert operator associations
      if (jobData.operatorIds && jobData.operatorIds.length > 0) {
        for (const operatorId of jobData.operatorIds) {
          await t.none('INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2)', [job.id, operatorId]);
        }
      }

      return job;
    });

    // Transform and return the complete job
    const transformedJob = await transformJobRow(result);
    return transformedJob as Job;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Update a job (real Postgres query)
 */
export const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job | null> => {
  try {
    const result = await db.tx(async (t: any) => {
      // Extract equipmentIds and operatorIds from jobData
      const { equipmentIds, operatorIds, ...dbJobData } = jobData;
      
      // Update the job record if there are database fields to update
      let updatedJob = null;
      if (Object.keys(dbJobData).length > 0) {
        const fields = Object.keys(dbJobData);
        const values = Object.values(dbJobData);
        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        const query = `UPDATE jobs SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
        updatedJob = await t.oneOrNone(query, [id, ...values]);
      } else {
        // If no direct job fields to update, just fetch the current job
        updatedJob = await t.oneOrNone('SELECT * FROM jobs WHERE id = $1', [id]);
      }
      
      if (!updatedJob) return null;

      // Update equipment associations if provided
      if (equipmentIds !== undefined) {
        // Remove existing associations
        await t.none('DELETE FROM job_equipment WHERE job_id = $1', [id]);
        // Add new associations
        if (equipmentIds.length > 0) {
          for (const equipmentId of equipmentIds) {
            await t.none('INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2)', [id, equipmentId]);
          }
        }
      }

      // Update operator associations if provided
      if (operatorIds !== undefined) {
        // Remove existing associations
        await t.none('DELETE FROM job_operators WHERE job_id = $1', [id]);
        // Add new associations
        if (operatorIds.length > 0) {
          for (const operatorId of operatorIds) {
            await t.none('INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2)', [id, operatorId]);
          }
        }
      }

      return updatedJob;
    });

    // Transform and return the complete job
    return result ? await transformJobRow(result) : null;
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
 * Delete a job (real Postgres query)
 */
export const deleteJob = async (id: string): Promise<boolean> => {
  try {
    const result = await db.result('DELETE FROM jobs WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    throw error;
  }
};

/**
 * CRUD for job_equipment
 */
export const getJobEquipment = async (jobId: string) => {
  return db.any('SELECT * FROM job_equipment WHERE job_id = $1', [jobId]);
};
export const addJobEquipment = async (jobId: string, equipmentId: string) => {
  return db.one('INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2) RETURNING *', [jobId, equipmentId]);
};
export const removeJobEquipment = async (jobId: string, equipmentId: string) => {
  const result = await db.result('DELETE FROM job_equipment WHERE job_id = $1 AND equipment_id = $2', [jobId, equipmentId]);
  return result.rowCount > 0;
};

/**
 * CRUD for job_operators
 */
export const getJobOperators = async (jobId: string) => {
  return db.any('SELECT * FROM job_operators WHERE job_id = $1', [jobId]);
};
export const addJobOperator = async (jobId: string, operatorId: string) => {
  return db.one('INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2) RETURNING *', [jobId, operatorId]);
};
export const removeJobOperator = async (jobId: string, operatorId: string) => {
  const result = await db.result('DELETE FROM job_operators WHERE job_id = $1 AND operator_id = $2', [jobId, operatorId]);
  return result.rowCount > 0;
};
