/**
 * Equipment Service
 * 
 * This file serves as a wrapper that conditionally uses:
 * - API service in browser environments
 * - Direct PostgreSQL repository on the server
 * 
 * This ensures proper separation between frontend and backend,
 * preventing frontend components from trying to access PostgreSQL directly.
 */

import { Equipment, CraneCategory } from '../types/equipment';

// Conditionally import the appropriate implementation
// Based on the execution environment
const isBrowser = typeof window !== 'undefined';

// Promise to track when implementation is loaded
let implementationPromise: Promise<any>;

// Different implementation based on environment
if (isBrowser) {
  // In browser environment, use API implementation
  console.log('🌐 Loading API-based equipment service (browser)');
  implementationPromise = import('./api/equipmentService');
} else {
  // In server/Node environment, use PostgreSQL repository directly
  console.log('🗄️ Loading direct PostgreSQL equipment repository (server)');
  implementationPromise = import('./postgres/equipmentRepository');
}

// Helper to get implementation
const getImplementation = async () => {
  try {
    const impl = await implementationPromise;
    return impl;
  } catch (error) {
    console.error('Failed to load equipment service implementation:', error);
    throw new Error('Equipment service unavailable');
  }
};

/**
 * Get all equipment
 */
export const getEquipment = async (): Promise<Equipment[]> => {
  try {
    const impl = await getImplementation();
    return impl.getEquipment();
  } catch (error) {
    console.error('Failed to get equipment:', error);
    return [];
  }
};

/**
 * Get equipment by category
 */
export const getEquipmentByCategory = async (category: CraneCategory): Promise<Equipment[]> => {
  try {
    const impl = await getImplementation();
    return impl.getEquipmentByCategory(category);
  } catch (error) {
    console.error(`Failed to get equipment for category ${category}:`, error);
    return [];
  }
};

/**
 * Get equipment by ID
 */
export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  try {
    const impl = await getImplementation();
    return impl.getEquipmentById(id);
  } catch (error) {
    console.error(`Failed to get equipment ${id}:`, error);
    return null;
  }
};

/**
 * Create new equipment
 */
export const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> => {
  const impl = await getImplementation();
  return impl.createEquipment(equipmentData);
};

/**
 * Update equipment
 */
export const updateEquipment = async (id: string, equipmentData: Partial<Equipment>): Promise<Equipment | null> => {
  try {
    const impl = await getImplementation();
    return impl.updateEquipment(id, equipmentData);
  } catch (error) {
    console.error(`Failed to update equipment ${id}:`, error);
    return null;
  }
};

/**
 * Delete equipment
 */
export const deleteEquipment = async (id: string): Promise<boolean> => {
  try {
    const impl = await getImplementation();
    return impl.deleteEquipment(id);
  } catch (error) {
    console.error(`Failed to delete equipment ${id}:`, error);
    return false;
  }
};
