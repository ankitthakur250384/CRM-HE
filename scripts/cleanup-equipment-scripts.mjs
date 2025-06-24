/**
 * Script to clean up unnecessary equipment-related debug scripts
 * to prevent VS Code from hanging
 */
import fs from 'fs';
import path from 'path';

// List of scripts to keep (essential ones)
const SCRIPTS_TO_KEEP = [
  'inspect-equipment-table.mjs',
  'verify-equipment-schema.mjs'
];

// Additional migration scripts that can be removed
const MIGRATION_SCRIPTS_TO_REMOVE = [
  'add-equipment-columns.mjs',
  'migrate-equipment-schema.mjs',
  'update-equipment-schema.mjs',
  'create-equipment-table.mjs',
  'add-equipment-fields.mjs',
  'fix-equipment-schema.mjs'
];

// Path to scripts directory
const scriptsDir = path.resolve('./scripts');

// Main cleanup function
async function cleanupScripts() {
  console.log('Scanning scripts directory...');
    try {
    // Read all files in the scripts directory
    const files = await fs.promises.readdir(scriptsDir);
    
    // Filter equipment-related scripts
    const equipmentScripts = files.filter(file => 
      file.endsWith('.mjs') && 
      file.includes('equipment') && 
      !SCRIPTS_TO_KEEP.includes(file)
    );
    
    // Add migration scripts to remove list
    const migrationScripts = files.filter(file => 
      MIGRATION_SCRIPTS_TO_REMOVE.includes(file) ||
      (file.endsWith('.mjs') && 
       (file.includes('migration') || 
        file.includes('migrate') || 
        file.includes('schema')))
    );
    
    // Combine the lists, removing duplicates
    const scriptsToRemove = [...new Set([...equipmentScripts, ...migrationScripts])];
    
    console.log(`Found ${scriptsToRemove.length} scripts that can be removed:`);
    console.log('Equipment scripts and migration scripts:');
    scriptsToRemove.forEach(file => console.log(` - ${file}`));
    
    console.log('\nRemoving unnecessary scripts...');
    
    // Remove each file
    for (const file of scriptsToRemove) {
      const filePath = path.join(scriptsDir, file);
      try {
        await fs.promises.unlink(filePath);
        console.log(`✅ Removed: ${file}`);
      } catch (err) {
        console.log(`⚠️ Could not remove: ${file} - ${err.message}`);
      }
    }
    
    console.log('\nCleanup complete!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupScripts().catch(console.error);
