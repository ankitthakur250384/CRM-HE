/**
 * Firestore to PostgreSQL Migration Script - UID Version
 * 
 * This script migrates users from Firestore to PostgreSQL,
 * mapping Firestore IDs to the uid field instead of the id field.
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
 * Get existing columns in the users table
 */
async function getExistingColumns() {
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Users table does not exist.');
      return null;
    }

    // Get column information
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users';
    `);
    
    // Convert to a more usable format
    const columns = {};
    columnsResult.rows.forEach(col => {
      columns[col.column_name] = col.data_type;
    });
    
    console.log('Existing table columns:', columns);
    return columns;
    
  } catch (error) {
    console.error('Error getting table information:', error);
    throw error;
  }
}

/**
 * Get the next available ID for the users table
 */
async function getNextId() {
  try {
    const result = await pool.query(`
      SELECT COALESCE(MAX(id), 0) + 1 as next_id 
      FROM users
    `);
    
    return result.rows[0].next_id;
  } catch (error) {
    console.error('Error getting next ID:', error);
    return 1000; // Default starting value
  }
}

/**
 * Insert a user into PostgreSQL with UID mapping
 */
async function insertUser(user, columns, nextId) {
  try {
    const firestoreId = user.id;
    const data = user.data();
    
    // Log the data for debugging
    console.log(`Processing user ${firestoreId}:`, JSON.stringify(data, null, 2));
    
    // Prepare values for insert based on existing columns
    const values = [];
    const columnNames = [];
    const placeholders = [];
    let paramIndex = 1;
    
    // Always include id as it's the primary key
    columnNames.push('id');
    values.push(nextId);
    placeholders.push(`$${paramIndex++}`);
    
    // Always include uid for Firestore ID
    if (columns.uid) {
      columnNames.push('uid');
      values.push(firestoreId);
      placeholders.push(`$${paramIndex++}`);
    } else {
      console.warn('Warning: uid column not found, cannot store Firestore ID');
    }
    
    // Map common user fields if columns exist
    if (columns.email) {
      columnNames.push('email');
      values.push(data.email || null);
      placeholders.push(`$${paramIndex++}`);
    }
    
    if (columns.role) {
      columnNames.push('role');
      values.push(data.role || 'user');
      placeholders.push(`$${paramIndex++}`);
    }
    
    // Handle display_name or name
    if (columns.display_name) {
      columnNames.push('display_name');
      values.push(data.displayName || data.name || null);
      placeholders.push(`$${paramIndex++}`);
    } else if (columns.name) {
      columnNames.push('name');
      values.push(data.displayName || data.name || null);
      placeholders.push(`$${paramIndex++}`);
    }
    
    // Handle timestamps
    if (columns.created_at) {
      columnNames.push('created_at');
      values.push(data.createdAt ? data.createdAt.toDate() : new Date());
      placeholders.push(`$${paramIndex++}`);
    } else if (columns.createdat) {
      columnNames.push('createdat');
      values.push(data.createdAt ? data.createdAt.toDate() : new Date());
      placeholders.push(`$${paramIndex++}`);
    }
    
    if (columns.updated_at) {
      columnNames.push('updated_at');
      values.push(data.updatedAt ? data.updatedAt.toDate() : new Date());
      placeholders.push(`$${paramIndex++}`);
    }
    
    // Add password_hash if it exists
    if (columns.password_hash) {
      columnNames.push('password_hash');
      values.push(data.passwordHash || null);
      placeholders.push(`$${paramIndex++}`);
    }
    
    // Insert the user
    const insertSQL = `
      INSERT INTO users (${columnNames.join(', ')}) 
      VALUES (${placeholders.join(', ')})
      RETURNING id;
    `;
    
    console.log(`SQL for user ${firestoreId}:`, insertSQL);
    console.log('Values:', values);
    
    const result = await pool.query(insertSQL, values);
    
    if (result.rows.length > 0) {
      console.log(`User ${firestoreId} inserted successfully with ID ${result.rows[0].id}.`);
      return { success: true, id: result.rows[0].id };
    } else {
      console.log(`Failed to insert user ${firestoreId}.`);
      return { success: false };
    }
    
  } catch (error) {
    console.error(`Error inserting user ${user.id}:`, error);
    return { success: false, error };
  }
}

/**
 * Main migration function
 */
async function migrateFirestoreUsersToPostgres() {
  try {
    console.log('Starting Firestore users migration to PostgreSQL...');
    
    // Get existing columns from the database
    const columns = await getExistingColumns();
    
    if (!columns) {
      console.error('Cannot proceed without a users table.');
      return;
    }
    
    // Get next available ID
    let nextId = await getNextId();
    console.log(`Next available ID: ${nextId}`);
    
    // Get all users from Firestore
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore.`);
    
    // Process each user document
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersSnapshot.docs) {
      const result = await insertUser(user, columns, nextId);
      if (result.success) {
        successCount++;
        nextId++; // Increment ID for the next user
      } else {
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
