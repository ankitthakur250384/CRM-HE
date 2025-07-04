// Script to delete files in chunks

const fs = require('fs');
const path = require('path');

// Read the list of files to delete
const scriptsDir = __dirname;
const filesToDelete = fs.readFileSync(path.join(scriptsDir, 'files-to-delete.txt'), 'utf8')
  .split('\n')
  .filter(Boolean); // Filter out empty lines

console.log(`Found ${filesToDelete.length} files to delete`);

// Delete the files
let deletedCount = 0;
for (const file of filesToDelete) {
  try {
    const filePath = path.join(scriptsDir, file);
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file}`);
    deletedCount++;
  } catch (err) {
    console.error(`Error deleting ${file}: ${err.message}`);
  }
}

console.log(`Successfully deleted ${deletedCount} out of ${filesToDelete.length} files`);
