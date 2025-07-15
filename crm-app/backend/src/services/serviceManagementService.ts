import serviceRepository, { Service } from './postgres/serviceRepository';

/**
 * Get all services
 */
export const getServices = async (): Promise<Service[]> => {
  try {
    return await serviceRepository.getServices();
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Get service by ID
 */
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    return await serviceRepository.getServiceById(id);
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    return null;
  }
};

/**
 * Create a new service
 */
export const createService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> => {
  try {
    return await serviceRepository.createService(service);
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

/**
 * Update service details
 */
export const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
  try {
    return await serviceRepository.updateService(id, data);
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a service
 */
export const deleteService = async (id: string): Promise<void> => {
  try {
    await serviceRepository.deleteService(id);
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle a service's active status
 */
export const toggleServiceStatus = async (id: string): Promise<Service> => {
  try {
    return await serviceRepository.toggleServiceStatus(id);
  } catch (error) {
    console.error(`Error toggling service status ${id}:`, error);
    throw error;
  }
};

// Export service interface
export type { Service } from './postgres/serviceRepository';
