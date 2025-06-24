/**
 * PostgreSQL Operator Repository
 * Handles database operations for operators using PostgreSQL
 */
import { Operator } from '../../types/job';

/**
 * Get all operators from the database
 */
export const getOperators = async (): Promise<Operator[]> => {
  try {
    console.log('Getting all operators from PostgreSQL');
    
    // Mock data for development
    return [
      {
        id: 'op-1',
        name: 'Mike Operator',
        email: 'mike@aspcranes.com',
        phone: '555-123-4567',
        specialization: 'Tower Crane',
        experience: 5,
        certifications: ['NCCCO Tower Crane'],
        availability: 'available',
        createdAt: new Date('2025-01-10').toISOString(),
        updatedAt: new Date('2025-06-01').toISOString()
      },
      {
        id: 'op-2',
        name: 'Lisa Crane',
        email: 'lisa@aspcranes.com',
        phone: '555-987-6543',
        specialization: 'Mobile Crane',
        experience: 8,
        certifications: ['NCCCO Mobile Crane', 'OSHA Safety'],
        availability: 'assigned',
        createdAt: new Date('2025-02-15').toISOString(),
        updatedAt: new Date('2025-05-20').toISOString()
      },
      {
        id: 'op-3',
        name: 'Tom Heavy',
        email: 'tom@aspcranes.com',
        phone: '555-456-7890',
        specialization: 'Crawler Crane',
        experience: 10,
        certifications: ['NCCCO Crawler Crane', 'Heavy Lift Specialist'],
        availability: 'available',
        createdAt: new Date('2025-01-05').toISOString(),
        updatedAt: new Date('2025-04-10').toISOString()
      },
      {
        id: 'op-4',
        name: 'Sarah Heights',
        email: 'sarah@aspcranes.com',
        phone: '555-789-0123',
        specialization: 'Tower Crane',
        experience: 6,
        certifications: ['NCCCO Tower Crane', 'High Rise Specialist'],
        availability: 'on_leave',
        createdAt: new Date('2025-03-20').toISOString(),
        updatedAt: new Date('2025-06-15').toISOString()
      },
      {
        id: 'op-5',
        name: 'Dave Mobile',
        email: 'dave@aspcranes.com',
        phone: '555-234-5678',
        specialization: 'Mobile Crane',
        experience: 7,
        certifications: ['NCCCO Mobile Crane'],
        availability: 'available',
        createdAt: new Date('2025-02-01').toISOString(),
        updatedAt: new Date('2025-05-05').toISOString()
      }
    ];
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
};

/**
 * Get operator by ID
 */
export const getOperatorById = async (id: string): Promise<Operator | null> => {
  try {
    console.log(`Getting operator ${id} from PostgreSQL`);
    
    const operators = await getOperators();
    const operator = operators.find(o => o.id === id);
    
    return operator || null;
  } catch (error) {
    console.error(`Error fetching operator ${id}:`, error);
    throw error;
  }
};

/**
 * Get operators by specialization
 */
export const getOperatorsBySpecialization = async (specialization: string): Promise<Operator[]> => {
  try {
    console.log(`Getting operators by specialization ${specialization} from PostgreSQL`);
    
    const operators = await getOperators();
    return operators.filter(o => o.specialization === specialization);
  } catch (error) {
    console.error(`Error fetching operators by specialization ${specialization}:`, error);
    throw error;
  }
};

/**
 * Get available operators
 */
export const getAvailableOperators = async (): Promise<Operator[]> => {
  try {
    console.log('Getting available operators from PostgreSQL');
    
    const operators = await getOperators();
    return operators.filter(o => o.availability === 'available');
  } catch (error) {
    console.error('Error fetching available operators:', error);
    throw error;
  }
};

/**
 * Create a new operator
 */
export const createOperator = async (operatorData: Omit<Operator, 'id' | 'createdAt' | 'updatedAt'>): Promise<Operator> => {
  try {
    console.log('Creating operator in PostgreSQL:', operatorData);
    
    const newOperator: Operator = {
      ...operatorData,
      id: `op-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newOperator;
  } catch (error) {
    console.error('Error creating operator:', error);
    throw error;
  }
};

/**
 * Update an operator
 */
export const updateOperator = async (id: string, operatorData: Partial<Operator>): Promise<Operator | null> => {
  try {
    console.log(`Updating operator ${id} in PostgreSQL`);
    
    const operator = await getOperatorById(id);
    
    if (!operator) {
      return null;
    }
    
    const updatedOperator = {
      ...operator,
      ...operatorData,
      updatedAt: new Date().toISOString()
    };
    
    return updatedOperator;
  } catch (error) {
    console.error(`Error updating operator ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an operator
 */
export const deleteOperator = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting operator ${id} from PostgreSQL`);
    
    // In a real implementation, we would delete from the database
    // For this mock, we just return true to indicate success
    
    return true;
  } catch (error) {
    console.error(`Error deleting operator ${id}:`, error);
    throw error;
  }
};
