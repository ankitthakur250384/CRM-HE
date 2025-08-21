import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Calculator,
  Building,
  Truck,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface NewQuotationBuilderProps {
  onClose: () => void;
  onSave: () => void;
  dealId?: string;
  quotationData?: any;
}

interface QuotationFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  machineType: string;
  orderType: string;
  numberOfDays: number;
  workingHours: number;
  siteDistance: number;
  usage: string;
  shift: string;
  foodResources: string;
  accomResources: string;
  riskFactor: string;
  extraCharge: number;
  notes: string;
}

const initialFormData: QuotationFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  machineType: 'mobile_crane',
  orderType: 'rental',
  numberOfDays: 1,
  workingHours: 8,
  siteDistance: 0,
  usage: 'Construction',
  shift: 'Day Shift',
  foodResources: 'Client Provided',
  accomResources: 'Client Provided',
  riskFactor: 'Medium',
  extraCharge: 0,
  notes: ''
};

const equipmentOptions = [
  { value: 'mobile_crane', label: 'Mobile Crane', baseRate: 4000 },
  { value: 'tower_crane', label: 'Tower Crane', baseRate: 5500 },
  { value: 'crawler_crane', label: 'Crawler Crane', baseRate: 6000 },
  { value: 'all_terrain_crane', label: 'All Terrain Crane', baseRate: 5000 },
  { value: 'floating_crane', label: 'Floating Crane', baseRate: 7000 },
];

const orderTypeOptions = [
  { value: 'rental', label: 'Rental', multiplier: 1 },
  { value: 'long_term_rental', label: 'Long-term Rental', multiplier: 0.9 },
  { value: 'project_rental', label: 'Project Rental', multiplier: 0.95 },
  { value: 'specialized_rental', label: 'Specialized Rental', multiplier: 1.2 },
];

const NewQuotationBuilder: React.FC<NewQuotationBuilderProps> = ({ 
  onClose, 
  onSave, 
  dealId, 
  quotationData 
}) => {
  const [formData, setFormData] = useState<QuotationFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDeal, setLoadingDeal] = useState(!!dealId);
  const [dealData, setDealData] = useState<any>(null);
  const [isEditMode] = useState(!!quotationData);
  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalRent: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    gstAmount: 0,
    totalCost: 0
  });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // Load deal data or quotation data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (dealId) {
          // Load deal data for creating quotation from deal
          setLoadingDeal(true);
          const response = await fetch(`/api/deals/${dealId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const deal = result.data;
              setDealData(deal);
              
              // Pre-populate form with deal data
              setFormData(prev => ({
                ...prev,
                customerName: deal.customer?.company || deal.customer?.name || '',
                customerEmail: deal.customer?.email || '',
                customerPhone: deal.customer?.phone || '',
                customerAddress: deal.customer?.address || '',
                notes: `Quotation for deal: ${deal.title}\n${deal.description}`
              }));
            }
          }
          setLoadingDeal(false);
        } else if (quotationData) {
          // Load existing quotation data for editing
          setFormData({
            customerName: quotationData.customer_name || '',
            customerEmail: quotationData.customer_email || '',
            customerPhone: quotationData.customer_phone || '',
            customerAddress: quotationData.customer_address || '',
            machineType: quotationData.machine_type || 'mobile_crane',
            orderType: quotationData.order_type || 'rental',
            numberOfDays: quotationData.number_of_days || 1,
            workingHours: quotationData.working_hours || 8,
            siteDistance: quotationData.site_distance || 0,
            usage: quotationData.usage || 'Construction',
            shift: quotationData.shift || 'Day Shift',
            foodResources: quotationData.food_resources || 'Client Provided',
            accomResources: quotationData.accom_resources || 'Client Provided',
            riskFactor: quotationData.risk_factor || 'Medium',
            extraCharge: quotationData.extra_charge || 0,
            notes: quotationData.notes || ''
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('error', 'Failed to load data');
      }
    };

    loadInitialData();
  }, [dealId, quotationData]);

  // Calculate costs whenever form data changes
  useEffect(() => {
    calculateCosts();
  }, [formData]);

  const calculateCosts = () => {
    const equipment = equipmentOptions.find(eq => eq.value === formData.machineType);
    const orderType = orderTypeOptions.find(ot => ot.value === formData.orderType);
    
    if (!equipment || !orderType) return;

    const baseRate = equipment.baseRate * orderType.multiplier;
    const totalRent = baseRate * formData.workingHours * formData.numberOfDays;
    
    // Mobilization/Demobilization based on distance
    const mobDemobCost = Math.max(15000, formData.siteDistance * 200);
    
    // Food and accommodation
    const foodCost = formData.foodResources === 'ASP Provided' ? 2500 * formData.numberOfDays : 0;
    const accomCost = formData.accomResources === 'ASP Provided' ? 4000 * formData.numberOfDays : 0;
    const foodAccomCost = foodCost + accomCost;
    
    // Risk factor adjustment
    const riskMultiplier = {
      'Low': 0.95,
      'Medium': 1.0,
      'High': 1.1,
      'Very High': 1.2
    }[formData.riskFactor] || 1.0;
    
    const subtotal = (totalRent + mobDemobCost + foodAccomCost + formData.extraCharge) * riskMultiplier;
    const gstAmount = subtotal * 0.18;
    const totalCost = subtotal + gstAmount;

    setCalculations({
      baseRate,
      totalRent,
      mobDemobCost,
      foodAccomCost,
      gstAmount,
      totalCost
    });
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: 'info', message: '' }), 5000);
  };

  const handleInputChange = (field: keyof QuotationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.customerName && formData.customerEmail && formData.customerPhone);
      case 2:
        return !!(formData.machineType && formData.orderType && formData.numberOfDays > 0);
      case 3:
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      showNotification('error', 'Please fill in all required fields');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      showNotification('error', 'Please complete all required information');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for API
      const quotationData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        machineType: equipmentOptions.find(eq => eq.value === formData.machineType)?.label || formData.machineType,
        orderType: formData.orderType,
        numberOfDays: formData.numberOfDays,
        workingHours: formData.workingHours,
        siteDistance: formData.siteDistance,
        usage: formData.usage,
        shift: formData.shift,
        foodResources: formData.foodResources,
        accomResources: formData.accomResources,
        riskFactor: formData.riskFactor,
        extraCharge: formData.extraCharge,
        totalCost: calculations.totalCost,
        gstRate: 18,
        items: [
          {
            description: equipmentOptions.find(eq => eq.value === formData.machineType)?.label || 'Equipment',
            qty: formData.numberOfDays,
            price: calculations.baseRate * formData.workingHours,
            equipmentId: null
          }
        ],
        terms: [
          'Payment Terms: 50% advance payment required, balance to be paid on completion of work',
          'Equipment will be delivered within 2-3 working days from advance payment receipt',
          'Fuel charges will be extra as per actual consumption and current market rates',
          'All rates are subject to site conditions, accessibility, and final inspection',
          'This quotation is valid for 15 days from date of issue'
        ]
      };

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification('success', 'Quotation created successfully!');
        setTimeout(() => {
          onSave(); // Refresh the list
          onClose(); // Close the builder
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to create quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Building className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC Construction Ltd."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@company.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91-9876543210"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Complete address..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Equipment & Project Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type *
                </label>
                <select
                  value={formData.machineType}
                  onChange={(e) => handleInputChange('machineType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {equipmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} (₹{option.baseRate.toLocaleString()}/hr)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type *
                </label>
                <select
                  value={formData.orderType}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {orderTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfDays}
                  onChange={(e) => handleInputChange('numberOfDays', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.workingHours}
                  onChange={(e) => handleInputChange('workingHours', parseInt(e.target.value) || 8)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Type
                </label>
                <input
                  type="text"
                  value={formData.usage}
                  onChange={(e) => handleInputChange('usage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Construction, Infrastructure, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Shift
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => handleInputChange('shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Day Shift">Day Shift</option>
                  <option value="Night Shift">Night Shift</option>
                  <option value="Double Shift">Double Shift</option>
                  <option value="Round the Clock">Round the Clock</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-600 text-white p-2 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Site & Additional Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Distance (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.siteDistance}
                  onChange={(e) => handleInputChange('siteDistance', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Factor
                </label>
                <select
                  value={formData.riskFactor}
                  onChange={(e) => handleInputChange('riskFactor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Resources
                </label>
                <select
                  value={formData.foodResources}
                  onChange={(e) => handleInputChange('foodResources', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Client Provided">Client Provided</option>
                  <option value="ASP Provided">ASP Provided</option>
                  <option value="To be discussed">To be discussed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accommodation Resources
                </label>
                <select
                  value={formData.accomResources}
                  onChange={(e) => handleInputChange('accomResources', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Client Provided">Client Provided</option>
                  <option value="ASP Provided">ASP Provided</option>
                  <option value="To be discussed">To be discussed</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.extraCharge}
                  onChange={(e) => handleInputChange('extraCharge', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional charges if any"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional notes or requirements..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-600 text-white p-2 rounded-lg">
                <Calculator className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Review & Cost Summary</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment Rental ({formData.numberOfDays} days × {formData.workingHours} hrs)</span>
                  <span className="font-medium">₹{calculations.totalRent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobilization & Demobilization</span>
                  <span className="font-medium">₹{calculations.mobDemobCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Food & Accommodation</span>
                  <span className="font-medium">₹{calculations.foodAccomCost.toLocaleString('en-IN')}</span>
                </div>
                {formData.extraCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Charges</span>
                    <span className="font-medium">₹{formData.extraCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(calculations.totalCost - calculations.gstAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">₹{calculations.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{calculations.totalCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {formData.customerName}
                </div>
                <div>
                  <span className="font-medium">Equipment:</span> {equipmentOptions.find(eq => eq.value === formData.machineType)?.label}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {formData.numberOfDays} days
                </div>
                <div>
                  <span className="font-medium">Shift:</span> {formData.shift}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Quotation' : dealId ? 'New Quotation from Deal' : 'New Quotation'}
                </h1>
                <p className="text-gray-600">
                  {isEditMode ? 'Update quotation details' : dealId ? 'Create quotation for selected deal' : 'Create a professional quotation'}
                </p>
                {dealData && (
                  <p className="text-sm text-blue-600 mt-1">
                    Deal: {dealData.title}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Save Quotation'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              <div className="ml-3 text-sm">
                {step === 1 && 'Customer Info'}
                {step === 2 && 'Equipment Details'}
                {step === 3 && 'Site Details'}
                {step === 4 && 'Review & Save'}
              </div>
              {step < 4 && <div className="w-12 h-px bg-gray-300 ml-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg border-l-4 max-w-sm ${
            notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-start space-x-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
              {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="text-sm text-gray-500">
              Step {currentStep} of 4
            </div>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Create Quotation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewQuotationBuilder;
