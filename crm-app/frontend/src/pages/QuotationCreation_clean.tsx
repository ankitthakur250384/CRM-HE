import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  AlertCircle,
  ArrowLeft,
  Save,
  Calculator,
  Truck,
  Users,
  Clock,
  IndianRupee,
  AlertTriangle,
  Settings,
  Calendar,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType, CraneCategory, BaseRates } from '../types/equipment';
import { QuotationInputs } from '../types/quotation';
import { getDealById } from '../services/deal';
import { getEquipment, getEquipmentByCategory } from '../services/equipment';
import { createQuotation, updateQuotation, getQuotationById } from '../services/quotation';
import { formatCurrency } from '../utils/formatters';
import { useQuotationConfig, useConfigChangeListener } from '../hooks/useQuotationConfig';

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const MACHINE_TYPES = [
  { value: '', label: 'Select machine type...' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
] satisfies { value: string; label: string }[];

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

const USAGE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
];

const DEAL_TYPES = [
  { value: 'no_advance', label: 'No Advance' },
  { value: 'credit', label: 'Credit' },
  { value: 'long_credit', label: 'Long Credit' },
];

const RISK_LEVELS = [
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

const OTHER_FACTORS = [
  { value: 'area', label: 'Area' },
  { value: 'condition', label: 'Condition' },
  { value: 'customer_reputation', label: 'Customer Reputation' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'helper', label: 'Helper' },
];

const INCIDENTAL_OPTIONS = [
  { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
  { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
  { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
];

interface SelectedMachine {
  id: string;
  machineType: string;
  equipmentId: string;
  name: string;
  baseRates: BaseRates;
  baseRate: number;
  runningCostPerKm: number;
  quantity: number;
}

interface QuotationFormState extends QuotationInputs {
  version: number;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  selectedMachines: SelectedMachine[];
  customerName?: string;
  customerContact?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    designation?: string;
  };
}

export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dealId = searchParams.get('dealId') || '';
  const quotationId = searchParams.get('quotationId');

  // Configuration management with auto-refresh
  const {
    quotationConfig,
    resourceRates,
    additionalParams
  } = useQuotationConfig();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEquipmentBaseRate, setSelectedEquipmentBaseRate] = useState<number>(0);

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState<QuotationFormState>({
    machineType: '',
    selectedEquipment: {
      id: '',
      equipmentId: '',
      name: '',
      baseRates: {
        micro: 0,
        small: 0,
        monthly: 0,
        yearly: 0
      }
    },
    selectedMachines: [],
    orderType: 'micro',
    numberOfDays: 0,
    workingHours: 8,
    foodResources: 0,
    accomResources: 0,
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    extraCharge: 0,
    incidentalCharges: [],
    otherFactorsCharge: 0,
    billing: 'gst',
    includeGst: true,
    shift: 'single',
    dayNight: 'day',
    mobDemob: 0,
    mobRelaxation: 0,
    runningCostPerKm: 0,
    version: 1,
    createdBy: user?.id || '',
    status: 'draft',
    otherFactors: [],
    dealType: DEAL_TYPES[0].value,
    sundayWorking: 'no'
  });

  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalHours: 0,
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    usageLoadFactor: 0,
    extraCharges: 0,
    riskAdjustment: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  // Listen for configuration changes and recalculate quotations
  useConfigChangeListener('resourceRatesUpdated', () => {
    console.log('Resource rates updated, recalculating quotation...');
    calculateQuotation();
  });

  useConfigChangeListener('additionalParamsUpdated', () => {
    console.log('Additional parameters updated, recalculating quotation...');
    calculateQuotation();
  });

  useConfigChangeListener('quotationConfigUpdated', (detail) => {
    console.log('Quotation configuration updated, checking order type...', detail);
    if (formData.numberOfDays > 0) {
      const newOrderType = determineOrderType(formData.numberOfDays);
      if (newOrderType !== formData.orderType) {
        setFormData(prev => ({ ...prev, orderType: newOrderType }));
      }
    }
    calculateQuotation();
  });

  useEffect(() => {
    fetchData();
  }, [dealId, quotationId]);

  useEffect(() => {
    calculateQuotation();
  }, [formData, selectedEquipmentBaseRate]);

  useEffect(() => {
    if (formData.workingHours !== undefined) {
      calculateQuotation();
    }
  }, [formData.workingHours]);
  
  useEffect(() => {
    if (formData.orderType && formData.selectedEquipment?.id && Array.isArray(availableEquipment) && availableEquipment.length > 0) {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment.id);
      if (selected?.baseRates) {
        const baseRate = selected.baseRates[formData.orderType];
        setSelectedEquipmentBaseRate(baseRate);
      }
    }
    
    if (formData.selectedMachines.length > 0 && Array.isArray(availableEquipment) && availableEquipment.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedMachines: prev.selectedMachines.map(machine => {
          const equipmentDetails = availableEquipment.find(eq => eq.id === machine.id);
          if (equipmentDetails?.baseRates) {
            return {
              ...machine,
              baseRate: equipmentDetails.baseRates[formData.orderType] || machine.baseRate
            };
          }
          return machine;
        })
      }));
    }
  }, [formData.orderType, availableEquipment.length]);

  useEffect(() => {
    if (formData.machineType) {
      const fetchEquipment = async () => {
        try {
          const equipment = await getEquipmentByCategory(formData.machineType as CraneCategory);
          setAvailableEquipment(Array.isArray(equipment) ? equipment : []);
        } catch (error) {
          console.error('Error fetching equipment:', error);
          setAvailableEquipment([]);
        }
      };
      fetchEquipment();
    } else {
      setAvailableEquipment([]);
    }
  }, [formData.machineType]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('[QuotationCreation] Fetching data with dealId:', dealId, 'quotationId:', quotationId);

      const navState = location.state as any;
      let existingQuotation = null;
      let dealData = null;

      if (navState) {
        if (navState.quotation) {
          existingQuotation = navState.quotation;
          console.log('[QuotationCreation] Found quotation in navigation state:', existingQuotation);
        }
        if (navState.deal) {
          dealData = navState.deal;
          console.log('[QuotationCreation] Found deal in navigation state:', dealData);
          setDeal(dealData);
        }
      }

      if (!dealData && dealId) {
        try {
          dealData = await getDealById(dealId);
          console.log('[QuotationCreation] Fetched deal data:', dealData);
          setDeal(dealData);
        } catch (err) {
          console.error('[QuotationCreation] Error fetching deal by ID:', err);
          showToast('Warning: Could not load deal details. You can still create a quotation.', 'warning');
          setDeal({
            id: dealId,
            customer: {
              name: 'Unknown Customer',
              email: '',
              phone: '',
              company: 'Unknown Company',
              address: '',
              designation: ''
            },
            title: 'Unknown Deal',
            description: '',
            value: 0,
            stage: 'qualification',
            leadId: '',
            customerId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedTo: '',
            probability: 0,
            expectedCloseDate: new Date().toISOString()
          } as Deal);
        }
      } else if (!dealData) {
        setDeal({
          id: 'new',
          customer: {
            name: 'New Customer',
            email: '',
            phone: '',
            company: '',
            address: '',
            designation: ''
          },
          title: 'New Quotation',
          description: '',
          value: 0,
          stage: 'qualification',
          leadId: '',
          customerId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: '',
          probability: 0,
          expectedCloseDate: new Date().toISOString()
        } as Deal);
      }

      const equipmentData = await getEquipment();
      console.log('Fetched equipment data:', equipmentData);
      setAvailableEquipment(equipmentData);

      if (quotationId) {
        let quotationToLoad = existingQuotation;
        
        if (!quotationToLoad) {
          try {
            console.log('[QuotationCreation] Fetching existing quotation from API:', quotationId);
            quotationToLoad = await getQuotationById(quotationId);
          } catch (err) {
            console.error('[QuotationCreation] Error fetching quotation:', err);
            showToast('Error loading quotation data', 'error');
          }
        }
        
        if (quotationToLoad) {
          console.log('[QuotationCreation] Loading quotation data for ID:', quotationToLoad.id);
          
          const updatedFormData = {
            ...formData,
            machineType: quotationToLoad.machineType || '',
            selectedEquipment: quotationToLoad.selectedEquipment || formData.selectedEquipment,
            selectedMachines: quotationToLoad.selectedMachines || [],
            orderType: quotationToLoad.orderType || 'micro',
            numberOfDays: quotationToLoad.numberOfDays || 0,
            workingHours: quotationToLoad.workingHours || 8,
            foodResources: quotationToLoad.foodResources || 0,
            accomResources: quotationToLoad.accomResources || 0,
            siteDistance: quotationToLoad.siteDistance || 0,
            usage: quotationToLoad.usage || 'normal',
            riskFactor: quotationToLoad.riskFactor || 'low',
            extraCharge: quotationToLoad.extraCharge || 0,
            incidentalCharges: quotationToLoad.incidentalCharges || [],
            otherFactorsCharge: quotationToLoad.otherFactorsCharge || 0,
            billing: quotationToLoad.billing || 'gst',
            includeGst: quotationToLoad.includeGst !== undefined ? quotationToLoad.includeGst : true,
            shift: quotationToLoad.shift || 'single',
            dayNight: quotationToLoad.dayNight || 'day',
            mobDemob: quotationToLoad.mobDemob || 0,
            mobRelaxation: quotationToLoad.mobRelaxation || 0,
            runningCostPerKm: quotationToLoad.runningCostPerKm || 0,
            otherFactors: quotationToLoad.otherFactors || [],
            dealType: quotationToLoad.dealType || DEAL_TYPES[0].value,
            sundayWorking: quotationToLoad.sundayWorking || 'no',
            version: quotationToLoad.version || 1,
            status: quotationToLoad.status || 'draft',
            customerName: quotationToLoad.customerName || (dealData?.customer?.name || ''),
            customerContact: quotationToLoad.customerContact || {
              name: dealData?.customer?.name || '',
              email: dealData?.customer?.email || '',
              phone: dealData?.customer?.phone || '',
              company: dealData?.customer?.company || '',
              address: dealData?.customer?.address || '',
              designation: dealData?.customer?.designation || ''
            }
          };
          
          console.log('[QuotationCreation] Form data populated with', Object.keys(updatedFormData).length, 'fields');
          setFormData(updatedFormData);

          if (quotationToLoad.selectedEquipment?.id && equipmentData) {
            const selected = equipmentData.find((eq: any) => eq.id === quotationToLoad.selectedEquipment.id);
            if (selected?.baseRates) {
              const baseRate = selected.baseRates[quotationToLoad.orderType as keyof typeof selected.baseRates || 'micro'];
              setSelectedEquipmentBaseRate(baseRate);
            }
          }

          if (!dealData && quotationToLoad.dealId) {
            try {
              const quotationDeal = await getDealById(quotationToLoad.dealId);
              if (quotationDeal) {
                console.log('[QuotationCreation] Loaded deal from quotation:', quotationDeal);
                setDeal(quotationDeal);
              }
            } catch (dealError) {
              console.warn('[QuotationCreation] Could not load deal for quotation:', dealError);
            }
          }
        } else {
          console.warn('[QuotationCreation] No quotation found with ID:', quotationId);
          showToast('Quotation not found', 'warning');
        }
      } else {
        setAvailableEquipment(equipmentData);
      }

      console.log('Quotation config managed by centralized store');
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const determineOrderType = (days: number): OrderType => {
    if (!quotationConfig?.orderTypeLimits) return 'micro';
    
    const limits = quotationConfig.orderTypeLimits;
    if (days <= 0) return 'micro';
    if (days >= limits.yearly.minDays) return 'yearly';
    if (days >= limits.monthly.minDays) return 'monthly';
    if (days >= limits.small.minDays) return 'small';
    return 'micro';
  };

  const calculateQuotation = () => {
    console.log("Calculating quotation with working hours:", formData.workingHours);
    
    const hasMachines = formData.selectedMachines.length > 0;
    const effectiveBaseRate = selectedEquipmentBaseRate;
    
    if (!formData.numberOfDays || (!hasMachines && !effectiveBaseRate)) {
      setCalculations({
        baseRate: 0,
        totalHours: 0,
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        usageLoadFactor: 0,
        extraCharges: 0,
        riskAdjustment: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const numberOfDays = Number(formData.numberOfDays);
    const workingHours = Number(formData.workingHours) || 8;
    const totalHours = numberOfDays * workingHours;

    // Calculate working cost based on whether we have machines or single equipment
    let workingCost = 0;
    if (hasMachines) {
      workingCost = formData.selectedMachines.reduce((total, machine) => {
        const baseRate = machine.baseRate * machine.quantity;
        if (formData.orderType === 'monthly') {
          return total + baseRate * Math.ceil(numberOfDays / 26);
        } else {
          return total + (baseRate * totalHours);
        }
      }, 0);
    } else {
      if (formData.orderType === 'monthly') {
        workingCost = effectiveBaseRate * Math.ceil(numberOfDays / 26);
      } else {
        workingCost = effectiveBaseRate * totalHours;
      }
    }

    // Food & Accommodation costs
    const foodRate = resourceRates?.foodRate || 0;
    const accomRate = resourceRates?.accommodationRate || 0;
    const foodCost = (formData.foodResources || 0) * foodRate * numberOfDays;
    const accomCost = (formData.accomResources || 0) * accomRate * numberOfDays;
    const foodAccomCost = foodCost + accomCost;

    // Mobilization/Demobilization costs
    let mobDemobCost = 0;
    if (formData.mobDemob > 0) {
      mobDemobCost = formData.mobDemob;
    } else if (formData.siteDistance > 0) {
      if (hasMachines) {
        mobDemobCost = formData.selectedMachines.reduce((total, machine) => {
          const distance = formData.siteDistance || 0;
          const runningCostPerKm = machine.runningCostPerKm || 0;
          const machineCost = (distance * 2 * runningCostPerKm) + (quotationConfig?.trailerCost || 0);
          return total + (machineCost * machine.quantity);
        }, 0);
      } else {
        const distance = formData.siteDistance || 0;
        const runningCostPerKm = formData.runningCostPerKm || 0;
        mobDemobCost = (distance * 2 * runningCostPerKm) + (quotationConfig?.trailerCost || 0);
      }
      
      if (formData.mobRelaxation > 0) {
        mobDemobCost = mobDemobCost * (1 - (formData.mobRelaxation / 100));
      }
    }

    // Risk & Usage adjustments
    const baseForRiskCalc = workingCost;
    let riskPercentage = 0;
    let usagePercentage = 0;

    if (formData.riskFactor === 'high') riskPercentage = 0.15;
    else if (formData.riskFactor === 'medium') riskPercentage = 0.10;
    else riskPercentage = 0.05;

    if (formData.usage === 'heavy') usagePercentage = 0.10;
    else usagePercentage = 0.05;

    const riskAdjustment = baseForRiskCalc * riskPercentage;
    const usageLoadFactor = baseForRiskCalc * usagePercentage;

    // Additional charges
    const extraCharges = Number(formData.extraCharge) || 0;
    
    const incidentalTotal = formData.incidentalCharges.reduce((sum, val) => {
      const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
      return sum + (found ? found.amount : 0);
    }, 0);

    const otherFactorsTotal = (formData.otherFactors.includes('rigger') ? (additionalParams?.riggerAmount || 40000) : 0) + 
                            (formData.otherFactors.includes('helper') ? (additionalParams?.helperAmount || 12000) : 0);

    // Calculate subtotal
    const subtotal = workingCost + foodAccomCost + mobDemobCost + riskAdjustment + usageLoadFactor + extraCharges + incidentalTotal + otherFactorsTotal;

    // GST calculation
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;

    setCalculations({
      baseRate: effectiveBaseRate,
      totalHours,
      workingCost,
      mobDemobCost,
      foodAccomCost,
      usageLoadFactor,
      extraCharges,
      riskAdjustment,
      gstAmount,
      totalAmount,
    });
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success', description?: string) => {
    setToast({ show: true, title, description, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numberOfDays || formData.numberOfDays === 0) {
      showToast('Please enter the number of days', 'error');
      return;
    }

    if (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id) {
      showToast('Please select at least one machine', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      const quotationData = {
        ...formData,
        dealId: dealId || 'new',
        customerName: formData.customerName || deal?.customer?.name || '',
        customerContact: formData.customerContact || {
          name: deal?.customer?.name || '',
          email: deal?.customer?.email || '',
          phone: deal?.customer?.phone || '',
          company: deal?.customer?.company || '',
          address: deal?.customer?.address || '',
          designation: deal?.customer?.designation || ''
        },
        calculations,
        totalAmount: calculations.totalAmount,
        createdBy: user?.id || '',
        updatedAt: new Date().toISOString()
      };

      if (quotationId) {
        await updateQuotation(quotationId, quotationData);
        showToast('Quotation updated successfully', 'success');
      } else {
        await createQuotation(quotationData);
        showToast('Quotation created successfully', 'success');
      }
      
      navigate('/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      showToast('Error saving quotation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft size={16} />}
            className="self-start"
          >
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {quotationId ? 'Edit Quotation' : 'Create Quotation'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              For {deal?.customer?.name || 'New Customer'} - {deal?.title || 'New Quotation'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-full mx-auto px-2 sm:px-4">
        <RequiredFieldsInfo />
        
        {/* Customer Information Card - Compact */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-medium">Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Customer</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerName || deal?.customer?.name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Company</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.company || deal?.customer?.company || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Email</div>
                <div className="font-semibold text-gray-900 break-all">
                  {formData.customerContact?.email || deal?.customer?.email || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Phone</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.phone || deal?.customer?.phone || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Designation</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.designation || deal?.customer?.designation || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Address</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.address || deal?.customer?.address || 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Column - Form Fields */}
          <div className="flex-1 space-y-4">
            {/* Basic Information Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Number of Days"
                    value={formData.numberOfDays || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const days = e.target.value === '' ? 0 : Number(e.target.value);
                      const newOrderType = determineOrderType(days);
                      
                      setFormData(prev => {
                        const orderTypeChanged = days > 0 && newOrderType !== prev.orderType;
                        let updatedMachines = [...prev.selectedMachines];
                        if (orderTypeChanged) {
                          updatedMachines = prev.selectedMachines.map(machine => ({
                            ...machine,
                            baseRate: machine.baseRates?.[newOrderType] || machine.baseRate
                          }));
                        }
                        
                        return {
                          ...prev,
                          numberOfDays: days,
                          orderType: days > 0 ? newOrderType : prev.orderType,
                          selectedMachines: updatedMachines
                        };
                      });
                    }}
                    required
                    min="1"
                    placeholder="Enter days"
                  />
                  <FormInput
                    type="number"
                    label="Working Hours/Day"
                    value={formData.workingHours || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const hours = Number(e.target.value) || 8;
                      setFormData(prev => ({ ...prev, workingHours: hours }));
                    }}
                    min="1"
                    max="24"
                    placeholder="8"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    Machine Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Select
                    label="Machine Type"
                    value={formData.machineType}
                    onChange={(value: string) => setFormData(prev => ({ 
                      ...prev, 
                      machineType: value,
                      selectedEquipment: { id: '', equipmentId: '', name: '', baseRates: { micro: 0, small: 0, monthly: 0, yearly: 0 } },
                      selectedMachines: []
                    }))}
                    options={MACHINE_TYPES}
                    placeholder="Select machine type"
                    required
                  />
                  
                  {formData.machineType && (
                    <Select
                      label="Equipment"
                      value={formData.selectedEquipment.id}
                      onChange={(value: string) => {
                        const selected = availableEquipment.find(eq => eq.id === value);
                        if (selected) {
                          const baseRate = selected.baseRates[formData.orderType];
                          setSelectedEquipmentBaseRate(baseRate);
                          setFormData(prev => ({
                            ...prev,
                            selectedEquipment: {
                              id: selected.id,
                              equipmentId: selected.equipmentId,
                              name: selected.name,
                              baseRates: selected.baseRates
                            },
                            baseRate,
                            runningCostPerKm: selected.runningCostPerKm || 0
                          }));
                        }
                      }}
                      options={[
                        { value: '', label: 'Select equipment...' },
                        ...availableEquipment.map(eq => ({ value: eq.id, label: `${eq.name} (${eq.equipmentId})` }))
                      ]}
                      placeholder="Select equipment"
                      required={formData.selectedMachines.length === 0}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <Select
                    label="Shift Type"
                    value={formData.shift}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, shift: value }))}
                    options={SHIFT_OPTIONS}
                  />
                  <Select
                    label="Time"
                    value={formData.dayNight}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, dayNight: value }))}
                    options={TIME_OPTIONS}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resources & Costs Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    Food & Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Food Resources"
                    value={formData.foodResources || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, foodResources: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Number of people"
                  />
                  <FormInput
                    type="number"
                    label="Accommodation Resources"
                    value={formData.accomResources || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, accomResources: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Number of people"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-500" />
                    Transport & Site
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <FormInput
                    type="number"
                    label="Site Distance (km)"
                    value={formData.siteDistance || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, siteDistance: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="Distance in km"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      label="Usage"
                      value={formData.usage}
                      onChange={(value: string) => setFormData(prev => ({ ...prev, usage: value }))}
                      options={USAGE_OPTIONS}
                    />
                    <Select
                      label="Risk Level"
                      value={formData.riskFactor}
                      onChange={(value: string) => setFormData(prev => ({ ...prev, riskFactor: value }))}
                      options={RISK_LEVELS}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Charges Row */}
            <Card className="shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-500" />
                  Additional Charges
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    type="number"
                    label="Extra Commercial Charges"
                    value={formData.extraCharge || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData(prev => ({ ...prev, extraCharge: Number(e.target.value) || 0 }));
                    }}
                    min="0"
                    placeholder="₹0"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incidental Charges</label>
                    <div className="space-y-2">
                      {INCIDENTAL_OPTIONS.map(option => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.incidentalCharges.includes(option.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  incidentalCharges: [...prev.incidentalCharges, option.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  incidentalCharges: prev.incidentalCharges.filter(val => val !== option.value)
                                }));
                              }
                            }}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Factors</label>
                    <div className="space-y-2">
                      {OTHER_FACTORS.map(factor => (
                        <label key={factor.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.otherFactors.includes(factor.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  otherFactors: [...prev.otherFactors, factor.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  otherFactors: prev.otherFactors.filter(val => val !== factor.value)
                                }));
                              }
                            }}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {factor.label}
                            {factor.value === 'rigger' && ' (₹40,000)'}
                            {factor.value === 'helper' && ' (₹12,000)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/quotations')}
                className="sm:flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSaving || (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id)}
                className="sm:flex-1 bg-primary-600 hover:bg-primary-700"
                leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
                variant="accent"
              >
                {isSaving ? 'Saving...' : quotationId ? 'Update Quotation' : 'Create Quotation'}
              </Button>
              {formData.selectedMachines.length === 0 && !formData.selectedEquipment.id && (
                <div className="text-xs text-center text-amber-600 col-span-2">
                  Please add at least one machine
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="w-full xl:w-[400px] flex-shrink-0">
            <div className="sticky top-6">
              <Card className="shadow-xl border border-gray-200 bg-white">
                <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-800">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span>Quotation Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Working Cost</span>
                      </div>
                      <span className="font-bold text-blue-900">{formatCurrency(calculations.workingCost)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Food & Accommodation</span>
                      </div>
                      <span className="font-bold text-green-900">{formatCurrency(calculations.foodAccomCost)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-900">Mob/Demob Cost</span>
                      </div>
                      <span className="font-bold text-orange-900">{formatCurrency(calculations.mobDemobCost)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-900">Risk & Usage</span>
                      </div>
                      <span className="font-bold text-red-900">{formatCurrency(calculations.riskAdjustment + calculations.usageLoadFactor)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Extra Commercial Charges</span>
                      </div>
                      <span className="font-bold text-purple-900">{formatCurrency(Number(formData.extraCharge))}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">Incidental Charges</span>
                      </div>
                      <span className="font-bold text-indigo-900">
                        {formatCurrency(formData.incidentalCharges.reduce((sum, val) => {
                          const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
                          return sum + (found ? found.amount : 0);
                        }, 0))}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm font-medium text-gray-900">Other Factors</span>
                      </div>
                      <span className="font-bold text-cyan-900">
                        {formatCurrency(
                          (formData.otherFactors.includes('rigger') ? (additionalParams?.riggerAmount || 40000) : 0) + 
                          (formData.otherFactors.includes('helper') ? (additionalParams?.helperAmount || 12000) : 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(calculations.totalAmount - calculations.gstAmount)}</span>
                      </div>
                      
                      {formData.includeGst && (
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>GST (18%)</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(calculations.gstAmount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(calculations.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={formData.includeGst}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            includeGst: e.target.checked 
                          }))}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Include GST</div>
                          <div className="text-sm text-gray-600">
                            GST will be calculated at 18% of the total amount
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}
