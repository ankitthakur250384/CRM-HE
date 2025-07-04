# Frontend-Backend Code Separation Guide

## Overview

This document explains how to properly separate frontend and backend code in our React + Node.js application. Following these guidelines will help prevent common errors such as "process is not defined" that occur when server-side code is accidentally used in the browser.

## Key Principles

1. **Frontend code should never import server-side modules directly**
2. **All server-side functionality should be exposed via API endpoints**
3. **API requests should be used for all data operations**
4. **Keep separate client and server implementations for shared functionality**

## Common Problems

### "process is not defined" Error

This occurs when frontend code imports modules that depend on Node.js's `process` object. Common culprits:

- Direct imports of database libraries (pg-promise, knex, etc.)
- Importing from server-side services
- Using Node.js built-ins (fs, path, os, etc.)

### How We Fixed It

1. Created separate client-side service files:
   - `authService.client.ts` instead of `postgresAuthService.ts`
   - `configService.ts` is frontend-only, using API calls

2. Updated imports in frontend code:
   - `quotationConfigStore.ts` now imports from `configService.ts`
   - `authStore.ts` now imports from `authService.client.ts` 

3. Added build-time checks:
   - `check-frontend-imports.mjs` script scans for server-side imports

## Architecture Guidelines

### For Backend Developers:
- Keep server code in specific directories (`src/api`, `src/services/postgres`)
- Export functionality via API endpoints 
- Use `.js` or `.mjs` extensions for server modules
- Document API endpoints for frontend developers

### For Frontend Developers:
- Never import from server directories
- Create client-side versions of services that call APIs
- Use `.ts` and `.tsx` extensions
- Look for `*.client.ts` files for frontend-safe implementations

### API Communication
- Use fetch API for all backend communication
- Handle authentication consistently
- Structure API responses with `success`, `data`, and `error` fields

## Testing

To check for problematic imports:

```bash
npm run check:frontend
```

This will identify any server-side imports in frontend code.

## Examples

### ❌ Incorrect (Server-side import in frontend code):
```typescript
import { getQuotationConfig } from '../services/postgresService';
```

### ✅ Correct (API-based approach):
```typescript
import { getQuotationConfig } from '../services/configService';
```

## Reference

Server-side modules to avoid importing in frontend:
- pg-promise
- knex
- bcryptjs
- jsonwebtoken
- express
- dotenv
- fs, path, os, crypto, etc.

Always use API calls for data operations!
