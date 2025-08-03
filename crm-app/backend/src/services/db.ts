// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only import pg-promise in Node.js environment
let pgp;
if (!isBrowser) {
  try {
    // Dynamic import to prevent browser from trying to load pg-promise
    const pgPromise = require('pg-promise');
    
    // Initialize pg-promise
    pgp = pgPromise({
      // Initialization options
      capSQL: true, // capitalize SQL queries
      
      // Global event notification;
      error: (error: any, e: any) => {
        if (e.cn) {
          // A connection-related error;
          console.error('DB Connection Error:', error);
        } else if (e.query) {
          // A query-related error;
          console.error('DB Query Error:', error);
        } else {
          // Generic DB error
          console.error('DB Error:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error importing pg-promise:', error);
  }
}

// Check for required environment variables
const requiredEnvVars = [
  'VITE_DB_HOST',
  'VITE_DB_PORT',
  'VITE_DB_NAME',
  'VITE_DB_USER',
  'VITE_DB_PASSWORD'
];

// Log missing environment variables
const missingEnvVars = requiredEnvVars.filter(
  varName => !process.env[varName]
);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file in the project root with these variables');
}

// Database connection config
const config = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  max: 30, // use up to 30 connections
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Increase timeout for network latency
  query_timeout: 10000,
  connectionTimeoutMillis: 10000,
};

// Create the database instance - only in Node.js environment
let db: any;
let pgpExport: any;

if (!isBrowser && pgp) {
  db = pgp(config);
  pgpExport = pgp;
  
  // Test connection
  db.connect()
    .then((obj: any) => {
      console.log('✅ Database connection successful');
      // Release the connection when done
      obj.done();
    })
    .catch((error: any) => {
      console.error('❌ Failed to connect to database:', error);
    });
} else {
  // In browser environment, use a mock implementation
  console.log('🌐 Browser environment detected, using mock DB client');
  
  // Export a mock db interface
  db = {
    oneOrNone: async () => null,
    one: async () => ({}),
    any: async () => [],
    none: async () => null,
    connect: async () => ({ done: () => {} }),
    query: async () => ({ rows: [], rowCount: 0 }),
    result: async () => ({ rowCount: 0 })
  };
  
  pgpExport = {
    as: {
      format: (text: string, _values: any) => text
    }
  };
}

export { db, pgpExport as pgp };

