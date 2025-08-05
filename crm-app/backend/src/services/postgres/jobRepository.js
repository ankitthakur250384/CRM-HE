// Stub jobRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const getJobs = async () => {
  try {
    const jobs = await db.any('SELECT * FROM jobs ORDER BY created_at DESC');
    return jobs;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

export const getJobById = async (id) => {
  try {
    return await db.oneOrNone('SELECT * FROM jobs WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    return null;
  }
};

export const createJob = async (jobData) => {
  try {
    const result = await db.one(
      'INSERT INTO jobs (title, description, status) VALUES ($1, $2, $3) RETURNING *',
      [jobData.title, jobData.description, jobData.status || 'pending']
    );
    return result;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const updateJob = async (id, jobData) => {
  try {
    const result = await db.one(
      'UPDATE jobs SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *',
      [jobData.title, jobData.description, jobData.status, id]
    );
    return result;
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
};

export const deleteJob = async (id) => {
  try {
    await db.none('DELETE FROM jobs WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

export const getJobEquipment = async (jobId) => {
  try {
    return await db.any('SELECT * FROM job_equipment WHERE job_id = $1', [jobId]);
  } catch (error) {
    console.error('Error fetching job equipment:', error);
    return [];
  }
};

export const addJobEquipment = async (jobId, equipmentId) => {
  try {
    const result = await db.one(
      'INSERT INTO job_equipment (job_id, equipment_id) VALUES ($1, $2) RETURNING *',
      [jobId, equipmentId]
    );
    return result;
  } catch (error) {
    console.error('Error adding job equipment:', error);
    throw error;
  }
};

export const removeJobEquipment = async (jobId, equipmentId) => {
  try {
    await db.none('DELETE FROM job_equipment WHERE job_id = $1 AND equipment_id = $2', [jobId, equipmentId]);
  } catch (error) {
    console.error('Error removing job equipment:', error);
    throw error;
  }
};

export const getJobOperators = async (jobId) => {
  try {
    return await db.any('SELECT * FROM job_operators WHERE job_id = $1', [jobId]);
  } catch (error) {
    console.error('Error fetching job operators:', error);
    return [];
  }
};

export const addJobOperator = async (jobId, operatorId) => {
  try {
    const result = await db.one(
      'INSERT INTO job_operators (job_id, operator_id) VALUES ($1, $2) RETURNING *',
      [jobId, operatorId]
    );
    return result;
  } catch (error) {
    console.error('Error adding job operator:', error);
    throw error;
  }
};

export const removeJobOperator = async (jobId, operatorId) => {
  try {
    await db.none('DELETE FROM job_operators WHERE job_id = $1 AND operator_id = $2', [jobId, operatorId]);
  } catch (error) {
    console.error('Error removing job operator:', error);
    throw error;
  }
};
