/**
 * Script to clean up debug files to reduce VS Code hanging
 */
import fs from 'fs';
import path from 'path';

// Main function to clean up all unnecessary files
async function finalCleanup() {
  console.log('Running final cleanup...\n');
  
  const rootDir = path.resolve('.');
  const files = [
    // Documentation files (keeping only EQUIPMENT_MANAGEMENT_DOCUMENTATION.md)
    path.join(rootDir, 'EQUIPMENT_VERIFICATION_CHECKLIST.md'),
    path.join(rootDir, 'EQUIPMENT_FIX_SUMMARY.md'),
    
    // This cleanup script itself should be removed at the end
    path.join(rootDir, 'scripts', 'cleanup-more-scripts.mjs'),
    path.join(rootDir, 'scripts', 'final-cleanup.mjs')
  ];
  
  console.log('Files to be removed:');
  files.forEach(file => console.log(` - ${path.basename(file)}`));
  console.log('');
  
  // Remove each file if it exists
  for (const filePath of files) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      await fs.promises.unlink(filePath);
      console.log(`✅ Removed: ${path.basename(filePath)}`);
    } catch (err) {
      // File doesn't exist
      console.log(`⏭️ File not found: ${path.basename(filePath)}`);
    }
  }
  
  console.log('\nFinal cleanup complete!');
  console.log('\nVS Code should now run more smoothly with the unnecessary debugging files removed.');
}

finalCleanup().catch(console.error);
