/**
 * Script to clean up additional unnecessary debug scripts
 * to prevent VS Code from hanging
 */
import fs from 'fs';
import path from 'path';

// Scripts to clean up - these scripts were likely created for testing and debugging
const SCRIPTS_TO_REMOVE = [
  'server-check.mjs',
  'direct-db-test.mjs',
  'api-response-validation.mjs',
  'check-server-status.mjs',
  'check-server-running.mjs'
];

// Path to scripts directory
const scriptsDir = path.resolve('./scripts');

// Main cleanup function
async function cleanupAdditionalScripts() {
  console.log('Scanning for additional debug scripts to remove...');
  
  try {
    // Check each script in the list
    for (const file of SCRIPTS_TO_REMOVE) {
      const filePath = path.join(scriptsDir, file);
      
      // Check if file exists before trying to delete
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        
        // If we get here, file exists, so delete it
        await fs.promises.unlink(filePath);
        console.log(`✅ Removed: ${file}`);
      } catch (err) {
        // File doesn't exist, skip
        console.log(`⏭️ File not found, skipping: ${file}`);
      }
    }
    
    console.log('\nAdditional cleanup complete!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupAdditionalScripts().catch(console.error);
