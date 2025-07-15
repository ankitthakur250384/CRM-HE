/**
 * PostgreSQL Config Repository
 * 
 * Handles database operations for all configuration settings using PostgreSQL
 */
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables
dotenv.config();

// Database connection options
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'asp_crm',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'vedant21',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create a pool connection
const pool = new pg.Pool(dbConfig);

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGS = {
  quotation: {
    orderTypeLimits: {
      micro: { minDays: 1, maxDays: 10 },
      small: { minDays: 11, maxDays: 25 },
      monthly: { minDays: 26, maxDays: 365 },
      yearly: { minDays: 366, maxDays: 3650 }
    }
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    ssl: false
  },
  resourceRates: {
    foodRate: 500,
    accommodationRate: 1000,
    transportRate: 25
  },
  additionalParams: {
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
  }
};

/**
 * Default quotation configuration
 */
export const DEFAULT_QUOTATION_CONFIG = DEFAULT_CONFIGS.quotation;

/**
 * Default database configuration
 */
export const DEFAULT_DATABASE_CONFIG = DEFAULT_CONFIGS.database;

/**
 * Generic function to get configuration by name
 */
export const getConfig = async (configName) => {
  try {
    console.log(`Getting ${configName} config from PostgreSQL`);
    
    const result = await pool.query(
      `SELECT value, updated_at FROM config WHERE name = $1`,
      [configName]
    );
    
    if (result.rows.length > 0) {
      // Add updatedAt field for consistency
      return {
        ...result.rows[0].value,
        updatedAt: result.rows[0].updated_at
      };
    }
    
    // Return default config if not found
    if (DEFAULT_CONFIGS[configName]) {
      return {
        ...DEFAULT_CONFIGS[configName],
        updatedAt: new Date().toISOString()
      };
    }
    
    return {};
  } catch (error) {
    console.error(`Error fetching ${configName} config:`, error);
    return (DEFAULT_CONFIGS[configName] || {});
  }
};

/**
 * Generic function to update configuration by name
 */
export const updateConfig = async (configName, configData) => {
  try {
    console.log(`Updating ${configName} config in PostgreSQL:`, configData);
    
    // Get current config
    const currentConfig = await getConfig(configName);
    
    // Remove updatedAt property before merging
    const { updatedAt, ...currentConfigData } = currentConfig;
    
    // Handle password for database config
    let configToMerge = configData;
    if (configName === 'database') {
      if (!configData.password) {
        const { password, ...dataWithoutPassword } = configData;
        configToMerge = dataWithoutPassword;
      }
    }
    
    // Merge with new config
    const mergedConfig = {
      ...currentConfigData,
      ...configToMerge
    };
      // Update in database
    // Convert the config object to a proper JSONB value for PostgreSQL
    await pool.query(
      `INSERT INTO config(name, value)
       VALUES($1, $2::jsonb)
       ON CONFLICT (name) DO UPDATE
       SET value = $2::jsonb, updated_at = CURRENT_TIMESTAMP`,
      [configName, JSON.stringify(mergedConfig)]
    );
    
    // Get the updated record to return
    return await getConfig(configName);
  } catch (error) {
    console.error(`Error updating ${configName} config:`, error);
    throw error;
  }
};

/**
 * Backward compatibility functions
 */
export const getAdditionalConfig = async (configName) => {
  return getConfig(configName);
};

export const updateAdditionalConfig = async (configName, configData) => {
  return updateConfig(configName, configData);
};

/**
 * Get quotation configuration
 */
export const getQuotationConfig = async () => {
  return getConfig('quotation');
};

/**
 * Update quotation configuration
 */
export const updateQuotationConfig = async (config) => {
  return updateConfig('quotation', config);
};

/**
 * Get database configuration
 */
export const getDatabaseConfig = async () => {
  const config = await getConfig('database');
  // Remove password from result for security
  const { password, ...safeConfig } = config;
  return safeConfig;
};

/**
 * Update database configuration
 */
export const updateDatabaseConfig = async (config) => {
  return updateConfig('database', config);
};

/**
 * Get default template configuration
 */
export const getDefaultTemplateConfig = async () => {
  try {
    console.log('Getting default template config from PostgreSQL');
    
    // Get config from database
    const configData = await getConfig('defaultTemplate');
    
    // If we have a default template ID, fetch the template details
    if (configData && configData.defaultTemplateId) {
      try {
        // Here we would normally fetch the template from the database
        // For now, we'll return just the template ID
        return {
          defaultTemplateId: configData.defaultTemplateId,
          defaultTemplate: await getTemplateById(configData.defaultTemplateId),
          updatedAt: configData.updatedAt || new Date().toISOString()
        };
      } catch (templateError) {
        console.error('Error fetching template details:', templateError);
      }
    }
    
    // Return empty config if nothing found
    return {
      defaultTemplateId: null,
      defaultTemplate: null
    };
  } catch (error) {
    console.error('Error fetching default template config:', error);
    return {
      defaultTemplateId: null,
      defaultTemplate: null
    };
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (templateId) => {
  try {
    console.log(`Getting template ${templateId} from PostgreSQL`);
    
    // For now, just return the default template
    const { defaultTemplate } = await getDefaultTemplateConfig();
    return defaultTemplate;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
};

/**
 * Get resource rates configuration
 */
export const getResourceRatesConfig = async () => {
  return getConfig('resourceRates');
};

/**
 * Update resource rates configuration
 */
export const updateResourceRatesConfig = async (config) => {
  return updateConfig('resourceRates', config);
};

/**
 * Get additional parameters configuration
 */
export const getAdditionalParamsConfig = async () => {
  return getConfig('additionalParams');
};

/**
 * Update additional parameters configuration
 */
export const updateAdditionalParamsConfig = async (config) => {
  return updateConfig('additionalParams', config);
};

/**
 * Update default template configuration
 */
export const updateDefaultTemplateConfig = async (templateId) => {
  try {
    console.log(`Updating default template to ${templateId} in PostgreSQL`);
    
    // Create config data with templateId
    const configData = {
      defaultTemplateId: templateId,
      updatedAt: new Date().toISOString()
    };
    
    // Update in database using the generic update function
    return await updateConfig('defaultTemplate', configData);
  } catch (error) {
    console.error('Error updating default template config:', error);
    throw error;
  }
};

/**
 * Cleanup function to close the database connection pool
 */
export const closeConfigDatabase = async () => {
  try {
    await pool.end();
    console.log('Config database connection pool closed.');
    return true;
  } catch (error) {
    console.error('Error closing config database connection:', error);
    return false;
  }
};
