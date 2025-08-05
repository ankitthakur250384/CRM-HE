// Enhanced PostgreSQL Config Repository using centralized db client
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
    console.log(`🔍 Getting ${configName} config from database...`);
    const result = await db.oneOrNone('SELECT value FROM config WHERE name = $1', [configName]);
    if (result) {
      console.log(`✅ Config found: ${configName}`);
      return result.value;
    }
    console.log(`📝 Using default config for: ${configName}`);
    return DEFAULT_CONFIGS[configName] || {};
  } catch (error) {
    console.error(`❌ Error fetching ${configName} config:`, error);
    return DEFAULT_CONFIGS[configName] || {};
  }
};

export const updateConfig = async (configName, configData) => {
  try {
    console.log(`📝 Updating ${configName} config in database...`);
    await db.none(
      'INSERT INTO config(name, value) VALUES($1, $2) ON CONFLICT (name) DO UPDATE SET value = $2, updated_at = NOW()',
      [configName, configData]
    );
    console.log(`✅ Config updated: ${configName}`);
    return await getConfig(configName);
  } catch (error) {
    console.error(`❌ Error updating ${configName} config:`, error);
    throw error;
  }
};

export const getDatabaseConfig = async () => getConfig('database');
export const updateDatabaseConfig = async (config) => updateConfig('database', config);
