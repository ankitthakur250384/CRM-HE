// Template merger utility for processing template variables
export interface TemplateVariable {
  name: string;
  value: any;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export interface TemplateContext {
  [key: string]: any;
}

/**
 * Merges template content with provided variables
 * Replaces {{variableName}} placeholders with actual values
 */
export function mergeTemplate(content: string, variables: TemplateContext): string {
  let mergedContent = content;
  
  // Replace template variables in format {{variableName}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  mergedContent = mergedContent.replace(variableRegex, (match, variableName) => {
    const trimmedName = variableName.trim();
    
    // Support nested properties with dot notation
    const value = getNestedProperty(variables, trimmedName);
    
    return value !== undefined ? String(value) : match;
  });
  
  return mergedContent;
}

/**
 * Gets nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Extracts all template variables from content
 */
export function extractTemplateVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(content)) !== null) {
    const variableName = match[1].trim();
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * Validates that all required variables are provided
 */
export function validateTemplateVariables(content: string, variables: TemplateContext): { valid: boolean; missing: string[] } {
  const requiredVariables = extractTemplateVariables(content);
  const missing = requiredVariables.filter(varName => 
    getNestedProperty(variables, varName) === undefined
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

