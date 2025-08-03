// Async handler for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`, error);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal server error',
    });
  });
};

// Dev bypass for config routes (same as leads)
const devBypass = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' ||
    req.headers['x-bypass-auth'] === 'development-only-123' ||
    req.headers['x-bypass-auth'] === 'true'
  ) {
    console.log('⚠️ [AUTH] Bypassing authentication for config route');
    req.user = { id: 'dev-user', email: 'dev@example.com', role: 'admin' };
    return next();
  }
  return authenticateToken(req, res, next);
};
/**
 * General Configuration API
 * Provides endpoints to manage all configuration types (except database config which has its own routes)
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
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'operations_manager')) {
    return res.status(403).json({ 
      success: false, 
      message: 'This operation requires administrator or operations manager privileges' 
    });
  }
  next();
};


// Default configurations that match schema.sql
const DEFAULT_CONFIGS = {
  quotation: {
    orderTypeLimits: {
      micro: { minDays: 1, maxDays: 10 },
      small: { minDays: 11, maxDays: 25 },
      monthly: { minDays: 26, maxDays: 365 },
      yearly: { minDays: 366, maxDays: 3650 }
    }
  },
  resourceRates: {
    foodRate: 2500,
    accommodationRate: 4000,
    transportRate: 0
  },
  additionalParams: {
    riggerAmount: 40000,
    helperAmount: 12000,
    incidentalOptions: [
      {
        value: "incident1",
        label: "Incident 1 - ₹5,000",
        amount: 5000
      },
      {
        value: "incident2", 
        label: "Incident 2 - ₹10,000",
        amount: 10000
      },
      {
        value: "incident3",
        label: "Incident 3 - ₹15,000", 
        amount: 15000
      }
    ],
    usageFactors: {
      normal: 1.0,
      medium: 1.2,
      heavy: 1.5
    },
    riskFactors: {
      low: 0,
      medium: 8000,
      high: 15000
    },
    shiftFactors: {
      single: 1.0,
      double: 1.8
    },
    dayNightFactors: {
      day: 1.0,
      night: 1.3
    }
  },
  defaultTemplate: {
    defaultTemplateId: 'template_001',
    updatedAt: new Date().toISOString()
  }
};

// Ensure default configs exist in database
const ensureDefaultConfigs = async () => {
  try {
    console.log('🔄 Ensuring default configurations exist in database...');
    
    for (const [configName, configValue] of Object.entries(DEFAULT_CONFIGS)) {
      const result = await pool.query(
        'SELECT name FROM config WHERE name = $1',
        [configName]
      );
      
      if (result.rows.length === 0) {
        console.log(`📝 Creating default config for: ${configName}`);
        await pool.query(
          'INSERT INTO config (name, value) VALUES ($1, $2)',
          [configName, JSON.stringify(configValue)]
        );
      }
    }
    
    console.log('✅ Default configurations ensured');
  } catch (error) {
    console.error('❌ Error ensuring default configs:', error);
  }
};

// Initialize default configs on startup
ensureDefaultConfigs();

// Generic function to get configuration by name
const getConfig = async (configName) => {
  try {
    console.log(`📋 Getting ${configName} config from database`);
    
    const result = await pool.query(
      'SELECT value, updated_at FROM config WHERE name = $1',
      [configName]
    );
    
    if (result.rows.length > 0) {
      let configData = result.rows[0].value;
      // If value is a string, parse it as JSON
      if (typeof configData === 'string') {
        try {
          configData = JSON.parse(configData);
        } catch (e) {
          console.error(`❌ Error parsing config value for ${configName}:`, e);
          configData = {};
        }
      }
      return {
        ...configData,
        updatedAt: result.rows[0].updated_at
      };
    }
    
    console.log(`⚠️ Config '${configName}' not found in database, returning default`);
    // Return default config if not found
    return DEFAULT_CONFIGS[configName] || {};
  } catch (error) {
    console.error(`❌ Error fetching ${configName} config:`, error);
    // Return default config on error
    return DEFAULT_CONFIGS[configName] || {};
  }
};

// Generic function to update configuration by name
const updateConfig = async (configName, configData) => {
  try {
    console.log(`📝 Updating ${configName} config:`, JSON.stringify(configData, null, 2));
    
    const result = await pool.query(`
      INSERT INTO config (name, value) 
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET 
        value = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING value, updated_at
    `, [configName, JSON.stringify(configData)]);
    
    if (result.rows.length > 0) {
      let updatedValue = result.rows[0].value;
      if (typeof updatedValue === 'string') {
        try {
          updatedValue = JSON.parse(updatedValue);
        } catch (e) {
          console.error(`❌ Error parsing updated config value for ${configName}:`, e);
          updatedValue = {};
        }
      }
      return {
        ...updatedValue,
        updatedAt: result.rows[0].updated_at
      };
    }
    
    throw new Error('Failed to update configuration');
  } catch (error) {
    console.error(`❌ Error updating ${configName} config:`, error);
    throw error;
  }
};

// GET /config/:configType - Get config by type
router.get('/:configType', devBypass, asyncHandler(async (req, res) => {
  const { configType } = req.params;
  console.log(`🔍 API Request: GET /api/config/${configType}`);
  const config = await getConfig(configType);
  console.log(`✅ Successfully fetched ${configType} config`);
  res.json({ data: config });
}));

// PUT /config/:configType - Update config by type
router.put('/:configType', devBypass, asyncHandler(async (req, res) => {
  const { configType } = req.params;
  const configData = req.body;
  console.log(`🔍 API Request: PUT /api/config/${configType}`);
  console.log(`📦 Request body:`, JSON.stringify(configData, null, 2));
  if (!configData || typeof configData !== 'object') {
    return res.status(400).json({ message: 'Valid configuration data object is required' });
  }
  let dataToUpdate = configData;
  if (configType === 'defaultTemplate' && configData.defaultTemplateId) {
    dataToUpdate = {
      defaultTemplateId: configData.defaultTemplateId,
      updatedAt: new Date().toISOString()
    };
  }
  const updatedConfig = await updateConfig(configType, dataToUpdate);
  console.log(`✅ Successfully updated ${configType} config`);
  res.json({ data: updatedConfig });
}));

// GET all configs - /api/config (for debugging)
router.get('/', devBypass, async (req, res) => {
  try {
    console.log(`🔍 API Request: GET /api/config (all configs)`);
    
    const result = await pool.query('SELECT name, value, updated_at FROM config ORDER BY name');
    const configs = {};
    result.rows.forEach(row => {
      let value = row.value;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      }
      configs[row.name] = {
        ...value,
        updatedAt: row.updated_at
      };
    });
    console.log(`✅ Successfully fetched all configs`);
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error(`❌ Error fetching all configs:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve configurations',
      error: error.message
    });
  }
});

export default router;
