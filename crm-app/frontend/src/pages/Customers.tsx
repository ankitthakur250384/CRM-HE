import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Building2
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { Badge } from '../components/common/Badge';
import { useAuthStore } from '../store/authStore';
import { Customer } from '../types/customer';
import { Contact } from '../types/lead';
import { 
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getContactsByCustomer,
  deleteContact
} from '../services/customerService';

export function Customers() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact[]>>({});
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
  }>({ show: false, title: '' });  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    type: 'other',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);
  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers from service...');
      const data = await getCustomers();
      
      if (data && Array.isArray(data)) {
        console.log(`Received ${data.length} customers from service`);
        setCustomers(data);
        
        // Fetch contacts for each customer
        const contactsData: Record<string, Contact[]> = {};
        for (const customer of data) {
          console.log(`Fetching contacts for customer: ${customer.id} - ${customer.name}`);
          const customerContacts = await getContactsByCustomer(customer.id);
          contactsData[customer.id] = customerContacts;
        }
        setContacts(contactsData);
        setIsLoading(false);
      } else {
        console.error('Invalid customer data format:', data);
        showToast('Error fetching customers: Invalid data format', 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showToast('Error fetching customers', 'error');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
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
      
      // Delete associated contacts
      const customerContacts = contacts[selectedCustomer.id] || [];
      for (const contact of customerContacts) {
        await deleteContact(contact.id);
      }
      
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
      contactName: '',
      email: '',
      phone: '',
      address: '',
      type: 'other' as const,
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
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.contactName || 'N/A'}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {customer.id}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            {customer.email}
                          </div>
                          <div className="flex items-center text-gray-500 mt-1">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                          {customer.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          {customer.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setFormData({
                                name: customer.name,
                                email: customer.email,
                                phone: customer.phone,
                                address: customer.address,                                contactName: customer.contactName || '',
                                type: customer.type,
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
          />          <FormInput
            label="Contact Name"
            value={formData.contactName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
            required
          />

          <FormInput
            label="Customer Type"
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