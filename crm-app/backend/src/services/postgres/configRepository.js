import { db } from '../../lib/dbClient.js';

// Track database connection status
let dbConnectionAvailable = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Test database connection
const testDbConnection = async () => {
  const now = Date.now();
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return dbConnectionAvailable;
  }
  
  try {
    await db.one('SELECT 1');
    dbConnectionAvailable = true;
    lastConnectionCheck = now;
    return true;
  } catch (error) {
    dbConnectionAvailable = false;
    lastConnectionCheck = now;
    console.log('📵 Database connection not available, using default configs');
    return false;
  }
};

export const DEFAULT_CONFIGS = {
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
      { value: "incident1", label: "Incident 1 - ₹5,000", amount: 5000 },
      { value: "incident2", label: "Incident 2 - ₹10,000", amount: 10000 },
      { value: "incident3", label: "Incident 3 - ₹15,000", amount: 15000 }
    ],
    usageFactors: { normal: 1.0, medium: 1.2, heavy: 1.5 },
    riskFactors: { low: 0, medium: 8000, high: 15000 },
    shiftFactors: { single: 1.0, double: 1.8 },
    dayNightFactors: { day: 1.0, night: 1.3 }
  },
  defaultTemplate: {
    defaultTemplateId: 'qtpl_a650c77a',
    updatedAt: new Date().toISOString()
  },
  database: {
    host: 'postgres',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    ssl: false
  }
};

export const getConfig = async (configName) => {
  console.log(`🔍 Getting ${configName} config`);
  
  // Check database connection first
  const isDbAvailable = await testDbConnection();
  
  if (!isDbAvailable) {
    console.log(`� Using default config for ${configName} (DB unavailable)`);
    return DEFAULT_CONFIGS[configName] || {};
  }
  
  try {
    const result = await db.oneOrNone('SELECT value, updated_at FROM config WHERE name = $1', [configName]);
    
    if (result) {
      let configValue = result.value;
      if (typeof configValue === 'string') {
        try {
          configValue = JSON.parse(configValue);
        } catch (e) {
          configValue = DEFAULT_CONFIGS[configName] || {};
        }
      }
      return { ...configValue, updatedAt: result.updated_at };
    }
    
    return DEFAULT_CONFIGS[configName] || {};
  } catch (error) {
    console.error(`Error fetching ${configName}:`, error);
    dbConnectionAvailable = false; // Mark DB as unavailable
    return DEFAULT_CONFIGS[configName] || {};
  }
};

export const updateConfig = async (configName, configData) => {
  console.log(`📝 Updating ${configName} config`);
  
  // Check database connection first
  const isDbAvailable = await testDbConnection();
  
  if (!isDbAvailable) {
    throw new Error('Database connection not available for config updates');
  }
  
  try {
    const result = await db.one(`
      INSERT INTO config (name, value) VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING value, updated_at
    `, [configName, JSON.stringify(configData)]);
    
    let updatedValue = result.value;
    if (typeof updatedValue === 'string') {
      try {
        updatedValue = JSON.parse(updatedValue);
      } catch (e) {
        updatedValue = configData;
      }
    }
    
    return { ...updatedValue, updatedAt: result.updated_at };
  } catch (error) {
    console.error(`Error updating ${configName}:`, error);
    dbConnectionAvailable = false; // Mark DB as unavailable
    throw error;
  }
};

export const getAllConfigs = async () => {
  // Check database connection first
  const isDbAvailable = await testDbConnection();
  
  if (!isDbAvailable) {
    console.log('📝 Using default configs (DB unavailable)');
    return DEFAULT_CONFIGS;
  }
  
  try {
    const result = await db.any('SELECT name, value, updated_at FROM config ORDER BY name');
    const configs = {};
    
    result.forEach(row => {
      let value = row.value;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      }
      configs[row.name] = { ...value, updatedAt: row.updated_at };
    });
    
    return configs;
  } catch (error) {
    console.error('Error fetching all configs:', error);
    dbConnectionAvailable = false; // Mark DB as unavailable
    return DEFAULT_CONFIGS;
  }
};

export const initializeDefaultConfigs = async () => {
  try {
    console.log('🔄 Initializing default configurations...');
    
    for (const [configName, configValue] of Object.entries(DEFAULT_CONFIGS)) {
      const existing = await db.oneOrNone('SELECT name FROM config WHERE name = $1', [configName]);
      
      if (!existing) {
        await db.none('INSERT INTO config (name, value) VALUES ($1, $2)', [configName, JSON.stringify(configValue)]);
      }
    }
    
    console.log('✅ Default configurations initialized');
  } catch (error) {
    console.error('Error initializing configs:', error);
    throw error;
  }
};

export const getDatabaseConfig = () => getConfig('database');
export const updateDatabaseConfig = (config) => updateConfig('database', config);
