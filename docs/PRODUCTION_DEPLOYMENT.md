# ASP Cranes CRM - Production Deployment Guide

This guide outlines the steps required to properly build and deploy the ASP Cranes CRM application to a production environment with enhanced security.

## Security Improvements

We've made significant security improvements to ensure proper separation between development and production environments:

1. **Environment Detection**: Enhanced environment detection to reliably identify production vs. development environments.
2. **Development Token Blocking**: Development authentication tokens are now completely blocked in production.
3. **Module Aliasing**: Development modules are replaced with empty modules in production builds.
4. **Token Cleanup**: Added utilities to purge any development tokens from browser storage.
5. **Production Validation**: Added validation checks to ensure production deployments are secure.
6. **Error Reporting**: Enhanced error reporting for security incidents.

## Production Build Process

To build the application for production:

1. Navigate to the project directory
2. Run the production build script:

```bash
# On Windows
scripts/build-production.bat

# On Linux/Mac
chmod +x scripts/build-production.sh
./scripts/build-production.sh
```

## Key Files Modified

- **SimpleAuthProvider.tsx**: Ensures no dev authentication is used in production
- **SimpleProtectedRoute.tsx**: Prevents dev token fallbacks in production
- **jwtService.ts**: Enhanced JWT validation with strict checking of dev tokens
- **emptyModule.js**: Improved module shim for production builds
- **vite.config.ts**: Updated module aliasing with better path coverage
- **envConfig.ts**: Improved environment detection
- **productionValidator.ts**: Added validation of production deployments
- **main.tsx**: Enhanced initialization with proper environment checks

## Pre-Deployment Checklist

Before deploying to production:

1. **Clean Browser Storage**: Use the cleanup.html page to remove any development tokens
2. **Verify Auth**: Test that authentication works properly with real JWT tokens
3. **Check for Dev Code**: Verify that no development authentication code is present in the build
4. **API Authentication**: Test API endpoints to ensure they require proper authentication
5. **Environment Variables**: Set required environment variables for production
6. **Security Hardening**: Review any additional security measures for your specific deployment

## Environment Variables

The following environment variables must be set in production:

- `NODE_ENV=production`
- `VITE_JWT_SECRET=your-secure-jwt-secret` (must match your API server)
- `VITE_API_URL=your-api-url` (if not using the default /api path)

## Troubleshooting

If you encounter any issues:

1. **JWT Errors**: Ensure JWT secrets match between frontend and backend
2. **Auth Failures**: Check for any remaining development tokens in localStorage
3. **API Connection Issues**: Verify API URL configuration
4. **Browser Errors**: Check console logs for security warnings

For any security-related issues, immediately stop deployment and review the changes.
