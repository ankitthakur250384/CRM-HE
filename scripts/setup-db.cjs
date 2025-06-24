/**
 * PostgreSQL Database Setup Script
 * 
 * This script sets up the PostgreSQL database for the application.
 * It creates tables and initializes the database with default data.
 */

const pgp = require('pg-promise')();
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Database configuration
const config = {
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || '',
  ssl: process.env.VITE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log('Connecting to database with config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  ssl: !!config.ssl
});

// Create a database instance
const db = pgp(config);

// Schema definition
const schema = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      customer_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      company VARCHAR(255),
      address TEXT,
      designation VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  leads: `
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      lead_id VARCHAR(255) UNIQUE NOT NULL,
      customer_id VARCHAR(255) REFERENCES customers(customer_id),
      status VARCHAR(50) NOT NULL DEFAULT 'new',
      source VARCHAR(100),
      notes TEXT,
      assigned_to VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  deals: `
    CREATE TABLE IF NOT EXISTS deals (
      id SERIAL PRIMARY KEY,
      deal_id VARCHAR(255) UNIQUE NOT NULL,
      customer_id VARCHAR(255) REFERENCES customers(customer_id),
      lead_id VARCHAR(255) REFERENCES leads(lead_id),
      stage VARCHAR(50) NOT NULL DEFAULT 'proposal',
      value DECIMAL(12, 2),
      notes TEXT,
      assigned_to VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  equipment: `
    CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      equipment_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'available',
      base_rate_micro DECIMAL(10, 2),
      base_rate_small DECIMAL(10, 2),
      base_rate_monthly DECIMAL(10, 2),
      base_rate_yearly DECIMAL(10, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  quotations: `
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      quotation_id VARCHAR(255) UNIQUE NOT NULL,
      customer_id VARCHAR(255) REFERENCES customers(customer_id),
      deal_id VARCHAR(255) REFERENCES deals(deal_id),
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      order_type VARCHAR(50),
      number_of_days INTEGER,
      working_hours INTEGER,
      shift VARCHAR(20),
      usage VARCHAR(20),
      total_rent DECIMAL(12, 2),
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      data JSONB
    );
  `,

  quotation_machines: `
    CREATE TABLE IF NOT EXISTS quotation_machines (
      id SERIAL PRIMARY KEY,
      quotation_id VARCHAR(255) REFERENCES quotations(quotation_id),
      equipment_id VARCHAR(255) REFERENCES equipment(equipment_id),
      quantity INTEGER DEFAULT 1,
      base_rate DECIMAL(10, 2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  jobs: `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) UNIQUE NOT NULL,
      customer_id VARCHAR(255) REFERENCES customers(customer_id),
      deal_id VARCHAR(255) REFERENCES deals(deal_id),
      quotation_id VARCHAR(255) REFERENCES quotations(quotation_id),
      status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
      scheduled_start_date TIMESTAMP WITH TIME ZONE,
      scheduled_end_date TIMESTAMP WITH TIME ZONE,
      location JSONB,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  operators: `
    CREATE TABLE IF NOT EXISTS operators (
      id SERIAL PRIMARY KEY,
      operator_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      status VARCHAR(50) DEFAULT 'available',
      skill_level VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  job_operators: `
    CREATE TABLE IF NOT EXISTS job_operators (
      id SERIAL PRIMARY KEY,
      job_id VARCHAR(255) REFERENCES jobs(job_id),
      operator_id VARCHAR(255) REFERENCES operators(operator_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  templates: `
    CREATE TABLE IF NOT EXISTS templates (
      id SERIAL PRIMARY KEY,
      template_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  site_assessments: `
    CREATE TABLE IF NOT EXISTS site_assessments (
      id SERIAL PRIMARY KEY,
      assessment_id VARCHAR(255) UNIQUE NOT NULL,
      job_id VARCHAR(255) REFERENCES jobs(job_id),
      customer_id VARCHAR(255) REFERENCES customers(customer_id),
      location TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      constraints JSONB,
      photos JSONB,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  
  services: `
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      service_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      description TEXT,
      rate DECIMAL(10, 2),
      rate_unit VARCHAR(50),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  configs: `
    CREATE TABLE IF NOT EXISTS configs (
      id SERIAL PRIMARY KEY,
      config_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) UNIQUE NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `
};

// Insert default config data
const defaultConfigs = [
  {
    name: 'quotation_config',
    data: {
      orderTypeLimits: {
        micro: { minDays: 1, maxDays: 10 },
        small: { minDays: 11, maxDays: 25 },
        monthly: { minDays: 26, maxDays: 365 },
        yearly: { minDays: 366, maxDays: 3650 }
      }
    }
  },
  {
    name: 'additional_params',
    data: {
      usageFactors: {
        normal: 1.0,
        medium: 1.2,
        heavy: 1.5
      },
      riskFactors: {
        low: 0,
        medium: 8000,
        high: 15000
      },
      shiftFactors: {
        single: 1.0,
        double: 1.8
      },
      dayNightFactors: {
        day: 1.0,
        night: 1.3
      }
    }
  },
  {
    name: 'resource_rates',
    data: {
      foodRate: 500,
      accommodationRate: 1000,
      transportRate: 25
    }
  }
];

// Run migrations and insert default data
async function runMigrations() {
  console.log('Running PostgreSQL schema migrations...');
  
  try {
    // Create tables in order (respecting foreign key constraints)
    await db.none(schema.users);
    console.log('✓ Created users table');
    
    await db.none(schema.customers);
    console.log('✓ Created customers table');
    
    await db.none(schema.leads);
    console.log('✓ Created leads table');
    
    await db.none(schema.deals);
    console.log('✓ Created deals table');
    
    await db.none(schema.equipment);
    console.log('✓ Created equipment table');
    
    await db.none(schema.quotations);
    console.log('✓ Created quotations table');
    
    await db.none(schema.quotation_machines);
    console.log('✓ Created quotation_machines table');
    
    await db.none(schema.jobs);
    console.log('✓ Created jobs table');
    
    await db.none(schema.operators);
    console.log('✓ Created operators table');
    
    await db.none(schema.job_operators);
    console.log('✓ Created job_operators table');
    
    await db.none(schema.templates);
    console.log('✓ Created templates table');
    
    await db.none(schema.site_assessments);
    console.log('✓ Created site_assessments table');
    
    await db.none(schema.services);
    console.log('✓ Created services table');
    
    await db.none(schema.configs);
    console.log('✓ Created configs table');
    
    // Insert default configs
    for (const config of defaultConfigs) {
      await db.none(
        `INSERT INTO configs(config_id, name, data) 
         VALUES($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
         SET data = $3, updated_at = CURRENT_TIMESTAMP`,
        [crypto.randomUUID(), config.name, config.data]
      );
    }
    console.log('✓ Inserted default configs');

    console.log('✅ All database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.error(error);
    return false;
  } finally {
    // Close the database connection
    pgp.end();
  }
}

// Run migrations
runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
