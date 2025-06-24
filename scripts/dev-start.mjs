/**
 * ASP Cranes CRM - Development Helper Script
 * 
 * This script helps set up and start the development environment
 * with both the API server and frontend dev server.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Color output helpers
const success = (message) => chalk.green(message);
const error = (message) => chalk.red(message);
const info = (message) => chalk.blue(message);
const warn = (message) => chalk.yellow(message);
const highlight = (message) => chalk.yellowBright.bold(message);

console.log(highlight('=== ASP CRANES CRM DEVELOPMENT HELPER ==='));
console.log('');

// Check if we're in the correct directory
const isInProjectDir = fs.existsSync('package.json') && fs.existsSync('src/server.mjs');
if (!isInProjectDir) {
  console.log(error('❌ Error: This script should be run from the project root directory'));
  console.log('Current directory:', process.cwd());
  process.exit(1);
}

// Check for necessary environment variables
console.log(info('📋 Checking environment setup...'));

const requiredEnvVars = ['VITE_API_URL', 'VITE_DB_HOST', 'VITE_DB_NAME', 'VITE_DB_USER'];
const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.log(warn(`⚠️ Warning: Missing environment variables: ${missingVars.join(', ')}`));
  console.log(info('Creating default .env file with development settings...'));
  
  // Create a default .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    const defaultEnv = `# ASP Cranes CRM Environment Variables
VITE_API_URL=http://localhost:3001/api
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=asp_crm
VITE_DB_USER=postgres
# Note: For security, the DB password is hardcoded in the backend files
# JWT secret should be changed in production
VITE_JWT_SECRET=your-secure-jwt-secret-key-change-in-production
NODE_ENV=development
`;
    fs.writeFileSync('.env', defaultEnv);
    console.log(success('✅ Created default .env file'));
    
    // Reload environment variables
    dotenv.config({ override: true });
  } else {
    console.log(warn('⚠️ .env file exists but is missing some variables. Please check the file.'));
  }
}

// Start the API server
console.log(info('🚀 Starting API server...'));

const apiServer = spawn('node', ['src/server.mjs'], { 
  stdio: 'pipe', 
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

console.log(info('⏳ Waiting for API server to start...'));

apiServer.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Filter out some noise
  if (output.includes('GET /api/debug/headers')) return;
  
  console.log(`${chalk.cyan('[API]')} ${output}`);
  
  // Detect when server is ready
  if (output.includes('Server running on port')) {
    console.log(success('✅ API server started successfully'));
    
    // Start the frontend dev server
    console.log(info('🚀 Starting frontend development server...'));
    
    const frontendServer = spawn('npm', ['run', 'dev'], { 
      stdio: 'pipe', 
      shell: true,
      env: { ...process.env }
    });
    
    frontendServer.stdout.on('data', (data) => {
      console.log(`${chalk.magenta('[FRONTEND]')} ${data.toString()}`);
      
      // Detect when frontend server is ready
      if (data.toString().includes('http://localhost')) {
        console.log(success('✅ Frontend development server started successfully'));
        
        console.log('');
        console.log(highlight('=== DEVELOPMENT ENVIRONMENT READY ==='));
        console.log('');
        console.log(info('📱 Access the application at: ') + highlight('http://localhost:5173'));
        console.log('');
        console.log(warn('⚠️ Remember: In development mode, the API fallback to local data will be used if API calls fail'));
        console.log('');
      }
    });
    
    frontendServer.stderr.on('data', (data) => {
      console.log(`${chalk.magenta('[FRONTEND ERROR]')} ${data.toString()}`);
    });
    
    frontendServer.on('close', (code) => {
      console.log(warn(`⚠️ Frontend server exited with code ${code}`));
      // Kill API server when frontend server exits
      apiServer.kill();
      process.exit(code);
    });
  }
});

apiServer.stderr.on('data', (data) => {
  console.log(`${chalk.cyan('[API ERROR]')} ${data.toString()}`);
});

apiServer.on('close', (code) => {
  console.log(warn(`⚠️ API server exited with code ${code}`));
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(info('\n🛑 Shutting down development environment...'));
  apiServer.kill();
  process.exit(0);
});
