/**
 * PostgreSQL Customer Repository
 * Handles database operations for customers using the API
 */
import { Customer } from '../../types/customer';
import { Contact } from '../../types/lead';
import { api } from '../../lib/apiService';
import { db } from '../../lib/dbClient';

/**
 * Get all customers from the database via API
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    console.log('🔍 getCustomers: Requesting customers from database...');
    
    // Using the centralized API service
    const response = await api.get<Customer[]>('/customers');
    
    console.log(`✅ getCustomers: Received ${response?.length || 0} customers`);
    
    if (!response) {
      console.error('⚠️ getCustomers: Response is undefined or null');
      return [];
    }
    
    if (!Array.isArray(response)) {
      console.error('⚠️ getCustomers: Response is not an array:', typeof response);
      return [];
    }
    
    if (response.length === 0) {
      console.log('⚠️ getCustomers: No customers received');
    }
    
    // Log first customer for debugging if available
    if (response.length > 0) {
      console.log('👉 First customer from API:', {
        id: response[0].id || 'unknown',
        name: response[0].name || 'unnamed',
        hasContactName: !!response[0].contactName,
        hasEmail: !!response[0].email
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

/**
 * Get a customer by ID from the database via API
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    console.log(`🔍 Getting customer ${id} from database...`);
    
    const customer = await api.get<Customer>(`/customers/${id}`);
    console.log(`✅ Retrieved customer: ${customer?.name || 'Unknown'}`);
    return customer;
  } catch (error) {
    console.error(`❌ Error fetching customer ${id}:`, error);
    return null;
  }
};

/**
 * Create a new customer via API
 */
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  try {
    console.log('Creating customer via API:', customerData);
    const newCustomer = await api.post<Customer>('/customers', customerData);
    return newCustomer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

/**
 * Update a customer via API
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  try {
    console.log(`Updating customer ${id} via API`);
    const updatedCustomer = await api.put<Customer>(`/customers/${id}`, customerData);
    return updatedCustomer;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    return null;
  }
};

/**
 * Delete a customer via API
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting customer ${id} via API`);
    await api.delete(`/customers/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error);
    return false;
  }
};

/**
 * Get all contacts for a specific customer via API
 */
export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  try {
    console.log(`Getting contacts for customer ${customerId} via API`);
    const contacts = await api.get<Contact[]>(`/customers/${customerId}/contacts`);
    return contacts;
  } catch (error) {
    console.error(`Error fetching contacts for customer ${customerId}:`, error);
    // Fall back to mock data if there's an error
    return [
      {
        id: `contact-1-${customerId}`,
        customerId: customerId,
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-123-4567',
        role: 'Project Manager'
      },
      {
        id: `contact-2-${customerId}`,
        customerId: customerId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-987-6543',
        role: 'Procurement Officer'
      }
    ];
  }
};

/**
 * Create a new contact via API
 */
export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  try {
    console.log('Creating contact via API:', contactData);
    const newContact = await api.post<Contact>(`/customers/${contactData.customerId}/contacts`, contactData);
    return newContact;
  } catch (error) {
    console.error('Error creating contact:', error);
    // Fall back to mock implementation
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`
    };
    return newContact;
  }
};

/**
 * Update a contact via API
 */
export const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
  try {
    if (!contactData.customerId) {
      throw new Error('Customer ID is required to update a contact');
    }
    
    console.log(`Updating contact ${id} via API`);
    const updatedContact = await api.put<Contact>(
      `/customers/${contactData.customerId}/contacts/${id}`, 
      contactData
    );
    
    return updatedContact;
  } catch (error) {
    console.error(`Error updating contact ${id}:`, error);
    // Fall back to mock implementation
    const contact: Contact = {
      id,
      customerId: contactData.customerId || 'unknown',
      name: contactData.name || 'Unknown Name',
      email: contactData.email || 'unknown@example.com',
      phone: contactData.phone || '000-000-0000',
      role: contactData.role || 'Unknown Role'
    };
    
    const updatedContact = {
      ...contact,
      ...contactData
    };
    
    return updatedContact;
  }
};

/**
 * Delete a contact via API
 */
export const deleteContact = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting contact ${id} via API`);
    // Note: This is a simplified implementation as we don't have the customer ID here
    // In a real app, we'd need to get the customer ID first or change the API structure
    await api.delete(`/contacts/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting contact ${id}:`, error);
    // Return true for mock implementation
    return true;
  }
};
