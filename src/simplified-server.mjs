/**
 * Simplified API Server for ASP Cranes CRM
 * Minimal version to help debug issues
 */

import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple router
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint works' });
});

// Mount router
app.use('/api', router);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Simplified API server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Simplified API server running at http://localhost:${PORT}`);
});
