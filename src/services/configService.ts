/**
 * Config Service
 * 
 * This frontend service interfaces with the configuration API endpoints.
 * It handles fetching and updating configuration from the backend.
 */

// Define interfaces for our configuration types
export interface QuotationConfig {
  orderTypeLimits: {
    micro: { minDays: number; maxDays: number };
    small: { minDays: number; maxDays: number };
    monthly: { minDays: number; maxDays: number };
    yearly: { minDays: number; maxDays: number };
  };
  updatedAt?: string;
}

// Default fallback configurations
export const DEFAULT_CONFIG: QuotationConfig = {
  orderTypeLimits: {
    micro: { minDays: 1, maxDays: 10 },
    small: { minDays: 11, maxDays: 25 },
    monthly: { minDays: 26, maxDays: 365 },
    yearly: { minDays: 366, maxDays: 3650 }
  }
};

// Import shared getHeaders utility
import { getHeaders } from '../utils/apiHeaders';

/**
 * Get quotation configuration
 */
export const getQuotationConfig = async (): Promise<QuotationConfig> => {
  try {
    const response = await fetch('/api/config/quotation', {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quotation config: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error fetching quotation config:', error);
    return DEFAULT_CONFIG;
  }
};

/**
 * Update quotation configuration
 */
export const updateQuotationConfig = async (config: Partial<QuotationConfig>): Promise<QuotationConfig> => {
  try {
    const response = await fetch('/api/config/quotation', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    
    // Always log response for debugging
    console.log('Quotation config update response status:', response.status);
    
    const responseData = await response.json();
    console.log('Quotation config update response data:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || `Failed to update quotation config (${response.status})`);
    }
    
    return responseData.data;
  } catch (error) {
    console.error('Error updating quotation configuration:', error);
    throw error;
  }
};

/**
 * Get database configuration
 */
export const getDatabaseConfig = async (): Promise<any> => {
  try {
    const response = await fetch('/api/dbconfig', {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch database config: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || {};
  } catch (error) {
    console.error('Error fetching database config:', error);
    
    // Return sensible defaults on error
    return {
      host: 'localhost',
      port: 5432,
      database: 'asp_crm',
      user: 'postgres',
      ssl: false
    };
  }
};

/**
 * Update database configuration
 */
export const updateDatabaseConfig = async (configData: any): Promise<any> => {
  const response = await fetch('/api/dbconfig', {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(configData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update database config');
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Get additional configuration by name
 */
export const getConfig = async (configName: string): Promise<any> => {
  // Special handling for database config
  if (configName === 'database') {
    return getDatabaseConfig();
  }
  
  try {
    const response = await fetch(`/api/config/${configName}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${configName} config: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || {};
  } catch (error) {
    console.error(`Error fetching ${configName} config:`, error);
    return {};
  }
};

/**
 * Update additional configuration by name
 */
export const updateConfig = async (configName: string, configData: any): Promise<any> => {
  // Special handling for database config
  if (configName === 'database') {
    return updateDatabaseConfig(configData);
  }
  
  const response = await fetch(`/api/config/${configName}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(configData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update ${configName} config`);
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * Define interfaces for all configuration types
 */
export interface ResourceRatesConfig {
  foodRate: number;
  accommodationRate: number;
  transportRate: number;
  updatedAt?: string;
}

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

export interface TemplateConfig {
  defaultTemplateId: string | null;
  defaultTemplate: any | null;
}

/**
 * Get default template configuration
 */
export const getDefaultTemplateConfig = async (): Promise<TemplateConfig> => {
  try {
    const response = await fetch('/api/config/defaultTemplate', {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template config: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || {
      defaultTemplateId: null,
      defaultTemplate: null
    };
  } catch (error) {
    console.error('Error fetching default template:', error);
    return {
      defaultTemplateId: null,
      defaultTemplate: null
    };
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (templateId: string): Promise<any> => {
  try {
    const response = await fetch(`/api/config/templates/${templateId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
};

/**
 * Update default template configuration
 */
export const updateDefaultTemplateConfig = async (templateId: string): Promise<TemplateConfig> => {
  try {
    // Log the attempt
    console.log('Updating default template to:', templateId);
    
    const response = await fetch('/api/config/defaultTemplate', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ defaultTemplateId: templateId })
    });
    
    // Always log response for debugging
    console.log('Default template update response status:', response.status);
    
    const responseData = await response.json();
    console.log('Default template update response data:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || `Failed to update default template (${response.status})`);
    }
    
    return responseData.data || {
      defaultTemplateId: templateId,
      defaultTemplate: null
    };
  } catch (error) {
    console.error('Error updating default template:', error);
    throw error;
  }
};

/**
 * Get resource rates configuration
 */
export const getResourceRatesConfig = async (): Promise<ResourceRatesConfig> => {
  return getConfig('resourceRates');
};

/**
 * Update resource rates configuration
 */
export const updateResourceRatesConfig = async (config: Partial<ResourceRatesConfig>): Promise<ResourceRatesConfig> => {
  return updateConfig('resourceRates', config);
};

/**
 * Get additional parameters configuration
 */
export const getAdditionalParamsConfig = async (): Promise<AdditionalParamsConfig> => {
  return getConfig('additionalParams');
};

/**
 * Update additional parameters configuration
 */
export const updateAdditionalParamsConfig = async (config: Partial<AdditionalParamsConfig>): Promise<AdditionalParamsConfig> => {
  return updateConfig('additionalParams', config);
};