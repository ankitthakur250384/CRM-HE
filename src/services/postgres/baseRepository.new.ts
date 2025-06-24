import { db } from '../../lib/dbClient';

// Collection name mapping
const collections = {
  users: 'users',
  leads: 'leads',
  deals: 'deals',
  customers: 'customers',
  quotations: 'quotations',
  jobs: 'jobs',
  equipment: 'equipment',
  operators: 'operators',
  templates: 'templates'
};

// Utility to convert snake_case DB columns to camelCase for JavaScript
const snakeToCamel = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

// Convert row object from snake_case to camelCase
const convertRowToCamelCase = (row: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(row)) {
    // Handle special case for IDs
    if (key === 'id') {
      result.id = value;
    } 
    // Detect _id suffix for specific entities
    else if (key.endsWith('_id')) {
      const baseKey = key.slice(0, -3); // Remove _id
      const camelKey = snakeToCamel(baseKey);
      
      // Store both the original ID format for DB operations and a camelCase version
      result[`${camelKey}Id`] = value;
      // Also keep the camelCase version of the full key for compatibility
      result[snakeToCamel(key)] = value;
    } 
    else {
      result[snakeToCamel(key)] = value;
    }
  }
  
  return result;
};

/**
 * Base class for PostgreSQL repositories
 * Provides common CRUD operations
 */
export class BaseRepository<T> {
  protected tableName: string;
  
  constructor(collectionName: keyof typeof collections) {
    this.tableName = collections[collectionName];
  }
  
  // Get all documents
  async getAll(): Promise<T[]> {
    try {
      const results = await db.any(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
      return results.map(row => convertRowToCamelCase(row as Record<string, any>) as T);
    } catch (error) {
      console.error(`Error getting all ${this.tableName}:`, error);
      throw error;
    }
  }
    
  // Get document by ID
  async getById(id: string): Promise<T | null> {
    try {
      // Use the appropriate ID column based on table name
      const idColumn = `${this.tableName.slice(0, -1)}_id`;
      
      const result = await db.oneOrNone(
        `SELECT * FROM ${this.tableName} WHERE ${idColumn} = $1`,
        [id]
      );
      
      return result ? convertRowToCamelCase(result as Record<string, any>) as T : null;
    } catch (error) {
      console.error(`Error getting ${this.tableName} by ID:`, error);
      throw error;
    }
  }
  
  // Create new document
  async create(data: Partial<T>): Promise<T> {
    try {
      // Convert camelCase keys to snake_case
      const columns: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];
      let counter = 1;
      
      for (const [key, value] of Object.entries(data)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        columns.push(snakeKey);
        values.push(value);
        placeholders.push(`$${counter++}`);
      }
      
      // Add timestamps
      columns.push('created_at');
      values.push(new Date());
      placeholders.push(`$${counter++}`);
      
      columns.push('updated_at');
      values.push(new Date());
      placeholders.push(`$${counter++}`);
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await db.one(query, values);
      return convertRowToCamelCase(result as Record<string, any>) as T;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }
  
  // Update document
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Use the appropriate ID column based on table name
      const idColumn = `${this.tableName.slice(0, -1)}_id`;
      
      // Convert camelCase keys to snake_case
      const updates: string[] = [];
      const values: any[] = [];
      let counter = 1;
      
      for (const [key, value] of Object.entries(data)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${counter++}`);
        values.push(value);
      }
      
      // Add timestamp
      updates.push(`updated_at = $${counter++}`);
      values.push(new Date());
      
      // Add ID as the last parameter
      values.push(id);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}
        WHERE ${idColumn} = $${counter}
        RETURNING *
      `;
      
      const result = await db.one(query, values);
      return convertRowToCamelCase(result as Record<string, any>) as T;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }
  
  // Delete document
  async delete(id: string): Promise<boolean> {
    try {
      // Use the appropriate ID column based on table name
      const idColumn = `${this.tableName.slice(0, -1)}_id`;
        // Use mock implementation for browser environment
      if (typeof window !== 'undefined') {
        console.log(`Mock deleting ${this.tableName} with ID ${id}`);
        return true;
      }
      
      await db.none(
        `DELETE FROM ${this.tableName} WHERE ${idColumn} = $1`,
        [id]
      );
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }
  
  // Query documents by condition
  async findByCondition(conditions: Record<string, any>): Promise<T[]> {
    try {
      const whereConditions: string[] = [];
      const values: any[] = [];
      let counter = 1;
      
      for (const [key, value] of Object.entries(conditions)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        whereConditions.push(`${snakeKey} = $${counter++}`);
        values.push(value);
      }
      
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
      `;
      
      const results = await db.any(query, values);
      return results.map(row => convertRowToCamelCase(row as Record<string, any>) as T);
    } catch (error) {
      console.error(`Error querying ${this.tableName}:`, error);
      throw error;
    }
  }
}
