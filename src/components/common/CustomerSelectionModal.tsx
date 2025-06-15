import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { Customer } from '../../types/lead';
import { getCustomers, createCustomer } from '../../services/firestore/customerService';

type ModalMode = 'select' | 'create';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  initialCustomerData?: {
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    address?: string;
    designation?: string;
  };
}

export function CustomerSelectionModal({
  isOpen,
  onClose,
  onSelect,
  initialCustomerData
}: CustomerSelectionModalProps) {
  const [mode, setMode] = useState<ModalMode>('select');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: initialCustomerData?.name || '',
    email: initialCustomerData?.email || '',
    phone: initialCustomerData?.phone || '',
    address: initialCustomerData?.address || '',
    companyName: initialCustomerData?.companyName || '',
    designation: initialCustomerData?.designation || ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      setMode('select'); // Reset to select mode when modal opens
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!formData.name.trim()) {
      alert('Customer Name is required');
      return;
    }
    try {
      const newCustomer = await createCustomer({
        ...formData,
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || 'Korean.org',
        email: formData.email.trim(),
        phone: formData.phone.trim() || 'N/A',
        address: formData.address.trim() || 'N/A',
        designation: formData.designation.trim() || 'N/A'
      });
      console.log('Created new customer:', newCustomer);
      onSelect(newCustomer);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer');
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    console.log('Selected existing customer:', customer);
    onSelect(customer);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select or Create Customer"
      size="md"
    >
      <div className="space-y-4">
        {/* Always show the selection buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={mode === 'select' ? "default" : "outline"}
            onClick={() => setMode('select')}
            className="flex-1"
            size="sm"
          >
            Select Existing
          </Button>
          <Button
            variant={mode === 'create' ? "default" : "outline"}
            onClick={() => {
              setMode('create');
              // Reset form with initial data when switching to create mode
              setFormData({
                name: initialCustomerData?.name || '',
                email: initialCustomerData?.email || '',
                phone: initialCustomerData?.phone || '',
                address: initialCustomerData?.address || '',
                companyName: initialCustomerData?.companyName || '',
                designation: initialCustomerData?.designation || ''
              });
            }}
            className="flex-1"
            size="sm"
          >
            Create New
          </Button>
        </div>

        {mode === 'select' ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <FormInput
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto border rounded-lg divide-y">
              {isLoading ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">Loading customers...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500">No customers found</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div>
                      <div className="font-medium text-sm sm:text-base">{customer.name}</div>
                      {customer.companyName && (
                        <div className="text-xs sm:text-sm text-gray-600">{customer.companyName}</div>
                      )}
                      {customer.designation && (
                        <div className="text-xs sm:text-sm text-gray-600">{customer.designation}</div>
                      )}
                      <div className="text-xs sm:text-sm text-gray-500">{customer.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{customer.customerId}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Customer Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
              <FormInput
                label="Company Name"
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Designation"
                value={formData.designation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Enter designation"
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormInput
                label="Phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
              <FormInput
                label="Address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                onClick={handleCreateCustomer}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                Add Customer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}