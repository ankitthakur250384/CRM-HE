import { getHeaders } from './apiHeaders';
import { Equipment } from '../types/equipment';
// Update equipment by ID via backend API
export async function updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<Equipment> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment/${equipmentId}`, {
    method: 'PATCH',
    headers: { ...getHeaders(true), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to update equipment');
  }
  return response.json();
}
// Delete equipment by ID via backend API
export async function deleteEquipment(equipmentId: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment/${equipmentId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete equipment');
  }
}
// Create a new equipment via backend API
export async function createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const response = await fetch(`${apiUrl}/equipment`, {
    method: 'POST',
    headers: { ...getHeaders(true), 'Content-Type': 'application/json' },
    body: JSON.stringify(equipment),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to create equipment');
  }
  return response.json();
}
// Get equipment by category from backend API
export async function getEquipmentByCategory(category: string): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const url = `${apiUrl}/equipment?category=${encodeURIComponent(category)}`;

  console.log('🔍 Fetching equipment by category:', category);
  console.log('🔗 API URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
    credentials: 'include',
  });

  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);

  if (!response.ok) {
    console.error('❌ Failed to fetch equipment:', response.status, response.statusText);
    throw new Error('Failed to fetch equipment by category');
  }

  const data = await response.json();
  console.log('📦 Equipment data received:', data);

  // Unwrap { data: equipment[] } or return equipment[] directly
  if (data && Array.isArray(data.data)) return data.data;
  return data;
}
// Get all equipment from backend API
export async function getEquipment(): Promise<Equipment[]> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const fullUrl = `${apiUrl}/equipment`;
  
  console.log('🔗 Equipment API URL:', fullUrl);
  
  try {
    // Try without authentication first (equipment endpoint is public)
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('📡 Equipment API Response Status:', response.status);
    console.log('📡 Equipment API Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Equipment API Error:', response.status, errorText);
      
      // If it's 401/403, try with auth headers
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 Retrying with authentication headers...');
        const authResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: getHeaders(false),
          credentials: 'include',
        });
        
        if (!authResponse.ok) {
          throw new Error(`Failed to fetch equipment: ${authResponse.status}`);
        }
        
        const authData = await authResponse.json();
        console.log('📦 Equipment API Auth Data:', authData);
        console.log('📦 Auth Data Type:', typeof authData);
        console.log('📦 Auth Data is Array:', Array.isArray(authData));
        console.log('📦 Auth Data Keys:', Object.keys(authData || {}));
        
        const equipmentArray = Array.isArray(authData) ? authData : (authData.equipment || authData.data || []);
        console.log('📦 Auth Equipment Array Length:', equipmentArray.length);
        console.log('📦 Auth First Equipment Item (RAW):', equipmentArray[0]);
        console.log('📦 Auth First Equipment Item Fields:', equipmentArray[0] ? Object.keys(equipmentArray[0]) : 'No items');
        
        // Transform database format to match our interface
        const transformedEquipment = equipmentArray.map((item: any) => {
          // Extract and convert rate values with debugging
          const baseMicro = Number(item.base_rate_micro || item.baseRateMicro || 0);
          const baseSmall = Number(item.base_rate_small || item.baseRateSmall || 0);
          const baseMonthly = Number(item.base_rate_monthly || item.baseRateMonthly || 0);
          const baseYearly = Number(item.base_rate_yearly || item.baseRateYearly || 0);
          
          console.log(`🔧 Auth path - Transforming equipment ${item.name || item.id}:`, {
            rawRates: {
              base_rate_micro: item.base_rate_micro,
              base_rate_small: item.base_rate_small,
              base_rate_monthly: item.base_rate_monthly,
              base_rate_yearly: item.base_rate_yearly
            },
            convertedRates: {
              micro: baseMicro,
              small: baseSmall,
              monthly: baseMonthly,
              yearly: baseYearly
            }
          });
          
          return {
            ...item,
            // Convert snake_case to camelCase
            equipmentId: item.equipment_id || item.equipmentId,
            maxLiftingCapacity: item.max_lifting_capacity || item.maxLiftingCapacity,
            unladenWeight: item.unladen_weight || item.unladenWeight,
            baseRateMicro: baseMicro,
            baseRateSmall: baseSmall,
            baseRateMonthly: baseMonthly,
            baseRateYearly: baseYearly,
            runningCostPerKm: item.running_cost_per_km || item.runningCostPerKm,
            runningCost: item.running_cost || item.runningCost,
            manufacturingDate: item.manufacturing_date || item.manufacturingDate,
            registrationDate: item.registration_date || item.registrationDate,
            createdAt: item.created_at || item.createdAt,
            updatedAt: item.updated_at || item.updatedAt,
            // Create backward-compatible baseRates object
            baseRates: {
              micro: baseMicro,
              small: baseSmall,
              monthly: baseMonthly,
              yearly: baseYearly,
            }
          };
        });
        
        return transformedEquipment;
      }
      
      throw new Error(`Failed to fetch equipment: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📦 Equipment API Raw Data:', data);
    console.log('📦 Raw Data Type:', typeof data);
    console.log('📦 Raw Data is Array:', Array.isArray(data));
    console.log('📦 Raw Data Keys:', Object.keys(data || {}));
    
    const equipmentArray = Array.isArray(data) ? data : (data.equipment || data.data || []);
    console.log('📦 Equipment Array Length:', equipmentArray.length);
    console.log('📦 First Equipment Item (RAW):', equipmentArray[0]);
    console.log('📦 First Equipment Item Fields:', equipmentArray[0] ? Object.keys(equipmentArray[0]) : 'No items');
    
    // Transform database format to match our interface
    const transformedEquipment = equipmentArray.map((item: any) => {
      // Extract and convert rate values with debugging
      const baseMicro = Number(item.base_rate_micro || item.baseRateMicro || 0);
      const baseSmall = Number(item.base_rate_small || item.baseRateSmall || 0);
      const baseMonthly = Number(item.base_rate_monthly || item.baseRateMonthly || 0);
      const baseYearly = Number(item.base_rate_yearly || item.baseRateYearly || 0);
      
      console.log(`🔧 Transforming equipment ${item.name || item.id}:`, {
        rawRates: {
          base_rate_micro: item.base_rate_micro,
          base_rate_small: item.base_rate_small,
          base_rate_monthly: item.base_rate_monthly,
          base_rate_yearly: item.base_rate_yearly,
          baseRateMicro: item.baseRateMicro,
          baseRateSmall: item.baseRateSmall,
          baseRateMonthly: item.baseRateMonthly,
          baseRateYearly: item.baseRateYearly
        },
        convertedRates: {
          micro: baseMicro,
          small: baseSmall,
          monthly: baseMonthly,
          yearly: baseYearly
        }
      });
      
      return {
        ...item,
        // Convert snake_case to camelCase
        equipmentId: item.equipment_id || item.equipmentId,
        maxLiftingCapacity: item.max_lifting_capacity || item.maxLiftingCapacity,
        unladenWeight: item.unladen_weight || item.unladenWeight,
        baseRateMicro: baseMicro,
        baseRateSmall: baseSmall,
        baseRateMonthly: baseMonthly,
        baseRateYearly: baseYearly,
        runningCostPerKm: item.running_cost_per_km || item.runningCostPerKm,
        runningCost: item.running_cost || item.runningCost,
        manufacturingDate: item.manufacturing_date || item.manufacturingDate,
        registrationDate: item.registration_date || item.registrationDate,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
        // Create backward-compatible baseRates object
        baseRates: {
          micro: baseMicro,
          small: baseSmall,
          monthly: baseMonthly,
          yearly: baseYearly,
        }
      };
    });
    
    console.log('🏗️ Processed Equipment Array:', transformedEquipment);
    
    return transformedEquipment;
  } catch (error) {
    console.error('💥 Equipment API Fetch Error:', error);
    throw error;
  }
}