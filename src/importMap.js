// Import map to handle both .js and .ts extensions in import statements
// This helps resolve imports between TypeScript (.ts) files and JavaScript (.js) files

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export function resolveImport(path) {
  try {
    return require.resolve(path);
  } catch (error) {
    if (path.endsWith('.js')) {
      try {
        return require.resolve(path.replace(/\.js$/, '.ts'));
      } catch {
        // If both fail, return the original path and let the system handle it
        return path;
      }
    }
    return path;
  }
}
