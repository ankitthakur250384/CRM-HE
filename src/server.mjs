/**
 * API Server for ASP Cranes CRM
 * This server provides authentication and database access for the frontend
 * With enhanced error handling and debugging
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Set development mode for better error handling
process.env.NODE_ENV = 'development';
// Using the fixed version of auth routes with better error handling
import authRoutes from './api/authRoutes.fixed.mjs';
import dbRoutes from './api/dbRoutes.mjs';
// Using the fixed version with better error handling and consistent DB connections
import leadsRoutes from './api/leadsRoutes.fixed.mjs';
import dealsRoutes from './api/dealsRoutes.mjs';
// Using the type-fixed version with proper type handling for database fields
import quotationRoutes from './api/quotationRoutes.typefix.mjs';
// Add customer routes - using fixed version with improved error handling
import customerRoutes from './api/customerRoutes.fixed.mjs';
// Equipment routes for equipment management - using fixed version
import equipmentRoutes from './api/equipmentRoutes.fixed.mjs';
// Database connection testing routes
import databaseRoutes from './api/databaseRoutes.mjs';
// Debug version of leads routes with no authentication for testing
import debugLeadsRoutes from './api/debugLeadsRoutes.mjs';
// Direct API routes for testing without authentication
import directRoutes from './api/directRoutes.mjs';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/database', databaseRoutes);

// Debug API routes (no authentication required)
app.use('/api/debug/leads', debugLeadsRoutes);

// Direct API routes without authentication (for development/testing only)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/direct', directRoutes);
}

// Direct debug route for checking API status
app.get('/api/check', (req, res) => {
  try {
    console.log('API status check endpoint hit');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    console.error('Error in API status check:', err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

// Debug endpoint to check registered routes (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/routes', (req, res) => {
    try {
      const routes = [];
      
      // Function to print all routes
      function print(path, layer) {
        try {
          if (layer.route) {
            layer.route.stack.forEach(print.bind(null, path));
          } else if (layer.name === 'router' && layer.handle.stack) {
            layer.handle.stack.forEach(print.bind(null, path + layer.regexp.source.replace("^", "").replace("\\/?(?=\\/|$)", "")));
          } else if (layer.method) {
            routes.push(`${layer.method.toUpperCase()} ${path + layer.regexp.source.replace("^", "").replace("\\/?(?=\\/|$)", "")}`);
          }
        } catch (innerErr) {
          console.error('Error processing route layer:', innerErr);
          // Continue with other layers even if one fails
        }
      }
      
      app._router.stack.forEach(print.bind(null, ''));
      
      res.json(routes);
    } catch (err) {
      console.error('Error retrieving routes:', err);
      res.status(500).json({ 
        error: 'Failed to retrieve routes',
        message: err.message
      });
    }
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoints for testing
app.get('/api/debug/headers', (req, res) => {
  console.log('DEBUG HEADERS ENDPOINT HIT');
  console.log('Headers received:', req.headers);
  
  res.status(200).json({ 
    status: 'ok', 
    headers: req.headers,
    environment: process.env.NODE_ENV,
    bypassEnabled: process.env.NODE_ENV === 'development'
  });
});

// Simple debug endpoint to check leads without authentication
app.get('/api/debug/leads-direct', async (req, res) => {
  console.log('DEBUG DIRECT LEADS ENDPOINT HIT');
  
  // Create a direct database connection pool
  const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'asp_crm',
    user: 'postgres',
    password: 'vedant21',
    ssl: false
  });
  
  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();
    console.log('✅ Connected to database for direct leads query');
    
    // Check if leads table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'leads'
      ) AS table_exists
    `);
    
    if (!tableCheck.rows[0].table_exists) {
      return res.status(200).json({
        status: 'ok',
        message: 'Leads table does not exist',
        leads: []
      });
    }
    
    // Get all leads
    const result = await client.query('SELECT * FROM leads LIMIT 100');
    
    return res.status(200).json({
      status: 'ok',
      count: result.rows.length,
      leads: result.rows
    });
  } catch (error) {
    console.error('Debug leads endpoint error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    // Make sure to release the client back to the pool
    if (client) {
      client.release();
    }
    // End the pool (not normally needed for a server, but included for completeness)
    await pool.end();
  }
});

// In production, serve the frontend build
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const buildPath = path.join(__dirname, '../dist');

  app.use(express.static(buildPath));
  
  // Serve index.html for all other routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Start the server with error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Development mode: ${process.env.NODE_ENV === 'development' ? 'ENABLED' : 'DISABLED'}`);
});

// Handle server errors to prevent crashing
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  
  // Check for specific errors
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Is another server already running?`);
    console.error('Try stopping the existing server or using a different port.');
  }
});

// Handle global unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  // Don't exit the process, just log the error
});

// Gracefully handle SIGINT (Ctrl+C) to prevent database connection leaks
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT (Ctrl+C). Shutting down gracefully...');
  
  try {
    // Close the Express server
    server.close(() => {
      console.log('✅ Express server closed successfully');
    });
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
});

export default app;
