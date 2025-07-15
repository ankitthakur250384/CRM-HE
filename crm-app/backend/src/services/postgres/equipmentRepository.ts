/**
 * PostgreSQL Equipment Repository
 * Handles database operations for equipment using PostgreSQL.
 * 
 * Production-ready implementation with proper error handling.
 */
import { Equipment, CraneCategory } from '../../types/equipment';
import { handleProductionApiError } from '../../utils/productionUtil';
import { api } from '../../lib/apiService';

/**
 * Helper function to ensure all equipment data has required fields
 * This helps prevent runtime errors when APIs return incomplete data
 */
const normalizeEquipment = (data: any): Equipment => {
  return {
    id: data.id,
    equipmentId: data.equipment_id || data.equipmentId,
    name: data.name,
    category: data.category as CraneCategory,
    manufacturingDate: data.manufacturing_date || data.manufacturingDate,
    registrationDate: data.registration_date || data.registrationDate,
    maxLiftingCapacity: Number(data.max_lifting_capacity || data.maxLiftingCapacity),
    unladenWeight: Number(data.unladen_weight || data.unladenWeight),
    baseRates: {
      micro: Number(data.base_rate_micro || data.baseRates?.micro || 0),
      small: Number(data.base_rate_small || data.baseRates?.small || 0),
      monthly: Number(data.base_rate_monthly || data.baseRates?.monthly || 0),
      yearly: Number(data.base_rate_yearly || data.baseRates?.yearly || 0),
    },
    runningCostPerKm: Number(data.running_cost_per_km || data.runningCostPerKm),
    description: data.description || '',
    status: data.status || 'available',
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
    runningCost: Number(data.running_cost || data.runningCost || 0),
  };
};

/**
 * Get all equipment from the database
 */
export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    console.log('Getting all equipment from database');
    
    // Use the centralized API service with authentication
    const data = await api.get<any[]>('/equipment');
    
    if (!data) {
      return [];
    }
    
    console.log(`✅ Successfully fetched ${data.length} equipment records`);
    
    // Normalize each item
    return data.map((item: any) => normalizeEquipment(item));
  } catch (error) {
    console.error('Error fetching equipment:', error);
    
    // Production error handling
    handleProductionApiError(error, 'fetch', 'equipment');
    
    // This line will never execute due to the error thrown above,
    // but TypeScript requires a return statement
    return [];
  }
};

/**
 * Get equipment by category
 */
export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  try {
    console.log(`Getting equipment by category ${category} from API`);
    
    // Use the centralized API service with authentication
    const data = await api.get<any[]>(`/equipment/category/${category}`);
    
    if (!data) {
      return [];
    }
    
    console.log(`✅ Successfully fetched ${data.length} ${category} equipment records`);
    
    // Normalize each item
    return data.map((item: any) => normalizeEquipment(item));
  } catch (error) {
    console.error(`Error fetching equipment by category ${category}:`, error);
    handleProductionApiError(error, 'fetch', `equipment by category ${category}`);
    return [];
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    console.log(`Getting equipment ${id} from API`);
    
    // Use the centralized API service with authentication
    try {
      const data = await api.get<any>(`/equipment/${id}`);
      
      if (!data) {
        return null;
      }
      
      console.log(`✅ Successfully fetched equipment ${id}`);
      
      // Normalize equipment data
      return normalizeEquipment(data);
    } catch (apiError: any) {
      // Handle 404 specifically - not an error, just null result
      if (apiError.status === 404 || apiError.message?.includes('404')) {
        console.log(`Equipment ${id} not found`);
        return null;
      }
      
      // Re-throw to be caught by outer catch
      throw apiError;
    }
  } catch (error) {
    console.error(`Error fetching equipment ${id}:`, error);
    handleProductionApiError(error, 'fetch', `equipment ${id}`);
    return null;
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  try {
    console.log('Creating equipment via API:', equipmentData);
    
    // Use the centralized API service with authentication
    const data = await api.post<any>('/equipment', equipmentData);
    
    if (!data) {
      throw new Error('No data returned from API after creating equipment');
    }
    
    console.log('✅ Successfully created equipment via API');
    
    // Normalize equipment data
    return normalizeEquipment(data);
  } catch (error) {
    console.error('Error creating equipment:', error);
    handleProductionApiError(error, 'create', 'equipment');
    throw error; // This line will never execute due to handleProductionApiError
  }
};

/**
 * Update equipment
 */
export const updateEquipment = async (id: string, equipmentData: Partial<Equipment>): Promise<Equipment | null> => {
  try {
    console.log(`Updating equipment ${id} via API`, equipmentData);
    
    // Ensure we're sending properly normalized data to the API
    const normalizedUpdateData = {
      ...equipmentData,
      baseRates: equipmentData.baseRates ? {
        micro: Number(equipmentData.baseRates.micro) || 0,
        small: Number(equipmentData.baseRates.small) || 0,
        monthly: Number(equipmentData.baseRates.monthly) || 0,
        yearly: Number(equipmentData.baseRates.yearly) || 0
      } : undefined
    };
    
    console.log(`Normalized update data:`, normalizedUpdateData);
    
    try {
      // Use the centralized API service with authentication
      const data = await api.put<any>(`/equipment/${id}`, normalizedUpdateData);
      
      if (!data) {
        console.warn(`No data returned when updating equipment ${id}`);
        return null;
      }
      
      console.log(`✅ Successfully updated equipment ${id} via API`);
      
      // Normalize equipment data
      return normalizeEquipment(data);
    } catch (apiError: any) {
      // Handle 404 specifically - not an error, just null result
      if (apiError.status === 404 || apiError.message?.includes('404')) {
        console.log(`Equipment ${id} not found for update`);
        return null;
      }
      
      // Re-throw to be caught by outer catch
      throw apiError;
    }
  } catch (error) {
    console.error(`Error updating equipment ${id}:`, error);
    handleProductionApiError(error, 'update', `equipment ${id}`);
    return null;
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting equipment ${id} via API`);
    
    try {
      // Use the centralized API service with authentication
      await api.delete(`/equipment/${id}`);
      console.log(`✅ Successfully deleted equipment ${id}`);
      return true;
    } catch (apiError: any) {
      // Handle 404 specifically - not an error, just false result
      if (apiError.status === 404 || apiError.message?.includes('404')) {
        console.log(`Equipment ${id} not found for deletion`);
        return false;
      }
      
      // Re-throw to be caught by outer catch
      throw apiError;
    }
  } catch (error) {
    console.error(`Error deleting equipment ${id}:`, error);
    handleProductionApiError(error, 'delete', `equipment ${id}`);
    return false;
  }
};
