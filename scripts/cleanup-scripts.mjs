import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsDir = __dirname;
const backupDir = path.join(__dirname, '..', 'backup', 'scripts', 'redundant');

// List of scripts that are referenced in package.json or are critical for the application
const keepScripts = [
  // Scripts referenced in package.json
  'start-server-improved.mjs', 
  'start-dev.mjs',
  'diagnose-api-connection.mjs',
  'test-api-endpoints.mjs', 
  'test-api-fixes.mjs',
  'dev-start.mjs',
  'inspect-lead-data.mjs', 
  'check-server-status.mjs',
  'simple-db-test.mjs', 
  'test-pg-connection.mjs',
  'test-login.mjs',
  'update-admin-password.mjs',
  'check-users-table.mjs',
  'test-integration.mjs',
  'test-authentication.mjs',
  'test-leads-api.mjs',
  'test-lead-unassignment.mjs',
  'test-deals-api.mjs',
  'check-deals-table.mjs',
  'test-quotation-api.mjs',
  'test-quotation-integration.bat',
  'test-quotation-integration.ps1',
  'test-quotation-with-restart.bat',
  'verify-quotation-routes.mjs',
  'create-deals-table.mjs',
  'insert-sample-deals.mjs',
  'setup-test-deals.bat',
  'add-password-hash-column.mjs',
  'create-lead-metadata-table.mjs',
  'update-legacy-leads.mjs',
  'db-setup.js',
  'test-db-connection.cjs',
  'migrate-data.js',
  'setup-db.cjs',
  'simple-db-test.cjs',
  'db-client-test.js',
  'migrate-firestore-to-postgres.cjs',
  'migrate-firestore-collection.cjs',
  'migrate-users-simple.cjs',
  'migrate-users-adaptive.cjs',
  'migrate-users-uid.cjs',
  'migrate-config.cjs',
  'migrate-all.bat',
  'start-server-debug.mjs',
  
  // Keep the cleanup script itself
  'cleanup-scripts.mjs',
  
  // Critical infrastructure scripts
  'check-server-running.mjs',
  'package.json',
  'tsconfig.json',
  'README-migration.md',
];

// Files recently created that should be preserved
const recentlyCreated = [
  'inspect-lead-data.mjs',
  'diagnose-api-connection.mjs',
  'check-server-status.mjs',
  'simple-db-test.mjs',
  'test-pg-connection.mjs',
  'test-api-endpoints.mjs',
  'test-api-fixes.mjs',
  'start-server-improved.mjs',
  'start-dev.mjs'
];

// Ensure the backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Process script files
const files = fs.readdirSync(scriptsDir);
const skippedFiles = [];
const movedFiles = [];
const errors = [];

files.forEach(file => {
  // Skip node_modules, directories, and essential files
  if (file === 'node_modules' || keepScripts.includes(file)) {
    skippedFiles.push(file);
    return;
  }
  
  const sourcePath = path.join(scriptsDir, file);
  
  // Skip directories
  if (fs.statSync(sourcePath).isDirectory()) {
    skippedFiles.push(file + '/');
    return;
  }
  
  const destinationPath = path.join(backupDir, file);
  
  try {
    // Move file to backup
    fs.renameSync(sourcePath, destinationPath);
    movedFiles.push(file);
  } catch (error) {
    errors.push({ file, error: error.message });
  }
});

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  moved: movedFiles,
  skipped: skippedFiles,
  errors
};

// Write the report to a log file
fs.writeFileSync(
  path.join(backupDir, 'cleanup-report.json'), 
  JSON.stringify(report, null, 2)
);

// Display results to console
console.log(`\nScript Cleanup Report`);
console.log('='.repeat(50));
console.log(`Moved ${movedFiles.length} redundant files to backup`);
console.log(`Kept ${skippedFiles.length} essential files`);
console.log(`Encountered ${errors.length} errors`);
console.log('='.repeat(50));

if (errors.length > 0) {
  console.log('\nErrors encountered:');
  errors.forEach(err => console.log(`- ${err.file}: ${err.error}`));
}

console.log(`\nBackup location: ${backupDir}`);
console.log(`Report saved to: ${path.join(backupDir, 'cleanup-report.json')}`);
