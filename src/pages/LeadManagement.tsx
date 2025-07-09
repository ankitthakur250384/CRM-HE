import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { FormInput } from '../components/common/FormInput';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { TextArea } from '../components/common/TextArea';
import { Modal } from '../components/common/Modal';

import { Toast } from '../components/common/Toast';
import { CustomerSelectionModal } from '../components/common/CustomerSelectionModal';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import MockDataWarning from '../components/common/MockDataWarning';
import { useAuthStore } from '../store/authStore';
import { Lead, LeadStatus, Customer } from '../types/lead';
import { getLeads, createLead, updateLeadStatus, updateLeadAssignment } from '../services/leadService';
import { createDeal } from '../services/dealService';
import { useNavigate } from 'react-router-dom';
import { extractDataFromApiResponse, getCustomerIdentifier } from '../utils/customerUtils';

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_process', label: 'In Process' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'lost', label: 'Lost' },
];

const MACHINERY_OPTIONS = [
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
];

const SHIFT_OPTIONS = [
  { value: 'day', label: 'Day Shift' },
  { value: 'night', label: 'Night Shift' }
];

export function LeadManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesAgents, setSalesAgents] = useState<{ id: string; name: string; }[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCustomerSelectionModalOpen, setIsCustomerSelectionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phoneNumber: '',
    email: '',
    machineryType: '',
    location: '',
    startDate: today,
    rentalDays: '',
    shiftTiming: 'day',
    notes: '',
    assignedTo: '',
    designation: '',
  });

  const [dealValue, setDealValue] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDealValueModalOpen, setIsDealValueModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchSalesAgents();
  }, []);
  useEffect(() => {
    console.log('Filtering leads. Current leads array:', leads);
    filterLeads();
  }, [leads, searchTerm, statusFilter]);
  const fetchLeads = async () => {
    try {
      console.log('Fetching leads from API...');
      const response = await getLeads();
      
      // Use robust data extraction utility
      const data = extractDataFromApiResponse<Lead>(response);
      
      console.log('🧪 Debug leads response:', {
        originalResponse: response,
        extractedData: data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not array',
        firstLead: data.length > 0 ? getCustomerIdentifier(data[0]) : 'none'
      });
      
      console.log('Leads data received:', data);
      setLeads(data || []); // Ensure we always have an array
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showToast('Error fetching leads', 'error');
      // Set empty array to prevent undefined errors
      setLeads([]);
      setIsLoading(false);
    }
  };
  const fetchSalesAgents = async () => {
    try {
      console.log('Fetching sales agents from API...');
      const response = await fetch('http://localhost:3001/api/auth/sales-agents', {
        headers: {
          'Content-Type': 'application/json',
          'X-Bypass-Auth': 'development-only-123'
        }
      });
      
      if (response.ok) {
        const agents = await response.json();
        console.log('Sales agents fetched:', agents);
        setSalesAgents(agents);
      } else {
        console.error('Failed to fetch sales agents:', response.status);
        // Fallback to mock data if API fails
        const mockAgents = [
          { id: 'u_sal_386065nosk', name: 'John Sales' },
          { id: 'usr_test001', name: 'Test User' },
        ];
        setSalesAgents(mockAgents);
      }
    } catch (error) {
      console.error('Error fetching sales agents:', error);
      // Fallback to mock data using actual user IDs from database
      const mockAgents = [
        { id: 'u_sal_386065nosk', name: 'John Sales' },
        { id: 'usr_test001', name: 'Test User' },
      ];
      setSalesAgents(mockAgents);
    }
  };
  const filterLeads = () => {
    // Check if leads is valid to prevent errors
    if (!Array.isArray(leads)) {
      console.warn('Leads is not an array:', leads);
      setFilteredLeads([]);
      return;
    }

    console.log(`Starting filtering with ${leads.length} leads`);
    let filtered = [...leads];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        (lead?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (lead?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (lead?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (lead?.phone?.includes(searchTerm) || false)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead?.status === statusFilter);
    } else {
      // By default, exclude converted leads from the pipeline
      filtered = filtered.filter(lead => lead?.status !== 'converted');
    }

    console.log(`After filtering: ${filtered.length} leads match criteria`);
    setFilteredLeads(filtered);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.phoneNumber || !formData.email || 
        !formData.machineryType || !formData.location || !formData.startDate || 
        !formData.rentalDays) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    try {
      // If user is a sales agent, automatically assign the lead to them
      const assignedTo = user?.role === 'sales_agent' ? user.id : formData.assignedTo;
      const assignedToName = user?.role === 'sales_agent' ? user.name : 
        salesAgents.find(agent => agent.id === formData.assignedTo)?.name || '';

      // Only include assignedTo and assignedToName if they have valid values
      const leadData = {
        customerName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phoneNumber,
        serviceNeeded: formData.machineryType,
        siteLocation: formData.location,
        startDate: formData.startDate,
        rentalDays: parseInt(formData.rentalDays),
        shiftTiming: formData.shiftTiming,
        status: 'new' as const,
        notes: formData.notes,
        designation: formData.designation,
        // Only include assignment if valid
        ...(assignedTo && assignedTo.trim() !== '' ? { 
          assignedTo: assignedTo,
          assignedToName: assignedToName 
        } : {})
      };

      console.log('Creating lead with data:', leadData);
      const newLead = await createLead(leadData);

      setLeads(prev => [...prev, newLead]);
      setIsCreateModalOpen(false);
      resetForm();
      showToast('Lead created successfully', 'success');
    } catch (error) {
      console.error('Error creating lead:', error);
      showToast('Error creating lead', 'error');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const updatedLead = await updateLeadStatus(leadId, newStatus);
      if (updatedLead) {
        setLeads(prev => 
          prev.map(lead => 
            lead.id === leadId ? updatedLead : lead
          )
        );
        
        showToast('Lead status updated', 'success');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      showToast('Error updating lead status', 'error');
    }
  };

  const handleCustomerSelect = async (customer: Customer) => {
    console.log('Selected customer:', customer);
    setSelectedCustomer(customer);
    setIsCustomerSelectionModalOpen(false);
    // Small delay to ensure modal transitions smoothly
    setTimeout(() => {
      setIsDealValueModalOpen(true);
    }, 100);
  };

  const handleDealCreation = async () => {
    try {
      setIsLoading(true);
      console.log('Creating deal with:', { selectedLead, selectedCustomer, dealValue });
      
      if (!selectedLead) {
        showToast('No lead selected', 'error');
        return;
      }

      if (!selectedCustomer) {
        showToast('No customer selected', 'error');
        return;
      }

      // Create a new deal from the lead with the selected customer
      const deal = await createDeal({
        title: `Deal for ${selectedCustomer.name}`,
        description: `Deal created from lead for ${selectedCustomer.name}${selectedCustomer.companyName ? ` (${selectedCustomer.companyName})` : ''}`,
        leadId: selectedLead.id,
        customerId: selectedCustomer.id,
        stage: 'qualification',
        value: dealValue,
        expectedCloseDate: new Date().toISOString(),
        customer: {
          name: selectedCustomer.name,
          email: selectedCustomer.email || selectedLead.email,
          phone: selectedCustomer.phone || selectedLead.phone,
          company: selectedCustomer.companyName || '',
          address: selectedCustomer.address || '',
          designation: selectedCustomer.designation || 'N/A'
        },
        probability: 0,
        createdBy: user?.id || '',
        assignedTo: selectedLead.assignedTo || user?.id || ''
      });

      console.log('Deal created successfully:', deal);
      
      // Update lead status to converted
      await updateLeadStatus(selectedLead.id, 'converted');
      
      // Update local state
      setLeads(prev => 
        prev.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, status: 'converted' }
            : lead
        )
      );

      // Show success message
      showToast('Lead converted to deal successfully', 'success');

      // Reset state and close modals
      setIsDealValueModalOpen(false);
      setIsCustomerSelectionModalOpen(false);
      setSelectedLead(null);
      setSelectedCustomer(null);
      setDealValue(0);
      
      // Navigate to deals page
      navigate('/deals');
    } catch (error) {
      console.error('Error converting lead to deal:', error);
      showToast('Error converting lead to deal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToDeal = async (lead: Lead) => {
    if (lead.status !== 'qualified') {
      showToast('Only qualified leads can be converted to deals', 'warning');
      return;
    }
    setSelectedLead(lead);
    setIsCustomerSelectionModalOpen(true);
  };
  const handleAssignmentChange = async (leadId: string, salesAgentId: string) => {
    try {
      // Handle unassignment case (empty string)
      if (salesAgentId === '') {
        console.log('Unassigning lead', leadId);
        const updatedLead = await updateLeadAssignment(leadId, '', 'Unassigned');
        if (updatedLead) {
          setLeads(prev => 
            prev.map(lead => 
              lead.id === leadId ? updatedLead : lead
            )
          );
          showToast('Lead unassigned successfully', 'success');
        }
        return;
      }
      
      // Handle assignment to a sales agent
      const selectedAgent = salesAgents.find(agent => agent.id === salesAgentId);
      if (!selectedAgent) {
        showToast('Selected sales agent not found', 'error');
        return;
      }

      const updatedLead = await updateLeadAssignment(leadId, salesAgentId, selectedAgent.name);
      if (updatedLead) {
        setLeads(prev => 
          prev.map(lead => 
            lead.id === leadId ? updatedLead : lead
          )
        );
        showToast('Lead assignment updated', 'success');
      }
    } catch (error) {
      console.error('Error updating lead assignment:', error);
      showToast('Error updating lead assignment', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      machineryType: '',
      location: '',
      startDate: today,
      rentalDays: '',
      shiftTiming: 'day',
      notes: '',
      assignedTo: '',
      designation: '',
    });
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Display warning if mock data is being used */}
      <MockDataWarning data={leads} dataType="leads" />
      
      <Card>
        <CardHeader>
          {/* Title and Add Button Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">Leads Pipeline</CardTitle>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="whitespace-nowrap self-start sm:self-auto"
              leftIcon={<Plus className="h-4 w-4" />}
              variant="accent"
            >
              Add Lead
            </Button>
          </div>
                    {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/50 rounded-xl border border-gray-200/60 shadow-sm relative z-10">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 min-w-0 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="relative z-20 w-full sm:w-[180px] flex-shrink-0">
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as LeadStatus | 'all')}
                options={[
                  { value: 'all', label: 'All Status' },
                  ...LEAD_STATUS_OPTIONS
                ]}
                className="w-full bg-white border-gray-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No leads found. Create a new lead to get started.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200/60 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {lead.customerName || 'Unknown Customer'}
                          </div>
                          {lead.companyName && (
                            <div className="text-sm text-gray-500">{lead.companyName}</div>
                          )}
                          {!lead.customerName && !lead.companyName && lead.id && (
                            <div className="text-xs text-gray-400">ID: {lead.id.substring(0, 8)}...</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {lead.serviceNeeded || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {lead.siteLocation || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          value={lead.status}
                          onChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                          options={LEAD_STATUS_OPTIONS}
                          className="min-w-[130px]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">                        {user?.role === 'admin' ? (
                          <Select
                            value={lead.assignedTo || ''}
                            onChange={(value) => handleAssignmentChange(lead.id, value)}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...salesAgents.map(agent => ({
                                value: agent.id,
                                label: agent.name,
                              }))
                            ]}
                            className="min-w-[160px]"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {!lead.assignedTo || lead.assignedTo === '' ? 'Unassigned' : (lead.assignedToName || 'Unassigned')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {lead.status === 'qualified' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToDeal(lead)}
                              leftIcon={<ArrowRight size={16} />}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              Convert to Deal
                            </Button>
                          )}
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

      {/* Create Lead Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Lead"
        size="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-6">
          <RequiredFieldsInfo />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />

            <FormInput
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              helperText="Optional"
            />

            <FormInput
              label="Phone Number"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              required
            />

            <FormInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />

            <Select
              label="Type of Machinery Needed"
              options={[
                { value: '', label: 'Select Machinery Type' },
                ...MACHINERY_OPTIONS
              ]}
              value={formData.machineryType}
              onChange={(value) => setFormData(prev => ({ ...prev, machineryType: value }))}
              required
            />

            <FormInput
              label="Site Location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />

            <FormInput
              label="Start Date"
              type="date"
              value={formData.startDate}
              min={today}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />

            <FormInput
              label="Number of Rental Days"
              type="number"
              min="1"
              value={formData.rentalDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                setFormData(prev => ({ ...prev, rentalDays: value.toString() }));
              }}
              required
            />

            <Select
              label="Shift Timing"
              options={SHIFT_OPTIONS}
              value={formData.shiftTiming}
              onChange={(value) => setFormData(prev => ({ ...prev, shiftTiming: value }))}
              required
            />

            <FormInput
              label="Designation"
              value={formData.designation}
              onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="Enter designation"
              helperText="Optional"
            />

            {/* Only show sales agent assignment for admin users */}
            {user?.role === 'admin' && (
              <Select
                label="Assign To"
                options={[
                  { value: '', label: 'Select Sales Agent' },
                  ...salesAgents.map(agent => ({
                    value: agent.id,
                    label: agent.name,
                  }))
                ]}
                value={formData.assignedTo}
                onChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                required
              />
            )}
          </div>

          <TextArea
            label="Additional Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>            <Button type="submit" variant="accent">
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={isCustomerSelectionModalOpen}
        onClose={() => {
          setIsCustomerSelectionModalOpen(false);
          setSelectedLead(null);
          setSelectedCustomer(null);
          setDealValue(0);
        }}
        onSelect={handleCustomerSelect}
        initialCustomerData={selectedLead ? {
          name: selectedLead.customerName,
          email: selectedLead.email,
          phone: selectedLead.phone,
          companyName: selectedLead.companyName,
          designation: selectedLead.designation,
        } : undefined}
      />

      {/* Deal Value Modal */}
      <Modal
        isOpen={isDealValueModalOpen}
        onClose={() => {
          setIsDealValueModalOpen(false);
          setSelectedLead(null);
          setSelectedCustomer(null);
          setDealValue(0);
        }}
        title="Enter Deal Value"
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            label="Deal Value"
            type="number"
            value={dealValue === 0 ? '' : dealValue}
            onChange={(e) => {
              const value = e.target.value;
              setDealValue(value === '' ? 0 : Number(value));
            }}
            placeholder="Enter deal value"
            helperText="Leave empty if deal value is not yet determined"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDealValueModalOpen(false);
                setSelectedLead(null);
                setSelectedCustomer(null);
                setDealValue(0);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDealCreation} variant="accent">
              Create Deal
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