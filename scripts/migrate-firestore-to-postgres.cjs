/**
 * Firestore to PostgreSQL Migration Script
 * 
 * This script migrates all documents from a Firestore collection 
 * called "users" to a PostgreSQL table with the same name.
 * 
 * Features:
 * - Automatically extracts all fields from Firestore documents
 * - Dynamically constructs SQL statements based on document structure
 * - Creates the PostgreSQL table if it doesn't exist
 * - Handles nested fields by flattening them with dot notation
 * - Avoids duplicate inserts using ON CONFLICT DO NOTHING
 */

// Load environment variables
require('dotenv').config();
const path = require('path');

// Firebase Admin SDK for Firestore access
const admin = require('firebase-admin');

// PostgreSQL client
const { Pool } = require('pg');

// Helper for generating SQL
const format = require('pg-format');

// Initialize Firebase Admin with service account
// Note: You need a service account key file to access Firestore
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
 * Example: { address: { city: 'New York' } } becomes { 'address.city': 'New York' }
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    
    // Skip undefined or null values
    if (obj[key] === undefined || obj[key] === null) {
      return acc;
    }
    
    // Handle nested objects (but not arrays or dates)
    if (
      typeof obj[key] === 'object' && 
      !(obj[key] instanceof Date) && 
      !(obj[key] instanceof Array) &&
      !(obj[key] instanceof admin.firestore.Timestamp)
    ) {
      Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
    } 
    // Convert Firestore Timestamp to JavaScript Date
    else if (obj[key] instanceof admin.firestore.Timestamp) {
      acc[`${pre}${key}`] = obj[key].toDate();
    }
    // Handle arrays by converting them to JSON strings
    else if (obj[key] instanceof Array) {
      acc[`${pre}${key}`] = JSON.stringify(obj[key]);
    }
    // Regular value
    else {
      acc[`${pre}${key}`] = obj[key];
    }
    
    return acc;
  }, {});
}

/**
 * Map JavaScript types to PostgreSQL types
 */
function getPgType(value) {
  if (typeof value === 'string') return 'TEXT';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'INTEGER';
    return 'NUMERIC';
  }
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (value instanceof Date) return 'TIMESTAMP';
  
  // Default to TEXT for complex types (converted to JSON strings)
  return 'TEXT';
}

/**
 * Create PostgreSQL table based on document structure
 */
async function createTableIfNotExists(document, tableName) {
  try {
    // Add document ID to the fields
    const fieldsWithId = { 
      id: document.id,
      ...flattenObject(document.data())
    };
    
    // Generate column definitions based on field types
    const columnDefinitions = Object.entries(fieldsWithId)
      .map(([key, value]) => {
        // Make id the primary key
        if (key === 'id') {
          return `"${key}" TEXT PRIMARY KEY`;
        }
        return `"${key}" ${getPgType(value)}`;
      })
      .join(', ');

    // Create table SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columnDefinitions}
      )
    `;
    
    console.log(`Creating table ${tableName} if it doesn't exist...`);
    console.log('Table structure:', createTableSQL);
    
    await pool.query(createTableSQL);
    console.log(`Table ${tableName} is ready.`);
    
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

/**
 * Insert a document into PostgreSQL
 */
async function insertDocument(document, tableName) {
  try {
    // Flatten the document data and add the ID
    const flatData = { 
      id: document.id,
      ...flattenObject(document.data())
    };
    
    // Get column names and values
    const columns = Object.keys(flatData);
    const values = Object.values(flatData);
    
    // Generate placeholders for parameterized query
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Insert SQL with ON CONFLICT DO NOTHING to handle duplicates
    const insertSQL = `
      INSERT INTO ${tableName} ("${columns.join('", "')}") 
      VALUES (${placeholders})
      ON CONFLICT (id) DO NOTHING
    `;
    
    await pool.query(insertSQL, values);
    console.log(`Document ${document.id} inserted.`);
    
  } catch (error) {
    console.error(`Error inserting document ${document.id}:`, error);
    throw error;
  }
}

/**
 * Add any missing columns to the table
 */
async function addMissingColumns(document, tableName) {
  try {
    // Flatten the document data
    const flatData = flattenObject(document.data());
    
    // Get existing columns
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name.toLowerCase());
    
    // Find missing columns
    const missingColumns = Object.entries(flatData)
      .filter(([key]) => !existingColumns.includes(key.toLowerCase()))
      .map(([key, value]) => ({
        name: key,
        type: getPgType(value)
      }));
    
    // Add each missing column
    for (const column of missingColumns) {
      console.log(`Adding missing column "${column.name}" with type ${column.type}`);
      
      await pool.query(`
        ALTER TABLE ${tableName}
        ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type}
      `);
    }
    
    if (missingColumns.length > 0) {
      console.log(`Added ${missingColumns.length} new columns to ${tableName}`);
    }
    
  } catch (error) {
    console.error('Error adding missing columns:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateFirestoreToPostgres() {
  const tableName = 'users';
  const collectionName = 'users';
  
  try {
    console.log(`Starting migration from Firestore collection "${collectionName}" to PostgreSQL table "${tableName}"...`);
    
    // Get all documents from Firestore
    const snapshot = await db.collection(collectionName).get();
    
    console.log(`Found ${snapshot.size} documents in Firestore.`);
    
    if (snapshot.empty) {
      console.log('No documents to migrate.');
      return;
    }
    
    // Get the first document to create the table structure
    const firstDoc = snapshot.docs[0];
    
    // Create the table based on the first document's structure
    await createTableIfNotExists(firstDoc, tableName);
    
    // Process each document
    for (const doc of snapshot.docs) {
      // First check for and add any missing columns
      await addMissingColumns(doc, tableName);
      
      // Then insert the document
      await insertDocument(doc, tableName);
    }
    
    console.log(`Migration complete! ${snapshot.size} documents migrated to PostgreSQL.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the PostgreSQL connection
    await pool.end();
    console.log('PostgreSQL connection closed.');
    
    // Terminate Firebase App
    await admin.app().delete();
    console.log('Firebase connection closed.');
    
    // Exit process
    process.exit();
  }
}

// Run the migration
migrateFirestoreToPostgres();
