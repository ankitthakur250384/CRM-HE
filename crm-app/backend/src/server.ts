import notificationRoutes from './routes/notificationRoutes';
import templateRoutes from './routes/templateRoutes';
/**
 * API Server for ASP Cranes CRM
 * This server provides authentication and database access for the frontend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes';
import dbRoutes from './routes/dbRoutes';
import jobRoutes from './routes/jobRoutes';
import operatorRoutes from './routes/operatorRoutes';
// @ts-ignore - Using .mjs file which doesn't have type declarations
import equipmentRoutes from './api/equipmentRoutes.mjs';
// @ts-ignore - Using .mjs file which doesn't have type declarations
import leadsRoutes from './api/leadsRoutes.mjs';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins temporarily
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bypass-auth', 'x-application-type'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Log all request headers for debugging
app.use((req, res, next) => {
  console.log('🔎 [REQUEST] Method:', req.method, 'URL:', req.originalUrl);
  console.log('🔎 [REQUEST] Headers:', req.headers);
  next();
});
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve the frontend build
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const buildPath = path.join(__dirname, '../dist');

  app.use(express.static(buildPath));
  
  // Serve index.html for all other routes
  app.get('*', (_, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
