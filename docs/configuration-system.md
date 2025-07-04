# ASP CRM Configuration System

This document describes the configuration system used in the ASP Cranes CRM application.

## Overview

The configuration system provides a robust, extensible way to store and manage various settings in the PostgreSQL database. Each configuration type (database, quotation, resourceRates, additionalParams) can be managed independently through a unified interface.

## Configuration Types

1. **Database Configuration**
   - Database connection settings
   - Host, port, database name, user, password, SSL options
   - API: `/api/dbconfig`

2. **Quotation Configuration**
   - Order type limits (micro, small, monthly, yearly)
   - Min/max days for each order type
   - API: `/api/config/quotation`

3. **Resource Rates Configuration**
   - Food, accommodation, and transport rates
   - API: `/api/config/resourceRates`

4. **Additional Parameters Configuration**
   - Usage factors
   - Risk factors
   - Shift factors
   - Day/night factors
   - API: `/api/config/additionalParams`

## Database Structure

The configuration data is stored in a PostgreSQL table with the following structure:

```sql
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

- `name`: Identifies the configuration type (e.g., 'database', 'quotation')
- `value`: Stores the configuration as a JSONB object
- `updated_at`: Tracks when the configuration was last updated

## API Endpoints

### Database Configuration

- `GET /api/dbconfig`: Get database configuration
- `PUT /api/dbconfig`: Update database configuration
- `POST /api/dbconfig/test`: Test database connection

### Other Configurations

- `GET /api/config/:configType`: Get configuration by type
- `PUT /api/config/:configType`: Update configuration by type

## Frontend Integration

The frontend components in `src/components/config/` use the `configService.ts` to interact with the API endpoints:

- `DatabaseConfig.tsx`: Database connection settings
- `QuotationConfig.tsx`: Quotation order type settings
- `ResourceRatesConfig.tsx`: Resource rates configuration
- `AdditionalParamsConfig.tsx`: Additional parameters configuration

## Setup and Testing

To set up and test the configuration system:

1. Run the config table setup script:
   ```
   node scripts/fix-config-table.mjs
   ```

2. Test API endpoints:
   ```
   node scripts/test-config-api.mjs
   ```

3. Or use the batch file for a complete setup and test:
   ```
   setup-and-test-config-api.bat
   ```

## Manual SQL Commands

You can also manage configurations directly in the database using SQL:

```sql
-- Get all configurations
SELECT id, name, updated_at, jsonb_pretty(value) FROM config;

-- Update a configuration
UPDATE config
SET value = jsonb_set(value, '{host}', '"new-db-host"'),
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'database';
```

## Note on Database Configuration Updates

After changing database connection settings, the server must be restarted for the changes to take effect. The UI displays a message to this effect when database settings are saved.
