import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  MoreVertical,
  Calendar,
  Phone,
  Wrench,
  Clock,
  DollarSign,
  Download,
  Printer,
  Mail,
  FileText
} from 'lucide-react';
import SuiteCRMQuotationSystem from './SuiteCRMQuotationSystem';

interface QuotationListItem {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  total_cost: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  site_distance?: number;
  usage?: string;
  shift?: string;
  food_resources?: string;
  accom_resources?: string;
  risk_factor?: string;
  mob_demob_cost?: number;
  working_cost?: number;
  food_accom_cost?: number;
  gst_amount?: number;
  total_rent?: number;
}

const QuotationManagementComplete: React.FC = () => {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sample data for demonstration
  const sampleQuotations: QuotationListItem[] = [
    {
      id: 'QT-2024-001',
      customer_name: 'ABC Construction Ltd.',
      customer_email: 'contact@abcconstruction.com',
      customer_phone: '+91-9876543210',
      customer_address: '123 Industrial Area, Delhi - 110001',
      machine_type: 'Mobile Crane 50T',
      order_type: 'Rental',
      number_of_days: 7,
      working_hours: 8,
      total_cost: 175000,
      status: 'sent',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      site_distance: 45,
      usage: 'Construction',
      shift: 'Day Shift',
      food_resources: 'Client Provided',
      accom_resources: 'Client Provided',
      risk_factor: 'Medium',
      mob_demob_cost: 15000,
      working_cost: 140000,
      food_accom_cost: 0,
      gst_amount: 20000,
      total_rent: 155000
    },
    {
      id: 'QT-2024-002',
      customer_name: 'XYZ Infrastructure Pvt Ltd',
      customer_email: 'projects@xyzinfra.com',
      customer_phone: '+91-9876543211',
      customer_address: '456 Tech Park, Mumbai - 400001',
      machine_type: 'Tower Crane 60T',
      order_type: 'Rental',
      number_of_days: 30,
      working_hours: 12,
      total_cost: 850000,
      status: 'draft',
      created_at: '2024-01-14T14:20:00Z',
      updated_at: '2024-01-14T14:20:00Z',
      site_distance: 25,
      usage: 'High-rise Construction',
      shift: 'Double Shift',
      food_resources: 'ASP Provided',
      accom_resources: 'ASP Provided',
      risk_factor: 'High',
      mob_demob_cost: 50000,
      working_cost: 650000,
      food_accom_cost: 50000,
      gst_amount: 100000,
      total_rent: 700000
    },
    {
      id: 'QT-2024-003',
      customer_name: 'Metro Railway Corporation',
      customer_email: 'procurement@metrorail.com',
      customer_phone: '+91-9876543212',
      customer_address: '789 Metro Bhawan, Kolkata - 700001',
      machine_type: 'Crawler Crane 100T',
      order_type: 'Long-term Rental',
      number_of_days: 90,
      working_hours: 16,
      total_cost: 2850000,
      status: 'accepted',
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-12T16:45:00Z',
      site_distance: 15,
      usage: 'Metro Construction',
      shift: 'Round the Clock',
      food_resources: 'Client Provided',
      accom_resources: 'ASP Provided',
      risk_factor: 'Very High',
      mob_demob_cost: 100000,
      working_cost: 2300000,
      food_accom_cost: 150000,
      gst_amount: 300000,
      total_rent: 2400000
    },
    {
      id: 'QT-2024-004',
      customer_name: 'Green Energy Solutions',
      customer_email: 'ops@greenenergy.in',
      customer_phone: '+91-9876543213',
      customer_address: '321 Solar Park, Rajasthan - 342001',
      machine_type: 'All Terrain Crane 80T',
      order_type: 'Project Rental',
      number_of_days: 45,
      working_hours: 10,
      total_cost: 1250000,
      status: 'rejected',
      created_at: '2024-01-08T11:00:00Z',
      updated_at: '2024-01-09T10:30:00Z',
      site_distance: 120,
      usage: 'Wind Farm Setup',
      shift: 'Day Shift',
      food_resources: 'Client Provided',
      accom_resources: 'Client Provided',
      risk_factor: 'Medium',
      mob_demob_cost: 80000,
      working_cost: 950000,
      food_accom_cost: 0,
      gst_amount: 220000,
      total_rent: 1030000
    },
    {
      id: 'QT-2024-005',
      customer_name: 'Shipyard Industries Ltd',
      customer_email: 'contracts@shipyard.co.in',
      customer_phone: '+91-9876543214',
      customer_address: '654 Port Area, Chennai - 600001',
      machine_type: 'Floating Crane 150T',
      order_type: 'Specialized Rental',
      number_of_days: 14,
      working_hours: 8,
      total_cost: 980000,
      status: 'sent',
      created_at: '2024-01-12T13:45:00Z',
      updated_at: '2024-01-12T13:45:00Z',
      site_distance: 35,
      usage: 'Ship Building',
      shift: 'Day Shift',
      food_resources: 'ASP Provided',
      accom_resources: 'ASP Provided',
      risk_factor: 'High',
      mob_demob_cost: 120000,
      working_cost: 700000,
      food_accom_cost: 80000,
      gst_amount: 80000,
      total_rent: 780000
    }
  ];

  useEffect(() => {
    setQuotations(sampleQuotations);
  }, []);

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.machine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const currentQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleQuickAction = (action: string, quotationId: string) => {
    switch (action) {
      case 'view':
        setSelectedQuotation(quotationId);
        break;
      case 'edit':
        console.log('Edit quotation:', quotationId);
        break;
      case 'duplicate':
        console.log('Duplicate quotation:', quotationId);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this quotation?')) {
          setQuotations(prev => prev.filter(q => q.id !== quotationId));
        }
        break;
    }
  };

  const handleCreateNew = () => {
    const newId = `QT-2024-${String(quotations.length + 1).padStart(3, '0')}`;
    setSelectedQuotation(newId);
  };

  if (selectedQuotation) {
    const quotationData = quotations.find(q => q.id === selectedQuotation);
    return (
      <SuiteCRMQuotationSystem
        quotationId={selectedQuotation}
        quotationData={quotationData}
        onClose={() => setSelectedQuotation(null)}
      />
    );
  }

  return (
    <div className="quotation-management-complete bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
              <p className="text-gray-600 mt-1">Manage and track all your quotations</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold text-gray-900">{quotations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {quotations.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {quotations.filter(q => q.status === 'sent').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{quotations.reduce((sum, q) => sum + q.total_cost, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Quotations ({filteredQuotations.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {currentQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.id}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(quotation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.customer_name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {quotation.customer_phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.machine_type}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Wrench className="h-3 w-3 mr-1" />
                          {quotation.order_type}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.number_of_days} days</div>
                        <div className="text-sm text-gray-500">
                          {quotation.working_hours}h/day
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">
                        ₹{quotation.total_cost.toLocaleString('en-IN')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuickAction('view', quotation.id)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="View Quotation"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleQuickAction('edit', quotation.id)}
                          className="text-gray-600 hover:text-gray-700 p-1 rounded"
                          title="Edit Quotation"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-700 p-1 rounded"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="text-purple-600 hover:text-purple-700 p-1 rounded"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          className="text-orange-600 hover:text-orange-700 p-1 rounded"
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleQuickAction('duplicate', quotation.id)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => handleQuickAction('delete', quotation.id)}
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagementComplete;
