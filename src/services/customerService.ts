/**
 * Customer Service
 * 
 * This file serves as a wrapper around the PostgreSQL customer repository.
 * It replaces the Firestore implementation and provides the same interface.
 */

import * as customerRepository from './postgres/customerRepository';
import { Customer } from '../types/customer';
import { Contact } from '../types/lead';

/**
 * Get all customers
 */
export const getCustomers = async (): Promise<Customer[]> => {
  return customerRepository.getCustomers();
};

/**
 * Get a customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  return customerRepository.getCustomerById(id);
};

/**
 * Create a new customer
 */
export const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  return customerRepository.createCustomer(customerData);
};

/**
 * Update a customer
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer | null> => {
  return customerRepository.updateCustomer(id, customerData);
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  return customerRepository.deleteCustomer(id);
};

/**
 * Get contacts by customer ID
 */
export const getContactsByCustomer = async (customerId: string): Promise<Contact[]> => {
  return customerRepository.getContactsByCustomer(customerId);
};

/**
 * Create a new contact
 */
export const createContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
  return customerRepository.createContact(contactData);
};

/**
 * Update a contact
 */
export const updateContact = async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
  return customerRepository.updateContact(id, contactData);
};

/**
 * Delete a contact
 */
export const deleteContact = async (id: string): Promise<boolean> => {
  return customerRepository.deleteContact(id);
};
