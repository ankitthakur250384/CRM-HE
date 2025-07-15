/**
 * PostgreSQL Operator Repository
 * Handles database operations for operators using PostgreSQL
 */
import { Operator } from '../../types/job';
import { db } from '../../lib/dbClient';
import { v4 as uuidv4 } from 'uuid';

// Define the database row type
interface OperatorRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  certifications: string[];
  availability: OperatorAvailability;
  created_at: string;
  updated_at: string;
}

/**
 * Get all operators from the database
 */
export const getOperators = async (): Promise<Operator[]> => {
  try {
    console.log('Getting all operators from PostgreSQL');
    
    const operators = await db.any<OperatorRow>(`
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
      ORDER BY name ASC
    `);
    
    // Convert to application model
    return operators.map(op => ({
      id: op.id,
      name: op.name,
      email: op.email,
      phone: op.phone,
      specialization: op.specialization,
      experience: op.experience,
      certifications: Array.isArray(op.certifications) ? op.certifications : [],
      availability: op.availability,
      createdAt: op.created_at,
      updatedAt: op.updated_at
    }));
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Get operator by ID
 */
export const getOperatorById = async (id: string): Promise<Operator | null> => {
  try {
    console.log(`Getting operator ${id} from PostgreSQL`);
    
    const operator = await db.oneOrNone<OperatorRow>(`
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
      WHERE id = $1
    `, [id]);
    
    if (!operator) {
      return null;
    }
    
    return {
      id: operator.id,
      name: operator.name,
      email: operator.email,
      phone: operator.phone,
      specialization: operator.specialization,
      experience: operator.experience,
      certifications: Array.isArray(operator.certifications) ? operator.certifications : [],
      availability: operator.availability,
      createdAt: operator.created_at,
      updatedAt: operator.updated_at
    };
  } catch (error) {
    console.error(`Error fetching operator ${id}:`, error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Get operators by specialization
 */
export const getOperatorsBySpecialization = async (specialization: string): Promise<Operator[]> => {
  try {
    console.log(`Getting operators by specialization ${specialization} from PostgreSQL`);
    
    const operators = await db.any<OperatorRow>(`
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
      WHERE specialization = $1
      ORDER BY name ASC
    `, [specialization]);
    
    return operators.map(op => ({
      id: op.id,
      name: op.name,
      email: op.email,
      phone: op.phone,
      specialization: op.specialization,
      experience: op.experience,
      certifications: Array.isArray(op.certifications) ? op.certifications : [],
      availability: op.availability,
      createdAt: op.created_at,
      updatedAt: op.updated_at
    }));
  } catch (error) {
    console.error(`Error fetching operators by specialization ${specialization}:`, error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Get available operators
 */
export const getAvailableOperators = async (): Promise<Operator[]> => {
  try {
    console.log('Getting available operators from PostgreSQL');
    
    const operators = await db.any<OperatorRow>(`
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
      WHERE availability = 'available'
      ORDER BY name ASC
    `);
    
    return operators.map(op => ({
      id: op.id,
      name: op.name,
      email: op.email,
      phone: op.phone,
      specialization: op.specialization,
      experience: op.experience,
      certifications: Array.isArray(op.certifications) ? op.certifications : [],
      availability: op.availability,
      createdAt: op.created_at,
      updatedAt: op.updated_at
    }));
  } catch (error) {
    console.error('Error fetching available operators:', error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Create a new operator
 */
export const createOperator = async (operatorData: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>): Promise<Operator> => {
  try {
    console.log('Creating operator in PostgreSQL:', operatorData);
    
    const newId = uuidv4();
    const timestamp = new Date();
    
    const result = await db.one<OperatorRow>(`
      INSERT INTO operators(
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
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      newId,
      operatorData.name,
      operatorData.email,
      operatorData.phone,
      operatorData.specialization,
      operatorData.experience,
      operatorData.certifications,
      operatorData.availability,
      timestamp,
      timestamp
    ]);
    
    return {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      specialization: result.specialization,
      experience: result.experience,
      certifications: Array.isArray(result.certifications) ? result.certifications : [],
      availability: result.availability,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  } catch (error) {
    console.error('Error creating operator:', error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Update an operator
 */
export const updateOperator = async (id: string, operatorData: Partial<Operator>): Promise<Operator | null> => {
  try {
    console.log(`Updating operator ${id} in PostgreSQL`);
    
    // First check if the operator exists
    const existingOperator = await getOperatorById(id);
    if (!existingOperator) {
      return null;
    }
    
    // Build the update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCounter = 1;
    
    if (operatorData.name !== undefined) {
      updateFields.push(`name = $${paramCounter++}`);
      updateValues.push(operatorData.name);
    }
    
    if (operatorData.email !== undefined) {
      updateFields.push(`email = $${paramCounter++}`);
      updateValues.push(operatorData.email);
    }
    
    if (operatorData.phone !== undefined) {
      updateFields.push(`phone = $${paramCounter++}`);
      updateValues.push(operatorData.phone);
    }
    
    if (operatorData.specialization !== undefined) {
      updateFields.push(`specialization = $${paramCounter++}`);
      updateValues.push(operatorData.specialization);
    }
    
    if (operatorData.experience !== undefined) {
      updateFields.push(`experience = $${paramCounter++}`);
      updateValues.push(operatorData.experience);
    }
    
    if (operatorData.certifications !== undefined) {
      updateFields.push(`certifications = $${paramCounter++}`);
      updateValues.push(operatorData.certifications);
    }
    
    if (operatorData.availability !== undefined) {
      updateFields.push(`availability = $${paramCounter++}`);
      updateValues.push(operatorData.availability);
    }
    
    updateFields.push(`updated_at = $${paramCounter++}`);
    updateValues.push(new Date());
    
    // Add ID as the last parameter
    updateValues.push(id);
    
    const result = await db.oneOrNone<OperatorRow>(`
      UPDATE operators
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `, updateValues);
    
    if (!result) {
      return null;
    }
    
    return {
      id: result.id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      specialization: result.specialization,
      experience: result.experience,
      certifications: Array.isArray(result.certifications) ? result.certifications : [],
      availability: result.availability,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  } catch (error) {
    console.error(`Error updating operator ${id}:`, error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};

/**
 * Delete an operator
 */
export const deleteOperator = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting operator ${id} from PostgreSQL`);
    
    const result = await db.result(`
      DELETE FROM operators
      WHERE id = $1
    `, [id]);
    
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting operator ${id}:`, error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
};
