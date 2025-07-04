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
let authenticateToken;
try {
  const authModule = await import('../authMiddleware.mjs');
  authenticateToken = authModule.authenticateToken;
  console.log('Using centralized authentication middleware');
} catch (e) {
  console.log('Creating inline authentication middleware');
  // Fallback inline implementation
  authenticateToken = (req, res, next) => {
    // Skip authentication check if we're in development mode with bypass header
    if (
      process.env.NODE_ENV === 'development' && 
      (
        req.headers['x-bypass-auth'] === 'development-only-123' ||
        req.headers['x-bypass-auth'] === 'true'
      )
    ) {
      console.log('⚠️ Bypassing authentication in development mode');
      req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development', (err, user) => {
      if (err) {
        console.log('❌ Invalid token:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      
      req.user = user;
      next();
    });
  };
}

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
  // Validate required fields
  const requiredFields = ['customerId', 'serviceNeeded', 'status'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Missing required fields',
      fields: missingFields
    });
  }
  
  const lead = await leadRepository.createLead(req.body);
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
  
  if (!salesAgentId) {
    return res.status(400).json({ message: 'Sales agent ID is required' });
  }
  
  const lead = await leadRepository.updateLeadAssignment(
    req.params.id, 
    salesAgentId, 
    salesAgentName || 'Unknown Agent'
  );
  
  if (!lead) {
    return res.status(404).json({ message: `Lead with ID ${req.params.id} not found` });
  }
  
  res.json(lead);
}));

export default router;
