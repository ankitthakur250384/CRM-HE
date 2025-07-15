# ASP Cranes CRM - Production Database Schema Documentation

This document provides a comprehensive overview of the production-ready database schema for the ASP Cranes CRM application. The schema has been designed following industry best practices to support all application functionalities while ensuring data integrity, performance, and security.

## Overview

The database schema implements a fully normalized structure with the following key components:

### Core Data Management
- **User management and authentication** - Secure user storage with role-based access control and token management
- **Customer management** - Customer records with contact information and relationship tracking
- **Lead tracking and management** - Complete lead lifecycle from acquisition to conversion
- **Deal tracking** - Sales pipeline with opportunity management
- **Equipment inventory** - Crane equipment with detailed specifications and pricing

### Operational Functions
- **Operator management** - Personnel records with scheduling capabilities
- **Job scheduling and management** - Complete job lifecycle management
- **Site assessments** - On-site evaluation records with media support
- **Quotation management** - Dynamic quotation generation with versioning
- **Service management** - Available service offerings with pricing

### System Functions
- **Notification system** - User alerts and notifications
- **Audit logging** - Comprehensive change tracking
- **Configuration management** - System-wide settings

### Technical Features
- UUID-based primary keys with business-friendly prefixes
- Comprehensive data validation through CHECK constraints
- Optimized indexes for common query patterns
- Automatic timestamp management via triggers
- Full text search capabilities
- Referential integrity with appropriate cascading behaviors

## Tables and Relationships

### Users
Stores user accounts for the CRM system.
- `uid`: Primary key, unique identifier for the user
- `email`: User's email address (unique)
- `password_hash`: Securely hashed password
- `display_name`: User's display name
- `role`: User role (admin, sales_agent, operations_manager, operator, support)
- `avatar`: Optional URL to the user's avatar image
- `created_at`: Timestamp of user creation
- `updated_at`: Timestamp of last update

### Customers
Stores information about customers.
- `id`: Primary key, unique identifier for the customer
- `name`: Customer's name
- `company_name`: Name of the customer's company
- `contact_name`: Primary contact name
- `email`: Customer's email address
- `phone`: Customer's phone number
- `address`: Customer's address
- `type`: Customer type (construction, property_developer, manufacturing, government, other)
- `designation`: Contact's job title/designation
- `notes`: Additional notes about the customer
- `created_at`: Timestamp of customer creation
- `updated_at`: Timestamp of last update

### Contacts
Stores additional contacts for customers.
- `id`: Primary key, unique identifier for the contact
- `customer_id`: Foreign key to the customers table
- `name`: Contact's name
- `email`: Contact's email address
- `phone`: Contact's phone number
- `role`: Contact's role in the company
- `created_at`: Timestamp of contact creation
- `updated_at`: Timestamp of last update

### Leads
Stores leads information.
- `id`: Primary key, unique identifier for the lead
- `customer_id`: Foreign key to the customers table (nullable)
- `customer_name`: Name of the potential customer
- `company_name`: Name of the company (optional)
- `email`: Lead's email address
- `phone`: Lead's phone number
- `service_needed`: Description of the service needed
- `site_location`: Location of the potential job site
- `start_date`: Expected start date
- `rental_days`: Number of rental days required
- `shift_timing`: Shift timing details
- `status`: Lead status (new, in_process, qualified, unqualified, lost, converted)
- `source`: Lead source (website, referral, direct, social, email, phone, other)
- `assigned_to`: Foreign key to the users table
- `designation`: Lead contact's job title
- `files`: JSONB field for storing file references
- `notes`: Additional notes
- `created_at`: Timestamp of lead creation
- `updated_at`: Timestamp of last update

### Deals
Stores information about deals with customers.
- `id`: Primary key, unique identifier for the deal
- `lead_id`: Foreign key to the leads table
- `customer_id`: Foreign key to the customers table
- `title`: Deal title
- `description`: Deal description
- `value`: Deal monetary value
- `stage`: Deal stage (qualification, proposal, negotiation, won, lost)
- `created_by`: Foreign key to the users table
- `assigned_to`: Foreign key to the users table
- `probability`: Success probability percentage
- `expected_close_date`: Expected closing date
- `notes`: Additional notes
- `created_at`: Timestamp of deal creation
- `updated_at`: Timestamp of last update

### Equipment
Stores information about crane equipment.
- `id`: Primary key, unique identifier for the equipment
- `equipment_id`: Business identifier (e.g., EQ0001)
- `name`: Equipment name
- `category`: Equipment category (mobile_crane, tower_crane, crawler_crane, pick_and_carry_crane)
- `manufacturing_date`: Date of manufacture
- `registration_date`: Date of registration
- `max_lifting_capacity`: Maximum lifting capacity in tons
- `unladen_weight`: Weight in tons
- `base_rates`: JSONB field containing rates for different order types
- `running_cost_per_km`: Running cost per kilometer
- `running_cost`: Total running cost
- `description`: Equipment description
- `status`: Current status (available, in_use, maintenance)
- `created_at`: Timestamp of equipment creation
- `updated_at`: Timestamp of last update

### Operators
Stores information about crane operators.
- `id`: Primary key, unique identifier for the operator
- `name`: Operator's name
- `email`: Operator's email address
- `phone`: Operator's phone number
- `specialization`: Crane type specialization
- `experience`: Years of experience
- `certifications`: Array of certification names
- `availability`: Current availability status (available, assigned, on_leave, inactive)
- `created_at`: Timestamp of operator creation
- `updated_at`: Timestamp of last update

### Jobs
Stores information about scheduled jobs.
- `id`: Primary key, unique identifier for the job
- `title`: Job title
- `lead_id`: Foreign key to the leads table
- `customer_id`: Foreign key to the customers table
- `customer_name`: Name of the customer
- `deal_id`: Foreign key to the deals table
- `status`: Job status (pending, scheduled, in_progress, completed, cancelled)
- `scheduled_start_date`: Scheduled start date and time
- `scheduled_end_date`: Scheduled end date and time
- `actual_start_date`: Actual start date and time
- `actual_end_date`: Actual end date and time
- `location`: Job location
- `notes`: Additional notes
- `created_by`: Foreign key to the users table
- `assigned_to`: Foreign key to the users table
- `created_at`: Timestamp of job creation
- `updated_at`: Timestamp of last update

### Job-Equipment and Job-Operator Relationship Tables
Junction tables for many-to-many relationships:
- `job_equipment`: Links jobs to equipment units
- `job_operator`: Links jobs to operators

### Site Assessments
Stores information about site assessments.
- `id`: Primary key, unique identifier for the assessment
- `title`: Assessment title
- `description`: Assessment description
- `customer_id`: Foreign key to the customers table
- `job_id`: Foreign key to the jobs table (optional)
- `location`: Site location
- `constraints`: Array of site constraints
- `notes`: Additional notes
- `images`: Array of image URLs
- `videos`: Array of video URLs
- `created_by`: Foreign key to the users table
- `created_at`: Timestamp of assessment creation
- `updated_at`: Timestamp of last update

### Quotations
Stores information about quotations provided to customers.
- `id`: Primary key, unique identifier for the quotation
- `lead_id`: Foreign key to the leads table
- `customer_id`: Foreign key to the customers table
- `customer_name`: Name of the customer
- `customer_contact`: JSONB field with customer contact details
- `selected_machines`: JSONB field with selected equipment details
- `machine_type`: Type of machine
- `order_type`: Order type (micro, small, monthly, yearly)
- `number_of_days`: Number of rental days
- `working_hours`: Working hours per day
- `food_resources`: Number of food resources needed
- `accom_resources`: Number of accommodation resources needed
- `site_distance`: Distance to the site
- `usage`: Usage type (normal, heavy)
- `risk_factor`: Risk level (low, medium, high)
- Additional costs and configuration fields
- `total_rent`: Total rental cost
- Various cost breakdown fields
- `version`: Quotation version number
- `created_by`: Foreign key to the users table
- `status`: Quotation status (draft, sent, accepted, rejected)
- `created_at`: Timestamp of quotation creation
- `updated_at`: Timestamp of last update

### Quotation Templates
Stores template information for generating quotations.
- `id`: Primary key, unique identifier for the template
- `name`: Template name
- `description`: Template description
- `content`: Template content (HTML/markup)
- `is_default`: Whether this is the default template
- `created_by`: Foreign key to the users table
- `created_at`: Timestamp of template creation
- `updated_at`: Timestamp of last update

### Services
Stores information about services offered.
- `id`: Primary key, unique identifier for the service
- `name`: Service name
- `description`: Service description
- `category`: Service category
- `base_price`: Base price for the service
- `is_active`: Whether the service is active
- `created_at`: Timestamp of service creation
- `updated_at`: Timestamp of last update

### Notifications
Stores notifications for users.
- `id`: Primary key, unique identifier for the notification
- `user_id`: Foreign key to the users table
- `title`: Notification title
- `message`: Notification message content
- `type`: Notification type
- `reference_id`: ID of the referenced entity
- `reference_type`: Type of the referenced entity
- `is_read`: Whether the notification has been read
- `created_at`: Timestamp of notification creation

### Audit Logs
Tracks important changes to the system.
- `id`: Primary key, auto-incrementing
- `user_id`: Foreign key to the users table
- `action`: Type of action performed
- `entity_type`: Type of entity affected
- `entity_id`: ID of the entity affected
- `changes`: JSONB field with details of the changes
- `ip_address`: IP address of the user
- `user_agent`: User agent string
- `created_at`: Timestamp of the logged action

## Performance Optimizations

The schema includes multiple optimizations for production performance:

### Indexing Strategy
- Primary key indexes on all tables
- Foreign key indexes to optimize JOIN operations
- Composite indexes for common filter combinations (e.g., entity + status)
- Date-based indexes for time-range queries
- Full-text search indexes using pg_trgm for text columns

### Data Integrity
- CHECK constraints for validating data ranges and enumerated values
- NOT NULL constraints on required fields
- Email validation patterns
- Numeric range validation
- Foreign key constraints with appropriate cascading behaviors

### Automation
- Timestamp triggers for automatic updating of `updated_at` fields
- UUID generation with business-friendly prefixes
- Default values for common fields

### Query Optimization
- Denormalization where appropriate for query performance
- JSONB for flexible data structures
- Array types for simple collections
- Text search optimization via GIN indexes

## Usage Instructions

### Database Setup
1. Create a PostgreSQL database (version 12 or higher recommended):
   ```sql
   CREATE DATABASE asp_cranes_crm;
   ```

2. Connect to the database and execute the schema.sql file:
   ```bash
   psql -U your_user -d asp_cranes_crm -f schema.sql
   ```

### Environment Configuration
1. Configure the application's environment variables to connect to the database:
   ```
   DB_HOST=your-postgresql-host
   DB_PORT=5432
   DB_NAME=asp_cranes_crm
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_SSL=true
   ```

2. Ensure database connection pooling is properly configured in production:
   ```
   DB_POOL_MIN=5
   DB_POOL_MAX=20
   DB_IDLE_TIMEOUT=10000
   ```

### Deployment Notes
- Run a database migration tool to track and apply schema changes
- Always backup the database before schema updates
- Consider using a connection pooler like PgBouncer for high-traffic deployments
- Set up regular database maintenance tasks (VACUUM, ANALYZE)

## Security Considerations

### Authentication & Authorization
- All passwords are stored as secure hashes (bcrypt/Argon2) - never in plaintext
- JWT tokens with short expiration times and refresh token rotation
- Role-based access control fully integrated into database schema
- Email validation patterns for user inputs

### Audit & Compliance
- Comprehensive audit logging of all data modifications
- User tracking for all operations
- IP address and user agent logging
- Timestamps for all records and changes

### Data Protection
- Foreign key constraints enforce referential integrity
- CHECK constraints prevent invalid data entry
- Separation of authentication and business data
- Fine-grained permission system through roles

### Best Practices
- Input validation at database level
- No direct exposure of sequential IDs
- Protection against SQL injection through parameterized queries
- Regular security patching plan for PostgreSQL

## Maintenance Recommendations

### Regular Maintenance
- Scheduled database backups (at least daily)
- Implement point-in-time recovery capability
- VACUUM ANALYZE on regular schedule
- Index rebuilding for fragmented indexes

### Monitoring
- Query performance monitoring and logging
- Slow query identification
- Index usage statistics tracking
- Storage growth monitoring

### Scaling Considerations
- Partitioning strategy for high-growth tables (particularly audit_logs, notifications)
- Read replica setup for reporting workloads
- Connection pooling for high-concurrency environments
- Consider timeseries approach for historical data

### Data Lifecycle
- Implement data retention policies
- Archive older data to separate tables
- Regular review of index effectiveness
- Regular schema optimization reviews

### Backup Strategy
- Daily full backups
- Continuous WAL archiving for point-in-time recovery
- Regular backup restoration testing
- Off-site backup storage
