/**
 * Config Service
 * 
 * This file serves as a wrapper around the PostgreSQL config repository.
 * It replaces the Firestore implementation and provides the same interface.
 */
import * as configRepository from './postgres/configRepository';
import { QuotationConfig } from './postgres/configRepository';

// Re-export the default configuration
export const DEFAULT_CONFIG: QuotationConfig = configRepository.DEFAULT_QUOTATION_CONFIG;

/**
 * Get quotation configuration
 */
export const getQuotationConfig = async (): Promise<QuotationConfig> => {
  return configRepository.getQuotationConfig();
};

/**
 * Update quotation configuration
 */
export const updateQuotationConfig = async (config: Partial<QuotationConfig>): Promise<QuotationConfig> => {
  return configRepository.updateQuotationConfig(config);
};

/**
 * Get additional configuration by name
 */
export const getConfig = async (configName: string): Promise<any> => {
  // Special handling for database config
  if (configName === 'database') {
    return configRepository.getDatabaseConfig();
  }
  return configRepository.getAdditionalConfig(configName);
};

/**
 * Update additional configuration by name
 */
export const updateConfig = async (configName: string, configData: any): Promise<any> => {
  // Special handling for database config
  if (configName === 'database') {
    return configRepository.updateDatabaseConfig(configData);
  }
  return configRepository.updateAdditionalConfig(configName, configData);
};

/**
 * Get default template configuration
 */
export const getDefaultTemplateConfig = async () => {
  return configRepository.getDefaultTemplateConfig();
};

/**
 * Get template by ID
 */
export const getTemplateById = async (templateId: string) => {
  return configRepository.getTemplateById(templateId);
};

/**
 * Get resource rates configuration
 */
export const getResourceRatesConfig = async () => {
  return configRepository.getResourceRatesConfig();
};

/**
 * Update resource rates configuration
 */
export const updateResourceRatesConfig = async (config: any) => {
  return configRepository.updateResourceRatesConfig(config);
};

/**
 * Get additional parameters configuration
 */
export const getAdditionalParamsConfig = async () => {
  return configRepository.getAdditionalParamsConfig();
};

/**
 * Update additional parameters configuration
 */
export const updateAdditionalParamsConfig = async (config: any) => {
  return configRepository.updateAdditionalParamsConfig(config);
};