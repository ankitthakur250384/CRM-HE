// Stub operatorRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const getOperators = async () => {
  try {
    const operators = await db.any('SELECT * FROM operators ORDER BY name');
    return operators;
  } catch (error) {
    console.error('Error fetching operators:', error);
    return [];
  }
};
