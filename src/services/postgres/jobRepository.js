/**
 * Job Repository
 * Handles database operations for jobs using JavaScript/ES modules
 */

import { query } from '../../lib/dbConnection.js';

/**
 * Transform database row to camelCase format with populated equipment and operator IDs
 */
const transformJobRow = async (row) => {
  if (!row) return null;
  
  try {
    // Fetch equipment IDs for this job
    const equipmentResult = await query('SELECT equipment_id FROM job_equipment WHERE job_id = $1', [row.id]);
    const equipmentIds = equipmentResult.rows.map(e => e.equipment_id);
    
    // Fetch operator IDs for this job
    const operatorResult = await query('SELECT operator_id FROM job_operators WHERE job_id = $1', [row.id]);
    const operatorIds = operatorResult.rows.map(o => o.operator_id);
    
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
  } catch (error) {
    console.error('Error transforming job row:', error);
    // Return basic job structure without equipment/operator IDs if transform fails
    return {
      id: row.id,
      title: row.title,
      leadId: row.lead_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      equipmentIds: [],
      operatorIds: [],
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
  }
};

/**
 * Get all jobs from the database
 */
export const getJobs = async () => {
  try {
    const result = await query('SELECT * FROM jobs ORDER BY created_at DESC');
    const transformedJobs = await Promise.all(result.rows.map(transformJobRow));
    return transformedJobs.filter(job => job !== null);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * Get a job by ID
 */
export const getJobById = async (id) => {
  try {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] ? await transformJobRow(result.rows[0]) : null;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new job
 */
export const createJob = async (jobData) => {
  try {
    // For simplicity, create job first, then add associations
    const jobResult = await query(
      `INSERT INTO jobs (title, deal_id, lead_id, customer_id, customer_name, location, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [jobData.title, jobData.dealId, jobData.leadId, jobData.customerId, jobData.customerName, jobData.location, jobData.scheduledStartDate, jobData.scheduledEndDate, jobData.actualStartDate, jobData.actualEndDate, jobData.status, jobData.notes, jobData.createdBy]
    );
    
    const newJob = jobResult.rows[0];
    
    // Insert equipment associations
    if (jobData.equipmentIds && jobData.equipmentIds.length > 0) {
      for (const equipmentId of jobData.equipmentIds) {
        await query('INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2)', [newJob.id, equipmentId]);
      }
    }
    
    // Insert operator associations
    if (jobData.operatorIds && jobData.operatorIds.length > 0) {
      for (const operatorId of jobData.operatorIds) {
        await query('INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2)', [newJob.id, operatorId]);
      }
    }
    
    // Transform and return the complete job
    return await transformJobRow(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Update a job
 */
export const updateJob = async (id, jobData) => {
  try {
    // Extract equipmentIds and operatorIds from jobData
    const { equipmentIds, operatorIds, ...dbJobData } = jobData;
    
    let updatedJob = null;
    
    // Update the job record if there are database fields to update
    if (Object.keys(dbJobData).length > 0) {
      const fields = Object.keys(dbJobData);
      const values = Object.values(dbJobData);
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const sql = `UPDATE jobs SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
      
      const result = await query(sql, [id, ...values]);
      updatedJob = result.rows[0];
    } else {
      // If no direct job fields to update, just fetch the current job
      const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
      updatedJob = result.rows[0];
    }
    
    if (!updatedJob) return null;
    
    // Update equipment associations if provided
    if (equipmentIds !== undefined) {
      // Remove existing associations
      await query('DELETE FROM job_equipment WHERE job_id = $1', [id]);
      // Add new associations
      if (equipmentIds.length > 0) {
        for (const equipmentId of equipmentIds) {
          await query('INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2)', [id, equipmentId]);
        }
      }
    }
    
    // Update operator associations if provided
    if (operatorIds !== undefined) {
      // Remove existing associations
      await query('DELETE FROM job_operators WHERE job_id = $1', [id]);
      // Add new associations
      if (operatorIds.length > 0) {
        for (const operatorId of operatorIds) {
          await query('INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2)', [id, operatorId]);
        }
      }
    }
    
    return await transformJobRow(updatedJob);
  } catch (error) {
    console.error(`Error updating job ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a job
 */
export const deleteJob = async (id) => {
  try {
    const result = await query('DELETE FROM jobs WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    throw error;
  }
};

/**
 * Job Equipment operations
 */
export const getJobEquipment = async (jobId) => {
  try {
    const result = await query('SELECT * FROM job_equipment WHERE job_id = $1', [jobId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching job equipment for ${jobId}:`, error);
    throw error;
  }
};

export const addJobEquipment = async (jobId, equipmentId) => {
  try {
    const result = await query(
      'INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2) RETURNING *',
      [jobId, equipmentId]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error adding equipment to job ${jobId}:`, error);
    throw error;
  }
};

export const removeJobEquipment = async (jobId, equipmentId) => {
  try {
    const result = await query(
      'DELETE FROM job_equipment WHERE job_id = $1 AND equipment_id = $2',
      [jobId, equipmentId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error removing equipment from job ${jobId}:`, error);
    throw error;
  }
};

/**
 * Job Operators operations
 */
export const getJobOperators = async (jobId) => {
  try {
    const result = await query('SELECT * FROM job_operators WHERE job_id = $1', [jobId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching job operators for ${jobId}:`, error);
    throw error;
  }
};

export const addJobOperator = async (jobId, operatorId) => {
  try {
    const result = await query(
      'INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2) RETURNING *',
      [jobId, operatorId]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error adding operator to job ${jobId}:`, error);
    throw error;
  }
};

export const removeJobOperator = async (jobId, operatorId) => {
  try {
    const result = await query(
      'DELETE FROM job_operators WHERE job_id = $1 AND operator_id = $2',
      [jobId, operatorId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error removing operator from job ${jobId}:`, error);
    throw error;
  }
};
