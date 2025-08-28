import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';

import { useAuthStore } from '../store/authStore';
import { Customer } from '../types/customer';
import { 
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../services/api/customerService';

export function Customers() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    type: 'other',
    designation: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      if (data && Array.isArray(data)) {
        setCustomers(data);
      } else {
        showToast('Error fetching customers: Invalid data format', 'error');
      }
    } catch (error) {
      showToast('Error fetching customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCustomerExpansion = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  // Group customers by company name to eliminate duplicates
  const groupedCustomers = customers.reduce((acc, customer) => {
    const companyKey = customer.companyName || customer.name;
    if (!acc[companyKey]) {
      acc[companyKey] = {
        company: companyKey,
        type: customer.type,
        address: customer.address,
        contacts: []
      };
    }
    acc[companyKey].contacts.push({
      id: customer.id,
      name: customer.contactName || customer.name,
      email: customer.email,
      phone: customer.phone,
      designation: customer.designation,
      notes: customer.notes
    });
    return acc;
  }, {} as Record<string, {
    company: string;
    type: string;
    address: string;
    contacts: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      designation?: string;
      notes?: string;
    }>;
  }>);

  const filteredCompanies = Object.values(groupedCustomers).filter(company =>
    company.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contacts.some(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.companyName || !formData.contactName || !formData.email || !formData.phone || !formData.address || !formData.type) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (selectedCustomer) {        const updatedCustomer = await updateCustomer(selectedCustomer.id, formData);
        if (updatedCustomer) {
          setCustomers(prev =>
            prev.map(customer =>
              customer.id === selectedCustomer.id ? updatedCustomer : customer
            )
          );
        }
        showToast('Customer updated successfully', 'success');
      } else {
        const newCustomer = await createCustomer(formData);
        setCustomers(prev => [...prev, newCustomer]);
        showToast('Customer added successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      showToast('Error saving customer', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      await deleteCustomer(selectedCustomer.id);
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      showToast('Customer deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting customer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      type: 'other' as const,
      designation: '',
      notes: ''
    });
    setSelectedCustomer(null);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'sales_agent')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="mr-3 text-blue-600" size={28} />
              Customer Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your business relationships and contacts</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <FormInput
                placeholder="Search companies or contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              leftIcon={<Plus size={16} />}
              variant="accent"
              className="w-full sm:w-auto flex-shrink-0"
            >
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No customers found. Add new customers to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map((company) => (
                <div key={company.company} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  {/* Company Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCustomerExpansion(company.company)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {expandedCustomers.has(company.company) ? (
                            <ChevronDown size={16} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                          )}
                        </button>
                        <Building2 size={20} className="text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{company.company}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {company.type}
                            </span>
                            <span className="flex items-center">
                              <Users size={14} className="mr-1" />
                              {company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}
                            </span>
                            {company.address && (
                              <span className="flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {company.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const firstContact = company.contacts[0];
                            if (firstContact) {
                              const customer = customers.find(c => c.id === firstContact.id);
                              if (customer) {
                                setSelectedCustomer(customer);
                                setFormData({
                                  name: customer.name,
                                  companyName: customer.companyName,
                                  contactName: customer.contactName,
                                  email: customer.email,
                                  phone: customer.phone,
                                  address: customer.address,
                                  type: customer.type,
                                  designation: customer.designation || '',
                                  notes: customer.notes || ''
                                });
                                setIsModalOpen(true);
                              }
                            }
                          }}
                          title="Edit Company"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Contacts List (Expandable) */}
                  {expandedCustomers.has(company.company) && (
                    <div className="p-4 space-y-3">
                      {company.contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <User size={16} className="text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{contact.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {contact.designation && (
                                  <span>{contact.designation}</span>
                                )}
                                <a href={`mailto:${contact.email}`} className="flex items-center hover:text-blue-600 transition-colors">
                                  <Mail size={14} className="mr-1" />
                                  {contact.email}
                                </a>
                                <a href={`tel:${contact.phone}`} className="flex items-center hover:text-blue-600 transition-colors">
                                  <Phone size={14} className="mr-1" />
                                  {contact.phone}
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const customer = customers.find(c => c.id === contact.id);
                                if (customer) {
                                  setSelectedCustomer(customer);
                                  setFormData({
                                    name: customer.name,
                                    companyName: customer.companyName,
                                    contactName: customer.contactName,
                                    email: customer.email,
                                    phone: customer.phone,
                                    address: customer.address,
                                    type: customer.type,
                                    designation: customer.designation || '',
                                    notes: customer.notes || ''
                                  });
                                  setIsModalOpen(true);
                                }
                              }}
                              title="Edit Contact"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const customer = customers.find(c => c.id === contact.id);
                                if (customer) {
                                  setSelectedCustomer(customer);
                                  setIsDeleteModalOpen(true);
                                }
                              }}
                              title="Delete Contact"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Customer Name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter customer name"
            />
            <FormInput
              label="Company Name"
              value={formData.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              required
              placeholder="Enter company name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Contact Name"
              value={formData.contactName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              required
              placeholder="Enter contact person name"
            />
            <FormInput
              label="Designation"
              value={formData.designation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="e.g., Project Manager, CEO"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="contact@company.com"
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              placeholder="+1-555-0123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="construction">Construction Company</option>
                <option value="property_developer">Property Developer</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <FormInput
              label="Address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              placeholder="Company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this customer..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              {selectedCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Delete Customer"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this customer? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}