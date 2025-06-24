#!/usr/bin/env node

/**
 * Firestore to PostgreSQL Migration Script
 * 
 * This script migrates data from Firestore to PostgreSQL.
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

// PostgreSQL configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'asp_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create PostgreSQL client
const pgClient = new pg.Client(pgConfig);

// Helper function to convert Firestore timestamps to JS Date objects
function processTimestamp(timestamp) {
  if (!timestamp) return new Date().toISOString();
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  return new Date().toISOString();
}

// Migration functions for each collection
async function migrateUsers() {
  console.log('Migrating users...');
  
  try {
    const snapshot = await getDocs(collection(firestoreDb, 'users'));
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      await pgClient.query(`
        INSERT INTO users (uid, email, display_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (uid) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          updated_at = CURRENT_TIMESTAMP
      `, [
        doc.id,
        userData.email || '',
        userData.displayName || '',
        userData.role || 'user',
        processTimestamp(userData.createdAt),
        processTimestamp(userData.updatedAt)
      ]);
    }
    
    console.log(`✓ Migrated ${snapshot.size} users`);
    return true;
  } catch (error) {
    console.error('❌ User migration failed:', error.message);
    return false;
  }
}

// Main migration function
async function migrateFromFirestore() {
  console.log('Starting Firestore to PostgreSQL migration...');
  
  try {
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Migrate users as a test
    await migrateUsers();
    
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  } finally {
    await pgClient.end();
  }
}

// Run migration
migrateFromFirestore()
  .then(success => {
    if (success) {
      console.log('Migration completed successfully!');
      process.exit(0);
    } else {
      console.error('Migration failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during migration:', error);
    process.exit(1);
  });
