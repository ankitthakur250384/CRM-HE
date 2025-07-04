/**
 * Equipment API Routes
 * Handles CRUD operations for equipment
 * Uses repository pattern to separate database logic from route handling
 */

import express from 'express';
import dotenv from 'dotenv';

// Import authentication middleware and equipment repository
import { authenticateToken } from '../authMiddleware.mjs';
import * as equipmentRepository from '../services/postgres/equipmentRepository.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize equipment table when server starts
try {
  equipmentRepository.initializeEquipmentTable();
} catch (error) {
  console.error('Failed to initialize equipment table:', error);
}

// Wrap all repository calls in try/catch with proper error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// GET all equipment
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const equipment = await equipmentRepository.getAllEquipment();
  res.json({
    success: true,
    data: equipment
  });
}));

// GET equipment by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const equipment = await equipmentRepository.getEquipmentById(req.params.id);
  
  if (!equipment) {
    return res.status(404).json({ 
      success: false,
      message: `Equipment with ID ${req.params.id} not found` 
    });
  }
  
  res.json({
    success: true,
    data: equipment
  });
}));

// CREATE equipment
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  // Validate required fields
  const requiredFields = ['name', 'type'];
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      fields: missingFields
    });
  }
  
  const equipment = await equipmentRepository.createEquipment(req.body);
  
  res.status(201).json({
    success: true,
    data: equipment
  });
}));

// UPDATE equipment
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const equipment = await equipmentRepository.updateEquipment(req.params.id, req.body);
  
  if (!equipment) {
    return res.status(404).json({ 
      success: false,
      message: `Equipment with ID ${req.params.id} not found` 
    });
  }
  
  res.json({
    success: true,
    data: equipment
  });
}));

// DELETE equipment
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const deleted = await equipmentRepository.deleteEquipment(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ 
      success: false,
      message: `Equipment with ID ${req.params.id} not found or could not be deleted` 
    });
  }
  
  res.json({
    success: true,
    message: `Equipment ${req.params.id} deleted successfully`
  });
}));

export default router;
