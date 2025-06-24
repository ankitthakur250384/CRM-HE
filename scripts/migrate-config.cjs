/**
 * Script to migrate the config collection from Firestore to PostgreSQL
 * 
 * This script handles the specific requirements of the config table:
 * - Maps Firestore document ID to the 'name' column
 * - Maps the document content to the 'value' JSONB column
 * - Handles timestamps properly
 */

// Load environment variables
require('dotenv').config();
const path = require('path');

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
 * Process Firestore Timestamps in the data
 * Converts Firestore Timestamps to JavaScript Date objects
 */
function processData(data) {
  if (!data) return data;
  
  const result = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Handle Firestore timestamps
    if (value && typeof value === 'object' && value._seconds !== undefined && value._nanoseconds !== undefined) {
      // Convert Firestore timestamp to JavaScript Date
      result[key] = new admin.firestore.Timestamp(
        value._seconds, 
        value._nanoseconds
      ).toDate();
    } 
    // Handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = processData(value);
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return processData(item);
        }
        return item;
      });
    }
    // Regular values
    else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Check if config table exists already
 */
async function checkTableExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'config'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if config table exists:', error);
    throw error;
  }
}

/**
 * Get columns in the config table
 */
async function getConfigColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'config';
    `);
    
    return result.rows.map(row => row.column_name);
  } catch (error) {
    console.error('Error getting config columns:', error);
    throw error;
  }
}

/**
 * Insert a config document into PostgreSQL
 */
async function insertConfigDocument(doc) {
  try {
    const docId = doc.id; // This becomes the name field in SQL
    let docData = doc.data();
    
    // Extract timestamps for created_at and updated_at fields
    const createdAt = docData.createdAt 
      ? new admin.firestore.Timestamp(docData.createdAt._seconds, docData.createdAt._nanoseconds).toDate()
      : new Date();
    
    const updatedAt = docData.updatedAt 
      ? new admin.firestore.Timestamp(docData.updatedAt._seconds, docData.updatedAt._nanoseconds).toDate()
      : new Date();
    
    // Remove timestamps from the data as they'll be stored separately
    if (docData.createdAt) delete docData.createdAt;
    if (docData.updatedAt) delete docData.updatedAt;
    
    // Process any remaining timestamps in the data
    docData = processData(docData);
    
    // Insert into PostgreSQL
    const insertSQL = `
      INSERT INTO config (name, value, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) 
      DO UPDATE SET 
        value = $2,
        updated_at = $4
    `;
    
    await pool.query(insertSQL, [
      docId,                   // name
      JSON.stringify(docData), // value as JSONB
      createdAt,               // created_at
      updatedAt                // updated_at
    ]);
    
    console.log(`Config document '${docId}' successfully migrated.`);
    return true;
    
  } catch (error) {
    console.error(`Error migrating config document ${doc.id}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateConfigCollection() {
  let errorCount = 0;
  
  try {
    console.log('Starting migration of Firestore config collection to PostgreSQL...');
    
    // Check if the config table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      throw new Error('Config table does not exist in PostgreSQL. Please run the database migrations first.');
    }
    
    // Get config table columns
    const columns = await getConfigColumns();
    console.log('Config table columns:', columns);
    
    // Verify the required columns exist
    const requiredColumns = ['id', 'name', 'value', 'created_at', 'updated_at'];
    for (const col of requiredColumns) {
      if (!columns.includes(col)) {
        throw new Error(`Required column '${col}' is missing from config table.`);
      }
    }
    
    // Get existing configs in PostgreSQL
    const existingConfigs = await pool.query('SELECT name FROM config');
    const existingConfigNames = existingConfigs.rows.map(row => row.name);
    console.log('Existing configs in PostgreSQL:', existingConfigNames);
    
    // Get all config documents from Firestore
    const snapshot = await db.collection('config').get();
    
    console.log(`Found ${snapshot.size} config documents in Firestore.`);
    
    if (snapshot.empty) {
      console.log('No config documents to migrate.');
      return;
    }
    
    // Process each document
    let successCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      try {
        // Insert the document
        await insertConfigDocument(doc);
        successCount++;
      } catch (error) {
        console.error(`Failed to process config document ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\nMigration summary:`);
    console.log(`- Total config documents found: ${snapshot.size}`);
    console.log(`- Successfully migrated: ${successCount} documents`);
    if (skippedCount > 0) {
      console.log(`- Skipped: ${skippedCount} documents`);
    }
    if (errorCount > 0) {
      console.log(`- Failed to migrate: ${errorCount} documents`);
    }
    
  } catch (error) {
    console.error('Config migration failed:', error);
    errorCount++;
  } finally {
    // Close the PostgreSQL connection
    await pool.end();
    console.log('PostgreSQL connection closed.');
    
    // Terminate Firebase App
    await admin.app().delete();
    console.log('Firebase connection closed.');
    
    // Exit process with error code if any errors occurred
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

// Run the migration
migrateConfigCollection();
