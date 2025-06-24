/**
 * PostgreSQL Equipment Repository
 * Handles database operations for equipment using PostgreSQL.
 * 
 * Implements fallback to schema.json data for development if API fails.
 */
import { Equipment, CraneCategory, BaseRates } from '../../types/equipment';
import equipmentSchema from '../../models/equipment-schema.json';

/**
 * Helper function to ensure all equipment data has required fields
 * This helps prevent runtime errors when APIs return incomplete data
 */
const normalizeEquipment = (data: any): Equipment => {
  return {
    id: data.id || `eq-${Date.now()}`,
    equipmentId: data.equipmentId || `EQ0000`,
    name: data.name || '',
    category: data.category || 'mobile_crane',
    manufacturingDate: data.manufacturingDate || '',
    registrationDate: data.registrationDate || '',
    maxLiftingCapacity: Number(data.maxLiftingCapacity) || 0,
    unladenWeight: Number(data.unladenWeight) || 0,
    baseRates: {
      micro: Number(data.baseRates?.micro) || 0,
      small: Number(data.baseRates?.small) || 0,
      monthly: Number(data.baseRates?.monthly) || 0,
      yearly: Number(data.baseRates?.yearly) || 0,
    },
    runningCostPerKm: Number(data.runningCostPerKm) || 0,
    description: data.description || '',
    status: data.status || 'available',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    runningCost: Number(data.runningCost) || 0,
    _source: data._source,
    _mockFlag: data._mockFlag,
  };
};

const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

/**
 * Get all equipment from the database
 */
export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    console.log('Getting all equipment from PostgreSQL API');
    
    if (import.meta.env.DEV) {
      try {
        // Try fetching from API first
        const response = await fetch(`${API_URL}/equipment`, {
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          }
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
          const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length} equipment records from API`);
        
        // Mark data as coming from API and normalize each item
        return data.map((item: any) => normalizeEquipment({
          ...item,
          _source: 'api',
          _mockFlag: false
        }));
      } catch (apiError) {
        console.warn('⚠️ API fetch failed, using schema data instead:', apiError);
          // Fallback to schema data if API fails
        console.log(`ℹ️ Using ${equipmentSchema.length} equipment records from schema`);
          // Clearly mark schema data and normalize each item
        return equipmentSchema.map((item: any) => normalizeEquipment({
          ...item,
          _source: 'schema' as const,
          _mockFlag: true
        }));
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment`, {
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
        const data = await response.json();
      
      // Even in production, mark data source for debugging and normalize
      return data.map((item: any) => normalizeEquipment({
        ...item,
        _source: 'api',
        _mockFlag: false
      }));
    }
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
};

/**
 * Get equipment by category
 */
export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  try {
    console.log(`Getting equipment by category ${category} from API`);
    
    if (import.meta.env.DEV) {
      try {
        // Try fetching from API first
        const response = await fetch(`${API_URL}/equipment/category/${category}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          }
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
          const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length} ${category} equipment from API`);
        
        // Mark data as coming from API and normalize
        return data.map((item: any) => normalizeEquipment({
          ...item,
          _source: 'api',
          _mockFlag: false
        }));
      } catch (apiError) {
        console.warn(`⚠️ API fetch for ${category} failed, using schema data:`, apiError);
          // Fallback to schema data if API fails
        const filteredEquipment = (equipmentSchema as any[]).filter(e => e.category === category);
        console.log(`ℹ️ Using ${filteredEquipment.length} ${category} equipment from schema`);
        // Normalize the filtered schema data
        return filteredEquipment.map(item => normalizeEquipment({
          ...item,
          _source: 'schema' as const,
          _mockFlag: true
        }));
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment/category/${category}`, {
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Error fetching equipment by category ${category}:`, error);
    throw error;
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    console.log(`Getting equipment ${id} from API`);
    
    if (import.meta.env.DEV) {
      try {
        // Try fetching from API first
        const response = await fetch(`${API_URL}/equipment/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return null; // Equipment not found
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
          const data = await response.json();
        console.log(`✅ Successfully fetched equipment ${id} from API`);
        
        // Mark data as coming from API and normalize
        return normalizeEquipment({
          ...data,
          _source: 'api',
          _mockFlag: false
        });
      } catch (apiError) {
        console.warn(`⚠️ API fetch for equipment ${id} failed, using schema data:`, apiError);
          // Fallback to schema data if API fails
        const foundEquipment = (equipmentSchema as any[]).find(e => e.id === id);
        if (foundEquipment) {
          console.log(`ℹ️ Found equipment ${id} in schema`);
          // Normalize the equipment data
          return normalizeEquipment({
            ...foundEquipment,
            _source: 'schema' as const,
            _mockFlag: true
          });
        } else {
          console.log(`❌ Equipment ${id} not found in schema`);
          return null;
        }
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment/${id}`, {
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Equipment not found
        }
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Error fetching equipment ${id}:`, error);
    throw error;
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  try {
    console.log('Creating equipment via API:', equipmentData);
    
    if (import.meta.env.DEV) {
      try {
        // Try creating via API first
        const response = await fetch(`${API_URL}/equipment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          },
          body: JSON.stringify(equipmentData)
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
          const data = await response.json();
        console.log('✅ Successfully created equipment via API');
        
        // Mark data as coming from API and normalize
        return normalizeEquipment({
          ...data,
          _source: 'api',
          _mockFlag: false
        });
      } catch (apiError) {
        console.warn('⚠️ API create failed, using client-side mock:', apiError);        // Fallback to client-side mock if API fails
        const newEquipment = normalizeEquipment({
          ...equipmentData as any, // Cast to any to avoid typing issues with missing fields
          id: `eq-mock-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _source: 'client',
          _mockFlag: true
        });
        
        return newEquipment;
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        },
        body: JSON.stringify(equipmentData)
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
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
    
    if (import.meta.env.DEV) {
      try {
        // Try updating via API first
        const response = await fetch(`${API_URL}/equipment/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          },
          body: JSON.stringify(normalizedUpdateData)
        });
        
        // Log the raw response for debugging
        console.log(`API response status:`, response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`Equipment ${id} not found in database`);
            return null; // Equipment not found
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
          
        const data = await response.json();
        console.log(`✅ Successfully updated equipment ${id} via API:`, data);
        
        // Mark data as coming from API and normalize
        return normalizeEquipment({
          ...data,
          _source: 'api',
          _mockFlag: false
        });
      } catch (apiError) {
        console.warn(`⚠️ API update for ${id} failed, using client-side mock:`, apiError);
        
        // Fallback to client-side mock if API fails
        const equipment = await getEquipmentById(id);
        
        if (!equipment) {
          console.error(`Cannot update equipment ${id}: not found`);
          return null;
        }
        
        const updatedEquipment = normalizeEquipment({
          ...equipment,
          ...normalizedUpdateData,
          updatedAt: new Date().toISOString(),
          _source: 'client',
          _mockFlag: true
        });
        
        console.log(`Created client-side mock update for ${id}:`, updatedEquipment);
        return updatedEquipment;
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        },
        body: JSON.stringify(normalizedUpdateData)
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Equipment not found
        }
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Make sure we normalize in production too
      return normalizeEquipment({
        ...data,
        _source: 'api',
        _mockFlag: false
      });
    }
  } catch (error) {
    console.error(`Error updating equipment ${id}:`, error);
    throw error;
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting equipment ${id} via API`);
    
    if (import.meta.env.DEV) {
      try {
        // Try deleting via API first
        const response = await fetch(`${API_URL}/equipment/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-bypass-auth': 'true' // Development bypass for auth
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return false; // Equipment not found
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        console.log(`✅ Successfully deleted equipment ${id} via API`);
        return true;
      } catch (apiError) {
        console.warn(`⚠️ API delete for ${id} failed:`, apiError);
        
        // In development, pretend delete was successful even if API fails
        console.log(`ℹ️ Simulating successful delete for ${id} in development`);
        return true;
      }
    } else {
      // Production mode: only use API
      const response = await fetch(`${API_URL}/equipment/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
          // In production, Authorization header should be added by an interceptor
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return false; // Equipment not found
        }
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error(`Error deleting equipment ${id}:`, error);
    throw error;
  }
};
