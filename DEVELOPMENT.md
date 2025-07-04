# Development Commands Guide

## Quick Start

### Start Everything (Recommended)
```bash
npm run dev:full
```
This command starts both the backend API server (port 3001) and frontend development server (port 5173) simultaneously with color-coded output.

### Individual Services

#### Start Only Backend API Server
```bash
npm run dev:server
# or
npm run server:dev
```
Starts the API server on http://localhost:3001 with hot reload via nodemon.

#### Start Only Frontend Client
```bash
npm run dev:client
# or  
npm run dev
```
Starts the Vite development server on http://localhost:5173.

## Testing

### Test API Endpoints
```bash
npm run test:api
```
Tests all API endpoints to ensure they're responding correctly.

### Check Server Status
```bash
npm run check:server
```
Checks if the server is running and accessible.

## API Endpoints

When the server is running, these endpoints are available:

- **General API Info**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health  
- **Status Check**: http://localhost:3001/api/check
- **Authentication**: http://localhost:3001/api/auth
- **Deals**: http://localhost:3001/api/deals
- **Leads**: http://localhost:3001/api/leads
- **Customers**: http://localhost:3001/api/customers
- **Equipment**: http://localhost:3001/api/equipment
- **Quotations**: http://localhost:3001/api/quotations
- **Configuration**: http://localhost:3001/api/config

## Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

## Troubleshooting

### API Not Found Error
If you get "Not found" when accessing `/api`, make sure:
1. The server is running (`npm run dev:server`)
2. You're accessing the correct port (3001 for API, 5173 for frontend)
3. Check server logs for any startup errors

### Port Conflicts
If ports 3001 or 5173 are already in use:
- Backend: Set `PORT=3002` in your `.env` file
- Frontend: Vite will automatically use the next available port

### Environment Variables
Make sure you have a `.env` file with required database and configuration settings.
