/**
 * API routes for job scheduling (jobs, job_equipment, job_operators)
 */
import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, getJobEquipment, addJobEquipment, removeJobEquipment, getJobOperators, addJobOperator, removeJobOperator } from '../services/postgres/jobRepository.js';
import { createJobActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.ts';

const router = express.Router();

const getErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

// Get all jobs
router.get('/', async (_req, res) => {
  try {
    const jobs = await getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const job = await createJob(req.body);
    
    // Create activity for job creation
    try {
      await createJobActivity(
        job.customerName,
        'created',
        job.createdBy || 'System'
      );
    } catch (activityError) {
      console.error('Error creating activity:', activityError);
      // Don't fail the job creation if activity creation fails
    }
    
    // Create notification for operations manager and assigned operator
    try {
      // Notify operations manager
      await createNotification({
        userId: job.createdBy || 'admin', // Could be improved to find actual ops manager
        type: 'job_created',
        title: 'Job Created',
        message: `New job scheduled for ${job.customerName}`,
        link: `/jobs/${job.id}`
      });
      
      // Notify assigned operators
      if (job.operatorIds && job.operatorIds.length > 0) {
        for (const operatorId of job.operatorIds) {
          await createNotification({
            userId: operatorId,
            type: 'job_assigned',
            title: 'Job Assigned',
            message: `You have been assigned to a job for ${job.customerName}`,
            link: `/jobs/${job.id}`
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
      // Don't fail the job creation if notification creation fails
    }
    
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await updateJob(req.params.id, req.body);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteJob(req.params.id);
    if (!success) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Job Equipment endpoints
router.get('/:id/equipment', async (req, res) => {
  try {
    const equipment = await getJobEquipment(req.params.id);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.post('/:id/equipment', async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const result = await addJobEquipment(req.params.id, equipmentId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.delete('/:id/equipment/:equipmentId', async (req, res) => {
  try {
    const success = await removeJobEquipment(req.params.id, req.params.equipmentId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// Job Operators endpoints
router.get('/:id/operators', async (req, res) => {
  try {
    const operators = await getJobOperators(req.params.id);
    res.json(operators);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.post('/:id/operators', async (req, res) => {
  try {
    const { operatorId } = req.body;
    const result = await addJobOperator(req.params.id, operatorId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});
router.delete('/:id/operators/:operatorId', async (req, res) => {
  try {
    const success = await removeJobOperator(req.params.id, req.params.operatorId);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
