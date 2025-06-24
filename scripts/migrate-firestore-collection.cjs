/**
 * Generic Firestore to PostgreSQL Migration Script
 * 
 * This script migrates all documents from a specified Firestore collection 
 * to a PostgreSQL table with the same name.
 * 
 * Usage: node migrate-firestore-collection.js <collection-name> [table-name]
 * 
 * If table name is not provided, it will use the collection name.
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

// Parse command line arguments
const args = process.argv.slice(2);
const collectionName = args[0];
const tableName = args[1] || collectionName;

// Configuration options with defaults
let uidColumn = 'id'; // Column to store the Firestore document ID
let mandatoryFields = []; // Fields that must exist in the SQL table

// Parse additional options
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--uid-column' && i + 1 < args.length) {
    uidColumn = args[++i];
  } else if (args[i] === '--mandatory-fields' && i + 1 < args.length) {
    mandatoryFields = args[++i].split(',');
  }
}

// Validate command line arguments
if (!collectionName) {
  console.error('Error: Collection name is required.');
  console.log('Usage: npm run migrate:firestore <collection-name> [table-name] [--uid-column column-name] [--mandatory-fields field1,field2,...]');
  process.exit(1);
}

console.log(`Migration configuration:`);
console.log(`- Firestore Collection: ${collectionName}`);
console.log(`- PostgreSQL Table: ${tableName}`);
console.log(`- UID Column: ${uidColumn}`);
console.log(`- Mandatory Fields: ${mandatoryFields.join(', ') || 'none'}`);

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
 * Check if table exists already
 */
async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if table exists:', error);
    throw error;
  }
}

/**
 * Get existing columns in the table
 */
async function getExistingColumns(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1;
    `, [tableName]);
    
    const columns = {};
    result.rows.forEach(row => {
      columns[row.column_name] = {
        dataType: row.data_type,
        nullable: row.is_nullable === 'YES'
      };
    });
    
    return columns;
  } catch (error) {
    console.error('Error getting existing columns:', error);
    throw error;
  }
}

/**
 * Create PostgreSQL table based on document structure
 */
async function createTableIfNotExists(document, tableName) {
  try {
    // Check if table already exists
    const tableExists = await checkTableExists(tableName);
    
    if (tableExists) {
      console.log(`Table "${tableName}" already exists. Skipping creation.`);
      return;
    }
    
    console.log(`Creating table "${tableName}"...`);
    
    // For predefined tables, we don't want to create them from the document structure
    // as they already have a specific structure in the database
    console.log(`Table "${tableName}" must be created manually. Please run the database migrations.`);
    console.log(`If the table already exists, make sure it has the following mandatory fields: ${mandatoryFields.join(', ')}`);
    
    // Instead of creating, check if table exists
    const exists = await checkTableExists(tableName);
    
    if (!exists) {
      throw new Error(`Table "${tableName}" does not exist and cannot be created automatically. Please create the table manually.`);
    }
    
    console.log(`Table "${tableName}" is ready.`);
    
  } catch (error) {
    console.error('Error with table:', error);
    throw error;
  }
}

/**
 * Add any missing columns to the table
 * We're going to use a 'data' JSONB column for most collections instead of adding columns
 */
async function addMissingColumns(document, tableName) {
  try {
    // Get existing columns
    const columns = await getExistingColumns(tableName);
    
    // Check if the table has a 'data' JSONB column
    if (columns['data'] && columns['data'].dataType === 'jsonb') {
      // If there's a data column, we don't need to add individual columns
      console.log(`Table "${tableName}" has a data column for dynamic data, skipping column additions.`);
      return;
    }
    
    // Otherwise, check if any mandatory fields are missing 
    // (we won't add arbitrary fields from Firestore)
    const missingMandatoryColumns = mandatoryFields.filter(field => !columns[field]);
    
    // Add each missing mandatory column
    for (const column of missingMandatoryColumns) {
      // Determine column type based on its name
      let columnType = 'TEXT';
      if (column === 'created_at' || column === 'updated_at') {
        columnType = 'TIMESTAMP WITH TIME ZONE';
      } else if (column.endsWith('_at')) {
        columnType = 'TIMESTAMP WITH TIME ZONE';
      } else if (column === 'id' || column.endsWith('_id')) {
        columnType = 'VARCHAR';
      }
      
      console.log(`Adding missing mandatory column "${column}" with type ${columnType}`);
      
      await pool.query(`
        ALTER TABLE "${tableName}"
        ADD COLUMN IF NOT EXISTS "${column}" ${columnType}
      `);
    }
    
    if (missingMandatoryColumns.length > 0) {
      console.log(`Added ${missingMandatoryColumns.length} missing mandatory columns to "${tableName}"`);
    }
    
  } catch (error) {
    console.error('Error adding missing columns:', error);
    throw error;
  }
}

/**
 * Map field names from Firestore to PostgreSQL
 */
function mapFieldNames(tableName, fieldName) {
  // Common field mappings
  const fieldMappings = {
    // customers collection
    companyName: 'company',
    
    // generic mappings
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  };
  
  // Return the mapped field name if it exists, otherwise convert to snake_case
  if (fieldMappings[fieldName]) {
    return fieldMappings[fieldName];
  }
  
  // Convert camelCase to snake_case
  return fieldName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Insert a document into PostgreSQL
 */
async function insertDocument(document, tableName) {
  try {
    // Flatten the document data
    let flatData = flattenObject(document.data());
    
    // Add the document ID to the UID column
    flatData[uidColumn] = document.id;
    
    // Convert field names from camelCase to snake_case and map fields
    const mappedData = {};
    const existingColumns = await getExistingColumns(tableName);
    const dataFields = {};
    
    // First pass - map field names and identify which ones go to data column
    Object.entries(flatData).forEach(([key, value]) => {
      const mappedKey = mapFieldNames(tableName, key);
      
      // Check if the mapped column exists in the table
      if (existingColumns[mappedKey]) {
        mappedData[mappedKey] = value;
      } else {
        // If column doesn't exist, add to data JSON field if available
        dataFields[key] = value;
      }
    });
    
    // Add data JSON field if table has one and we have extra fields
    if (existingColumns['data'] && Object.keys(dataFields).length > 0) {
      mappedData['data'] = dataFields;
    }
    
    // Ensure all mandatory fields are present
    for (const field of mandatoryFields) {
      if (mappedData[field] === undefined) {
        // For missing mandatory fields, set default values
        if (field === 'created_at' || field === 'updated_at') {
          mappedData[field] = new Date();
        } else if (field.includes('_id') && field !== 'id') {
          // Generate a unique ID for any *_id fields if missing
          if (field === uidColumn) {
            // Already set above
          } else {
            const randomId = Math.random().toString(36).substring(2, 15);
            mappedData[field] = `${tableName.slice(0, 3).toUpperCase()}${randomId}`;
            console.log(`Generated ${field} = ${mappedData[field]} for document ${document.id}`);
          }
        } else {
          // For all other fields, warn but proceed
          console.log(`Warning: Missing mandatory field ${field} for document ${document.id}`);
          if (field === 'status') {
            mappedData[field] = 'draft'; // Default status
          } else {
            mappedData[field] = null;
          }
        }
      }
    }
    
    // Get column names and values
    const columns = Object.keys(mappedData);
    const values = Object.values(mappedData);
    
    // Generate placeholders for parameterized query
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Insert SQL with ON CONFLICT DO NOTHING to handle duplicates
    const insertSQL = `
      INSERT INTO "${tableName}" ("${columns.join('", "')}") 
      VALUES (${placeholders})
      ON CONFLICT (${uidColumn}) DO NOTHING
    `;
    
    console.log(`SQL for document ${document.id}:`);
    console.log(insertSQL);
    console.log('Values:', values);
    
    await pool.query(insertSQL, values);
    console.log(`Document ${document.id} inserted into "${tableName}".`);
    return true;
    
  } catch (error) {
    console.error(`Error inserting document ${document.id}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateFirestoreToPostgres() {
  let errorCount = 0;
  
  try {
    console.log(`Starting migration from Firestore collection "${collectionName}" to PostgreSQL table "${tableName}"...`);
    
    // Get all documents from Firestore
    const snapshot = await db.collection(collectionName).get();
    
    console.log(`Found ${snapshot.size} documents in Firestore collection "${collectionName}".`);
    
    if (snapshot.empty) {
      console.log('No documents to migrate.');
      return;
    }
    
    // Check if the table exists and has the right structure
    await createTableIfNotExists(snapshot.docs[0], tableName);
    
    // Get existing column info
    const existingColumns = await getExistingColumns(tableName);
    console.log('Existing table columns:', existingColumns);
    
    // Count existing records in the table
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    console.log(`Currently ${countResult.rows[0].count} records in table "${tableName}"`);
    
    // Process each document
    let successCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      try {
        // Then insert the document
        await insertDocument(doc, tableName);
        successCount++;
      } catch (error) {
        // Check if this was a duplicate key error
        if (error.code === '23505') { // PostgreSQL duplicate key error
          console.log(`Document ${doc.id} already exists in table "${tableName}", skipped.`);
          skippedCount++;
        } else {
          console.error(`Failed to process document ${doc.id}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log(`\nMigration summary:`);
    console.log(`- Total documents found: ${snapshot.size}`);
    console.log(`- Successfully migrated: ${successCount} documents`);
    if (skippedCount > 0) {
      console.log(`- Skipped (already exist): ${skippedCount} documents`);
    }
    if (errorCount > 0) {
      console.log(`- Failed to migrate: ${errorCount} documents`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
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
migrateFirestoreToPostgres();
