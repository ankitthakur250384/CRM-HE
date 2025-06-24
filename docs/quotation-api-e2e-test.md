# Quotation API End-to-End Test

Follow this process to test the Quotation API integration:

## Prerequisites

1. Make sure you have PostgreSQL running with the correct configuration:
   - Host: localhost (or as defined in your .env)
   - Database: asp_crm (or as defined in your .env)
   - User: postgres (or as defined in your .env)
   - Password: as defined in your .env

2. Create a .env file with the appropriate configuration if one doesn't exist:

```
VITE_API_URL=http://localhost:3001/api
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=asp_crm
VITE_DB_USER=postgres
VITE_DB_PASSWORD=your_password_here
VITE_DB_SSL=false
VITE_JWT_SECRET=your-secure-jwt-secret-key-change-in-production
```

## Test Process

### Option 1: Running the automated integration test

Run the integration test script which will start the server and run the tests:

```bash
# Using npm script with batch file (Windows CMD)
npm run test:quotation-integration

# OR using PowerShell script
npm run test:quotation-integration:ps
```

### Option 2: Running tests separately

1. Start the API server in one terminal:
```bash
npm run server
```

2. Run the login test to verify authentication works:
```bash
node scripts/test-login.mjs
```

3. If login test is successful, run the quotation API test:
```bash
node scripts/test-quotation-api.mjs
```

You can also use the npm script:
```bash
npm run test:quotations
```

## Troubleshooting

If the tests fail, check these common issues:

- **Authentication errors**: Ensure the credentials in the test scripts match the ones in your database
- **Connection errors**: Verify your PostgreSQL connection settings
- **API errors**: Check the API server logs for details
- **Database errors**: Make sure the database and tables exist

## Expected Test Output

When successful, the quotation test should show:
- Successful creation of a quotation
- Fetching all quotations
- Fetching a specific quotation
- Successful updates to a quotation
- Status updates working
- Deletion working correctly
