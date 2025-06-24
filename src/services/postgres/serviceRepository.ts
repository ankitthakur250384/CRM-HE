import { v4 as uuidv4 } from 'uuid';
import { db } from '../../lib/dbClient';
import { BaseRepository } from './baseRepository';

export interface Service {
  id: string;
  name: string;
  type: string;
  baseRate: number;
  unit: 'hour' | 'day' | 'shift';
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ServiceRepository extends BaseRepository<Service> {
  constructor() {
    super('services');
  }

  async getServices(): Promise<Service[]> {
    try {
      const services = await db.any('SELECT * FROM services ORDER BY name');
      return services.map(service => this.mapDatabaseRowToModel(service));
    } catch (error) {
      console.error('Error fetching services:', error);
      
      // Return mock data for development/demo
      return [
        {
          id: '1',
          name: 'Crane Operation',
          type: 'lifting',
          baseRate: 5000,
          unit: 'hour',
          description: 'Professional crane operation services',
          isActive: true,
          createdAt: new Date(2025, 5, 15).toISOString(),
          updatedAt: new Date(2025, 5, 15).toISOString()
        },
        {
          id: '2',
          name: 'Crane Transport',
          type: 'transport',
          baseRate: 15000,
          unit: 'day',
          description: 'Transportation of crane equipment to site',
          isActive: true,
          createdAt: new Date(2025, 5, 16).toISOString(),
          updatedAt: new Date(2025, 5, 16).toISOString()
        },
        {
          id: '3',
          name: 'Jib Attachment',
          type: 'attachment',
          baseRate: 3000,
          unit: 'day',
          description: 'Rental of jib attachment for extended reach',
          isActive: true,
          createdAt: new Date(2025, 5, 17).toISOString(),
          updatedAt: new Date(2025, 5, 17).toISOString()
        },
        {
          id: '4',
          name: 'Technical Consultation',
          type: 'consultation',
          baseRate: 8000,
          unit: 'hour',
          description: 'Expert technical advice for complex lifting solutions',
          isActive: true,
          createdAt: new Date(2025, 5, 18).toISOString(),
          updatedAt: new Date(2025, 5, 18).toISOString()
        },
        {
          id: '5',
          name: 'Operator Training',
          type: 'operator',
          baseRate: 12000,
          unit: 'shift',
          description: 'Training sessions for crane operators',
          isActive: false,
          createdAt: new Date(2025, 5, 19).toISOString(),
          updatedAt: new Date(2025, 5, 19).toISOString()
        }
      ];
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const service = await db.oneOrNone('SELECT * FROM services WHERE id = $1', [id]);
      return service ? this.mapDatabaseRowToModel(service) : null;
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      
      // Return mock data for development/demo
      const mockServices = [
        {
          id: '1',
          name: 'Crane Operation',
          type: 'lifting',
          baseRate: 5000,
          unit: 'hour',
          description: 'Professional crane operation services',
          isActive: true,
          createdAt: new Date(2025, 5, 15).toISOString(),
          updatedAt: new Date(2025, 5, 15).toISOString()
        },
        {
          id: '2',
          name: 'Crane Transport',
          type: 'transport',
          baseRate: 15000,
          unit: 'day',
          description: 'Transportation of crane equipment to site',
          isActive: true,
          createdAt: new Date(2025, 5, 16).toISOString(),
          updatedAt: new Date(2025, 5, 16).toISOString()
        }
      ];
      
      return mockServices.find(service => service.id === id) || null;
    }
  }

  async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    try {
      const now = new Date().toISOString();
      const newService = {
        id: uuidv4(),
        ...service,
        createdAt: now,
        updatedAt: now
      };
      
      // In a real implementation, we would insert into the database
      // await db.one(
      //   `INSERT INTO services(...) VALUES(...) RETURNING *`
      // );
      
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    try {
      const now = new Date().toISOString();
      
      // In a real implementation, we would update the database
      // const result = await db.oneOrNone(
      //   `UPDATE services SET ... WHERE id = $1 RETURNING *`,
      //   [id]
      // );
      
      // For mock implementation, just return a service with updated fields
      return { 
        id, 
        name: service.name || 'Updated Service',
        type: service.type || 'lifting',
        baseRate: service.baseRate || 5000,
        unit: service.unit || 'hour',
        description: service.description || 'Updated description',
        isActive: service.isActive !== undefined ? service.isActive : true,
        createdAt: new Date(2025, 5, 15).toISOString(),
        updatedAt: now 
      };
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      // In a real implementation, we would delete from the database
      // await db.none('DELETE FROM services WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
  
  async toggleServiceStatus(id: string): Promise<Service> {
    try {
      // In a real implementation:
      // 1. Get the current service
      // 2. Toggle its active status
      // 3. Save it back to DB
      
      // For mock implementation:
      const service = await this.getServiceById(id);
      if (!service) throw new Error('Service not found');
      
      return this.updateService(id, { isActive: !service.isActive });
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  }

  // Helper to map database rows to model objects
  private mapDatabaseRowToModel(row: any): Service {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      baseRate: row.base_rate || row.baseRate,
      unit: row.unit,
      description: row.description,
      isActive: row.is_active || row.isActive,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt
    };
  }
}

const serviceRepository = new ServiceRepository();
export default serviceRepository;
