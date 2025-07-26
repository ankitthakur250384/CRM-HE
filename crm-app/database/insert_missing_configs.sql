-- Insert missing configuration data for the CRM application
-- This script adds the required config rows that are missing from the database

-- Insert default resourceRates config
INSERT INTO config (name, value)
VALUES ('resourceRates', '{
  "foodRate": 500,
  "accommodationRate": 1000,
  "transportRate": 25
}') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Insert default additionalParams config
INSERT INTO config (name, value)
VALUES ('additionalParams', '{
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
}') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Insert default defaultTemplate config
INSERT INTO config (name, value)
VALUES ('defaultTemplate', '{
  "defaultTemplateId": null
}') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Insert default database config (if needed)
INSERT INTO config (name, value)
VALUES ('database', '{
  "host": "localhost",
  "port": 5432,
  "database": "asp_crm",
  "user": "postgres",
  "ssl": false
}') ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Verify the configs were inserted
SELECT name, value FROM config ORDER BY name;
