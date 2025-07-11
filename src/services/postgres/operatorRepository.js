/**
 * Operator Repository
 * Handles database operations for operators using JavaScript/ES modules
 */

import { query } from '../../lib/dbConnection.js';

/**
 * Get all operators from the database
 */
export const getOperators = async () => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        specialization, 
        experience, 
        certifications, 
        availability,
        created_at,
        updated_at
      FROM operators 
      ORDER BY name
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
};
