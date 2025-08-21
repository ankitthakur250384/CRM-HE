import React, { useState, useEffect } from 'react';
import { Eye, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import QuotationPreviewPrint from '../components/quotations/QuotationPreviewPrint';

interface Quotation {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  total_cost: number;
  status: string;
  created_at: string;
  customerContact?: {
    name: string;
    email?: string;
    phone?: string;
  };
  totalCost?: number;
  createdAt: string;
}

const QuotationManagementSimple: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data for demonstration
  const sampleQuotations: Quotation[] = [
    {
      id: "Q001",
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+91-9876543210",
      machine_type: "Mobile Crane",
      order_type: "Rental",
      number_of_days: 5,
      working_hours: 8,
      total_cost: 50000,
      status: "draft",
      created_at: new Date().toISOString(),
      customerContact: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+91-9876543210"
      },
      totalCost: 50000,
      createdAt: new Date().toISOString()
    },
    {
      id: "Q002",
      customer_name: "Jane Smith",
      customer_email: "jane@example.com",
      customer_phone: "+91-9876543211",
      machine_type: "Tower Crane",
      order_type: "Rental",
      number_of_days: 10,
      working_hours: 8,
      total_cost: 120000,
      status: "sent",
      created_at: new Date().toISOString(),
      customerContact: {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+91-9876543211"
      },
      totalCost: 120000,
      createdAt: new Date().toISOString()
    },
    {
      id: "Q003",
      customer_name: "Tech Solutions Ltd",
      customer_email: "contact@techsolutions.com",
      customer_phone: "+91-9876543212",
      machine_type: "Hydraulic Crane",
      order_type: "Purchase",
      number_of_days: 1,
      working_hours: 8,
      total_cost: 2500000,
      status: "accepted",
      created_at: new Date().toISOString(),
      customerContact: {
        name: "Tech Solutions Ltd",
        email: "contact@techsolutions.com",
        phone: "+91-9876543212"
      },
      totalCost: 2500000,
      createdAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setQuotations(sampleQuotations);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredQuotations = quotations.filter(quotation =>
    quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.machine_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePreviewQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsPreviewOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-gray-600 mt-1">Manage and preview your quotations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quotations ({filteredQuotations.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading quotations...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{quotation.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quotation.customer_name}
                          </div>
                          {quotation.customer_email && (
                            <div className="text-sm text-gray-500">
                              {quotation.customer_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quotation.machine_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{quotation.total_cost.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                          {quotation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handlePreviewQuotation(quotation)}
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredQuotations.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No quotations found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {isPreviewOpen && selectedQuotation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  Quotation Preview - #{selectedQuotation.id}
                </h3>
                <Button
                  onClick={() => setIsPreviewOpen(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
              <div className="p-6 h-full overflow-auto">
                <QuotationPreviewPrint
                  quotationId={selectedQuotation.id}
                  quotationData={selectedQuotation}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationManagementSimple;
