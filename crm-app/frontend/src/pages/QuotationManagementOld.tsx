import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Save,
  X,
  Printer,
  Calculator,
  Users,
  Clock,
  DollarSign,
  Settings,
  FileText,
  CheckCircle,
  Trash2,
  Building2,
  Phone,
  Calendar,
  Zap
} from 'lucide-react';

// Types
interface Quotation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  machineType: string;
  orderType: 'micro' | 'small' | 'monthly' | 'yearly';
  numberOfDays: number;
  workingHours: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  foodResources: number;
  accomResources: number;
  mobDemob: number;
  totalCost: number;
  workingCost: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  notes?: string;
}

interface NewQuotationForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  customerAddress: string;
  machineType: string;
  orderType: 'micro' | 'small' | 'monthly' | 'yearly';
  numberOfDays: number;
  workingHours: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  foodResources: number;
  accomResources: number;
  mobDemob: number;
  notes: string;
}

const MACHINE_TYPES = [
  { value: 'mobile_crane', label: 'Mobile Crane', baseRate: 4000 },
  { value: 'tower_crane', label: 'Tower Crane', baseRate: 3500 },
  { value: 'crawler_crane', label: 'Crawler Crane', baseRate: 5000 },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane', baseRate: 3000 },
];

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro (1-3 days)', multiplier: 1.0 },
  { value: 'small', label: 'Small (4-15 days)', multiplier: 0.9 },
  { value: 'monthly', label: 'Monthly (16-30 days)', multiplier: 0.8 },
  { value: 'yearly', label: 'Yearly (30+ days)', multiplier: 0.7 },
];

const USAGE_TYPES = [
  { value: 'normal', label: 'Normal Usage', multiplier: 1.0 },
  { value: 'heavy', label: 'Heavy Usage', multiplier: 1.2 },
];

const RISK_FACTORS = [
  { value: 'low', label: 'Low Risk', multiplier: 1.0 },
  { value: 'medium', label: 'Medium Risk', multiplier: 1.1 },
  { value: 'high', label: 'High Risk', multiplier: 1.25 },
];

export function QuotationManagementOld() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NewQuotationForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    customerAddress: '',
    machineType: '',
    orderType: 'micro',
    numberOfDays: 1,
    workingHours: 8,
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    foodResources: 0,
    accomResources: 0,
    mobDemob: 0,
    notes: ''
  });

  // Calculated values
  const [calculatedCost, setCalculatedCost] = useState({
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    totalCost: 0,
    gstAmount: 0,
    grandTotal: 0
  });

  // Fetch quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotations');
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        const transformedQuotations: Quotation[] = result.data.map((item: any) => ({
          id: item.id,
          customerName: item.customer_name || item.customerName,
          customerEmail: item.customer_email || item.customerEmail,
          customerPhone: item.customer_phone || item.customerPhone,
          customerCompany: item.customer_company || item.customerCompany,
          customerAddress: item.customer_address || item.customerAddress,
          machineType: item.machine_type || item.machineType,
          orderType: item.order_type || item.orderType,
          numberOfDays: item.number_of_days || item.numberOfDays,
          workingHours: item.working_hours || item.workingHours,
          siteDistance: item.site_distance || item.siteDistance,
          usage: item.usage || 'normal',
          riskFactor: item.risk_factor || item.riskFactor || 'low',
          foodResources: item.food_resources || item.foodResources || 0,
          accomResources: item.accom_resources || item.accomResources || 0,
          mobDemob: item.mob_demob || item.mobDemob || 0,
          totalCost: item.total_cost || item.totalCost,
          workingCost: item.working_cost || item.workingCost || 0,
          status: item.status,
          createdAt: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          validUntil: item.valid_until || item.validUntil,
          notes: item.notes || ''
        }));
        setQuotations(transformedQuotations);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate costs
  const calculateCosts = () => {
    const machine = MACHINE_TYPES.find(m => m.value === formData.machineType);
    if (!machine) {
      setCalculatedCost({
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        totalCost: 0,
        gstAmount: 0,
        grandTotal: 0
      });
      return;
    }

    const orderType = ORDER_TYPES.find(o => o.value === formData.orderType);
    const usage = USAGE_TYPES.find(u => u.value === formData.usage);
    const risk = RISK_FACTORS.find(r => r.value === formData.riskFactor);

    const baseRate = machine.baseRate;
    const totalHours = formData.numberOfDays * formData.workingHours;
    
    let workingCost = baseRate * totalHours;
    workingCost *= orderType?.multiplier || 1;
    workingCost *= usage?.multiplier || 1;
    workingCost *= risk?.multiplier || 1;

    const mobDemobCost = formData.siteDistance > 0 
      ? (formData.siteDistance * 50 * 2) + 5000 // ₹50/km both ways + base cost
      : formData.mobDemob;

    const foodAccomCost = (formData.foodResources * 500 * formData.numberOfDays) + 
                         (formData.accomResources * 800 * formData.numberOfDays);

    const totalCost = workingCost + mobDemobCost + foodAccomCost;
    const gstAmount = totalCost * 0.18;
    const grandTotal = totalCost + gstAmount;

    setCalculatedCost({
      workingCost,
      mobDemobCost,
      foodAccomCost,
      totalCost,
      gstAmount,
      grandTotal
    });
  };

  // Save quotation
  const handleSave = async () => {
    if (!formData.customerName || !formData.machineType) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const quotationData = {
        ...formData,
        totalCost: calculatedCost.grandTotal,
        workingCost: calculatedCost.workingCost,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      let response;
      if (editingQuotation) {
        response = await fetch(`/api/quotations/${editingQuotation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotationData)
        });
      } else {
        response = await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotationData)
        });
      }

      if (response.ok) {
        setShowForm(false);
        setEditingQuotation(null);
        resetForm();
        fetchQuotations();
        alert(editingQuotation ? 'Quotation updated successfully!' : 'Quotation created successfully!');
      } else {
        throw new Error('Failed to save quotation');
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Error saving quotation');
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      customerAddress: '',
      machineType: '',
      orderType: 'micro',
      numberOfDays: 1,
      workingHours: 8,
      siteDistance: 0,
      usage: 'normal',
      riskFactor: 'low',
      foodResources: 0,
      accomResources: 0,
      mobDemob: 0,
      notes: ''
    });
  };

  // Edit quotation
  const handleEdit = (quotation: Quotation) => {
    setFormData({
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail || '',
      customerPhone: quotation.customerPhone || '',
      customerCompany: quotation.customerCompany || '',
      customerAddress: quotation.customerAddress || '',
      machineType: quotation.machineType,
      orderType: quotation.orderType,
      numberOfDays: quotation.numberOfDays,
      workingHours: quotation.workingHours,
      siteDistance: quotation.siteDistance,
      usage: quotation.usage,
      riskFactor: quotation.riskFactor,
      foodResources: quotation.foodResources,
      accomResources: quotation.accomResources,
      mobDemob: quotation.mobDemob,
      notes: quotation.notes || ''
    });
    setEditingQuotation(quotation);
    setShowForm(true);
  };

  // Delete quotation
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchQuotations();
        alert('Quotation deleted successfully');
      } else {
        throw new Error('Failed to delete quotation');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Error deleting quotation');
    }
  };

  // Print quotation
  const handlePrint = (quotation: Quotation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const machine = MACHINE_TYPES.find(m => m.value === quotation.machineType);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation ${quotation.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .company-tagline { font-size: 14px; color: #666; margin-bottom: 15px; }
            .quotation-title { font-size: 22px; margin: 10px 0; color: #1e40af; }
            .quotation-id { font-size: 16px; color: #666; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
            .section { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }
            .section h3 { margin-top: 0; color: #1e40af; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .field { margin: 12px 0; display: flex; justify-content: space-between; }
            .field strong { color: #333; }
            .cost-breakdown { margin: 30px 0; border: 2px solid #1e40af; border-radius: 8px; overflow: hidden; }
            .cost-header { background: #1e40af; color: white; padding: 15px; font-size: 18px; font-weight: bold; }
            .cost-body { padding: 20px; }
            .cost-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .cost-total { font-size: 20px; font-weight: bold; color: #1e40af; margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e40af; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">ASP CRANES</div>
            <div class="company-tagline">Professional Crane Services & Equipment Rental</div>
            <div class="quotation-title">QUOTATION</div>
            <div class="quotation-id">Quotation ID: ${quotation.id}</div>
            <div class="quotation-id">Date: ${new Date(quotation.createdAt).toLocaleDateString()}</div>
            <div class="quotation-id">Valid Until: ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A'}</div>
          </div>
          
          <div class="details">
            <div class="section">
              <h3>Customer Information</h3>
              <div class="field"><span>Name:</span><strong>${quotation.customerName}</strong></div>
              <div class="field"><span>Company:</span><strong>${quotation.customerCompany || 'N/A'}</strong></div>
              <div class="field"><span>Email:</span><strong>${quotation.customerEmail || 'N/A'}</strong></div>
              <div class="field"><span>Phone:</span><strong>${quotation.customerPhone || 'N/A'}</strong></div>
              <div class="field"><span>Address:</span><strong>${quotation.customerAddress || 'N/A'}</strong></div>
            </div>
            
            <div class="section">
              <h3>Project Details</h3>
              <div class="field"><span>Equipment:</span><strong>${machine?.label || quotation.machineType}</strong></div>
              <div class="field"><span>Order Type:</span><strong>${ORDER_TYPES.find(o => o.value === quotation.orderType)?.label}</strong></div>
              <div class="field"><span>Duration:</span><strong>${quotation.numberOfDays} days</strong></div>
              <div class="field"><span>Working Hours:</span><strong>${quotation.workingHours} hours/day</strong></div>
              <div class="field"><span>Total Hours:</span><strong>${quotation.numberOfDays * quotation.workingHours} hours</strong></div>
              <div class="field"><span>Site Distance:</span><strong>${quotation.siteDistance} km</strong></div>
              <div class="field"><span>Usage Type:</span><strong>${USAGE_TYPES.find(u => u.value === quotation.usage)?.label}</strong></div>
              <div class="field"><span>Risk Factor:</span><strong>${RISK_FACTORS.find(r => r.value === quotation.riskFactor)?.label}</strong></div>
            </div>
          </div>

          <div class="cost-breakdown">
            <div class="cost-header">Cost Breakdown</div>
            <div class="cost-body">
              <div class="cost-row">
                <span>Working Cost (${quotation.numberOfDays * quotation.workingHours} hours):</span>
                <span>₹${quotation.workingCost.toLocaleString('en-IN')}</span>
              </div>
              <div class="cost-row">
                <span>Transportation (Mob/Demob):</span>
                <span>₹${quotation.mobDemob.toLocaleString('en-IN')}</span>
              </div>
              <div class="cost-row">
                <span>Food & Accommodation:</span>
                <span>₹${((quotation.foodResources * 500) + (quotation.accomResources * 800)) * quotation.numberOfDays}</span>
              </div>
              <div class="cost-row">
                <span>Subtotal:</span>
                <span>₹${(quotation.totalCost / 1.18).toLocaleString('en-IN')}</span>
              </div>
              <div class="cost-row">
                <span>GST (18%):</span>
                <span>₹${(quotation.totalCost - (quotation.totalCost / 1.18)).toLocaleString('en-IN')}</span>
              </div>
              <div class="cost-total">
                <div class="cost-row" style="border: none; font-size: 22px;">
                  <span>Total Amount:</span>
                  <span>₹${quotation.totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          ${quotation.notes ? `
          <div class="section" style="margin-top: 30px;">
            <h3>Additional Notes</h3>
            <p>${quotation.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>ASP Cranes</strong> - Your Trusted Partner for Crane Services</p>
            <p>Thank you for considering our services. Please contact us for any clarifications.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  // Filter quotations
  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.machineType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    calculateCosts();
  }, [formData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading quotations...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Quotation Management
              </h1>
              <p className="text-gray-600 mt-1">Create, manage, and track all your quotations in one place</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingQuotation(null);
                resetForm();
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">New Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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
            <Filter className="h-5 w-5 text-gray-400" />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                <p className="text-3xl font-bold text-gray-900">{quotations.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {quotations.filter(q => q.status === 'sent').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-3xl font-bold text-green-600">
                  {quotations.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{quotations.reduce((sum, q) => sum + q.totalCost, 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quotations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Quotations ({filteredQuotations.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment & Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">#{quotation.id}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(quotation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{quotation.customerName}</div>
                        <div className="text-sm text-gray-500">
                          {quotation.customerCompany && (
                            <div className="flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {quotation.customerCompany}
                            </div>
                          )}
                          {quotation.customerPhone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {quotation.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {MACHINE_TYPES.find(m => m.value === quotation.machineType)?.label || quotation.machineType}
                        </div>
                        <div className="text-sm text-gray-500">
                          {quotation.numberOfDays} days × {quotation.workingHours}h/day
                        </div>
                        <div className="text-sm text-blue-600">
                          {ORDER_TYPES.find(o => o.value === quotation.orderType)?.label}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-lg text-gray-900">
                        ₹{quotation.totalCost.toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Including GST
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(quotation.status)}`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(quotation)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(quotation)}
                          className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Print Quotation"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quotation.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredQuotations.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No quotations found</p>
              <p className="text-gray-400">Create your first quotation to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                  {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter customer name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={formData.customerCompany}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerCompany: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="customer@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={formData.customerAddress}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Complete address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Project Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Machine Type *
                        </label>
                        <select
                          value={formData.machineType}
                          onChange={(e) => setFormData(prev => ({ ...prev, machineType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select machine type</option>
                          {MACHINE_TYPES.map(machine => (
                            <option key={machine.value} value={machine.value}>
                              {machine.label} (₹{machine.baseRate}/hr)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order Type
                        </label>
                        <select
                          value={formData.orderType}
                          onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {ORDER_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Days
                        </label>
                        <input
                          type="number"
                          value={formData.numberOfDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, numberOfDays: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Working Hours/Day
                        </label>
                        <input
                          type="number"
                          value={formData.workingHours}
                          onChange={(e) => setFormData(prev => ({ ...prev, workingHours: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="24"
                          placeholder="8"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site Distance (km)
                        </label>
                        <input
                          type="number"
                          value={formData.siteDistance}
                          onChange={(e) => setFormData(prev => ({ ...prev, siteDistance: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manual Mob/Demob Cost
                        </label>
                        <input
                          type="number"
                          value={formData.mobDemob}
                          onChange={(e) => setFormData(prev => ({ ...prev, mobDemob: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Usage Type
                        </label>
                        <select
                          value={formData.usage}
                          onChange={(e) => setFormData(prev => ({ ...prev, usage: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {USAGE_TYPES.map(usage => (
                            <option key={usage.value} value={usage.value}>
                              {usage.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Risk Factor
                        </label>
                        <select
                          value={formData.riskFactor}
                          onChange={(e) => setFormData(prev => ({ ...prev, riskFactor: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {RISK_FACTORS.map(risk => (
                            <option key={risk.value} value={risk.value}>
                              {risk.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Food Resources (People)
                        </label>
                        <input
                          type="number"
                          value={formData.foodResources}
                          onChange={(e) => setFormData(prev => ({ ...prev, foodResources: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Accommodation (People)
                        </label>
                        <input
                          type="number"
                          value={formData.accomResources}
                          onChange={(e) => setFormData(prev => ({ ...prev, accomResources: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Any additional notes or terms..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        Cost Summary
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Working Cost:</span>
                          <span className="font-semibold">₹{calculatedCost.workingCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Transportation:</span>
                          <span className="font-semibold">₹{calculatedCost.mobDemobCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Food & Accommodation:</span>
                          <span className="font-semibold">₹{calculatedCost.foodAccomCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₹{calculatedCost.totalCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600">GST (18%):</span>
                          <span className="font-semibold">₹{calculatedCost.gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-blue-600 text-white rounded-lg px-4 mt-4">
                          <span className="font-semibold">Grand Total:</span>
                          <span className="text-xl font-bold">₹{calculatedCost.grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {formData.numberOfDays > 0 && formData.workingHours > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="text-gray-600">
                            <div>Total Hours: {formData.numberOfDays * formData.workingHours}</div>
                            <div>Rate per Hour: ₹{formData.machineType && MACHINE_TYPES.find(m => m.value === formData.machineType)?.baseRate.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.customerName || !formData.machineType}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingQuotation ? 'Update Quotation' : 'Create Quotation'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationManagementOld;
