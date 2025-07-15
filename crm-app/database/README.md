# ASP Cranes CRM Database

This directory contains the PostgreSQL database schema and documentation for the ASP Cranes CRM application.

## Files

- `schema.sql` - Complete SQL schema for creating all database tables and relationships
- `SCHEMA_DOCUMENTATION.md` - Detailed documentation of the database schema

## Schema Overview

The database schema implements a fully normalized structure with the following key components:

### Core Data Management
- User management and authentication
- Customer management
- Lead tracking and management
- Deal tracking
- Equipment inventory

### Operational Functions
- Operator management
- Job scheduling and management
- Site assessments
- Quotation management
- Service management

### System Functions
- Notification system
- Audit logging
- Configuration management

## Usage

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE asp_crm;
   ```

2. Run the schema creation script:
   ```bash
   psql -U postgres -d asp_crm -f schema.sql
   ```

3. Create a dedicated database user with limited permissions:
   ```sql
   CREATE USER asp_crm_user WITH PASSWORD 'strong_password_here';
   GRANT CONNECT ON DATABASE asp_crm TO asp_crm_user;
   ```

4. Grant permissions to the application user:
   ```sql
   \c asp_crm
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO asp_crm_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO asp_crm_user;
   ```

Refer to `SCHEMA_DOCUMENTATION.md` for detailed information about the database schema.
