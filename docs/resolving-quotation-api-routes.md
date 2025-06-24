# Resolving Quotation API Routes Issue

We've identified an issue with the quotation API routes not being recognized by the server. Follow these steps to resolve the issue:

## Step 1: Test with Simplified Routes

We've created a simplified version of the quotation routes (`quotationRoutes.simple.mjs`) that doesn't depend on the database. 

1. The server has been updated to use this simplified version:
   ```javascript
   // In server.mjs
   import quotationRoutes from './api/quotationRoutes.simple.mjs';
   ```

2. Run the server restart test script to check if the simplified routes work:
   ```bash
   npm run test:quotation-restart
   ```

3. If the simplified routes work, the issue is likely with the original quotation routes file, not with the server configuration.

## Step 2: Check for Common Issues

If the issue persists, check for these common problems:

1. **Syntax Errors**: Check the quotation routes file for any JavaScript syntax errors
   ```bash
   node --check src/api/quotationRoutes.mjs
   ```

2. **Import Errors**: Make sure all imports are working correctly
   ```bash
   node --experimental-modules --es-module-specifier-resolution=node src/api/quotationRoutes.mjs
   ```

3. **Route Issues**: Look for middleware errors or route configuration issues
   ```bash
   # Check the debug route
   curl http://localhost:3001/api/quotations/debug
   ```

## Step 3: Fix the Original Routes File

Once you've identified the issue, apply the fix to the original quotation routes file:

1. If it's a database connection issue, check your PostgreSQL connection settings
2. If it's a route configuration issue, compare with the simplified version
3. If it's a middleware issue, check the authentication function

## Step 4: Update the Server Configuration

After fixing the routes file, update the server to use the original routes again:

```javascript
// In server.mjs
import quotationRoutes from './api/quotationRoutes.mjs';
```

## Step 5: Verify the Integration

Run the full integration test:
```bash
npm run test:quotation-integration
```

This should now work with the fixed quotation routes.

## Additional Resources

- Check `scripts/verify-quotation-routes.mjs` for endpoint verification
- Check `scripts/test-quotation-api.mjs` for API testing
- Check `src/api/quotationRoutes.simple.mjs` for a working example of routes
