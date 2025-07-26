import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2
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

  const resetForm = () => {    setFormData({
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

  const filteredCustomers = customers.filter(customer =>
    customer &&
    typeof customer.name === 'string' &&
    typeof customer.email === 'string' &&
    (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.companyName && typeof customer.companyName === 'string' && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  if (!user || (user.role !== 'admin' && user.role !== 'sales_agent')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <FormInput
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
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

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No customers found. Add new customers to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.contactName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.companyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.designation || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
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
                            }}
                            title="Edit Customer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

          <FormInput
            label="Customer Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <FormInput
            label="Company Name"
            value={formData.companyName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            required
          />
          <FormInput
            label="Contact Name"
            value={formData.contactName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            required
          />
          <FormInput
            label="Designation"
            value={formData.designation}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
          />
          <FormInput
            label="Type"
            value={formData.type}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <FormInput
            label="Phone"
            value={formData.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
          <FormInput
            label="Address"
            value={formData.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            required
          />
          <FormInput
            label="Notes"
            value={formData.notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-3">
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