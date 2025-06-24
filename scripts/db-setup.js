#!/usr/bin/env node

/**
 * PostgreSQL Database Management Script (Simplified)
 * 
 * This script helps manage the PostgreSQL database for the ASP CRM application.
 */

import dotenv from 'dotenv';
import pg from 'pg';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Database name
const dbName = process.env.DB_NAME || 'asp_crm';

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to create a database connection
function createClient(database = dbName) {
  return new pg.Client({
    ...dbConfig,
    database
  });
}

// Function to ensure database exists
async function ensureDatabase() {
  console.log(`Checking if database '${dbName}' exists...`);
  
  // Connect to default postgres database
  const client = createClient('postgres');
  
  try {
    await client.connect();
    
    // Check if our database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (result.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully.`);
    } else {
      console.log(`✅ Database '${dbName}' already exists.`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error ensuring database: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Function to create schema
async function createSchema() {
  console.log(`Creating schema in database '${dbName}'...`);
  
  // Connect to our database
  const client = createClient();
  
  try {
    await client.connect();
    
    // Read the SQL file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      await client.query(statement + ';');
    }
    
    console.log('✅ Schema created successfully.');
    return true;
  } catch (error) {
    console.error(`❌ Error creating schema: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Function to reset database
async function resetDatabase() {
  console.log(`Resetting database '${dbName}'...`);
  
  // Connect to our database
  const client = createClient();
  
  try {
    await client.connect();
    
    // Drop tables in reverse order to respect foreign keys
    const tables = [
      'job_operators',
      'operators',
      'jobs',
      'quotation_machines',
      'quotations',
      'equipment',
      'deals',
      'leads',
      'customers',
      'users',
      'config'
    ];
    
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`- Dropped table ${table}`);
    }
    
    console.log('✅ Database reset successfully.');
    return true;
  } catch (error) {
    console.error(`❌ Error resetting database: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Main function
async function main() {
  console.clear();
  console.log('=================================================');
  console.log('| ASP CRM - PostgreSQL Database Management Tool |');
  console.log('=================================================');
  
  try {
    // Ensure database exists
    const dbExists = await ensureDatabase();
    if (!dbExists) {
      console.error('Failed to ensure database exists.');
      process.exit(1);
    }
    
    // Show menu
    while (true) {
      console.log('\nWhat would you like to do?');
      console.log('1. Create database schema (tables)');
      console.log('2. Migrate data from Firestore to PostgreSQL');
      console.log('3. Reset database (DANGER: deletes all data)');
      console.log('4. Exit');
      
      const choice = await prompt('\nEnter your choice (1-4): ');
      
      switch (choice) {
        case '1':
          await createSchema();
          break;
          
        case '2':
          const confirmMigrate = await prompt('\n⚠️ Are you sure you want to migrate data? (y/n): ');
          if (confirmMigrate.toLowerCase() === 'y') {
            console.log('This feature is not yet implemented in this script.');
            console.log('Please use the TypeScript migration script once the schema is created.');
          } else {
            console.log('Migration cancelled.');
          }
          break;
          
        case '3':
          const confirm = await prompt('\n⚠️ WARNING: This will delete ALL data in the database. Are you sure? (type "RESET" to confirm): ');
          
          if (confirm === 'RESET') {
            await resetDatabase();
          } else {
            console.log('Reset cancelled.');
          }
          break;
          
        case '4':
          console.log('\nExiting. Goodbye!');
          rl.close();
          process.exit(0);
          
        default:
          console.log('\nInvalid choice. Please try again.');
      }
    }
  } catch (error) {
    console.error(`\nUnexpected error: ${error.message}`);
    process.exit(1);
  }
}

main();
