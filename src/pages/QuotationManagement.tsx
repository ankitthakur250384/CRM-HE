import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Send,
  Eye,
  Edit2,
  Trash2,
  FileText,
  IndianRupee,
  Calendar,
  User,
  Building2,
  X,
  Clock,
  MapPin,
  Truck,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import { TemplatePreview } from '../components/quotations/TemplatePreview';
import { useAuthStore } from '../store/authStore';
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { Deal } from '../types/deal';
import { getQuotations } from '../services/quotationService';
import { getDeals, getDealById } from '../services/dealService';
import { getDefaultTemplateConfig, getTemplateById } from '../services/configService';
import { mergeQuotationWithTemplate } from '../utils/templateMerger';
import { formatCurrency } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

export function QuotationManagement() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [defaultTemplate, setDefaultTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [isEditingQuotation, setIsEditingQuotation] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [quotationsData, dealsData] = await Promise.all([
        getQuotations(),
        getDeals()
      ]);
      
      setQuotations(quotationsData);
      
      // Filter deals to only show qualified ones
      const qualifiedDeals = dealsData.filter(deal => 
        deal.stage === 'qualification' || deal.stage === 'proposal'
      );
      setDeals(qualifiedDeals);

      // Load default template
      await loadDefaultTemplate();
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load quotations. Please try again.');
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      const config = await getDefaultTemplateConfig();
      if (config.defaultTemplateId) {
        const template = await getTemplateById(config.defaultTemplateId);
        setDefaultTemplate(template);
      }
    } catch (error) {
      console.error('Error loading default template:', error);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];

    if (searchTerm) {
      filtered = filtered.filter(quotation =>
        (quotation.customerContact?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.customerContact?.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quotation.selectedEquipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === statusFilter);
    }

    setFilteredQuotations(filtered);
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleCreateQuotation = () => {
    if (deals.length === 0) {
      showToast('No qualified deals available', 'warning', 'Create and qualify deals first to generate quotations.');
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleProceedWithDeal = () => {
    if (!selectedDealId) {
      showToast('Please select a deal', 'warning');
      return;
    }

    // Navigate to quotation creation with the selected deal
    navigate(`/quotations/create?dealId=${selectedDealId}`);
    
    setSelectedDealId('');
  };

  const handleEditQuotation = async (quotation: Quotation) => {
    try {
      setIsEditingQuotation(quotation.id);
      console.log('Editing quotation:', quotation);
      
      if (!quotation.leadId) {
        showToast('Invalid quotation data', 'error', 'Missing lead ID');
        return;
      }

      // Verify that the deal still exists
      const deal = await getDealById(quotation.leadId);
      if (!deal) {
        showToast('Associated deal not found', 'error', 'The deal associated with this quotation no longer exists');
        return;
      }

      console.log('Navigating to:', `/quotations/create?dealId=${quotation.leadId}&quotationId=${quotation.id}`);
      navigate(`/quotations/create?dealId=${quotation.leadId}&quotationId=${quotation.id}`);
    } catch (error) {
      console.error('Error preparing quotation edit:', error);
      showToast('Error preparing quotation edit', 'error');
    } finally {
      setIsEditingQuotation(null);
    }
  };

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      setIsGeneratingPDF(true);
      
      if (!defaultTemplate) {
        showToast('No default template configured', 'warning', 'Please set a default template in Configuration settings.');
        return;
      }

      // Use the template merger utility to get the merged content
      const content = mergeQuotationWithTemplate(quotation, defaultTemplate);
      
      // Create a new window with the content for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Popup blocked', 'error', 'Please allow popups to download PDF.');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quotation - ${quotation.customerContact?.name || 'Customer'}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
      
      showToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendToCustomer = async (quotation: Quotation) => {
    try {
      setIsSendingEmail(true);
      
      if (!defaultTemplate) {
        showToast('No default template configured', 'warning', 'Please set a default template in Configuration settings.');
        return;
      }

      // Use the template merger utility
      const content = mergeQuotationWithTemplate(quotation, defaultTemplate);
      
      // Create mailto link with the quotation content
      const subject = `Quotation from ASP Cranes - ${quotation.id.slice(0, 8).toUpperCase()}`;
      const emailBody = `Dear ${quotation.customerContact.name || 'Customer'},

Please find your quotation details for ${quotation.selectedEquipment.name} below:

${content}

Best regards,
ASP Cranes Team`;
      
      const mailtoLink = `mailto:${quotation.customerContact.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink);
      
      showToast('Email prepared successfully', 'success', 'Your email client should open with the quotation details.');
    } catch (error) {
      console.error('Error sending to customer:', error);
      showToast('Error preparing email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Transform deals into select options
  const dealOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a qualified deal...' },
      ...deals.map(deal => ({
        value: deal.id,
        label: `${deal.customer.name} - ${deal.customer.company} (${formatCurrency(deal.value)})`
      }))
    ];
  }, [deals]);

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Quotation Management</h1>
          <Button 
            onClick={handleCreateQuotation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Quotation
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              name="quotation_search"
              id="quotation_search"
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              disabled={isLoading}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              leftIcon={<Filter className="w-4 h-4" />}
              disabled={isLoading}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quotation History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <X className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No quotations found</p>
                <p className="text-sm">Create a new quotation to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Rent
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotations.map((quotation) => (
                      <tr key={quotation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {quotation.customerContact.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {quotation.customerContact.company}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{quotation.selectedEquipment.name}</div>
                          <div className="text-sm text-gray-500">{quotation.machineType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{quotation.numberOfDays} days</div>
                          <div className="text-sm text-gray-500">{quotation.workingHours} hrs/day</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(quotation.totalRent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={quotation.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditQuotation(quotation)}
                              title="Edit Quotation"
                              disabled={isLoading || isEditingQuotation === quotation.id}
                            >
                              {isEditingQuotation === quotation.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Edit2 size={16} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setIsPreviewOpen(true);
                              }}
                              title="Preview Quotation"
                              disabled={!defaultTemplate || isLoading}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(quotation)}
                              disabled={isGeneratingPDF || !defaultTemplate || isLoading}
                              title="Download PDF"
                            >
                              {isGeneratingPDF ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendToCustomer(quotation)}
                              disabled={isSendingEmail || !defaultTemplate || isLoading}
                              title="Send to Customer"
                            >
                              {isSendingEmail ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Send size={16} />
                              )}
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

        {/* Create Quotation Modal - Deal Selection */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedDealId('');
          }}
          title="Create New Quotation"
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select a Qualified Deal
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose from qualified deals to create a quotation. Only deals in qualification or proposal stage are shown.
              </p>
            
              <Select
                options={isLoading ? [{ value: '', label: 'Loading deals...' }] : dealOptions}
                value={selectedDealId}
                onChange={setSelectedDealId}
                className="w-full"
                label="Available Deals"
                disabled={isLoading}
              />
              
              {selectedDealId && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const selectedDeal = deals.find(d => d.id === selectedDealId);
                    if (!selectedDeal) return null;
                    
                    return (
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900">Selected Deal Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">Customer:</span>
                            <p className="text-blue-800">{selectedDeal.customer.name}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Company:</span>
                            <p className="text-blue-800">{selectedDeal.customer.company}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Value:</span>
                            <p className="text-blue-800">{formatCurrency(selectedDeal.value)}</p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Stage:</span>
                            <p className="text-blue-800 capitalize">{selectedDeal.stage}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSelectedDealId('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedWithDeal}
                disabled={!selectedDealId || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Quotation
              </Button>
            </div>
          </div>
        </Modal>

        {/* Template Preview Modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Quotation Preview"
          size="full"
        >
          {selectedQuotation && defaultTemplate && (
            <TemplatePreview
              quotation={selectedQuotation}
              template={defaultTemplate}
              onDownloadPDF={() => handleDownloadPDF(selectedQuotation)}
              onSendEmail={() => handleSendToCustomer(selectedQuotation)}
            />
          )}
        </Modal>

        {toast.show && (
          <Toast
            title={toast.title}
            variant={toast.variant}
            isVisible={toast.show}
            onClose={() => setToast({ show: false, title: '' })}
          />
        )}
      </div>
    </div>
  );
}