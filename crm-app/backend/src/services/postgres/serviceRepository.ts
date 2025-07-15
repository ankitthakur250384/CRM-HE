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
      throw error;
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const service = await db.oneOrNone('SELECT * FROM services WHERE id = $1', [id]);
      return service ? this.mapDatabaseRowToModel(service) : null;
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      throw error;
    }
  }

  async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    try {
      const now = new Date().toISOString();
      const id = uuidv4();
      
      const result = await db.one(
        `INSERT INTO services(
          id, name, type, base_rate, unit, description, is_active, 
          created_at, updated_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          id,
          service.name,
          service.type,
          service.baseRate,
          service.unit,
          service.description,
          service.isActive,
          now,
          now
        ]
      );
      
      return this.mapDatabaseRowToModel(result);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    try {
      // Prepare the update parts
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (service.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(service.name);
      }
      
      if (service.type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(service.type);
      }
      
      if (service.baseRate !== undefined) {
        updates.push(`base_rate = $${paramIndex++}`);
        values.push(service.baseRate);
      }
      
      if (service.unit !== undefined) {
        updates.push(`unit = $${paramIndex++}`);
        values.push(service.unit);
      }
      
      if (service.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(service.description);
      }
      
      if (service.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(service.isActive);
      }
      
      // Always update the updated_at timestamp
      const now = new Date().toISOString();
      updates.push(`updated_at = $${paramIndex++}`);
      values.push(now);
      
      // Add the id as the last parameter
      values.push(id);
      
      // Execute the update
      const result = await db.one(
        `UPDATE services SET ${updates.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        values
      );
      
      return this.mapDatabaseRowToModel(result);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      await db.none('DELETE FROM services WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }
  
  async toggleServiceStatus(id: string): Promise<Service> {
    try {
      // Get the current service
      const service = await this.getServiceById(id);
      if (!service) throw new Error('Service not found');
      
      // Toggle the status and update
      const result = await db.one(
        `UPDATE services SET 
         is_active = NOT is_active, 
         updated_at = $1
         WHERE id = $2 
         RETURNING *`,
        [new Date().toISOString(), id]
      );
      
      return this.mapDatabaseRowToModel(result);
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
