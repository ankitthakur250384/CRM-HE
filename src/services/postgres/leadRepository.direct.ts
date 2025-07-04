/**
 * PostgreSQL Lead Repository - Direct Database Implementation
 * Maps directly to schema.sql structure
 */
import { Lead, LeadStatus } from '../../types/lead';
import { query, getClient } from '../../lib/dbConnection';
import { PoolClient } from 'pg';

/**
 * Get all leads from the database
 * Using direct PostgreSQL connection
 */
export const getLeads = async (): Promise<Lead[]> => {
  try {
    console.log('Getting all leads directly from PostgreSQL database');
    
    // Query matches schema.sql leads table structure
    const result = await query(`
      SELECT l.*, c.name as customer_name, c.company_name, u.display_name as assigned_to_name
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.uid
      ORDER BY l.created_at DESC
    `);
    
    // Map database fields to frontend model
    const leads = result.rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      shiftTiming: row.shift_timing,
      status: row.status as LeadStatus,
      source: row.source,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      designation: row.designation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : null,
      notes: row.notes
    }));
    
    console.log(`Successfully retrieved ${leads.length} leads from database`);
    
    return leads;
  } catch (error) {
    console.error('Error fetching leads from database:', error);
    throw error;
  }
};

/**
 * Get a lead by ID from the database
 */
export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    if (!id) {
      throw new Error('Lead ID is required');
    }
    
    console.log(`Getting lead ${id} from database`);
    
    // Query matches schema.sql leads table structure
    const result = await query(`
      SELECT l.*, c.name as customer_name, c.company_name, u.display_name as assigned_to_name  
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.uid
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log(`Lead ${id} not found in database`);
      return null;
    }
    
    const row = result.rows[0];
    
    // Map database fields to frontend model
    const lead: Lead = {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      serviceNeeded: row.service_needed,
      siteLocation: row.site_location,
      startDate: row.start_date,
      rentalDays: row.rental_days,
      shiftTiming: row.shift_timing,
      status: row.status as LeadStatus,
      source: row.source,
      assignedTo: row.assigned_to || '',
      assignedToName: row.assigned_to_name || '',
      designation: row.designation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : null,
      notes: row.notes
    };
    
    console.log(`Lead ${id} retrieved successfully`);
    
    return lead;
  } catch (error) {
    console.error(`Error fetching lead ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new lead in the database
 * Maps to the 'leads' table in schema.sql
 */
export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating lead in PostgreSQL database');
    
    // Map frontend data to database schema
    const result = await client.query(`
      INSERT INTO leads (
        customer_id, customer_name, company_name, email, phone,
        service_needed, site_location, start_date, rental_days,
        shift_timing, status, source, assigned_to, designation,
        notes, files
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      lead.customerId,
      lead.customerName,
      lead.companyName,
      lead.email,
      lead.phone,
      lead.serviceNeeded,
      lead.siteLocation,
      lead.startDate,
      lead.rentalDays,
      lead.shiftTiming,
      lead.status,
      lead.source,
      lead.assignedTo,
      lead.designation,
      lead.notes,
      lead.files ? JSON.stringify(lead.files) : null
    ]);
    
    const newLead = result.rows[0];
    
    // If there's an assignedTo value, we need to get the assigned user's name
    let assignedToName = '';
    if (newLead.assigned_to) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [newLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model for the response
    const createdLead: Lead = {
      id: newLead.id,
      customerId: newLead.customer_id,
      customerName: newLead.customer_name,
      companyName: newLead.company_name,
      email: newLead.email,
      phone: newLead.phone,
      serviceNeeded: newLead.service_needed,
      siteLocation: newLead.site_location,
      startDate: newLead.start_date,
      rentalDays: newLead.rental_days,
      shiftTiming: newLead.shift_timing,
      status: newLead.status as LeadStatus,
      source: newLead.source,
      assignedTo: newLead.assigned_to || '',
      assignedToName: assignedToName,
      designation: newLead.designation,
      createdAt: newLead.created_at,
      updatedAt: newLead.updated_at,
      files: newLead.files ? JSON.parse(newLead.files) : null,
      notes: newLead.notes
    };
    
    console.log('Lead created successfully:', createdLead.id);
    
    return createdLead;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a lead in the database
 */
export const updateLead = async (id: string, leadData: Partial<Lead>): Promise<Lead | null> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log(`Updating lead ${id} in database`);
    
    // First check if the lead exists
    const checkResult = await client.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      console.log(`Lead ${id} not found for update`);
      return null;
    }
    
    // Build the SQL update statement dynamically based on the provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Map frontend model fields to database schema
    if (leadData.customerId !== undefined) {
      updates.push(`customer_id = $${paramCounter++}`);
      values.push(leadData.customerId);
    }
    
    if (leadData.customerName !== undefined) {
      updates.push(`customer_name = $${paramCounter++}`);
      values.push(leadData.customerName);
    }
    
    if (leadData.companyName !== undefined) {
      updates.push(`company_name = $${paramCounter++}`);
      values.push(leadData.companyName);
    }
    
    if (leadData.email !== undefined) {
      updates.push(`email = $${paramCounter++}`);
      values.push(leadData.email);
    }
    
    if (leadData.phone !== undefined) {
      updates.push(`phone = $${paramCounter++}`);
      values.push(leadData.phone);
    }
    
    if (leadData.serviceNeeded !== undefined) {
      updates.push(`service_needed = $${paramCounter++}`);
      values.push(leadData.serviceNeeded);
    }
    
    if (leadData.siteLocation !== undefined) {
      updates.push(`site_location = $${paramCounter++}`);
      values.push(leadData.siteLocation);
    }
    
    if (leadData.startDate !== undefined) {
      updates.push(`start_date = $${paramCounter++}`);
      values.push(leadData.startDate);
    }
    
    if (leadData.rentalDays !== undefined) {
      updates.push(`rental_days = $${paramCounter++}`);
      values.push(leadData.rentalDays);
    }
    
    if (leadData.shiftTiming !== undefined) {
      updates.push(`shift_timing = $${paramCounter++}`);
      values.push(leadData.shiftTiming);
    }
    
    if (leadData.status !== undefined) {
      updates.push(`status = $${paramCounter++}`);
      values.push(leadData.status);
    }
    
    if (leadData.source !== undefined) {
      updates.push(`source = $${paramCounter++}`);
      values.push(leadData.source);
    }
    
    if (leadData.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCounter++}`);
      values.push(leadData.assignedTo);
    }
    
    if (leadData.designation !== undefined) {
      updates.push(`designation = $${paramCounter++}`);
      values.push(leadData.designation);
    }
    
    if (leadData.notes !== undefined) {
      updates.push(`notes = $${paramCounter++}`);
      values.push(leadData.notes);
    }
    
    if (leadData.files !== undefined) {
      updates.push(`files = $${paramCounter++}`);
      values.push(leadData.files ? JSON.stringify(leadData.files) : null);
    }
    
    // Add the id as the last parameter
    values.push(id);
    
    // If there are no fields to update, return the existing lead
    if (updates.length === 0) {
      console.log(`No fields to update for lead ${id}`);
      return getLeadById(id);
    }
    
    // Perform the update
    const result = await client.query(`
      UPDATE leads
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `, values);
    
    const updatedLead = result.rows[0];
    
    // Get the assigned user's name if needed
    let assignedToName = '';
    if (updatedLead.assigned_to) {
      const userResult = await client.query('SELECT display_name FROM users WHERE uid = $1', [updatedLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model
    const mappedLead: Lead = {
      id: updatedLead.id,
      customerId: updatedLead.customer_id,
      customerName: updatedLead.customer_name,
      companyName: updatedLead.company_name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      serviceNeeded: updatedLead.service_needed,
      siteLocation: updatedLead.site_location,
      startDate: updatedLead.start_date,
      rentalDays: updatedLead.rental_days,
      shiftTiming: updatedLead.shift_timing,
      status: updatedLead.status as LeadStatus,
      source: updatedLead.source,
      assignedTo: updatedLead.assigned_to || '',
      assignedToName: assignedToName,
      designation: updatedLead.designation,
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at,
      files: updatedLead.files ? JSON.parse(updatedLead.files) : null,
      notes: updatedLead.notes
    };
    
    console.log(`Lead ${id} updated successfully`);
    
    return mappedLead;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating lead ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a lead's status in the database
 * Updates the 'status' field in the 'leads' table
 */
export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead | null> => {
  try {
    if (!id) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Updating lead ${id} status to ${status} in database`);
    
    const result = await query(
      'UPDATE leads SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Lead ${id} not found when updating status to ${status}`);
      return null;
    }
    
    const updatedLead = result.rows[0];
    
    // Get the assigned user's name if needed
    let assignedToName = '';
    if (updatedLead.assigned_to) {
      const userResult = await query('SELECT display_name FROM users WHERE uid = $1', [updatedLead.assigned_to]);
      if (userResult.rows.length > 0) {
        assignedToName = userResult.rows[0].display_name;
      }
    }
    
    // Map database fields to frontend model
    const mappedLead: Lead = {
      id: updatedLead.id,
      customerId: updatedLead.customer_id,
      customerName: updatedLead.customer_name,
      companyName: updatedLead.company_name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      serviceNeeded: updatedLead.service_needed,
      siteLocation: updatedLead.site_location,
      startDate: updatedLead.start_date,
      rentalDays: updatedLead.rental_days,
      shiftTiming: updatedLead.shift_timing,
      status: updatedLead.status as LeadStatus,
      source: updatedLead.source,
      assignedTo: updatedLead.assigned_to || '',
      assignedToName: assignedToName,
      designation: updatedLead.designation,
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at,
      files: updatedLead.files ? JSON.parse(updatedLead.files) : null,
      notes: updatedLead.notes
    };
    
    console.log(`Lead ${id} status updated successfully to ${status}`);
    
    return mappedLead;
  } catch (error) {
    console.error(`Error updating lead ${id} status to ${status}:`, error);
    throw error;
  }
};

/**
 * Update a lead's assignment in the database
 * Updates the 'assigned_to' field in the 'leads' table
 */
export const updateLeadAssignment = async (
  leadId: string, 
  salesAgentId: string, 
  salesAgentName: string
): Promise<Lead | null> => {
  try {
    if (!leadId) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Updating lead ${leadId} assignment to ${salesAgentId} (${salesAgentName}) in database`);
    
    const result = await query(
      'UPDATE leads SET assigned_to = $1 WHERE id = $2 RETURNING *',
      [salesAgentId, leadId]
    );
    
    if (result.rows.length === 0) {
      console.warn(`Lead ${leadId} not found when updating assignment`);
      return null;
    }
    
    const updatedLead = result.rows[0];
    
    // Map database fields to frontend model
    const mappedLead: Lead = {
      id: updatedLead.id,
      customerId: updatedLead.customer_id,
      customerName: updatedLead.customer_name,
      companyName: updatedLead.company_name,
      email: updatedLead.email,
      phone: updatedLead.phone,
      serviceNeeded: updatedLead.service_needed,
      siteLocation: updatedLead.site_location,
      startDate: updatedLead.start_date,
      rentalDays: updatedLead.rental_days,
      shiftTiming: updatedLead.shift_timing,
      status: updatedLead.status as LeadStatus,
      source: updatedLead.source,
      assignedTo: updatedLead.assigned_to || '',
      assignedToName: salesAgentName, // Use the provided name
      designation: updatedLead.designation,
      createdAt: updatedLead.created_at,
      updatedAt: updatedLead.updated_at,
      files: updatedLead.files ? JSON.parse(updatedLead.files) : null,
      notes: updatedLead.notes
    };
    
    console.log(`Lead ${leadId} assignment updated successfully to ${salesAgentId}`);
    
    return mappedLead;
  } catch (error) {
    console.error(`Error updating lead ${leadId} assignment:`, error);
    throw error;
  }
};

/**
 * Delete a lead from the database
 */
export const deleteLead = async (id: string): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('Invalid lead ID provided');
    }
    
    console.log(`Deleting lead ${id} from database`);
    
    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [id]);
    
    const deleted = result.rows.length > 0;
    
    if (deleted) {
      console.log(`Lead ${id} deleted successfully`);
    } else {
      console.warn(`Lead ${id} not found for deletion`);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Error deleting lead ${id}:`, error);
    throw error;
  }
};
