# ASP Cranes CRM - User Initialization Guide

This guide explains how to set up users for the ASP Cranes CRM system.

## Quick Start

For immediate testing, use the essential users script:

```bash
psql -U postgres -d asp_crm -f essential-users.sql
```

This creates 4 essential users with sample data:
- **Admin**: admin@aspcranes.com
- **Sales**: sales@aspcranes.com  
- **Operations**: operations@aspcranes.com
- **Operator**: operator@aspcranes.com

**Default password for all accounts**: `password123`

## Full Setup

For a complete demonstration environment with multiple users:

```bash
psql -U postgres -d asp_crm -f initialize-users.sql
```

This creates:
- 2 Admin users
- 5 Sales agents  
- 3 Operations managers
- 5 Crane operators
- 2 Support staff
- 5 Sample customers
- 5 Sample equipment items

## User Roles & Permissions

### Admin (`admin`)
- Full system access
- User management
- System configuration
- All CRM functions

### Sales Agent (`sales_agent`)
- Lead management
- Customer management
- Quotation creation
- Deal tracking

### Operations Manager (`operations_manager`)
- Job scheduling
- Equipment management
- Operator assignment
- Resource planning

### Operator (`operator`)
- Job execution
- Equipment operation
- Status updates
- Field reporting

### Support (`support`)
- Customer support
- Issue tracking
- Basic reporting

## Available User Scripts

| Script | Purpose | Use Case |
|--------|---------|----------|
| `essential-users.sql` | Minimal setup (4 users + samples) | Quick testing |
| `initialize-users.sql` | Full demo environment | Development/Demo |
| `quick-users.sql` | Legacy quick setup | Compatibility |
| `add-users.sql` | Legacy basic users | Compatibility |

## Security Configuration

### Production Password Setup

1. **Generate secure password hashes**:
   ```bash
   # Install bcrypt if needed
   npm install bcrypt
   
   # Generate password hashes
   node generate-password-hash.js your_secure_password
   ```

2. **Update SQL scripts** with the generated hashes

3. **Change default passwords** immediately after deployment

### Password Hash Examples

The default demo hash `$2b$10$rOjLkWkqzKx8VnNx7.HUHOtGhq8E9F0rHvCxF6WoFhLkK3M4N5P6Q` corresponds to `password123`.

For production, generate unique hashes:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your_secure_password', 12);
```

## Database Connection

Ensure your PostgreSQL database is set up:

```bash
# Connect to database
psql -U postgres -d asp_crm

# Or with environment variables
export PGDATABASE=asp_crm
export PGUSER=postgres
psql -f essential-users.sql
```

## Verification

After running the user scripts, verify the setup:

```sql
-- Check user counts by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- Check operator profiles
SELECT COUNT(*) as operator_profiles FROM operators;

-- Check sample data
SELECT COUNT(*) as customers FROM customers;
SELECT COUNT(*) as equipment FROM equipment;
```

## Script Features

All user scripts are **idempotent** and safe to run multiple times:
- `ON CONFLICT DO UPDATE` prevents duplicate errors
- Existing data is updated, not duplicated
- Safe for development iterations

## Troubleshooting

### Common Issues

1. **Database doesn't exist**:
   ```bash
   createdb -U postgres asp_crm
   psql -U postgres -d asp_crm -f database/schema.sql
   ```

2. **Permission denied**:
   ```bash
   # Ensure PostgreSQL is running and user has permissions
   sudo -u postgres psql
   ```

3. **Constraint violations**:
   - Run `database/schema.sql` first
   - Check foreign key constraints
   - Verify UUID extension is installed

### Reset Users

To start fresh:
```sql
-- Clear all users and related data
TRUNCATE users CASCADE;
TRUNCATE operators CASCADE;
TRUNCATE customers CASCADE; 
TRUNCATE equipment CASCADE;

-- Then re-run initialization script
\i essential-users.sql
```

## Sample Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| Admin | admin@aspcranes.com | password123 | Full access |
| Sales | sales@aspcranes.com | password123 | Leads, Deals, Customers |
| Operations | operations@aspcranes.com | password123 | Jobs, Equipment |
| Operator | operator@aspcranes.com | password123 | Job execution |

## Next Steps

1. **Set up the database**: Run `database/schema.sql`
2. **Initialize users**: Run `essential-users.sql` 
3. **Test login**: Use the web interface
4. **Configure authentication**: Update JWT secrets
5. **Secure passwords**: Change defaults before production

## Production Checklist

- [ ] Generate unique password hashes
- [ ] Change all default passwords  
- [ ] Enable HTTPS
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Test all user roles
- [ ] Verify foreign key constraints
- [ ] Test password reset functionality
- [ ] Set up monitoring

---

**⚠️ Security Warning**: The default passwords are for development only. Always change them before production deployment!
