// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Calculator,
  Truck,
  Users,
  Clock,
  IndianRupee,
  Settings,
  Calendar,
  Package,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { RequiredFieldsInfo } from '../components/common/RequiredFieldsInfo';
import { QuotationSummary } from './QuotationSummary';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType, CraneCategory, BaseRates } from '../types/equipment';
import { QuotationInputs } from '../types/quotation';
import { getDealById } from '../services/deal';
import { getEquipment, getEquipmentByCategory } from '../services/equipment';
import { createQuotation, updateQuotation, getQuotationById } from '../services/quotation';
import { formatCurrency } from '../utils/formatters';
import { useQuotationConfig, useConfigChangeListener } from '../hooks/useQuotationConfig';
import { getLeadById } from '../services/api/leadService';

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

// Relax typing to avoid type resolution issues in editor environment
type QuotationFormState = any;

export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navState = location.state as any;
  const dealId = searchParams.get('dealId') || navState?.dealId || '';
  const quotationId = searchParams.get('quotationId') || searchParams.get('edit');

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
  // Info popover visibility state
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [showIncidentalInfo, setShowIncidentalInfo] = useState(false);
  const [showOtherInfo, setShowOtherInfo] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState<any>({
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
    sundayWorking: 'no',
    // per-quotation override fields - initialize as null so config defaults can be applied
    incident1: null,
    incident2: null,
    incident3: null,
    riggerAmount: null,
    helperAmount: null
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
      if (selected) {
        const baseRate = getEquipmentBaseRate(selected, formData.orderType);
        setSelectedEquipmentBaseRate(baseRate);
      }
      }

    if (formData.selectedMachines.length > 0 && Array.isArray(availableEquipment) && availableEquipment.length > 0) {
      setFormData(prev => ({
        ...prev,
        selectedMachines: prev.selectedMachines.map(machine => {
          const equipmentDetails = availableEquipment.find(eq => eq.id === machine.id);
          if (equipmentDetails) {
            return {
              ...machine,
              baseRate: getEquipmentBaseRate(equipmentDetails, formData.orderType),
              baseRates: getEquipmentBaseRates(equipmentDetails)
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
      let existingQuotation: any = null;
      let dealData: any = null;
      let leadData: any = null;
      let leadId = navState?.leadId || '';

      if (navState) {
        if (navState.quotation) {
          existingQuotation = navState.quotation;
          console.log('[QuotationCreation] Found quotation in navigation state:', existingQuotation);
        }
        if (navState.deal || navState.selectedDeal) {
          dealData = navState.deal || navState.selectedDeal;
          console.log('[QuotationCreation] Found deal in navigation state:', dealData);
          setDeal(dealData);
          if (!leadId && dealData.leadId) leadId = dealData.leadId;
        }
      }
      if (!leadId && dealId && !dealData) {
        // Fetch deal to get leadId
        try {
          dealData = await getDealById(dealId);
          setDeal(dealData);
          if (dealData?.leadId) leadId = dealData.leadId;
        } catch (err) {
          console.error('[QuotationCreation] Error fetching deal by ID:', err);
        }
      }
      // Fetch lead if leadId is available
      if (leadId) {
        try {
          leadData = await getLeadById(leadId);
          console.log('[QuotationCreation] Loaded lead:', leadData);
          if (leadData && leadData.rentalDays) {
            setFormData(prev => ({
              ...prev,
              numberOfDays: leadData.rentalDays
            }));
          }
        } catch (err) {
          console.error('[QuotationCreation] Error fetching lead by ID:', err);
        }
      }

      // If no lead data, fallback to deal data
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
          console.log('[QuotationCreation] Full quotation data received:', quotationToLoad);
          console.log('[QuotationCreation] Customer data:', quotationToLoad.customerContact);
          console.log('[QuotationCreation] Working hours:', quotationToLoad.workingHours);
          console.log('[QuotationCreation] Food resources:', quotationToLoad.foodResources);
          
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
            },
            // load incident amounts if present
            incident1: quotationToLoad.incident1 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident1')?.amount ?? 0,
            incident2: quotationToLoad.incident2 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident2')?.amount ?? 0,
            incident3: quotationToLoad.incident3 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident3')?.amount ?? 0,
            // rigger/helper amounts
            riggerAmount: quotationToLoad.riggerAmount ?? additionalParams?.riggerAmount ?? null,
            helperAmount: quotationToLoad.helperAmount ?? additionalParams?.helperAmount ?? null
          };
          
          console.log('[QuotationCreation] Form data populated with', Object.keys(updatedFormData).length, 'fields');
          console.log('[QuotationCreation] Updated form data preview:', {
            numberOfDays: updatedFormData.numberOfDays,
            workingHours: updatedFormData.workingHours,
            foodResources: updatedFormData.foodResources,
            customerName: updatedFormData.customerName,
            customerContact: updatedFormData.customerContact
          });
          setFormData(updatedFormData);

          // If we have calculations from the loaded quotation, use them to set initial state
          if (quotationToLoad.calculations) {
            console.log('[QuotationCreation] Setting calculations from loaded quotation:', quotationToLoad.calculations);
            setCalculations(quotationToLoad.calculations);
          }

          if (quotationToLoad.selectedEquipment?.id && equipmentData) {
            const selected = equipmentData.find((eq: any) => eq.id === quotationToLoad.selectedEquipment.id);
            if (selected) {
              const baseRate = getEquipmentBaseRate(selected, quotationToLoad.orderType as OrderType || 'micro');
              setSelectedEquipmentBaseRate(baseRate);
            }
          }

          // Force recalculation after loading data
          setTimeout(() => {
            console.log('[QuotationCreation] Forcing recalculation after data load');
            calculateQuotation();
          }, 100);

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

  // Helper function to get the correct rate unit based on order type
  const getRateUnit = (orderType: OrderType): string => {
    switch (orderType) {
      case 'micro': return '/hr';
      case 'small': return '/hr';
      case 'monthly': return '/month';
      case 'yearly': return '/year';
      default: return '/hr';
    }
  };

  // Helper function to get base rate from equipment based on order type
  const getEquipmentBaseRate = (equipment: Equipment, orderType: OrderType): number => {
    console.log(`🔧 Getting base rate for ${equipment.name} with order type: ${orderType}`);
    console.log(`🔧 Equipment baseRates:`, equipment.baseRates);

    // The backend should already provide the baseRates object
    if (equipment.baseRates && equipment.baseRates[orderType] !== undefined) {
      const rate = equipment.baseRates[orderType];
      console.log(`🔧 Found rate from baseRates: ${rate}`);
      return rate;
    }

    console.log(`🔧 Warning: No baseRates found for ${equipment.name}, returning 0`);
    return 0;
  };

  // Helper function to get base rates object from equipment
  const getEquipmentBaseRates = (equipment: Equipment): BaseRates => {
    console.log(`🔧 Getting base rates object for ${equipment.name}`);
    
    // The backend should already provide the baseRates object
    if (equipment.baseRates) {
      console.log(`🔧 Using baseRates from backend:`, equipment.baseRates);
      return equipment.baseRates;
    }

    console.log(`🔧 Warning: No baseRates found for ${equipment.name}, returning zeros`);
    return { micro: 0, small: 0, monthly: 0, yearly: 0 };
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
    console.log("FormData.numberOfDays:", formData.numberOfDays);
    console.log("SelectedEquipmentBaseRate:", selectedEquipmentBaseRate);
    console.log("FormData.selectedMachines:", formData.selectedMachines);
    
    const hasMachines = formData.selectedMachines.length > 0;
    const effectiveBaseRate = selectedEquipmentBaseRate;
    
    if (!formData.numberOfDays || (!hasMachines && !effectiveBaseRate)) {
      console.log("❌ Calculation stopped - missing days or equipment", {
        numberOfDays: formData.numberOfDays,
        hasMachines,
        effectiveBaseRate
      });
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

    console.log("✅ Calculation inputs:", {
      numberOfDays,
      workingHours,
      totalHours,
      effectiveBaseRate,
      hasMachines,
      orderType: formData.orderType,
      shift: formData.shift,
      dayNight: formData.dayNight,
      additionalParams
    });

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

    // Apply shift type multiplier from configuration
    let shiftMultiplier = 1;
    if (additionalParams?.shiftFactors) {
      if (formData.shift === 'single') {
        shiftMultiplier = additionalParams.shiftFactors.single;
      } else if (formData.shift === 'double') {
        shiftMultiplier = additionalParams.shiftFactors.double;
      }
    }
    workingCost = workingCost * shiftMultiplier;

    // Apply day/night time multiplier from configuration  
    let timeMultiplier = 1;
    if (additionalParams?.dayNightFactors) {
      if (formData.dayNight === 'day') {
        timeMultiplier = additionalParams.dayNightFactors.day;
      } else if (formData.dayNight === 'night') {
        timeMultiplier = additionalParams.dayNightFactors.night;
      }
    }
    workingCost = workingCost * timeMultiplier;

    console.log("💰 Working cost calculated:", {
      baseWorkingCost: workingCost / (shiftMultiplier * timeMultiplier),
      shiftMultiplier,
      timeMultiplier,
      finalWorkingCost: workingCost
    });

    // Food & Accommodation costs
    // Resolve daily rate with priority: additionalParams daily -> resourceRates daily -> additionalParams monthly -> resourceRates monthly -> defaults
    const resolvedFoodDaily = (() => {
      // additionalParams may store either a daily rate (foodRate) or monthly (foodRatePerMonth)
      if (additionalParams?.foodRate !== undefined && additionalParams.foodRate !== null) return Number(additionalParams.foodRate);
      if (resourceRates?.foodRate !== undefined && resourceRates.foodRate !== null) return Number(resourceRates.foodRate);
      if (additionalParams?.foodRatePerMonth !== undefined && additionalParams.foodRatePerMonth !== null) return Number(additionalParams.foodRatePerMonth) / 26;
      if (resourceRates?.foodRatePerMonth !== undefined && resourceRates.foodRatePerMonth !== null) return Number(resourceRates.foodRatePerMonth) / 26;
      // fallback default monthly 2500 -> per day
      return 2500 / 26;
    })();

    const resolvedAccomDaily = (() => {
      if (additionalParams?.accommodationRate !== undefined && additionalParams.accommodationRate !== null) return Number(additionalParams.accommodationRate);
      if (resourceRates?.accommodationRate !== undefined && resourceRates.accommodationRate !== null) return Number(resourceRates.accommodationRate);
      if (additionalParams?.accommodationRatePerMonth !== undefined && additionalParams.accommodationRatePerMonth !== null) return Number(additionalParams.accommodationRatePerMonth) / 26;
      if (resourceRates?.accommodationRatePerMonth !== undefined && resourceRates.accommodationRatePerMonth !== null) return Number(resourceRates.accommodationRatePerMonth) / 26;
      return 4000 / 26;
    })();

    const foodRate = resolvedFoodDaily;
    const accomRate = resolvedAccomDaily;
    const foodCost = (formData.foodResources || 0) * foodRate * numberOfDays;
    const accomCost = (formData.accomResources || 0) * accomRate * numberOfDays;

    const foodAccomCost = foodCost + accomCost;

    console.log("🍽️ Food & Accommodation:", {
      foodResources: formData.foodResources,
      accomResources: formData.accomResources,
      foodRate,
      accomRate,
      numberOfDays,
      foodCost,
      accomCost,
      foodAccomCost,
      resourceRates,
      additionalParams
    });

    // Mobilization/Demobilization costs
    let mobDemobCost = 0;
    const transportRate = resourceRates?.transportRate;
    
    if (formData.mobDemob > 0) {
      mobDemobCost = formData.mobDemob;
    } else if (formData.siteDistance > 0 && transportRate) {
      if (hasMachines) {
        mobDemobCost = formData.selectedMachines.reduce((total, machine) => {
          const distance = formData.siteDistance || 0;
          const runningCostPerKm = machine.runningCostPerKm || 0;
          const machineCost = (distance * 2 * runningCostPerKm) + transportRate;
          return total + (machineCost * machine.quantity);
        }, 0);
      } else {
        const distance = formData.siteDistance || 0;
        const runningCostPerKm = formData.runningCostPerKm || 0;
        mobDemobCost = (distance * 2 * runningCostPerKm) + transportRate;
      }
      
      if (formData.mobRelaxation > 0) {
        mobDemobCost = mobDemobCost * (1 - (formData.mobRelaxation / 100));
      }
    }

    console.log("🚚 Mob-Demob calculation:", {
      mobDemobManual: formData.mobDemob,
      siteDistance: formData.siteDistance,
      transportRate,
      mobRelaxation: formData.mobRelaxation,
      mobDemobCost,
      hasMachines,
      selectedMachines: formData.selectedMachines?.map(m => ({ 
        name: m.name, 
        quantity: m.quantity, 
        runningCostPerKm: m.runningCostPerKm 
      }))
    });

    // Risk & Usage adjustments from configuration
    const baseForRiskCalc = workingCost;
    let riskPercentage = 0;
    let usagePercentage = 0;

    // Get risk factor from configuration
    if (additionalParams?.riskFactors) {
      if (formData.riskFactor === 'high') {
        riskPercentage = additionalParams.riskFactors.high;
      } else if (formData.riskFactor === 'medium') {
        riskPercentage = additionalParams.riskFactors.medium;
      } else {
        riskPercentage = additionalParams.riskFactors.low;
      }
    }

    // Get usage factor from configuration  
    if (additionalParams?.usageFactors) {
      if (formData.usage === 'heavy') {
        usagePercentage = additionalParams.usageFactors.heavy;
      } else {
        usagePercentage = additionalParams.usageFactors.normal;
      }
    }

    console.log("🔧 Risk & Usage factors:", {
      riskFactor: formData.riskFactor,
      riskPercentage,
      usage: formData.usage,
      usagePercentage,
      baseForRiskCalc
    });

    const riskAdjustment = baseForRiskCalc * riskPercentage;
    const usageLoadFactor = baseForRiskCalc * usagePercentage;

    // Additional charges
    const extraCharges = Number(formData.extraCharge) || 0;
    
    // Incidental charges from configuration
    const incidentalOptions = additionalParams?.incidentalOptions;
    const incidentalTotal = (formData.incidentalCharges || []).reduce((sum, val) => {
      if (val === 'incident1') return sum + (formData.incident1 ?? (incidentalOptions?.find(opt => opt.value === 'incident1')?.amount ?? 0));
      if (val === 'incident2') return sum + (formData.incident2 ?? (incidentalOptions?.find(opt => opt.value==='incident2')?.amount ?? 0));
      if (val === 'incident3') return sum + (formData.incident3 ?? (incidentalOptions?.find(opt => opt.value==='incident3')?.amount ?? 0));
      // fallback to config value
      const found = incidentalOptions?.find(opt => opt.value === val);
      return sum + (found ? found.amount : 0);
    }, 0);

    // Other factors (rigger/helper) use per-quotation override if provided, else config
    const otherFactorsTotal = (formData.otherFactors.includes('rigger') ? (formData.riggerAmount ?? additionalParams?.riggerAmount ?? 0) : 0) +
                              (formData.otherFactors.includes('helper') ? (formData.helperAmount ?? additionalParams?.helperAmount ?? 0) : 0);

    console.log("📋 Incidental charges:", {
      incidentalCharges: formData.incidentalCharges,
      incidentalOptions,
      incidentalTotal
    });

    console.log("👷 Other factors (Rigger & Helper):", {
      otherFactors: formData.otherFactors,
      riggerAmount: additionalParams?.riggerAmount,
      helperAmount: additionalParams?.helperAmount,
      riggerSelected: formData.otherFactors.includes('rigger'),
      helperSelected: formData.otherFactors.includes('helper'),
      otherFactorsTotal
    });

    // Calculate subtotal
    const subtotal = workingCost + foodAccomCost + mobDemobCost + riskAdjustment + usageLoadFactor + extraCharges + 
    incidentalTotal + otherFactorsTotal; // FIXED: use incidentalTotal

    // GST calculation
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;

    const newCalculations = {
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
    };

    console.log("🎯 Final calculations:", newCalculations);

    setCalculations(newCalculations);
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

    if (formData.selectedMachines.length === 0) {
      showToast('Please select at least one equipment', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure we have either a deal or lead ID
      if (!dealId) {
        showToast('A deal must be selected to create a quotation', 'error');
        return;
      }

      // Validate deal stage
      if (!deal?.stage || !['qualification', 'proposal', 'negotiation'].includes(deal.stage)) {
        showToast('Quotations can only be created for deals in Qualification, Proposal, or Negotiation stages', 'error');
        return;
      }

      const quotationData = {
        ...formData,
        dealId: dealId,
        customerName: formData.customerName || deal?.customer?.name || '',
        customerContact: {
          name: formData.customerContact?.name || deal?.customer?.name || '',
          email: formData.customerContact?.email || deal?.customer?.email || '',
          phone: formData.customerContact?.phone || deal?.customer?.phone || '',
          company: formData.customerContact?.company || deal?.customer?.company || '',
          address: formData.customerContact?.address || deal?.customer?.address || '',
          designation: formData.customerContact?.designation || deal?.customer?.designation || ''
        },
          // Include all calculation fields directly in the quotation data
        calculations,
        totalAmount: calculations.totalAmount,
        totalCost: calculations.totalAmount,
        workingCost: calculations.workingCost,
        mobDemobCost: calculations.mobDemobCost,
        foodAccomCost: calculations.foodAccomCost,
        usageLoadFactor: calculations.usageLoadFactor,
        riskAdjustment: calculations.riskAdjustment,
        gstAmount: calculations.gstAmount,
        createdBy: user?.id || '',
        updatedAt: new Date().toISOString(),
        // Map rigger/helper selections to explicit amounts for backend
        riggerAmount: formData.riggerAmount ?? additionalParams?.riggerAmount ?? null,
        helperAmount: formData.helperAmount ?? additionalParams?.helperAmount ?? null,
        incident1: formData.incident1 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident1')?.amount ?? 0,
        incident2: formData.incident2 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident2')?.amount ?? 0,
        incident3: formData.incident3 ?? additionalParams?.incidentalOptions?.find(o=>o.value==='incident3')?.amount ?? 0
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

  // Initialize incident/rigger/helper defaults from configuration for new quotations
  useEffect(() => {
    if (!additionalParams) return;
    // Only set defaults for new quotation (don't overwrite when editing existing quotation)
    if (!quotationId) {
      setFormData(prev => {
        const next = { ...prev };
        (additionalParams.incidentalOptions || []).forEach((opt: any) => {
          // Only set if value is null/undefined/empty
          if (next[opt.value] === undefined || next[opt.value] === null || next[opt.value] === '') {
            next[opt.value] = Number(opt.amount || 0);
          }
        });
        if (next.riggerAmount === null || next.riggerAmount === undefined || next.riggerAmount === '') {
          next.riggerAmount = Number(additionalParams.riggerAmount ?? 0);
        }
        if (next.helperAmount === null || next.helperAmount === undefined || next.helperAmount === '') {
          next.helperAmount = Number(additionalParams.helperAmount ?? 0);
        }
        return next;
      });
    }
  }, [additionalParams, quotationId]);

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
          input, select {
            color: #1a202c !important;
            background-color: #ffffff !important;
          }
          input::placeholder {
            color: #718096 !important;
            opacity: 1;
          }
          select {
            font-weight: 500 !important;
          }
          .form-input, .form-select {
            border-color: #e2e8f0;
            font-weight: 500;
          }
          option {
            color: #1a202c !important;
            background-color: #ffffff !important;
            font-weight: 500;
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
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
              {quotationId ? 'Edit Quotation' : 'Create Quotation'}
            </h1>
            <p className="text-sm sm:text-base text-blue-700">
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
                    <div className="text-blue-700 mb-1">Customer</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerName || deal?.customer?.name || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Company</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.company || deal?.customer?.company || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Email</div>
                <div className="font-semibold text-gray-900 break-all">
                  {formData.customerContact?.email || deal?.customer?.email || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Phone</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.phone || deal?.customer?.phone || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Designation</div>
                <div className="font-semibold text-gray-900">
                  {formData.customerContact?.designation || deal?.customer?.designation || 'N/A'}
                </div>
              </div>
              <div>
                    <div className="text-blue-700 mb-1">Address</div>
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
                    value={formData.numberOfDays === 0 ? '' : formData.numberOfDays}
                    style={{ color: '#1a202c', WebkitTextFillColor: '#1a202c' }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const days = e.target.value === '' ? 0 : Number(e.target.value);
                      const newOrderType = determineOrderType(days);
                      
                      setFormData(prev => {
                        const orderTypeChanged = days > 0 && newOrderType !== prev.orderType;
                        
                        let updatedMachines = [...prev.selectedMachines];
                        if (orderTypeChanged) {
                          updatedMachines = prev.selectedMachines.map(machine => {
                            // Find the equipment in availableEquipment to get updated rates
                            const equipment = availableEquipment.find(eq => eq.id === machine.id);
                            if (equipment) {
                              return {
                                ...machine,
                                baseRate: getEquipmentBaseRate(equipment, newOrderType),
                                baseRates: getEquipmentBaseRates(equipment)
                              };
                            }
                            return {
                              ...machine,
                              baseRate: machine.baseRates?.[newOrderType] || machine.baseRate
                            };
                          });
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
                    className="text-gray-900"
                  />
                  
                  {/* Order Type Display */}
                  {formData.numberOfDays > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Order Type</div>
                      <div className="text-lg font-bold text-blue-700 capitalize">
                        {formData.orderType}
                        {formData.orderType === 'micro' && ' (≤ 7 days)'}
                        {formData.orderType === 'small' && ' (8-25 days)'}
                        {formData.orderType === 'monthly' && ' (26-300 days)'}
                        {formData.orderType === 'yearly' && ' (≥ 300 days)'}
                      </div>
                    </div>
                  )}
                  
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
                    onChange={(value: string) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        machineType: value,
                        selectedEquipment: { id: '', equipmentId: '', name: '', baseRates: { micro: 0, small: 0, monthly: 0, yearly: 0 } },
                        selectedMachines: []
                      }));
                      if (value) {
                        console.log(`🔍 Fetching equipment for category: ${value}`);
                        getEquipmentByCategory(value as CraneCategory).then(equipment => {
                          console.log(`📦 Received equipment data:`, equipment);
                          console.log(`📦 Equipment count: ${equipment?.length || 0}`);
                          if (equipment && equipment.length > 0) {
                            console.log(`📦 First equipment sample:`, equipment[0]);
                            console.log(`📦 First equipment baseRates:`, equipment[0].baseRates);
                            console.log(`📦 First equipment individual rates:`, {
                              baseRateMicro: equipment[0].baseRateMicro,
                              baseRateSmall: equipment[0].baseRateSmall,
                              baseRateMonthly: equipment[0].baseRateMonthly,
                              baseRateYearly: equipment[0].baseRateYearly
                            });
                          }
                          setAvailableEquipment(Array.isArray(equipment) ? equipment : []);
                        }).catch(error => {
                          console.error('❌ Error fetching equipment:', error);
                          setAvailableEquipment([]);
                        });
                      }
                    }}
                    options={[
                      { value: '', label: 'Select machine type...' },
                      { value: 'mobile_crane', label: 'Mobile Crane' },
                      { value: 'tower_crane', label: 'Tower Crane' },
                      { value: 'crawler_crane', label: 'Crawler Crane' },
                      { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
                    ]}
                    required
                    className="text-gray-900"
                  />
                  
                  {formData.machineType && availableEquipment.length > 0 && (
                    <>
                      <Select
                        label="Available Equipment"
                        value=""
                        onChange={(value: string) => {
                          const selected = availableEquipment.find(eq => eq.id === value);
                          if (selected) {
                            // Check if this machine is already selected
                            const existingIndex = formData.selectedMachines.findIndex(m => m.id === selected.id);
                            
                            if (existingIndex >= 0) {
                              // If already selected, increase quantity
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: prev.selectedMachines.map((m, i) => 
                                  i === existingIndex ? { ...m, quantity: m.quantity + 1 } : m
                                )
                              }));
                            } else {
                              // Add new machine to the list
                              const baseRates = getEquipmentBaseRates(selected);
                              const newMachine = {
                                id: selected.id,
                                machineType: formData.machineType,
                                equipmentId: selected.equipmentId,
                                name: selected.name,
                                baseRates: baseRates,
                                baseRate: getEquipmentBaseRate(selected, formData.orderType),
                                runningCostPerKm: selected.runningCostPerKm || 0,
                                quantity: 1
                              };
                              
                              setFormData(prev => ({
                                ...prev,
                                selectedMachines: [...prev.selectedMachines, newMachine]
                              }));
                            }
                          }
                        }}
                        options={[
                          { value: '', label: 'Select equipment to add...' },
                          ...availableEquipment.map(eq => ({ 
                            value: eq.id, 
                            label: `${eq.name} - ${formatCurrency(getEquipmentBaseRate(eq, formData.orderType))}${getRateUnit(formData.orderType)}` 
                          }))
                        ]}
                        className="text-gray-900 mb-3"
                      />

                      {/* Selected machines list */}
                      {formData.selectedMachines.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            Selected Equipment ({formData.selectedMachines.length} type{formData.selectedMachines.length !== 1 ? 's' : ''})
                          </h4>
                          <div className="space-y-3">
                            {formData.selectedMachines.map((machine, index) => (
                              <div key={`${machine.id}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Equipment Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 text-base leading-tight">{machine.name}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{machine.equipmentId}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedMachines: prev.selectedMachines.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors ml-3 flex-shrink-0"
                                    title="Remove equipment"
                                  >
                                    ×
                                  </button>
                                </div>
                                
                                {/* Controls Row */}
                                <div className="grid grid-cols-3 gap-4">
                                  {/* Quantity */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Quantity
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, quantity: Math.max(1, m.quantity - 1) } : m
                                            )
                                          }));
                                        }}
                                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-medium"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        value={machine.quantity}
                                        onChange={(e) => {
                                          const quantity = Math.max(1, parseInt(e.target.value) || 1);
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, quantity } : m
                                            )
                                          }));
                                        }}
                                        className="w-12 text-center text-sm font-medium border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        min="1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, quantity: m.quantity + 1 } : m
                                            )
                                          }));
                                        }}
                                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-sm font-medium"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Rate */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Rate{getRateUnit(formData.orderType)}
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                      <input
                                        type="number"
                                        value={machine.baseRate}
                                        onChange={(e) => {
                                          const baseRate = Math.max(0, parseFloat(e.target.value) || 0);
                                          setFormData(prev => ({
                                            ...prev,
                                            selectedMachines: prev.selectedMachines.map((m, i) => 
                                              i === index ? { ...m, baseRate } : m
                                            )
                                          }));
                                        }}
                                        className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                        step="100"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>

                                  {/* Subtotal */}
                                  <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider">
                                      Subtotal
                                    </label>
                                    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                      <div className="font-bold text-blue-700 text-sm">
                                        {formatCurrency(machine.baseRate * machine.quantity)}
                                      </div>
                                      <div className="text-xs text-blue-600">
                                        {machine.quantity} × {formatCurrency(machine.baseRate)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Total Section */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">Total Equipment Cost:</span>
                              <span className="text-xl font-bold text-blue-700">
                                {formatCurrency(
                                  formData.selectedMachines.reduce((total, machine) => 
                                    total + (machine.baseRate * machine.quantity), 0
                                  )
                                )}{getRateUnit(formData.orderType)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {formData.machineType && availableEquipment.length === 0 && (
                    <div className="text-gray-500 text-sm italic">
                      No equipment available for this type
                    </div>
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
                    onChange={(value: string) => setFormData(prev => ({ ...prev, shift: value as 'single' | 'double' }))}
                    options={SHIFT_OPTIONS}
                  />
                  <Select
                    label="Time"
                    value={formData.dayNight}
                    onChange={(value: string) => setFormData(prev => ({ ...prev, dayNight: value as 'day' | 'night' }))}
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
                      onChange={(value: string) => setFormData(prev => ({ ...prev, usage: value as 'normal' | 'heavy' }))}
                      options={USAGE_OPTIONS}
                    />
                    <Select
                      label="Risk Level"
                      value={formData.riskFactor}
                      onChange={(value: string) => setFormData(prev => ({ ...prev, riskFactor: value as 'low' | 'medium' | 'high' }))}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Extra Commercial Charges */}
                  <div className="space-y-2">
                    <FormInput
                      type="number"
                      label="Extra Commercial Charges"
                      value={formData.extraCharge || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData(prev => ({ ...prev, extraCharge: Number(e.target.value) || 0 }));
                      }}
                      min="0"
                      placeholder="₹0"
                      className="text-gray-900"
                    />
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <div className="relative">
                        <button type="button" onClick={() => setShowExtraInfo(v => !v)} aria-label="Extra commercial charges info" className="p-1 rounded hover:bg-gray-100">
                          <Info className="w-4 h-4 text-gray-500" />
                        </button>
                        {showExtraInfo && (
                          <div className="absolute right-0 mt-2 w-64 p-3 bg-white border border-gray-200 rounded shadow-lg text-xs text-gray-700">
                            Optional — any additional commercial charges
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500">Optional</span>
                    </div>
                   </div>

                  {/* Incidental Charges: only label + editable input prefilled from configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">Incidental Charges</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <div className="relative">
                          <button type="button" onClick={() => setShowIncidentalInfo(v => !v)} aria-label="Incidental charges info" className="p-1 rounded hover:bg-gray-100">
                            <Info className="w-4 h-4 text-gray-500" />
                          </button>
                          {showIncidentalInfo && (
                            <div className="absolute right-0 mt-2 w-64 p-3 bg-white border border-gray-200 rounded shadow-lg text-xs text-gray-700">
                              Select and modify amounts if required
                            </div>
                          )}
                        </div>
                      </div>
                     </div>

                    <div className="space-y-3">
                      {additionalParams?.incidentalOptions?.map(option => (
                        <div key={option.value} className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3">
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
                                    incidentalCharges: prev.incidentalCharges.filter((val: string) => val !== option.value)
                                  }));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div className="text-sm text-gray-800">{String(option.label).replace(/\s*-\s*₹.*$/,'')}</div>
                          </label>

                          <div className="flex items-center gap-3">
                            <FormInput
                              type="number"
                              label=""
                              // Prefer explicit per-quotation value; if unset use config default (displayed)
                              value={formData[option.value] !== undefined && formData[option.value] !== null ? formData[option.value] : (additionalParams?.incidentalOptions?.find(o=>o.value===option.value)?.amount ?? '')}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                setFormData(prev => ({ ...prev, [option.value]: val }));
                              }}
                              placeholder=""
                              className="w-32"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Other Factors: rigger/helper editable inputs prefilled from configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">Other Factors</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <div className="relative">
                          <button type="button" onClick={() => setShowOtherInfo(v => !v)} aria-label="Other factors info" className="p-1 rounded hover:bg-gray-100">
                            <Info className="w-4 h-4 text-gray-500" />
                          </button>
                          {showOtherInfo && (
                            <div className="absolute right-0 mt-2 w-64 p-3 bg-white border border-gray-200 rounded shadow-lg text-xs text-gray-700">
                              Apply and override labour charges
                            </div>
                          )}
                        </div>
                      </div>
                     </div>

                    <div className="space-y-3">
                      {OTHER_FACTORS.map(factor => (
                        <div key={factor.value} className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.otherFactors.includes(factor.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, otherFactors: [...prev.otherFactors, factor.value] }));
                                } else {
                                  setFormData(prev => ({ ...prev, otherFactors: prev.otherFactors.filter((val: string) => val !== factor.value) }));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div className="text-sm text-gray-800">{factor.label}</div>
                          </label>

                          <div className="flex items-center gap-3">
                            {(factor.value === 'rigger' || factor.value === 'helper') ? (
                              <FormInput
                                type="number"
                                label=""
                                value={factor.value === 'rigger' ? (formData.riggerAmount ?? additionalParams?.riggerAmount ?? '') : (formData.helperAmount ?? additionalParams?.helperAmount ?? '')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  if (factor.value === 'rigger') setFormData(prev => ({ ...prev, riggerAmount: val }));
                                  else setFormData(prev => ({ ...prev, helperAmount: val }));
                                }}
                                placeholder="Enter amount"
                                className="w-32"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">—</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">Note: Prefilled values come from Configuration; modify per quotation as needed.</div>
                  </div>

                </div>
              </CardContent>
            </Card>
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
                  <QuotationSummary calculations={calculations} formData={formData} additionalParams={additionalParams} />
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

                  {/* Action Buttons - Moved below QuotationSummary */}
                  <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/quotations')}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSaving || (formData.selectedMachines.length === 0 && !formData.selectedEquipment.id)}
                      className="w-full bg-primary-600 hover:bg-primary-700"
                      leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
                      variant="accent"
                    >
                      {isSaving ? 'Saving...' : quotationId ? 'Update Quotation' : 'Create Quotation'}
                    </Button>
                    {formData.selectedMachines.length === 0 && !formData.selectedEquipment.id && (
                      <div className="text-xs text-center text-amber-600">
                        Please add at least one machine
                      </div>
                    )}
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
