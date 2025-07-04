/**
 * Database Configuration API
 * Provides endpoints to manage and test database configuration
 */

import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { getDatabaseConfig, updateDatabaseConfig } from '../services/postgres/configRepository.js';

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Skip auth if bypass header is present
  if (req.headers['x-bypass-auth'] === 'true' || req.headers['x-bypass-auth'] === 'development-only-123') {
    console.log('Authentication bypassed with development header');
    req.user = { uid: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'This operation requires administrator privileges' 
    });
  }
  next();
};

// GET /api/dbconfig - Get current database configuration
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = await getDatabaseConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching database config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve database configuration',
      error: error.message
    });
  }
});

// PUT /api/dbconfig - Update database configuration
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;
    
    // Validate required fields
    if (!host || !port || !database || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: host, port, database, and user are required'
      });
    }
    
    // Update the configuration
    const updatedConfig = await updateDatabaseConfig({ 
      host, 
      port: Number(port), 
      database, 
      user, 
      password, 
      ssl: Boolean(ssl) 
    });
    
    res.json({ 
      success: true, 
      message: 'Database configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating database config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update database configuration',
      error: error.message
    });
  }
});

// POST /api/dbconfig/test - Test connection with provided parameters
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;
    
    // Validate required fields
    if (!host || !port || !database || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields for connection test'
      });
    }
    
    // Configure test client
    const client = new pg.Client({
      host,
      port: Number(port),
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000 // 5 second timeout for quick feedback
    });
    
    console.log(`Testing database connection to ${host}:${port}/${database}`);
    
    // Attempt connection
    await client.connect();
    
    // Execute simple query to verify connection
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version');
    
    // Close connection
    await client.end();
    
    // Return success result
    res.json({
      success: true,
      message: 'Connection successful',
      data: {
        timestamp: result.rows[0].current_time,
        database: result.rows[0].db_name,
        version: result.rows[0].pg_version
      }
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    // Format user-friendly error message
    let errorMessage;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Could not connect to database server at ${req.body.host}:${req.body.port}`;
    } else if (error.code === '28P01') {
      errorMessage = 'Authentication failed: Invalid username or password';
    } else if (error.code === '3D000') {
      errorMessage = `Database "${req.body.database}" does not exist`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `Host "${req.body.host}" not found`;
    } else {
      errorMessage = `Connection error: ${error.message}`;
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
});

export default router;
