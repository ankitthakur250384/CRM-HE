// Stub configRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const DEFAULT_CONFIGS = {
  quotation: {
    orderTypeLimits: {
      micro: { minDays: 1, maxDays: 10 },
      small: { minDays: 11, maxDays: 25 },
      monthly: { minDays: 26, maxDays: 365 },
      yearly: { minDays: 366, maxDays: 3650 }
    }
  }
};

export const getConfig = async (configName) => {
  try {
    const result = await db.oneOrNone('SELECT value FROM config WHERE name = $1', [configName]);
    return result ? result.value : DEFAULT_CONFIGS[configName] || {};
  } catch (error) {
    console.error(`Error fetching ${configName} config:`, error);
    return DEFAULT_CONFIGS[configName] || {};
  }
};

export const updateConfig = async (configName, configData) => {
  try {
    await db.none(
      'INSERT INTO config(name, value) VALUES($1, $2) ON CONFLICT (name) DO UPDATE SET value = $2',
      [configName, configData]
    );
    return await getConfig(configName);
  } catch (error) {
    console.error(`Error updating ${configName} config:`, error);
    throw error;
  }
};

export const getDatabaseConfig = async () => getConfig('database');
export const updateDatabaseConfig = async (config) => updateConfig('database', config);
