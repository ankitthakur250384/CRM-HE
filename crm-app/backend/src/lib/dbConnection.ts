/**
 * PostgreSQL Database Connection Utility
 * 
 * This module provides a centralized connection to the PostgreSQL database
 * using the node-postgres library. It creates and manages a connection pool
 * that can be reused across the application.
 * 
 * In browser environments, this module provides a mock implementation.
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Load environment variables from .env file (server-side only)
if (!isBrowser) {
  dotenv.config();
}

// Get database configuration from environment variables
const dbConfig: PoolConfig = {
  host: isBrowser ? 'localhost' : (process.env.VITE_DB_HOST || process.env.VITE_DB_HOST || 'localhost'),
  port: parseInt(isBrowser ? '5432' : (process.env.VITE_DB_PORT || process.env.VITE_DB_PORT || '5432')),
  database: isBrowser ? 'asp_crm' : (process.env.VITE_DB_NAME || process.env.VITE_DB_NAME || 'asp_crm'),
  user: isBrowser ? 'postgres' : (process.env.VITE_DB_USER || process.env.VITE_DB_USER || 'postgres'),
  password: isBrowser ? 'postgres' : (process.env.VITE_DB_PASSWORD || process.env.VITE_DB_PASSWORD || 'postgres'),
  ssl: isBrowser ? false : ((process.env.VITE_DB_SSL || process.env.VITE_DB_SSL) === 'true' ? true : false),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a singleton connection pool
const pool = new Pool(dbConfig);

// In browser, log a warning
if (isBrowser) {
  console.warn('PostgreSQL connection is not available in browser environment. This is a mock implementation.');
}

// Log when the pool establishes a new connection
pool.on('connect', () => {
  console.log('PostgreSQL pool connection established');
});

// Log any errors from the pool
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a SQL query against the database
 * 
 * @param text The SQL query to execute
 * @param params The parameters to pass to the query
 * @returns A promise that resolves to the query result
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

/**
 * Get a client from the pool for transaction support
 * 
 * @returns A pooled client that can be used for transactions
 */
export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release;
  
  // Override the release method to log when a client is released back to the pool
  client.release = () => {
    console.log('PostgreSQL client released back to pool');
    originalRelease.apply(client);
  };
  
  return client;
};

/**
 * Health check function to test database connectivity
 * 
 * @returns A promise that resolves if the connection is successful, rejects otherwise
 */
export const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW()');
    return { 
      status: 'ok', 
      timestamp: result.rows[0].now,
      connection: 'PostgreSQL connection established'
    };
  } catch (error) {
    console.error('Database health check failed', error);
    throw new Error(`Database connection failed: ${(error as Error).message}`);
  }
};

// Export the pool for use in other modules
export default pool;

