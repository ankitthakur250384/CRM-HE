/**
 * Combined Development Server Launcher
 * 
 * This script launches both the API server and the Vite development server
 * at the same time to make development easier.
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

// Color output helpers
const success = chalk.green;
const error = chalk.red;
const info = chalk.blue;
const highlight = chalk.yellowBright.bold;

console.log(highlight('\n=== ASP CRANES CRM DEVELOPMENT SERVER ===\n'));

// Track running processes
const processes = [];

// Function to start a process
function startProcess(command, args, name, options = {}) {
  console.log(info(`Starting ${name}...`));
  
  const proc = spawn(command, args, {
    ...options,
    stdio: 'pipe', // Capture output to control formatting
    shell: true
  });
  
  processes.push({ proc, name });
  
  // Tag output with the process name
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${name}] ${line}`);
      }
    });
  });
  
  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(error(`[${name}] ${line}`));
      }
    });
  });
  
  proc.on('error', (err) => {
    console.error(error(`[${name}] Failed to start: ${err.message}`));
  });
  
  proc.on('exit', (code, signal) => {
    if (code !== null) {
      if (code === 0) {
        console.log(info(`[${name}] Process exited normally with code 0`));
      } else {
        console.error(error(`[${name}] Process exited with code ${code}`));
      }
    } else if (signal) {
      console.log(info(`[${name}] Process was killed with signal ${signal}`));
    }
    
    // Remove from processes array
    const index = processes.findIndex(p => p.proc === proc);
    if (index !== -1) {
      processes.splice(index, 1);
    }
    
    // If API server crashes, restart it
    if (name === 'API' && !shuttingDown) {
      console.log(info('[API] Server crashed, restarting in 5 seconds...'));
      setTimeout(() => {
        startProcess('npm', ['run', 'server'], 'API');
      }, 5000);
    }
  });
  
  return proc;
}

// Flag to track if we're intentionally shutting down
let shuttingDown = false;

// Start API server
startProcess('npm', ['run', 'server'], 'API');

// Wait a moment before starting the frontend to give the API time to initialize
setTimeout(() => {
  // Start Vite dev server with host flag to expose the network
  startProcess('npm', ['run', 'dev', '--', '--host'], 'FRONTEND');
  
  console.log(highlight('\n=== DEVELOPMENT SERVERS STARTED ===\n'));
  console.log(info('API Server:    ') + 'http://localhost:3001/api');
  console.log(info('Frontend:      ') + 'http://localhost:5173/');
  console.log(info('API Health:    ') + 'http://localhost:3001/api/health');
  console.log(info('API Status:    ') + 'http://localhost:3001/api/check');
  console.log();
  console.log(highlight('Press Ctrl+C to stop all servers\n'));
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log(highlight('\nShutting down all processes...'));
  shuttingDown = true;
  
  // Kill all child processes
  processes.forEach(({ proc, name }) => {
    console.log(info(`Stopping ${name}...`));
    
    // Different ways to kill depending on platform
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
    } else {
      proc.kill('SIGINT');
    }
  });
  
  // Allow some time for graceful shutdown before forcing exit
  setTimeout(() => {
    console.log(info('Shutdown complete'));
    process.exit(0);
  }, 1000);
});

// Watch for errors
process.on('unhandledRejection', (reason) => {
  console.error(error('Unhandled Promise Rejection:'), reason);
});
