/**
 * DEPRECATED: Migration from Firestore to PostgreSQL has been completed
 * This file is kept for reference only and is not used in the application
 */

// import { db as pgDb } from '../lib/db.js'; // Removed unused import
import { runMigrations } from './schema.js';

/**
 * Run database migrations to set up the PostgreSQL schema
 */
export const setupDatabase = async () => {
  try {
    console.log('Setting up PostgreSQL database...');
    await runMigrations();
    console.log('Database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
};

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during database setup:', err);
      process.exit(1);
    });
}
