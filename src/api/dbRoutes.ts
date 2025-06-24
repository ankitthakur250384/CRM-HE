/**
 * API routes for database operations
 * This file provides a secure way for the frontend to make database queries
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../lib/realDbClient';

const router = express.Router();

// JWT secret from environment variables
const JWT_SECRET = process.env.VITE_JWT_SECRET || 'your-secure-jwt-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Database query endpoint
 */
router.post('/query', async (req, res) => {
  try {
    const { query, values, type } = req.body;
    
    if (!query || !type) {
      return res.status(400).json({ error: 'Query and type are required' });
    }
    
    // Very important: Perform validation and security checks on the query
    // This is a security risk if not properly handled
    if (query.toLowerCase().includes('delete') || 
        query.toLowerCase().includes('drop') || 
        query.toLowerCase().includes('truncate') ||
        query.toLowerCase().includes('alter')) {
      return res.status(403).json({ error: 'Forbidden query type' });
    }
    
    // Add additional authorization checks based on user role
    // For example, only allow admins to run certain queries
    
    // Execute query based on type
    let result;
    switch (type) {
      case 'oneOrNone':
        result = await db.oneOrNone(query, values);
        break;
      case 'one':
        result = await db.one(query, values);
        break;
      case 'any':
        result = await db.any(query, values);
        break;
      case 'none':
        await db.none(query, values);
        result = { success: true };
        break;
      case 'query':
        result = await db.query(query, values);
        break;
      default:
        return res.status(400).json({ error: 'Invalid query type' });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
});

export default router;
