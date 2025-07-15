/**
 * Customer Service
 * 
 * This file serves as a wrapper around the API customer service.
 * It provides a consistent interface for customer operations.
 */

import * as customerApiService from './api/customerService';
import { Customer } from '../types/customer';
import { Contact } from '../types/lead';

/**
 * Get all customers
 */
export const getCustomers = async (): Promise<Customer[]> => {
  return customerApiService.getCustomers();
};

/**
 * Get a customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  return customerApiService.getCustomerById(id);
};

/**
 * Create a new customer
 */
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  return customerApiService.createCustomer(customerData);
};

/**
 * Update a customer
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  return customerApiService.updateCustomer(id, customerData);
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  return customerApiService.deleteCustomer(id);
};

/**
 * Get contacts by customer ID
 */
export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  return customerApiService.getContactsByCustomer(customerId);
};

/**
 * Create a new contact
 */
export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  return customerApiService.createContact(contactData);
};

/**
 * Update a contact
 */
export const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
  return customerApiService.updateContact(id, contactData);
};

/**
 * Delete a contact
 */
export const deleteContact = async (id: string): Promise<boolean> => {
  return customerApiService.deleteContact(id);
};

/**
 * Find customers by contact information for connection purposes
 * Note: This function may need backend API support for advanced search
 */
export const findCustomersByContact = async (email?: string, phone?: string, name?: string): Promise<Customer[]> => {
  // For now, get all customers and filter client-side
  // This could be optimized with a dedicated API endpoint
  const customers = await customerApiService.getCustomers();
  return customers.filter(customer => {
    if (email && customer.email === email) return true;
    if (phone && customer.phone === phone) return true;
    if (name && (customer.name.toLowerCase().includes(name.toLowerCase()) || 
                 customer.contactName.toLowerCase().includes(name.toLowerCase()))) return true;
    return false;
  });
};

/**
 * Create or find customer for lead connection
 * Note: This function may need backend API support for complex operations
 */
export const createOrFindCustomerForLead = async (leadData: {
  customerName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  siteLocation?: string;
  designation?: string;
}): Promise<Customer> => {
  // Try to find existing customer by email first
  const customers = await customerApiService.getCustomers();
  const existingCustomer = customers.find(customer => customer.email === leadData.email);
  
  if (existingCustomer) {
    return existingCustomer;
  }
  
  // Create new customer
  const customerData = {
    name: leadData.customerName || 'Unknown Customer',
    contactName: leadData.customerName || 'Unknown Customer',
    email: leadData.email,
    phone: leadData.phone || '',
    address: leadData.siteLocation || '',
    type: 'other' as const,
    notes: `Auto-created from lead on ${new Date().toISOString()}`
  };
  
  return customerApiService.createCustomer(customerData);
};
