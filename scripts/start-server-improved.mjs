#!/usr/bin/env node
/**
 * Improved Server Startup Script
 * 
 * This script starts the API server with better handling of environment
 * and helps with debugging connection issues.
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Color output helpers
const success = (message) => chalk.green(message);
const error = (message) => chalk.red(message);
const info = (message) => chalk.blue(message);
const warn = (message) => chalk.yellow(message);
const highlight = (message) => chalk.yellowBright.bold(message);

// Directory setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'src', 'server.mjs');

// Check if server file exists
if (!fs.existsSync(serverPath)) {
  console.error(error(`❌ Server file not found at ${serverPath}`));
  process.exit(1);
}

console.log(highlight('\n=== ASP CRANES CRM API SERVER ===\n'));
console.log(info('Starting API server...'));
console.log(info(`Server file: ${serverPath}`));
console.log(info(`Environment: ${process.env.NODE_ENV || 'development'}`));
console.log(info(`Port: ${process.env.PORT || 3001}`));

// Database connection check
console.log(info('\nDatabase connection parameters:'));
console.log({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: process.env.VITE_DB_PORT || 5432,
  database: process.env.VITE_DB_NAME || 'asp_crm',
  user: process.env.VITE_DB_USER || 'postgres',
  passwordProvided: process.env.VITE_DB_PASSWORD ? 'Yes' : 'No (using hardcoded)',
});

// Start the server
console.log(info('\nStarting server process...'));

const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development', // Force development mode
  },
});

serverProcess.on('error', (err) => {
  console.error(error(`\n❌ Failed to start server: ${err.message}`));
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== null) {
    if (code === 0) {
      console.log(warn(`\n⚠️ Server process exited with code 0 (should continue running)`));
    } else {
      console.error(error(`\n❌ Server process exited with code ${code}`));
    }
  } else if (signal) {
    console.log(info(`\n🛑 Server was killed with signal ${signal}`));
  }
});

// Show instructions
console.log(highlight('\n=== SERVER RUNNING ===\n'));
console.log(info('API Endpoints:'));
console.log(`• Health Check: http://localhost:${process.env.PORT || 3001}/api/health`);
console.log(`• API Status:   http://localhost:${process.env.PORT || 3001}/api/check`);
console.log(`• Debug Routes: http://localhost:${process.env.PORT || 3001}/api/debug/routes`);
console.log(`• Direct API:   http://localhost:${process.env.PORT || 3001}/api/direct/test`);

console.log(info('\nAuthentication:'));
console.log('Development mode bypass header: X-Bypass-Auth: true');

console.log(highlight('\nPress Ctrl+C to stop the server\n'));
