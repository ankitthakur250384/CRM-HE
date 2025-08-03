/**
 * Real database client that connects to PostgreSQL
 * This is used by server-side code and API routes
 */

// Using proper path for pg-promise import
import pgPromise from './pg-promise-server.js';

// Initialize pg-promise with options
const pgp = pgPromise({
  // Initialization options
});

// Database connection details from environment variables
const config = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create the database instance
const db = pgp(config);

// Export the database instance
export default db;

