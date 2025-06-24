/**
 * PostgreSQL Config Repository
 * Handles database operations for configuration settings using PostgreSQL
 */
import { db } from '../../lib/dbClient';

/**
 * Quotation config interface
 */
export interface QuotationConfig {
  orderTypeLimits: {
    micro: {
      minDays: number;
      maxDays: number;
    };
    small: {
      minDays: number;
      maxDays: number;
    };
    monthly: {
      minDays: number;
      maxDays: number;
    };
    yearly: {
      minDays: number;
      maxDays: number;
    };
  };
  updatedAt?: string;
}

/**
 * Default quotation configuration
 */
export const DEFAULT_QUOTATION_CONFIG: QuotationConfig = {
  orderTypeLimits: {
    micro: {
      minDays: 1,
      maxDays: 10
    },
    small: {
      minDays: 11,
      maxDays: 25
    },
    monthly: {
      minDays: 26,
      maxDays: 365
    },
    yearly: {
      minDays: 366,
      maxDays: 3650
    }
  }
};

/**
 * Get the quotation configuration from the database
 */
export const getQuotationConfig = async (): Promise<QuotationConfig> => {
  try {
    console.log('Getting quotation config from PostgreSQL');
    
    const result = await db.oneOrNone<{value: any, updated_at: string}>(
      `SELECT value, updated_at FROM config WHERE name = $1`,
      ['quotation']
    );
    
    if (result) {
      return {
        ...(result.value as QuotationConfig),
        updatedAt: result.updated_at
      };
    }
    
    return {
      ...DEFAULT_QUOTATION_CONFIG,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching quotation config:', error);
    return DEFAULT_QUOTATION_CONFIG;
  }
};

/**
 * Update the quotation configuration in the database
 */
export const updateQuotationConfig = async (config: Partial<QuotationConfig>): Promise<QuotationConfig> => {
  try {
    console.log('Updating quotation config in PostgreSQL:', config);
    
    // Get current config
    const currentConfig = await getQuotationConfig();
    
    // Remove updatedAt property before merging
    const { updatedAt, ...currentConfigData } = currentConfig;
    
    // Merge with new config
    const mergedConfig = {
      ...currentConfigData,
      ...config
    };
    
    // Update in database
    await db.none(
      `INSERT INTO config(name, value)
       VALUES($1, $2)
       ON CONFLICT (name) DO UPDATE
       SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      ['quotation', mergedConfig]
    );
    
    // Get the updated record to return
    return await getQuotationConfig();
  } catch (error) {
    console.error('Error updating quotation config:', error);
    throw error;
  }
};

/**
 * Get additional configuration values from the database
 */
export const getAdditionalConfig = async (configName: string): Promise<any> => {
  try {
    console.log(`Getting ${configName} config from PostgreSQL`);
    
    // Special handling for known config types
    switch (configName) {
      case 'database':
        // Use the specific database config function
        return await getDatabaseConfig();
        
      case 'template':
        return {
          defaultTemplateId: 'template-1',
          updatedAt: new Date().toISOString()
        };
        
      default:
        // Generic config handling for other types
        const result = await db.oneOrNone<{value: any, updated_at: string}>(
          `SELECT value, updated_at FROM config WHERE name = $1`,
          [configName]
        );
        
        if (result) {
          return {
            ...result.value,
            updatedAt: result.updated_at
          };
        }
        
        return {
          updatedAt: new Date().toISOString()
        };
    }
  } catch (error) {
    console.error(`Error fetching ${configName} config:`, error);
    return {};
  }
};

/**
 * Update additional configuration values in the database
 */
export const updateAdditionalConfig = async (configName: string, configData: any): Promise<any> => {
  try {
    console.log(`Updating ${configName} config in PostgreSQL:`, configData);
    
    // Special handling for known config types
    switch (configName) {
      case 'database':
        // Use the specific database config update function
        return await updateDatabaseConfig(configData);
        
      default:
        // Get current config to merge with new values
        const currentConfig = await getAdditionalConfig(configName);
        
        // Remove the updatedAt from currentConfig before merging
        const { updatedAt, ...currentConfigWithoutTimestamp } = currentConfig;
        
        // Merge current and new config
        const mergedConfig = {
          ...currentConfigWithoutTimestamp,
          ...configData
        };
        
        // Update in database
        await db.none(
          `INSERT INTO config(name, value)
           VALUES($1, $2)
           ON CONFLICT (name) DO UPDATE
           SET value = $2, updated_at = CURRENT_TIMESTAMP`,
          [configName, mergedConfig]
        );
        
        // Return updated config
        return {
          ...mergedConfig,
          updatedAt: new Date().toISOString()
        };
    }
  } catch (error) {
    console.error(`Error updating ${configName} config:`, error);
    throw error;
  }
};

/**
 * Get default template configuration
 */
export const getDefaultTemplateConfig = async () => {
  try {
    console.log('Getting default template config from PostgreSQL');
    
    // Mock data for template config
    return {
      defaultTemplateId: 'template-1',
      defaultTemplate: {
        id: 'template-1',
        name: 'Standard Quotation Template',
        description: 'Default quotation template for all services',
        sections: [
          {
            id: 'header',
            type: 'header',
            content: 'ASP CRANES QUOTATION'
          },
          {
            id: 'customer-info',
            type: 'section',
            title: 'Customer Information',
            fields: ['customerName', 'customerContact']
          },
          {
            id: 'equipment-details',
            type: 'section',
            title: 'Equipment Details',
            fields: ['selectedEquipment', 'orderType', 'numberOfDays']
          },
          {
            id: 'pricing',
            type: 'section',
            title: 'Pricing Details',
            fields: ['totalRent', 'workingCost', 'mobDemobCost', 'foodAccomCost', 'extraCharges', 'gstAmount']
          },
          {
            id: 'terms',
            type: 'section',
            title: 'Terms and Conditions',
            content: 'Standard terms and conditions apply.'
          }
        ],
        createdAt: new Date('2023-01-01').toISOString(),
        updatedAt: new Date('2023-01-01').toISOString()
      }
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
export const getTemplateById = async (templateId: string) => {
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
  try {
    console.log('Getting resource rates config from PostgreSQL');
    
    // Mock resource rates data
    return {
      foodRate: 500, // per person per day
      accommodationRate: 1000, // per person per day
      transportRate: 25, // per km
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching resource rates config:', error);
    return {
      foodRate: 500,
      accommodationRate: 1000,
      transportRate: 25,
      updatedAt: new Date().toISOString()
    };
  }
};

/**
 * Update resource rates configuration
 */
export const updateResourceRatesConfig = async (config: any) => {
  try {
    console.log('Updating resource rates config in PostgreSQL:', config);
    
    // Merge with current config
    const currentConfig = await getResourceRatesConfig();
    
    // Return updated config with timestamp
    return {
      ...currentConfig,
      ...config,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating resource rates config:', error);
    throw error;
  }
};

/**
 * Get additional parameters configuration
 */
export const getAdditionalParamsConfig = async () => {
  try {
    console.log('Getting additional parameters config from PostgreSQL');    const result = await db.oneOrNone<{data: any, updated_at: string}>(
      `SELECT value as data, updated_at FROM config WHERE name = $1`,
      ['additional_params']
    );
    
    if (result) {
      return {
        ...result.data,
        updatedAt: result.updated_at
      };
    }
    
    // If no config found in DB, return default values
    const defaultConfig = {
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
      },
      updatedAt: new Date().toISOString()
    };
    
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching additional parameters config:', error);
    // Return default values if there's an error
    return {
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
      },
      updatedAt: new Date().toISOString()
    };
  }
};

/**
 * Update additional parameters configuration
 */
export const updateAdditionalParamsConfig = async (config: any) => {
  try {
    console.log('Updating additional parameters config in PostgreSQL:', config);
    
    // Get current config to merge with new values
    const currentConfig = await getAdditionalParamsConfig();
    
    // Remove the updatedAt from currentConfig before merging
    const { updatedAt, ...currentConfigWithoutTimestamp } = currentConfig;
    
    // Merge current and new config
    const mergedConfig = {
      ...currentConfigWithoutTimestamp,
      ...config
    };    // No need for config_id with the current schema
      // Update in database
    await db.none(
      `INSERT INTO config(name, value)
       VALUES($1, $2)
       ON CONFLICT (name) DO UPDATE
       SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      ['additional_params', mergedConfig]
    );
    
    // Get the updated record to return
    const updatedRecord = await getAdditionalParamsConfig();
    return updatedRecord;
  } catch (error) {
    console.error('Error updating additional parameters config:', error);
    throw error;
  }
};

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl: boolean;
  updatedAt?: string;
}

/**
 * Default database configuration
 */
export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'asp_crm',
  user: 'postgres',
  ssl: false
};

/**
 * Get database configuration
 */
export const getDatabaseConfig = async (): Promise<DatabaseConfig> => {
  try {
    console.log('Getting database config from PostgreSQL');
    
    const result = await db.oneOrNone<{value: any, updated_at: string}>(
      `SELECT value, updated_at FROM config WHERE name = $1`,
      ['database']
    );
    
    if (result) {
      // Remove password from result for security
      const { password, ...safeConfig } = result.value as DatabaseConfig;
      
      return {
        ...safeConfig,
        updatedAt: result.updated_at
      };
    }
    
    return {
      ...DEFAULT_DATABASE_CONFIG,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching database config:', error);
    return {
      ...DEFAULT_DATABASE_CONFIG,
      updatedAt: new Date().toISOString()
    };
  }
};

/**
 * Update database configuration
 */
export const updateDatabaseConfig = async (config: Partial<DatabaseConfig>): Promise<DatabaseConfig> => {
  try {
    console.log('Updating database config in PostgreSQL');
    
    // Get current config
    const currentConfig = await getDatabaseConfig();
    
    // Merge with new config
    const mergedConfig = {
      ...currentConfig,
      ...config
    };
    
    // Remove updatedAt from the object to store
    const { updatedAt, ...configToStore } = mergedConfig;
    
    // Upsert config
    await db.none(
      `INSERT INTO config (name, value, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE
       SET value = $2, updated_at = $3`,
      ['database', configToStore, new Date()]
    );
    
    // Return updated config (without password)
    const { password, ...safeConfig } = mergedConfig;
    return {
      ...safeConfig,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating database config:', error);
    throw error;
  }
};
