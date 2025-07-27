/**
 * Leads API Routes
 * 
 * Handles all lead-related API endpoints with proper authentication,
 * error handling, and validation.
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import * as leadRepository from '../services/postgres/leadRepository.js';

const router = express.Router();

// Import authentication middleware from central file
// If the file doesn't exist yet, implement inline
import { authenticateToken } from '../authMiddleware.mjs';

/**
 * Wrap all repository calls in try/catch with proper error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`, error);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

/**
 * GET /leads - Get all leads
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const leads = await leadRepository.getLeads();
  res.json(leads);
}));

/**
 * GET /leads/:id - Get lead by ID
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const lead = await leadRepository.getLeadById(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
  }
  
  res.json(lead);
}));

/**
 * POST /leads - Create new lead
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  // Validate required fields - customerId is optional since it will be created/found automatically
  const requiredFields = ['customerName', 'email', 'serviceNeeded'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Missing required fields',
      fields: missingFields
    });
  }
  
  // Ensure status defaults to 'new' if not provided
  const leadData = {
    ...req.body,
    status: req.body.status || 'new'
  };
  
  const lead = await leadRepository.createLead(leadData);
  res.status(201).json(lead);
}));

/**
 * PATCH /leads/:id/status - Update lead status
 */
router.patch('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  const lead = await leadRepository.updateLeadStatus(req.params.id, status);
  
  if (!lead) {
    return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
  }
  
  res.json(lead);
}));

/**
 * PATCH /leads/:id/assign - Assign lead to sales agent
 */
router.patch('/:id/assign', authenticateToken, asyncHandler(async (req, res) => {
  const { salesAgentId, salesAgentName } = req.body;
  
  // Allow empty salesAgentId for unassignment (will be converted to null in repository)
  
  const lead = await leadRepository.updateLeadAssignment(
    req.params.id, 
    salesAgentId || '', // Pass empty string which will be handled in repository
    salesAgentName || 'Unassigned'
  );
  
  if (!lead) {
    return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
  }
  
  res.json(lead);
}));

/**
 * PUT /leads/:id - Update lead (complete update)
 */
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const leadId = req.params.id;
  const leadData = req.body;
  
  // Validate required fields (using frontend camelCase format)
  const requiredFields = ['companyName', 'customerName', 'phone', 'email'];
  const missingFields = requiredFields.filter(field => !leadData[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Missing required fields',
      fields: missingFields
    });
  }
  
  const updatedLead = await leadRepository.updateLead(leadId, leadData);
  
  if (!updatedLead) {
    return res.status(404).json({ message: `Lead with ID ${leadId} not found` });
  }
  
  res.json(updatedLead);
}));

export default router;
