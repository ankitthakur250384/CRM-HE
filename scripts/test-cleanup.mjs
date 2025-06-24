import fs from 'fs';
import path from 'path';

// Define paths
const projectRoot = process.cwd();
const scriptsDir = path.join(projectRoot, 'scripts');
const backupDir = path.join(projectRoot, 'backup', 'scripts', 'redundant');

console.log(`Project root: ${projectRoot}`);
console.log(`Scripts directory: ${scriptsDir}`);
console.log(`Backup directory: ${backupDir}`);

// Sample test to just list files
try {
  const files = fs.readdirSync(scriptsDir);
  console.log(`Found ${files.length} files in scripts directory.`);
  console.log('First 5 files:', files.slice(0, 5));
} catch (error) {
  console.error('Error reading scripts directory:', error);
}

// Create the backup directory if it doesn't exist
console.log('\nCreating backup directory if needed...');
try {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created directory: ${backupDir}`);
  } else {
    console.log(`Directory already exists: ${backupDir}`);
  }
} catch (error) {
  console.error('Error creating backup directory:', error);
}
