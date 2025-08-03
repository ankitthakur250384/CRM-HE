// Example repositories for each collection
import { BaseRepository } from './baseRepository';
import { db } from '../../lib/dbClient';
import { Quotation } from '../../types/quotation';
import { Lead } from '../../types/lead';
import { Deal } from '../../types/deal';
import { Equipment } from '../../types/equipment';
import { Job } from '../../types/job';

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
      customerId: row.customer_id,
      status: row.status,
      source: row.source,
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customerName: row.customer_name || '',
      email: row.email || '',
      phone: row.phone || '',
      serviceNeeded: row.service_needed || '',
      siteLocation: row.site_location || '',
      startDate: row.start_date || null,
      rentalDays: row.rental_days || 0
    };
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
      customerId: row.customer_id,
      leadId: row.lead_id,
      notes: row.notes,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customer: row.customer || '',
      title: row.title || '',
      description: row.description || '',
      value: row.value || 0,
      probability: row.probability || 0,
      expectedCloseDate: row.expected_close_date || null,
      stage: row.stage || 'prospecting'
    };
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
    let jsonData: any = {};
    if (row.data) {
      try {
        jsonData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (e) {
        console.error('Error parsing quotation JSON data:', e);
      }
    }
    
    return {
      id: row.quotation_id,
      dealId: row.deal_id,
      customerId: row.customer_id,
      customerName: row.customer_name || '',
      customerContact: jsonData.customerContact || null,
      selectedEquipment: jsonData.selectedEquipment || null,
      selectedMachines: jsonData.selectedMachines || [],
      machineType: row.machine_type || '',
      orderType: row.order_type,
      numberOfDays: row.number_of_days,
      workingHours: row.working_hours,
      foodResources: row.food_resources || 0,
      accomResources: row.accom_resources || 0,
      siteDistance: row.site_distance || 0,
      usage: row.usage,
      riskFactor: row.risk_factor || 'low',
      extraCharge: row.extra_charge || 0,
      incidentalCharges: row.incidental_charges ? JSON.parse(row.incidental_charges) : [],
      otherFactorsCharge: row.other_factors_charge || 0,
      otherFactors: jsonData.otherFactors || '',
      billing: row.billing || 'gst',
      includeGst: row.include_gst || false,
      shift: row.shift,
      dayNight: row.day_night || 'day',
      mobDemob: row.mob_demob || 0,
      mobRelaxation: row.mob_relaxation || 0,
      runningCostPerKm: row.running_cost_per_km || 0,
      dealType: row.deal_type || '',
      sundayWorking: row.sunday_working || 'no',
      totalRent: row.total_rent,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || '',
      status: row.status
    };
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
        result.selectedMachines = machines.map((m: any) => ({
          id: m.equipment_id,
          machineType: m.equipment_type,
          equipmentId: m.equipment_id,
          name: m.equipment_name,
          type: m.equipment_type,
          quantity: m.quantity,
          baseRate: m.base_rate,
          baseRates: {
            micro: m.base_rate || 0,
            small: m.base_rate || 0,
            monthly: m.base_rate || 0,
            yearly: m.base_rate || 0
          },
          runningCostPerKm: m.running_cost_per_km || 0
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
      category: row.category || '',
      manufacturingDate: row.manufacturing_date || '',
      registrationDate: row.registration_date || '',
      maxLiftingCapacity: row.max_lifting_capacity || 0,
      unladenWeight: row.unladen_weight || 0,
      baseRates: {
        micro: row.base_rate_micro || 0,
        small: row.base_rate_small || 0,
        monthly: row.base_rate_monthly || 0,
        yearly: row.base_rate_yearly || 0
      },
      runningCostPerKm: row.running_cost_per_km || 0,
      description: row.description || '',
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      runningCost: row.running_cost || 0
    };
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
      
      // Get associated operators
      const operators = await db.any(`
        SELECT jo.*, o.name as operator_name 
        FROM job_operators jo
        JOIN operators o ON jo.operator_id = o.operator_id
        WHERE jo.job_id = $1
      `, [id]);
      
      const result = this.convertRowToCamelCase(job);
      
      // Add operators to the result
      if (operators && operators.length) {
        result.operatorIds = operators.map((op: any) => op.operator_id);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw error;
    }
  }
  
  // Convert DB row format to match expected format
  private convertRowToCamelCase(row: any): Job {
    let jsonData: any = {};
    if (row.data) {
      try {
        jsonData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (e) {
        console.error('Error parsing job JSON data:', e);
      }
    }
    
    return {
      id: row.job_id,
      title: row.title || '',
      leadId: row.lead_id || '',
      customerId: row.customer_id,
      customerName: row.customer_name || '',
      equipmentIds: jsonData.equipmentIds || [],
      operatorIds: jsonData.operatorIds || [],
      dealId: row.deal_id || '',
      status: row.status,
      scheduledStartDate: row.scheduled_start_date || '',
      scheduledEndDate: row.scheduled_end_date || '',
      actualStartDate: row.actual_start_date || null,
      actualEndDate: row.actual_end_date || null,
      location: row.location || '',
      notes: row.notes || '',
      createdBy: row.created_by || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

// Config repository
export class ConfigRepository {
  async getQuotationConfig(): Promise<any> {
    try {
      const config = await db.oneOrNone('SELECT * FROM config WHERE name = $1', ['quotation']);
      if (!config) return null;
      let value = (config as any).value;
      if (typeof value === 'string') {
        value = JSON.parse(value);
      }
      return value;
    } catch (error) {
      console.error('Error fetching quotation config:', error);
      throw error;
    }
  }
}
