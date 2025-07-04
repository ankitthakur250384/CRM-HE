# ASP Cranes CRM - API Server Setup & Troubleshooting

This README provides instructions for starting the API server and troubleshooting common issues.

## Starting the API Server

To start the API server:

```bash
cd scripts
node start-api-server.mjs
```

## Fixed Issues

### 1. Error Fetching Quotations
- Fixed PostgreSQL type mismatch between VARCHAR and INTEGER fields
- Added explicit type casting in SQL queries:
  ```sql
  JOIN customers c ON q.customer_id::varchar = c.customer_id::varchar
  ```

### 2. Error Fetching Leads
- Created an improved version with consistent database connection settings
- Added better error handling and diagnostics
- Fixed type casting issues in JOIN operations
- Added automatic table creation if tables don't exist

### 3. Authentication Issues
- Fixed SimpleAuthProvider implementation for frontend
- Improved token handling and error reporting

## Database Configuration

The database connection parameters are set in the `.env` file:

```
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=asp_crm
VITE_DB_USER=postgres
VITE_DB_PASSWORD=vedant21
VITE_DB_SSL=false
```

Make sure these settings match your PostgreSQL configuration.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check your database credentials in `.env`
- Run `node scripts/test-db-connection.mjs` to test the connection

### API Endpoints
- Auth API: `http://localhost:3001/api/auth`
- Leads API: `http://localhost:3001/api/leads`
- Quotations API: `http://localhost:3001/api/quotations`
- Customers API: `http://localhost:3001/api/customers`
- Deals API: `http://localhost:3001/api/deals`

### Common Errors

#### "operator does not exist: character varying = integer"
This error occurs when comparing fields with different data types. Fixed by adding explicit type casting.

#### "Error fetching leads/quotations"
This can happen due to:
1. Database connection issues
2. Missing tables
3. Type mismatches in queries

Our fixed versions include automatic table creation and better error handling.

## Testing API Endpoints

You can test the API endpoints using:

```bash
node scripts/test-auth-api.mjs
node scripts/test-leads-api.mjs
node scripts/test-quotation-api.mjs
```
