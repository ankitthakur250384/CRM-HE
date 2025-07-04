/**
 * Minimal API Server for ASP Cranes CRM
 * For testing basic API functionality
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import core route files
import authRoutes from './api/authRoutes.mjs';
import dealsRoutes from './api/dealsRoutes.mjs';

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

// Mount essential routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Minimal API server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Minimal API server running at http://localhost:${PORT}`);
});
