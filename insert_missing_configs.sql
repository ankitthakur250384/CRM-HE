-- Insert missing config entries for ASP Cranes CRM
-- This script ensures all required configuration entries exist in the database

-- Insert default quotation config if not exists
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

-- Insert default resourceRates config if not exists
INSERT INTO config (name, value)
VALUES ('resourceRates', '{
  "foodRate": 2500,
  "accommodationRate": 4000,
  "transportRate": 0
}')
ON CONFLICT (name) DO NOTHING;

-- Insert default additionalParams config if not exists
INSERT INTO config (name, value)
VALUES ('additionalParams', '{
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
  ],
  "usageFactors": {
    "normal": 1.0,
    "medium": 1.2,
    "heavy": 1.5
  },
  "riskFactors": {
    "low": 0,
    "medium": 8000,
    "high": 15000
  },
  "shiftFactors": {
    "single": 1.0,
    "double": 1.8
  },
  "dayNightFactors": {
    "day": 1.0,
    "night": 1.3
  }
}')
ON CONFLICT (name) DO NOTHING;

-- Insert default database config if not exists
INSERT INTO config (name, value)
VALUES ('database', '{
  "host": "localhost",
  "port": 5432,
  "database": "asp_crm",
  "user": "postgres",
  "ssl": false
}')
ON CONFLICT (name) DO NOTHING;

-- Insert default template config if not exists
INSERT INTO config (name, value)
VALUES ('defaultTemplate', '{
  "defaultTemplateId": "template_001"
}')
ON CONFLICT (name) DO NOTHING;

-- Display all config entries for verification
SELECT 
    name,
    CASE 
        WHEN name = 'database' THEN 
            jsonb_set(value, '{password}', '"***hidden***"'::jsonb)
        ELSE value 
    END as value,
    created_at,
    updated_at
FROM config 
ORDER BY name;

-- Show table structure for reference
\d config;
