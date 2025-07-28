# Database and API Verification Scripts

This directory contains comprehensive verification scripts to ensure your ASP Cranes CRM deployment is working correctly with proper database connections and CRUD operations.

## 🚀 Quick Start

### On Linux/Ubuntu Server:
```bash
# Make scripts executable
chmod +x verify-full-system.sh quick-api-test.sh

# Run comprehensive verification
./verify-full-system.sh

# Or run quick API test
./quick-api-test.sh
```

### On Windows:
```powershell
# Run comprehensive verification
.\verify-full-system.ps1

# For manual API testing, see the manual commands below
```

## 📋 Available Scripts

### 1. `verify-full-system.sh` / `verify-full-system.ps1`
**Comprehensive system verification**
- ✅ Checks Docker container status
- ✅ Verifies database tables and structure
- ✅ Tests API endpoint accessibility
- ✅ Validates frontend accessibility
- ✅ Checks configuration and environment variables
- ✅ Shows resource usage and performance metrics

### 2. `quick-api-test.sh`
**Quick API CRUD testing**
- ✅ Tests API health endpoints
- ✅ Performs Customer CRUD operations
- ✅ Performs Lead CRUD operations
- ✅ Tests user authentication
- ✅ Tests equipment endpoints
- ✅ Cleans up test data

### 3. `verify-database-connections.js`
**Direct database connection testing**
- ✅ Tests PostgreSQL connection
- ✅ Verifies all required tables exist
- ✅ Performs CRUD operations on all main entities
- ✅ Checks database indexes and performance

### 4. `verify-api-endpoints.js`
**Comprehensive API endpoint testing**
- ✅ Tests all REST API endpoints
- ✅ Performs authenticated requests
- ✅ Validates response formats
- ✅ Tests error handling

## 🔧 Manual Testing Commands

### Test Customer Endpoints:
```bash
# Create Customer
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "company_name": "Test Company Ltd",
    "contact_name": "John Doe",
    "email": "test@company.com",
    "phone": "+1-555-0123",
    "address": "123 Test Street",
    "type": "construction"
  }'

# List Customers
curl http://localhost:3001/api/customers

# Get Customer by ID
curl http://localhost:3001/api/customers/{customer_id}

# Update Customer
curl -X PUT http://localhost:3001/api/customers/{customer_id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Customer Name"}'

# Delete Customer
curl -X DELETE http://localhost:3001/api/customers/{customer_id}
```

### Test Lead Endpoints:
```bash
# Create Lead (requires authentication)
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "title": "Test Lead",
    "company_name": "Lead Company",
    "contact_name": "Jane Smith",
    "email": "jane@leadcompany.com",
    "phone": "+1-555-0456",
    "equipment_type": "crane",
    "status": "new"
  }'

# List Leads (requires authentication)
curl http://localhost:3001/api/leads \
  -H "Authorization: Bearer {your_token}"
```

### Test Authentication:
```bash
# Register User
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aspcranes.com",
    "password": "admin123",
    "display_name": "Admin User",
    "role": "admin"
  }'

# Login User
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aspcranes.com",
    "password": "admin123"
  }'
```

### Test Database Connection:
```bash
# Check database tables from inside PostgreSQL container
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "\dt"

# Check table row counts
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
  SELECT tablename, n_live_tup as row_count 
  FROM pg_stat_user_tables 
  ORDER BY tablename;
"

# Test connection from backend container
docker exec -it asp-cranes-structured-backend-1 node -e "
  const pg = require('pg');
  const pool = new pg.Pool({
    host: 'postgres',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    password: 'crmdb@21'
  });
  pool.query('SELECT NOW()')
    .then(result => console.log('✅ DB Connection:', result.rows[0]))
    .catch(err => console.error('❌ DB Error:', err))
    .finally(() => pool.end());
"
```

## 🔍 Troubleshooting

### Common Issues and Solutions:

#### 1. Database Connection Errors
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL container
docker-compose restart postgres
```

#### 2. Backend API Not Responding
```bash
# Check backend container status
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Rebuild and restart backend
docker-compose up -d --build backend
```

#### 3. Frontend Not Loading
```bash
# Check frontend container status
docker-compose ps frontend

# Check frontend logs
docker-compose logs frontend

# Rebuild and restart frontend
docker-compose up -d --build frontend
```

#### 4. Authentication Issues
```bash
# Create admin user directly in database
docker exec -it asp-cranes-structured-postgres-1 psql -U postgres -d asp_crm -c "
  INSERT INTO users (email, password_hash, display_name, role) 
  VALUES (
    'admin@aspcranes.com', 
    '\$2b\$10\$dummy.hash.for.manual.testing', 
    'Admin User', 
    'admin'
  );
"
```

#### 5. Environment Variable Issues
```bash
# Check backend environment variables
docker exec asp-cranes-structured-backend-1 printenv | grep -E "DB_|NODE_|PORT|JWT_"

# Verify environment files
cat .env
cat crm-app/backend/.env
cat crm-app/frontend/.env
```

## 📊 Expected Results

### Successful Health Check:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX:XX:XX.XXXZ"
}
```

### Successful Customer Creation:
```json
{
  "id": "cust_xxxxxxxx",
  "name": "Test Customer",
  "company_name": "Test Company Ltd",
  "created_at": "2024-01-XX:XX:XX.XXXZ",
  "updated_at": "2024-01-XX:XX:XX.XXXZ"
}
```

### Successful Authentication:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "usr_xxxxxxxx",
    "email": "admin@aspcranes.com",
    "display_name": "Admin User",
    "role": "admin"
  }
}
```

## 🎯 What These Scripts Verify

1. **Database Layer:**
   - PostgreSQL container health
   - Database connection from backend
   - All required tables exist
   - CRUD operations work correctly
   - Data integrity and constraints

2. **API Layer:**
   - All REST endpoints are accessible
   - Authentication and authorization work
   - Request/response formats are correct
   - Error handling is appropriate

3. **Frontend Layer:**
   - Frontend application loads correctly
   - Can communicate with backend API
   - Environment configuration is correct

4. **Integration:**
   - Frontend ↔ Backend communication
   - Backend ↔ Database communication
   - Docker container networking
   - Environment variable consistency

## 🚀 Deployment Verification Checklist

- [ ] All Docker containers are running and healthy
- [ ] PostgreSQL database is accessible and contains all tables
- [ ] Backend API responds to health checks
- [ ] Frontend application loads successfully
- [ ] Customer CRUD operations work
- [ ] Lead CRUD operations work (with authentication)
- [ ] User authentication and authorization work
- [ ] Deal CRUD operations work
- [ ] Equipment endpoints are accessible
- [ ] Environment variables are configured correctly
- [ ] Database connections use correct host names
- [ ] No authentication bypass in production
- [ ] All API endpoints use proper JWT validation

Run these scripts after any deployment or configuration change to ensure everything is working correctly!
