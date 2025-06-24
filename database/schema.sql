-- ASP CRM PostgreSQL Schema

-- Users table    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

-- Customers table
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

-- Leads table
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

-- Deals table
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

-- Equipment table
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

-- Quotations table
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

-- Quotation Machines (junction table)
CREATE TABLE IF NOT EXISTS quotation_machines (
  id SERIAL PRIMARY KEY,
  quotation_id VARCHAR(255) REFERENCES quotations(quotation_id),
  equipment_id VARCHAR(255) REFERENCES equipment(equipment_id),
  quantity INTEGER DEFAULT 1,
  base_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
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

-- Operators table
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

-- Job Operators (junction table)
CREATE TABLE IF NOT EXISTS job_operators (
  id SERIAL PRIMARY KEY,
  job_id VARCHAR(255) REFERENCES jobs(job_id),
  operator_id VARCHAR(255) REFERENCES operators(operator_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Config table (for application settings)
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default quotation config
INSERT INTO config (name, value)
VALUES ('quotation', '{
  "orderTypeLimits": {
    "micro": { "minDays": 1, "maxDays": 10 },
    "small": { "minDays": 11, "maxDays": 25 },
    "monthly": { "minDays": 26, "maxDays": 365 },
    "yearly": { "minDays": 366, "maxDays": 3650 }
  }
}')
ON CONFLICT (name) DO NOTHING;
