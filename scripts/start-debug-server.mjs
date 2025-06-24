/**
 * Start API server with debug logging for equipment routes
 */
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiPath = join(__dirname, '..', 'src', 'api');

// Import equipment routes - use dynamic import to ensure we're getting the latest version
const { default: equipmentRoutes } = await import(join(apiPath, 'equipmentRoutes.fixed.mjs'));

// Set development mode for better error handling
process.env.NODE_ENV = 'development';

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Setup debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable detailed error logging for database connection
pg.on('error', (err) => {
  console.error('PostgreSQL Error:', err);
});

// API routes
app.use('/api/equipment', equipmentRoutes);

// Root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'API server is running', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Debug API server running on port ${PORT}`);
  console.log(`Test URL: http://localhost:${PORT}/api/equipment/debug/status`);
});
