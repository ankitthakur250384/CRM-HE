/**
 * Debug script to test the API server with verbose logging
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the server file
const serverPath = path.join(__dirname, '../src/server.mjs');

// Check if the server file exists
if (!fs.existsSync(serverPath)) {
  console.error(`Server file not found at ${serverPath}`);
  process.exit(1);
}

// Start the server with verbose logging
console.log(`Starting server from ${serverPath}...`);
console.log('==== DEBUG MODE - VERBOSE LOGGING ====');

const server = spawn('node', [serverPath], {
  env: { ...process.env, DEBUG: 'express:*' },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

// Handle server exit
server.on('exit', (code, signal) => {
  if (code) {
    console.error(`Server process exited with code ${code}`);
  } else if (signal) {
    console.error(`Server process was killed with signal ${signal}`);
  } else {
    console.log('Server stopped');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill('SIGINT');
});
