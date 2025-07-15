// Example repositories for each collection
import { BaseRepository } from './baseRepository';
import { db } from '../../lib/dbClient';
import { Quotation } from '../../types/quotation';
import { Lead } from '../../types/lead';
import { Deal } from '../../types/deal';
import { Equipment } from '../../types/equipment';
import { Job } from '../../types/job';
import { Template } from '../../types/template';

// Import repositories
import TemplateRepository from './templateRepository';
import UserRepository from './userRepository';

// Users repository
export class UsersRepository extends BaseRepository<any> {
  constructor() {
    super('users');
  }
  
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
      return user ? this.convertRowToCamelCase(user) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): any {
    return {
      id: row.uid,
      uid: row.uid,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

// Leads repository
export class LeadsRepository extends BaseRepository<Lead> {
  constructor() {
    super('leads');
  }
  
  async getLeadsByAssignee(assigneeId: string): Promise<Lead[]> {
    try {
      const leads = await db.any('SELECT * FROM leads WHERE assigned_to = $1', [assigneeId]);
      return leads.map(lead => this.convertRowToCamelCase(lead));
    } catch (error) {
      console.error('Error fetching leads by assignee:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Lead {
    return {
      id: row.lead_id,
      leadId: row.lead_id,
      customerId: row.customer_id,
      status: row.status,
      source: row.source,
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as Lead;
  }
}

// Deals repository
export class DealsRepository extends BaseRepository<Deal> {
  constructor() {
    super('deals');
  }
  
  async getDealsByCustomer(customerId: string): Promise<Deal[]> {
    try {
      const deals = await db.any('SELECT * FROM deals WHERE customer_id = $1', [customerId]);
      return deals.map(deal => this.convertRowToCamelCase(deal));
    } catch (error) {
      console.error('Error fetching deals by customer:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Deal {
    return {
      id: row.deal_id,
      dealId: row.deal_id,
      customerId: row.customer_id,
      leadId: row.lead_id,
      status: row.status,
      amount: row.amount,
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as Deal;
  }
}

// Quotations repository
export class QuotationsRepository extends BaseRepository<Quotation> {
  constructor() {
    super('quotations');
  }
  
  async getQuotationsByDeal(dealId: string): Promise<Quotation[]> {
    try {
      const quotations = await db.any('SELECT * FROM quotations WHERE deal_id = $1', [dealId]);
      return quotations.map(quotation => this.convertRowToCamelCase(quotation));
    } catch (error) {
      console.error('Error fetching quotations by deal:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Quotation {
    // Try to parse the JSON data field
    let jsonData = {};
    if (row.data) {
      try {
        jsonData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (e) {
        console.error('Error parsing quotation JSON data:', e);
      }
    }
    
    return {
      id: row.quotation_id,
      quotationId: row.quotation_id,
      customerId: row.customer_id,
      dealId: row.deal_id,
      status: row.status,
      orderType: row.order_type,
      numberOfDays: row.number_of_days,
      workingHours: row.working_hours,
      shift: row.shift,
      usage: row.usage,
      totalRent: row.total_rent,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      
      // Customer data might be in the JSON field
      customerContact: jsonData.customerContact || {
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        designation: ''
      },
      
      // Equipment data might also be in the JSON field
      selectedEquipment: jsonData.selectedEquipment || {
        id: row.equipment_id,
        equipmentId: row.equipment_id,
        name: 'Unknown Equipment',
        baseRates: {
          micro: 0,
          small: 0,
          monthly: 0,
          yearly: 0
        }
      },
      
      // Selected machines might need to be fetched separately
      selectedMachines: jsonData.selectedMachines || []
    } as Quotation;
  }
  
  // Override getById to include machines
  async getById(id: string): Promise<Quotation | null> {
    try {
      const quotation = await db.oneOrNone('SELECT * FROM quotations WHERE quotation_id = $1', [id]);
      
      if (!quotation) {
        return null;
      }
      
      // Get associated machines
      const machines = await db.any(`
        SELECT qm.*, e.name as equipment_name, e.type as equipment_type 
        FROM quotation_machines qm
        JOIN equipment e ON qm.equipment_id = e.equipment_id
        WHERE qm.quotation_id = $1
      `, [id]);
      
      const result = this.convertRowToCamelCase(quotation);
      
      // Add machines to the result
      if (machines && machines.length) {
        result.selectedMachines = machines.map(m => ({
          id: m.equipment_id,
          equipmentId: m.equipment_id,
          name: m.equipment_name,
          type: m.equipment_type,
          quantity: m.quantity,
          baseRate: m.base_rate
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching quotation by ID:', error);
      throw error;
    }
  }
}

// Equipment repository
export class EquipmentRepository extends BaseRepository<Equipment> {
  constructor() {
    super('equipment');
  }
  
  async getAvailableEquipment(): Promise<Equipment[]> {
    try {
      const equipment = await db.any('SELECT * FROM equipment WHERE status = $1', ['available']);
      return equipment.map(eq => this.convertRowToCamelCase(eq));
    } catch (error) {
      console.error('Error fetching available equipment:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Equipment {
    return {
      id: row.equipment_id,
      equipmentId: row.equipment_id,
      name: row.name,
      type: row.type,
      status: row.status,
      baseRates: {
        micro: row.base_rate_micro,
        small: row.base_rate_small,
        monthly: row.base_rate_monthly,
        yearly: row.base_rate_yearly
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as Equipment;
  }
}

// Jobs repository
export class JobsRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs');
  }
  
  // Override getById to include operators
  async getById(id: string): Promise<Job | null> {
    try {
      const job = await db.oneOrNone('SELECT * FROM jobs WHERE job_id = $1', [id]);
      
      if (!job) {
        return null;
      }
      
      // Get assigned operators
      const operators = await db.any(`
        SELECT o.* FROM operators o
        JOIN job_operators jo ON o.operator_id = jo.operator_id
        WHERE jo.job_id = $1
      `, [id]);
      
      const result = this.convertRowToCamelCase(job);
      
      // Add operators to the result
      if (operators && operators.length) {
        result.assignedOperators = operators.map(o => o.operator_id);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw error;
    }
  }
  
  // Get jobs by date range
  async getJobsByDateRange(startDate: Date, endDate: Date): Promise<Job[]> {
    try {
      const jobs = await db.any(`
        SELECT * FROM jobs 
        WHERE start_date >= $1 AND end_date <= $2
        ORDER BY start_date ASC
      `, [startDate, endDate]);
      
      return jobs.map(job => this.convertRowToCamelCase(job));
    } catch (error) {
      console.error('Error fetching jobs by date range:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Job {
    return {
      id: row.job_id,
      jobId: row.job_id,
      customerId: row.customer_id,
      dealId: row.deal_id,
      quotationId: row.quotation_id,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      siteLocation: row.site_location,
      notes: row.notes,
      assignedOperators: [],  // This will be populated separately
      createdAt: row.created_at,
      updatedAt: row.updated_at
    } as Job;
  }
}

// Config repository
export class ConfigRepository {
  async getQuotationConfig(): Promise<any> {
    try {
      const config = await db.oneOrNone('SELECT * FROM config WHERE name = $1', ['quotation']);
      
      if (!config) {
        return null;
      }
      
      // Parse the JSON value
      let value = config.value;
      if (typeof value === 'string') {
        value = JSON.parse(value);
      }
      
      return value;
    } catch (error) {
      console.error('Error fetching quotation config:', error);
      throw error;
    }
  }
  
  async updateQuotationConfig(configData: any): Promise<any> {
    try {
      const result = await db.one(`
        UPDATE config 
        SET value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE name = $2
        RETURNING *
      `, [JSON.stringify(configData), 'quotation']);
      
      // Parse the JSON value
      let value = result.value;
      if (typeof value === 'string') {
        value = JSON.parse(value);
      }
      
      return value;
    } catch (error) {
      console.error('Error updating quotation config:', error);
      throw error;
    }
  }
}
