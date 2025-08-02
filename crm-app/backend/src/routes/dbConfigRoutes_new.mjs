/**
 * Database Configuration API
 * Provides endpoints to manage and test database configuration
 * Direct database implementation for reliability
 */

import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../authMiddleware.mjs';

dotenv.config();

const router = express.Router();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
  database: process.env.DB_NAME || process.env.PGDATABASE || 'asp_crm',
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'crmdb@21',
  ssl: (process.env.DB_SSL === 'true' || process.env.PGSSL === 'true') ? { rejectUnauthorized: false } : false
};

// Create database pool
const pool = new pg.Pool(dbConfig);

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

// Development bypass for auth (non-production only)
const isDev = process.env.NODE_ENV !== 'production';
const devBypass = (req, res, next) => {
  if (isDev) {
    console.log(`🔓 DEV MODE: Bypassing auth for ${req.method} ${req.path}`);
    return next();
  }
  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

// Default database configuration
const DEFAULT_DATABASE_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  ssl: false
  // Note: password is never returned for security
};

// Ensure default database config exists
const ensureDefaultDatabaseConfig = async () => {
  try {
    console.log('🔄 Ensuring default database configuration exists...');
    
    const result = await pool.query(
      'SELECT name FROM config WHERE name = $1',
      ['database']
    );
    
    if (result.rows.length === 0) {
      console.log('📝 Creating default database config');
      await pool.query(
        'INSERT INTO config (name, value) VALUES ($1, $2)',
        ['database', JSON.stringify(DEFAULT_DATABASE_CONFIG)]
      );
    }
    
    console.log('✅ Default database configuration ensured');
  } catch (error) {
    console.error('❌ Error ensuring default database config:', error);
  }
};

// Initialize default database config on startup
ensureDefaultDatabaseConfig();

// GET /api/dbconfig - Get current database configuration
router.get('/', devBypass, async (req, res) => {
  try {
    console.log('🔍 API Request: GET /api/dbconfig');
    
    const result = await pool.query(
      'SELECT value, updated_at FROM config WHERE name = $1',
      ['database']
    );
    
    let config;
    if (result.rows.length > 0) {
      config = {
        ...result.rows[0].value,
        updatedAt: result.rows[0].updated_at
      };
    } else {
      config = {
        ...DEFAULT_DATABASE_CONFIG,
        updatedAt: new Date().toISOString()
      };
    }
    
    // Remove password from response for security
    delete config.password;
    
    console.log('✅ Successfully fetched database config');
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('❌ Error fetching database config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve database configuration',
      error: error.message
    });
  }
});

// PUT /api/dbconfig - Update database configuration
router.put('/', devBypass, async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;
    
    console.log('🔍 API Request: PUT /api/dbconfig');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!host || !port || !database || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: host, port, database, and user are required'
      });
    }
    
    // Prepare configuration data
    const configData = {
      host: String(host),
      port: Number(port),
      database: String(database),
      user: String(user),
      ssl: Boolean(ssl)
    };
    
    // Only include password if provided
    if (password && password.trim() !== '') {
      configData.password = String(password);
    }
    
    // Update the configuration in database
    const result = await pool.query(`
      INSERT INTO config (name, value) 
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET 
        value = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING value, updated_at
    `, ['database', JSON.stringify(configData)]);
    
    if (result.rows.length > 0) {
      const updatedConfig = {
        ...result.rows[0].value,
        updatedAt: result.rows[0].updated_at
      };
      
      // Remove password from response
      delete updatedConfig.password;
      
      console.log('✅ Successfully updated database config');
      res.json({ 
        success: true, 
        message: 'Database configuration updated successfully',
        data: updatedConfig
      });
    } else {
      throw new Error('Failed to update database configuration');
    }
  } catch (error) {
    console.error('❌ Error updating database config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update database configuration',
      error: error.message
    });
  }
});

// POST /api/dbconfig/test - Test connection with provided parameters
router.post('/test', devBypass, async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;
    
    console.log('🔍 API Request: POST /api/dbconfig/test');
    
    // Validate required fields
    if (!host || !port || !database || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields for database test'
      });
    }
    
    // Create test connection
    const testConfig = {
      host: String(host),
      port: Number(port),
      database: String(database),
      user: String(user),
      password: password ? String(password) : undefined,
      ssl: Boolean(ssl) ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000, // 5 second timeout
      idleTimeoutMillis: 3000
    };
    
    console.log('🧪 Testing database connection...');
    
    // Test the connection
    const testPool = new pg.Pool(testConfig);
    
    try {
      const testResult = await testPool.query('SELECT 1 as connection_test, version() as postgres_version');
      await testPool.end();
      
      console.log('✅ Database connection test successful');
      res.json({
        success: true,
        message: 'Database connection successful',
        data: {
          connected: true,
          version: testResult.rows[0].postgres_version,
          host: host,
          port: port,
          database: database
        }
      });
    } catch (testError) {
      await testPool.end();
      throw testError;
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

export default router;
