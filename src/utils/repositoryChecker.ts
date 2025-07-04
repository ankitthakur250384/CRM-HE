/**
 * PostgreSQL Repository Checker
 * 
 * This utility checks if all repositories have been properly migrated to PostgreSQL
 * without any mock data fallbacks.
 */

import fs from 'fs';
import path from 'path';
import { isProd } from './envConfig';

interface RepositoryStatus {
  name: string;
  hasDevFallbacks: boolean;
  mockVariableNames: string[];
  mockImports: string[];
  mockSchemaCount: number;
  file: string;
}

/**
 * Check if a repository has mock data fallbacks
 */
const checkRepository = (filePath: string): RepositoryStatus => {
  const fileName = path.basename(filePath);
  const name = fileName.replace('.ts', '');
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for known mock data patterns
  const hasDevFallbacks = content.includes('import.meta.env.DEV') || content.includes('!isProd()');
  
  // Look for mock data variable declarations
  const mockVariableRegex = /const\s+(\w+Schema|mock\w+|fake\w+)\s*=/g;
  const mockVariables: string[] = [];
  let match;
  while ((match = mockVariableRegex.exec(content)) !== null) {
    mockVariables.push(match[1]);
  }
  
  // Count references to schema or mock data
  const mockSchemaCount = (content.match(/Schema|mock|fake/g) || []).length;
  
  // Check for mock data imports
  const mockImportRegex = /import.*from\s+['"].*\/(mock|fake|schema)['"]/g;
  const mockImports: string[] = [];
  while ((match = mockImportRegex.exec(content)) !== null) {
    mockImports.push(match[0]);
  }
  
  return {
    name,
    hasDevFallbacks,
    mockVariableNames: mockVariables,
    mockImports,
    mockSchemaCount,
    file: filePath
  };
};

/**
 * Check all repositories in the project
 */
export const checkAllRepositories = (): void => {
  const repositoryDir = path.join(process.cwd(), 'src/services/postgres');
  
  if (!fs.existsSync(repositoryDir)) {
    console.error(`❌ Repository directory not found: ${repositoryDir}`);
    return;
  }
  
  // Find all repository files
  const repositoryFiles = fs.readdirSync(repositoryDir)
    .filter(file => file.endsWith('Repository.ts') && !file.includes('.new.'))
    .map(file => path.join(repositoryDir, file));
  
  console.log(`Found ${repositoryFiles.length} repository files to check`);
  
  // Check each repository
  const results = repositoryFiles.map(file => checkRepository(file));
  
  // Display results
  console.log('\n========== Repository Check Results ==========');
  
  // Count repositories with issues
  const reposWithIssues = results.filter(r => 
    r.hasDevFallbacks || r.mockVariableNames.length > 0 || r.mockImports.length > 0
  );
  
  console.log(`✅ Clean repositories: ${results.length - reposWithIssues.length} / ${results.length}`);
  console.log(`❌ Repositories with potential issues: ${reposWithIssues.length} / ${results.length}`);
  
  if (reposWithIssues.length > 0) {
    console.log('\nRepositories that need attention:');
    reposWithIssues.forEach(repo => {
      console.log(`\n📁 ${repo.name}:`);
      if (repo.hasDevFallbacks) {
        console.log(`  ⚠️ Has development mode fallbacks`);
      }
      if (repo.mockVariableNames.length > 0) {
        console.log(`  ⚠️ Contains mock data variables: ${repo.mockVariableNames.join(', ')}`);
      }
      if (repo.mockImports.length > 0) {
        console.log(`  ⚠️ Imports mock data: ${repo.mockImports.join(', ')}`);
      }
    });
  }
  
  // Warning if in production mode but still have mock data
  if (isProd() && reposWithIssues.length > 0) {
    console.log('\n⛔ WARNING: Production mode enabled but mock data still present in repositories!');
    console.log('This could lead to unexpected behavior and data loss.');
  }
};

/**
 * Export the repository check function
 */
export default checkAllRepositories;
