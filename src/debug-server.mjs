/**
 * Simplified API Server for ASP Cranes CRM
 * For debugging route issues
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import all route files
import authRoutes from './api/authRoutes.mjs';
import dealsRoutes from './api/dealsRoutes.mjs';
import leadsRoutes from './api/leadsRoutes.mjs';
import quotationRoutes from './api/quotationRoutes.mjs';
import customerRoutes from './api/customerRoutes.mjs';
import equipmentRoutes from './api/equipmentRoutes.mjs';
import configRoutes from './api/configRoutes.mjs';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint works' });
});

// Mount all routers
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/config', configRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Simplified API server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'production' ? null : err.stack });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Debug API server running at http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('All API routes mounted successfully:');
  console.log(`- Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`- Deals routes: http://localhost:${PORT}/api/deals`);
  console.log(`- Leads routes: http://localhost:${PORT}/api/leads`);
  console.log(`- Quotation routes: http://localhost:${PORT}/api/quotations`);
  console.log(`- Customer routes: http://localhost:${PORT}/api/customers`);
  console.log(`- Equipment routes: http://localhost:${PORT}/api/equipment`);
  console.log(`- Config routes: http://localhost:${PORT}/api/config`);
});
