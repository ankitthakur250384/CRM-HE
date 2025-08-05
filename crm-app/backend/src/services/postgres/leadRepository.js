// Stub leadRepository to prevent import errors
import { db } from '../../lib/dbClient.js';

export const getLeads = async () => {
  try {
    const leads = await db.any('SELECT * FROM leads ORDER BY created_at DESC');
    return leads.map(row => ({
      id: row.id,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      source: row.source,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: row.files ? JSON.parse(row.files) : [],
      notes: row.notes
    }));
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
};

export const getLeadById = async (id) => {
  try {
    const lead = await db.oneOrNone('SELECT * FROM leads WHERE id = $1', [id]);
    if (!lead) return null;
    
    return {
      id: lead.id,
      customerName: lead.customer_name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      source: lead.source,
      assignedTo: lead.assigned_to,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      files: lead.files ? JSON.parse(lead.files) : [],
      notes: lead.notes
    };
  } catch (error) {
    console.error('Error fetching lead by ID:', error);
    return null;
  }
};
