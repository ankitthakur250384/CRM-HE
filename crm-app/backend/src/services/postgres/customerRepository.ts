/**
 * PostgreSQL Customer Repository
 * Handles database operations for customers using direct PostgreSQL connection
 * Fully aligned with schema.sql structure
 */
import { Customer, CustomerType } from '../../types/customer';
import { Contact } from '../../types/lead';
import { query, getClient } from '../../lib/dbConnection';

/**
 * Get all customers from the database
 * Using direct PostgreSQL connection
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('Getting all customers directly from PostgreSQL database');
    
    // Query matches schema.sql customers table structure
    const result = await query(`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `);
    
    console.log(`Retrieved ${result.rows.length} customers from database`);
    
    // Map database fields to frontend model
    const customers = result.rows.map((row: any) => {
      return {
        id: row.id,
        customerId: row.id, // Business identifier
        name: row.name,
        companyName: row.company_name,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        type: row.type as CustomerType,
        designation: row.designation,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

/**
 * Get a customer by ID from the database
 * Retrieves a single record from the 'customers' table
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    if (!id) {
      throw new Error('Invalid customer ID provided');
    }
    
    console.log(`Getting customer ${id} from database`);
    
    const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log(`Customer ${id} not found in database`);
      return null;
    }
    
    const row = result.rows[0];
    
    // Map database response to frontend model
    const customer: Customer = {
      id: row.id,
      name: row.name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      type: row.type as CustomerType,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    console.log(`Retrieved customer: ${customer.name}`);
    return customer;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new customer in the database
 * Creates a record in the 'customers' table
 */
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating customer in database');
    
    // Map frontend model to database fields and insert into database
    const result = await client.query(`
      INSERT INTO customers (
        name, contact_name, email, phone, address, type, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      customerData.name,
      customerData.contactName,
      customerData.email,
      customerData.phone,
      customerData.address,
      customerData.type,
      customerData.notes
    ]);
    
    const newCustomer = result.rows[0];
    await client.query('COMMIT');
    
    // Map database fields to frontend model
    const customer: Customer = {
      id: newCustomer.id,
      name: newCustomer.name,
      contactName: newCustomer.contact_name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      type: newCustomer.type as CustomerType,
      notes: newCustomer.notes,
      createdAt: newCustomer.created_at,
      updatedAt: newCustomer.updated_at
    };
    
    console.log('Customer created successfully:', customer.id);
    return customer;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a customer in the database
 * Updates fields in the 'customers' table
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    if (!id) {
      throw new Error('Invalid customer ID provided');
    }
    
    console.log(`Updating customer ${id} in database`);
    
    // First check if the customer exists
    const checkResult = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      console.log(`Customer ${id} not found for update`);
      return null;
    }
    
    // Build the SQL update statement dynamically based on the provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Map frontend model fields to database schema
    if (customerData.name !== undefined) {
      updates.push(`name = $${paramCounter++}`);
      values.push(customerData.name);
    }
    
    if (customerData.contactName !== undefined) {
      updates.push(`contact_name = $${paramCounter++}`);
      values.push(customerData.contactName);
    }
    
    if (customerData.email !== undefined) {
      updates.push(`email = $${paramCounter++}`);
      values.push(customerData.email);
    }
    
    if (customerData.phone !== undefined) {
      updates.push(`phone = $${paramCounter++}`);
      values.push(customerData.phone);
    }
    
    if (customerData.address !== undefined) {
      updates.push(`address = $${paramCounter++}`);
      values.push(customerData.address);
    }
    
    if (customerData.type !== undefined) {
      updates.push(`type = $${paramCounter++}`);
      values.push(customerData.type);
    }
    
    if (customerData.notes !== undefined) {
      updates.push(`notes = $${paramCounter++}`);
      values.push(customerData.notes);
    }
    
    // Add the id as the last parameter
    values.push(id);
    
    // If there are no fields to update, return the existing customer
    if (updates.length === 0) {
      console.log(`No fields to update for customer ${id}`);
      await client.query('COMMIT');
      client.release();
      return getCustomerById(id);
    }
    
    // Perform the update
    await client.query(`
      UPDATE customers
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
    `, values);
    
    await client.query('COMMIT');
    
    console.log(`Customer ${id} updated successfully`);
    
    // Fetch the updated customer to return
    client.release();
    return getCustomerById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a customer from the database
 * Deletes a record from the 'customers' table
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('Invalid customer ID provided');
    }
    
    console.log(`Deleting customer ${id} from database`);
    
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    
    const deleted = result.rows.length > 0;
    
    if (deleted) {
      console.log(`Customer ${id} deleted successfully`);
    } else {
      console.warn(`Customer ${id} not found for deletion`);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw error;
  }
};

/**
 * Get all contacts for a specific customer from the database
 * Retrieves records from the 'contacts' table
 */
export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  try {
    console.log(`Getting contacts for customer ${customerId} from database`);
    
    const result = await query(`
      SELECT * FROM contacts 
      WHERE customer_id = $1 
      ORDER BY created_at DESC
    `, [customerId]);
    
    // Map database fields to frontend model
    const contacts = result.rows.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role || ''
    }));
    
    console.log(`Retrieved ${contacts.length} contacts for customer ${customerId}`);
    return contacts;
  } catch (error) {
    console.error(`Error fetching contacts for customer ${customerId}:`, error);
    throw error;
  }
};

/**
 * Create a new contact in the database
 * Creates a record in the 'contacts' table
 */
export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating contact in database:', contactData);
    
    // Verify customer exists first
    const customerCheck = await client.query('SELECT id FROM customers WHERE id = $1', [contactData.customerId]);
    
    if (customerCheck.rows.length === 0) {
      throw new Error(`Customer ${contactData.customerId} not found when creating contact`);
    }
    
    // Insert the contact into the database
    const result = await client.query(`
      INSERT INTO contacts (
        customer_id, name, email, phone, role
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      contactData.customerId,
      contactData.name,
      contactData.email,
      contactData.phone,
      contactData.role
    ]);
    
    const newContact = result.rows[0];
    
    await client.query('COMMIT');
    
    // Map database fields to frontend model
    const contact: Contact = {
      id: newContact.id,
      customerId: newContact.customer_id,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      role: newContact.role || ''
    };
    
    console.log(`Contact created successfully: ${contact.id} for customer ${contact.customerId}`);
    
    return contact;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating contact:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update a contact in the database
 * Updates fields in the 'contacts' table
 */
export const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    if (!id) {
      throw new Error('Invalid contact ID provided');
    }
    
    if (!contactData.customerId) {
      throw new Error('Customer ID is required to update a contact');
    }
    
    console.log(`Updating contact ${id} in database`);
    
    // Check if contact exists
    const checkResult = await client.query('SELECT * FROM contacts WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      console.log(`Contact ${id} not found for update`);
      return null;
    }
    
    // Build the SQL update statement dynamically based on the provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    // Map frontend model fields to database schema
    if (contactData.name !== undefined) {
      updates.push(`name = $${paramCounter++}`);
      values.push(contactData.name);
    }
    
    if (contactData.email !== undefined) {
      updates.push(`email = $${paramCounter++}`);
      values.push(contactData.email);
    }
    
    if (contactData.phone !== undefined) {
      updates.push(`phone = $${paramCounter++}`);
      values.push(contactData.phone);
    }
    
    if (contactData.role !== undefined) {
      updates.push(`role = $${paramCounter++}`);
      values.push(contactData.role);
    }
    
    // Add the id as the last parameter
    values.push(id);
    
    // If there are no fields to update, return the existing contact
    if (updates.length === 0) {
      console.log(`No fields to update for contact ${id}`);
      await client.query('COMMIT');
      client.release();
      
      // Return the existing contact
      const contact: Contact = {
        id: checkResult.rows[0].id,
        customerId: checkResult.rows[0].customer_id,
        name: checkResult.rows[0].name,
        email: checkResult.rows[0].email,
        phone: checkResult.rows[0].phone,
        role: checkResult.rows[0].role || ''
      };
      
      return contact;
    }
    
    // Perform the update
    const result = await client.query(`
      UPDATE contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `, values);
    
    await client.query('COMMIT');
    
    const updatedContact = result.rows[0];
    
    // Map database fields to frontend model
    const contact: Contact = {
      id: updatedContact.id,
      customerId: updatedContact.customer_id,
      name: updatedContact.name,
      email: updatedContact.email,
      phone: updatedContact.phone,
      role: updatedContact.role || ''
    };
    
    console.log(`Contact ${id} updated successfully`);
    
    return contact;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating contact ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete a contact from the database
 * Deletes a record from the 'contacts' table
 */
export const deleteContact = async (id: string): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('Invalid contact ID provided');
    }
    
    console.log(`Deleting contact ${id} from database`);
    
    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING id', [id]);
    
    const deleted = result.rows.length > 0;
    
    if (deleted) {
      console.log(`Contact ${id} deleted successfully`);
    } else {
      console.warn(`Contact ${id} not found for deletion`);
    }
    
    return deleted;
  } catch (error) {
    console.error(`Error deleting contact ${id}:`, error);
    throw error;
  }
};

/**
 * Find customers by email, phone, or name for connection purposes
 */
export const findCustomersByContact = async (email?: string, phone?: string, name?: string): Promise<Customer[]> => {
  try {
    console.log('Searching for customers by contact info:', { email, phone, name });
    
    let queryStr = 'SELECT * FROM customers WHERE ';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (email) {
      conditions.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    
    if (phone) {
      conditions.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }
    
    if (name) {
      conditions.push(`(name ILIKE $${paramIndex} OR contact_name ILIKE $${paramIndex})`);
      params.push(`%${name}%`);
      paramIndex++;
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    queryStr += conditions.join(' OR ');
    queryStr += ' ORDER BY created_at DESC';
    
    const result = await query(queryStr, params);
    
    const customers = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      type: row.type as CustomerType,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    console.log(`Found ${customers.length} matching customers`);
    return customers;
    
  } catch (error) {
    console.error('Error searching customers by contact:', error);
    throw error;
  }
};

/**
 * Create or find customer for lead connection
 * This ensures every lead is connected to a customer
 */
export const createOrFindCustomerForLead = async (leadData: {
  customerName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  siteLocation?: string;
  designation?: string;
}): Promise<Customer> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // First try to find existing customer by email
    const existingResult = await client.query(
      'SELECT * FROM customers WHERE email = $1',
      [leadData.email]
    );
    
    if (existingResult.rows.length > 0) {
      const customer = existingResult.rows[0];
      console.log(`Found existing customer ${customer.id} for email ${leadData.email}`);
      
      await client.query('COMMIT');
      
      return {
        id: customer.id,
        name: customer.name,
        contactName: customer.contact_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        type: customer.type as CustomerType,
        notes: customer.notes,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      };
    }
    
    // Create new customer
    const customerName = leadData.customerName || 'Unknown Customer';
    const companyName = leadData.companyName || customerName;
    
    const newCustomerResult = await client.query(`
      INSERT INTO customers (
        name, company_name, contact_name, email, phone, address, 
        type, designation, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      customerName,
      companyName,
      customerName, // contact_name same as name initially
      leadData.email,
      leadData.phone || '',
      leadData.siteLocation || '',
      'other', // default type
      leadData.designation || '',
      `Auto-created from lead on ${new Date().toISOString()}`
    ]);
    
    const newCustomer = newCustomerResult.rows[0];
    console.log(`Created new customer ${newCustomer.id} for lead`);
    
    await client.query('COMMIT');
    
    return {
      id: newCustomer.id,
      name: newCustomer.name,
      contactName: newCustomer.contact_name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      type: newCustomer.type as CustomerType,
      notes: newCustomer.notes,
      createdAt: newCustomer.created_at,
      updatedAt: newCustomer.updated_at
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating/finding customer for lead:', error);
    throw error;
  } finally {
    client.release();
  }
};
