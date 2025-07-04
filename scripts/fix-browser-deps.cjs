/**
 * Move pg-promise to a server-only dependency
 *
 * This script ensures that pg-promise and other server-only dependencies
 * do not cause issues for the frontend build.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the project root
const projectRoot = path.resolve(__dirname, '..');

// Path to the package.json
const packageJsonPath = path.join(projectRoot, 'package.json');

// Read the package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Server-only dependencies
const serverOnlyDeps = ['pg-promise', 'pg', 'bcryptjs', 'jsonwebtoken', 'express', 'cors', 'dotenv'];

// Check if any server deps are in dependencies
let hasDepsToMove = false;
const currentDeps = packageJson.dependencies || {};

// Create dependencies object if it doesn't exist
if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

// Create devDependencies object if it doesn't exist
if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}

// Check if browser field exists, if not create it
if (!packageJson.browser) {
  packageJson.browser = {};
}

// Ensure all server dependencies are marked as false in browser field
for (const dep of serverOnlyDeps) {
  if (currentDeps[dep]) {
    hasDepsToMove = true;
    console.log(`Found server dependency to move: ${dep}`);
    
    // Move to devDependencies 
    packageJson.devDependencies[dep] = currentDeps[dep];
    
    // Remove from dependencies
    delete packageJson.dependencies[dep];
    
    // Add to browser field to exclude from browser bundle
    packageJson.browser[dep] = false;
  }
}

// Save the updated package.json
if (hasDepsToMove) {
  console.log('Updating package.json to fix server dependency issues...');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  console.log('Package.json updated successfully!');
} else {
  console.log('No server dependencies found in package.json, nothing to fix.');
}

// Create alias files for browser environment
const shimDir = path.join(projectRoot, 'src', 'shims');
if (!fs.existsSync(shimDir)) {
  fs.mkdirSync(shimDir, { recursive: true });
}

// Create pg-promise shim
const pgPromiseShim = `
/**
 * Browser-compatible pg-promise shim
 */
export default function() {
  console.warn('pg-promise is not available in browser environment');
  return {
    query: () => Promise.resolve({ rows: [] }),
    none: () => Promise.resolve(),
    one: () => Promise.resolve({}),
    oneOrNone: () => Promise.resolve(null),
    many: () => Promise.resolve([]),
    manyOrNone: () => Promise.resolve([])
  };
}
`;

fs.writeFileSync(path.join(shimDir, 'pg-promise.js'), pgPromiseShim, 'utf8');
console.log('Created pg-promise shim file');

console.log('Done! The application should now build without server dependency errors.');
console.log('Remember to run "npm install" after these changes to update your node_modules!');
