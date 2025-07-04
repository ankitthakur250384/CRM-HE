/**
 * check-frontend-imports.mjs
 * 
 * This script checks for server-side imports in frontend code.
 * It helps prevent errors like "process is not defined" in the browser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// File patterns to check (frontend code)
const FRONTEND_PATTERNS = [
  /\.tsx$/,
  /src\/components\/.+\.ts$/,
  /src\/hooks\/.+\.ts$/,
  /src\/pages\/.+\.ts$/,
  /src\/store\/.+\.ts$/
];

// Import patterns to flag (server-side imports)
const PROBLEMATIC_IMPORTS = [
  // Database related
  /['"]pg-promise['"]/,
  /['"]knex['"]/,
  /['"]\.\.\/services\/postgres\//,
  /['"]\.\.\/lib\/dbClient['"]/,
  /['"]\.\.\/services\/postgresService['"]/,
  /['"]\.\.\/services\/postgresAuthService['"]/,
  // Node.js specific
  /['"]fs['"]/,
  /['"]path['"]/,
  /['"]os['"]/,
  /['"]crypto['"]/,
  /['"]bcryptjs['"]/,
  /['"]jsonwebtoken['"]/,
  /['"]express['"]/,
  /['"]dotenv['"]/
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /\.git/,
  /scripts/
];

console.log('🔍 Checking frontend files for server-side imports...');

const checkFile = (filePath) => {
  // Skip excluded paths
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
    return [];
  }
  
  // Only check frontend files
  const isTargetFile = FRONTEND_PATTERNS.some(pattern => pattern.test(filePath));
  if (!isTargetFile) {
    return [];
  }
  
  const issues = [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of PROBLEMATIC_IMPORTS) {
        if (pattern.test(line)) {
          issues.push({
            file: filePath.replace(projectRoot, ''),
            line: i + 1,
            content: line.trim(),
            problem: `Contains server-side import: ${line.trim()}`
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  
  return issues;
};

const walkDirectory = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recurse into subdirectories
      results = results.concat(walkDirectory(filePath));
    } else {
      // Check file
      results = results.concat(checkFile(filePath));
    }
  }
  
  return results;
};

// Start the scan
const issues = walkDirectory(path.join(projectRoot, 'src'));

if (issues.length === 0) {
  console.log('✅ No server-side imports found in frontend code.');
  process.exit(0);
} else {
  console.error(`❌ Found ${issues.length} problematic imports in frontend code:`);
  
  for (const issue of issues) {
    console.error(`\n${issue.file}:${issue.line}`);
    console.error(`  ${issue.content}`);
  }
  
  console.error('\n🔧 Fix recommendations:');
  console.error('1. Create client-side alternatives for server-side imports');
  console.error('2. Move server-side logic to API endpoints');
  console.error('3. Use environment-aware imports (typeof window !== "undefined")');
  
  process.exit(1);
}
