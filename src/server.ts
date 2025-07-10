/**
 * API Server for ASP Cranes CRM
 * This server provides authentication and database access for the frontend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './api/authRoutes';
import dbRoutes from './api/dbRoutes';
// @ts-ignore - Using .mjs file which doesn't have type declarations
import leadsRoutes from './api/leadsRoutes.mjs';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bypass-auth'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/leads', leadsRoutes);

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
