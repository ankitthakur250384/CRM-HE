/**
 * Firestore to PostgreSQL Migration Script - Adaptive Version
 * 
 * This script migrates users from Firestore to PostgreSQL,
 * adapting to the existing database schema.
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
 * Insert a user into PostgreSQL with dynamic column handling
 */
async function insertUser(user, columns) {
  try {
    const { id } = user;
    const data = user.data();
    
    // Log the data for debugging
    console.log(`Processing user ${id}:`, JSON.stringify(data, null, 2));
    
    // Prepare values for insert based on existing columns
    const values = [];
    const columnNames = [];
    const placeholders = [];
    let paramIndex = 1;
    
    // Always include id as it's the primary key
    columnNames.push('id');
    values.push(id);
    placeholders.push(`$${paramIndex++}`);
    
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
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;
    
    console.log(`SQL for user ${id}:`, insertSQL);
    console.log('Values:', values);
    
    const result = await pool.query(insertSQL, values);
    
    if (result.rows.length > 0) {
      console.log(`User ${id} inserted successfully.`);
      return true;
    } else {
      console.log(`User ${id} already exists, skipped.`);
      return true;
    }
    
  } catch (error) {
    console.error(`Error inserting user ${user.id}:`, error);
    return false;
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
    
    // Get all users from Firestore
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore.`);
    
    // Process each user document
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersSnapshot.docs) {
      const success = await insertUser(user, columns);
      if (success) {
        successCount++;
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
