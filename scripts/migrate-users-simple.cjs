/**
 * Firestore to PostgreSQL Migration Script - Simple Version
 * 
 * This script migrates all documents from a Firestore collection 
 * called "users" to a PostgreSQL table with the same name.
 * All fields are converted to TEXT type for simplicity.
 */

// Load environment variables
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Firebase Admin SDK for Firestore access
const admin = require('firebase-admin');

// PostgreSQL client
const { Pool } = require('pg');

// Initialize Firebase Admin with service account
const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore
const db = admin.firestore();

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

/**
 * Flatten a nested object into a single-level object with dot notation
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    
    // Skip undefined or null values
    if (obj[key] === undefined || obj[key] === null) {
      return acc;
    }
    
    // Handle nested objects
    if (typeof obj[key] === 'object' && !(obj[key] instanceof Date) && !(obj[key] instanceof Array)) {
      if (obj[key] instanceof admin.firestore.Timestamp) {
        // Convert Firestore timestamp to ISO string
        acc[`${pre}${key}`] = obj[key].toDate().toISOString();
      } else {
        Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
      }
    } 
    // Handle arrays or other complex types by converting to JSON string
    else if (typeof obj[key] === 'object') {
      acc[`${pre}${key}`] = JSON.stringify(obj[key]);
    }
    // Convert all primitive values to strings
    else {
      acc[`${pre}${key}`] = String(obj[key]);
    }
    
    return acc;
  }, {});
}

/**
 * Create PostgreSQL table for users
 */
async function createUsersTableIfNotExists() {
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Users table already exists.');
      return;
    }

    // Create a simple users table with id as primary key and all other fields as TEXT
    const createTableSQL = `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        role TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        metadata TEXT
      );
    `;
    
    await pool.query(createTableSQL);
    console.log('Users table created successfully.');
    
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  }
}

/**
 * Insert a document into PostgreSQL
 */
async function insertUser(user) {
  try {
    const { id } = user;
    const data = user.data();
    
    // Format the data for insertion
    const timestamp = new Date().toISOString();
    
    // Handle special fields and convert timestamps
    const userData = {
      email: data.email || null,
      display_name: data.displayName || data.name || null,
      role: data.role || 'user',
      created_at: data.createdAt ? data.createdAt.toDate() : new Date(),
      updated_at: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      metadata: JSON.stringify(data) // Store the entire document as JSON for reference
    };
    
    // Insert the user
    const insertSQL = `
      INSERT INTO users (id, email, display_name, role, created_at, updated_at, metadata) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    
    const result = await pool.query(insertSQL, [
      id,
      userData.email,
      userData.display_name,
      userData.role,
      userData.created_at,
      userData.updated_at,
      userData.metadata
    ]);
    
    if (result.rows.length > 0) {
      console.log(`User ${id} inserted successfully.`);
    } else {
      console.log(`User ${id} already exists, skipped.`);
    }
    
  } catch (error) {
    console.error(`Error inserting user ${user.id}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateFirestoreUsersToPostgres() {
  try {
    console.log('Starting Firestore users migration to PostgreSQL...');
    
    // Create the users table if it doesn't exist
    await createUsersTableIfNotExists();
    
    // Get all users from Firestore
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore.`);
    
    // Process each user document
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersSnapshot.docs) {
      try {
        await insertUser(user);
        successCount++;
      } catch (error) {
        console.error(`Failed to migrate user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`
Migration summary:
- Total users found: ${usersSnapshot.size}
- Successfully migrated: ${successCount}
- Failed to migrate: ${errorCount}
`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await pool.end();
    console.log('PostgreSQL connection closed.');
    
    await admin.app().delete();
    console.log('Firebase connection closed.');
  }
}

// Run the migration
migrateFirestoreUsersToPostgres();
