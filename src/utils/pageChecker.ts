/**
 * Page Repository Usage Checker
 * 
 * This tool scans all pages in the application to ensure they're using
 * the production-ready PostgreSQL repositories instead of mock data or Firebase.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface PageInfo {
  name: string;
  file: string;
  importsFirebase: boolean;
  importsMocks: boolean;
  importsRepositories: string[];
  needsRepositoryUpdate: boolean;
}

/**
 * Check if a page is using the correct repositories
 */
const checkPage = async (filePath: string): Promise<PageInfo> => {
  const fileName = path.basename(filePath);
  const name = fileName.replace('.tsx', '');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for imports
  const importsFirebase = content.includes("from '../lib/firebase'") || 
                          content.includes("from '../../lib/firebase'");
  
  const importsMocks = content.includes('/mocks/') || content.includes('/mock/');
  
  // Extract repository imports
  const repositoryImportRegex = /from\s+['"].*\/(postgres|services)\/(\w+)Repository['"]/g;
  const repoImports: string[] = [];
  let match;
  
  while ((match = repositoryImportRegex.exec(content)) !== null) {
    repoImports.push(match[2]);
  }
  
  // Check if the page needs repository updates
  const needsUpdate = importsFirebase || importsMocks || repoImports.length === 0;
  
  return {
    name,
    file: filePath,
    importsFirebase,
    importsMocks,
    importsRepositories: repoImports,
    needsRepositoryUpdate: needsUpdate
  };
};

/**
 * Check all pages in the project
 */
export const checkAllPages = async (): Promise<void> => {
  // Find all page files
  const pageFiles = await glob('src/pages/*.tsx');
  
  console.log(`Found ${pageFiles.length} page files to check`);
  
  // Check each page
  const results = await Promise.all(pageFiles.map(file => checkPage(file)));
  
  // Display results
  console.log('\n========== Page Repository Usage Check ==========');
  
  // Count pages with issues
  const pagesWithIssues = results.filter(p => p.needsRepositoryUpdate);
  
  console.log(`✅ Clean pages: ${results.length - pagesWithIssues.length} / ${results.length}`);
  console.log(`❌ Pages with potential issues: ${pagesWithIssues.length} / ${results.length}`);
  
  if (pagesWithIssues.length > 0) {
    console.log('\nPages that need attention:');
    pagesWithIssues.forEach(page => {
      console.log(`\n📄 ${page.name}:`);
      if (page.importsFirebase) {
        console.log(`  ⚠️ Imports Firebase - update to PostgreSQL repositories`);
      }
      if (page.importsMocks) {
        console.log(`  ⚠️ Imports mock data - update to real repositories`);
      }
      if (page.importsRepositories.length === 0) {
        console.log(`  ⚠️ No repository imports found - may need to add repository access`);
      } else {
        console.log(`  ℹ️ Uses repositories: ${page.importsRepositories.join(', ')}`);
      }
    });
  }
};

/**
 * Export the page check function
 */
export default checkAllPages;
