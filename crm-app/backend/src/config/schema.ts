import { db } from '../lib/db';

// Schema definition for PostgreSQL tables
// These will match our Firestore collections
export const schema = {  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255),
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
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      amount DECIMAL(12, 2),
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
      equipment_id VARCHAR(255) REFERENCES equipment(equipment_id),
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
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      site_location TEXT,
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

  config: `
    CREATE TABLE IF NOT EXISTS config (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      value JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT INTO config (name, value)
    VALUES 
      ('quotation', '{
        "orderTypeLimits": {
          "micro": { "minDays": 1, "maxDays": 10 },
          "small": { "minDays": 11, "maxDays": 25 },
          "monthly": { "minDays": 26, "maxDays": 365 },
          "yearly": { "minDays": 366, "maxDays": 3650 }
        }
      }'),
      ('resourceRates', '{
        "foodRate": 2500,
        "accommodationRate": 4000,
        "transportRate": 0
      }'),
      ('additionalParams', '{
        "riggerAmount": 40000,
        "helperAmount": 12000,
        "incidentalOptions": [
          {
            "value": "incident1",
            "label": "Incident 1 - ₹5,000",
            "amount": 5000
          },
          {
            "value": "incident2", 
            "label": "Incident 2 - ₹10,000",
            "amount": 10000
          },
          {
            "value": "incident3",
            "label": "Incident 3 - ₹15,000", 
            "amount": 15000
          }
        ]
      }')
    ON CONFLICT (name) DO NOTHING;
  `
};

// Function to run all migrations
export async function runMigrations() {
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
    
    await db.none(schema.config);
    console.log('✓ Created config table');

    console.log('✅ All database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    return false;
  }
}
