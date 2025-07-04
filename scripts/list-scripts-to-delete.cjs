// Create a list of scripts to delete

const fs = require('fs');
const path = require('path');

// Scripts to keep (essential ones)
const scriptsToKeep = [
  'fix-browser-deps.cjs',
  'fix-pg-module.cjs',
  'check-frontend-imports.mjs',
  'check-server-status.mjs',
  'migrate-config.cjs',
  'final-cleanup.ps1',
  'list-scripts-to-delete.cjs',
  'node_modules',
  'package.json',
  'tsconfig.json',
  'keep-scripts.txt'
];

// Get all files in the current directory
const scriptsDir = __dirname;
const allFiles = fs.readdirSync(scriptsDir);

// Filter out the files we want to keep
const filesToDelete = allFiles.filter(file => {
  return !scriptsToKeep.includes(file);
});

// Write the list to a file
const outputFile = path.join(scriptsDir, 'files-to-delete.txt');
fs.writeFileSync(outputFile, filesToDelete.join('\n'));

console.log(`Found ${filesToDelete.length} files to delete`);
console.log(`List written to ${outputFile}`);
