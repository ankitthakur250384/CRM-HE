/**
 * Enhanced PostgreSQL Config Repository
 * Handles database operations for all configuration settings using PostgreSQL
 */
import { db } from '../../lib/dbClient.js';

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
 * Resource rates interface
 */
export interface ResourceRatesConfig {
  foodRate: number;
  accommodationRate: number;
  transportRate: number;
  updatedAt?: string;
}

/**
 * Additional parameters interface
 */
export interface AdditionalParamsConfig {
  usageFactors: {
    normal: number;
    medium: number;
    heavy: number;
  };
  riskFactors: {
    low: number;
    medium: number;
    high: number;
  };
  shiftFactors: {
    single: number;
    double: number;
  };
  dayNightFactors: {
    day: number;
    night: number;
  };
  updatedAt?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIGS: { [key: string]: any } = {
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
 * For backward compatibility
 */
export const DEFAULT_QUOTATION_CONFIG = DEFAULT_CONFIGS.quotation;

/**
 * Get the quotation configuration from the database
 */
export const getQuotationConfig = async (): Promise<QuotationConfig> => {
  return getConfig<QuotationConfig>('quotation');
};

/**
 * Update the quotation configuration in the database
 */
export const updateQuotationConfig = async (config: Partial<QuotationConfig>): Promise<QuotationConfig> => {
  return updateConfig<QuotationConfig>('quotation', config);
};

/**
 * Generic function to get configuration by name
 */
export const getConfig = async <T>(configName: string): Promise<T> => {
  try {
    console.log(`Getting ${configName} config from PostgreSQL`);
    
    const result = await db.oneOrNone<{value: any, updated_at: string}>(
      `SELECT value, updated_at FROM config WHERE name = $1`,
      [configName]
    );
    
    if (result) {
      // Add updatedAt field for consistency
      return {
        ...(result.value as T),
        updatedAt: result.updated_at
      } as T;
    }
    
    // Return default config if not found
    if (DEFAULT_CONFIGS[configName]) {
      return {
        ...DEFAULT_CONFIGS[configName],
        updatedAt: new Date().toISOString()
      } as T;
    }
    
    return {} as T;
  } catch (error) {
    console.error(`Error fetching ${configName} config:`, error);
    return (DEFAULT_CONFIGS[configName] || {}) as T;
  }
};

/**
 * Generic function to update configuration by name
 */
export const updateConfig = async <T>(configName: string, configData: Partial<T>): Promise<T> => {
  try {
    console.log(`Updating ${configName} config in PostgreSQL:`, configData);
    
    // Get current config
    const currentConfig = await getConfig<T>(configName);
    
    // Remove updatedAt property before merging
    const { updatedAt, ...currentConfigData } = currentConfig as any;
    
    // Handle password for database config
    let configToMerge = configData;
    if (configName === 'database') {
      const typedData = configData as any;
      if (!typedData.password) {
        const { password, ...dataWithoutPassword } = typedData;
        configToMerge = dataWithoutPassword as Partial<T>;
      }
    }
    
    // Merge with new config
    const mergedConfig = {
      ...currentConfigData,
      ...configToMerge
    };
    
    // Update in database
    await db.none(
      `INSERT INTO config(name, value)
       VALUES($1, $2)
       ON CONFLICT (name) DO UPDATE
       SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [configName, mergedConfig]
    );
    
    // Get the updated record to return
    return await getConfig<T>(configName);
  } catch (error) {
    console.error(`Error updating ${configName} config:`, error);
    throw error;
  }
};

/**
 * Backward compatibility functions
 */
export const getAdditionalConfig = async (configName: string): Promise<any> => {
  return getConfig(configName);
};

export const updateAdditionalConfig = async (configName: string, configData: any): Promise<any> => {
  return updateConfig(configName, configData);
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
export const getResourceRatesConfig = async (): Promise<ResourceRatesConfig> => {
  return getConfig<ResourceRatesConfig>('resourceRates');
};

/**
 * Update resource rates configuration
 */
export const updateResourceRatesConfig = async (config: Partial<ResourceRatesConfig>): Promise<ResourceRatesConfig> => {
  return updateConfig<ResourceRatesConfig>('resourceRates', config);
};

/**
 * Get additional parameters configuration
 */
export const getAdditionalParamsConfig = async (): Promise<AdditionalParamsConfig> => {
  return getConfig<AdditionalParamsConfig>('additionalParams');
};

/**
 * Update additional parameters configuration
 */
export const updateAdditionalParamsConfig = async (config: Partial<AdditionalParamsConfig>): Promise<AdditionalParamsConfig> => {
  return updateConfig<AdditionalParamsConfig>('additionalParams', config);
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
  const config = await getConfig<DatabaseConfig>('database');
  // Remove password from result for security
  const { password, ...safeConfig } = config as any;
  return safeConfig as DatabaseConfig;
};

/**
 * Update database configuration
 */
export const updateDatabaseConfig = async (config: Partial<DatabaseConfig>): Promise<DatabaseConfig> => {
  return updateConfig<DatabaseConfig>('database', config);
};
