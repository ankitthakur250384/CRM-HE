// @ts-nocheck
import { useState, useEffect } from 'react';
import { Save, RefreshCw, Percent, AlertTriangle, Clock, Moon, Wrench } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { getAdditionalParamsConfig, updateAdditionalParamsConfig } from '../../services/configService';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';

export function AdditionalParamsConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [params, setParams] = useState({
    usageFactors: {
      normal: 1.0,
      medium: 1.2,
      heavy: 1.5
    },
    riskFactors: {
      low: 0,
      medium: 8000,
      high: 15000
    },
    shiftFactors: {
      single: 1.0,
      double: 1.8
    },
    dayNightFactors: {
      day: 1.0,
      night: 1.3
    },
    // default incidental options
    incidentalOptions: [
      { value: 'incident1', label: 'Incident 1', amount: 5000 },
      { value: 'incident2', label: 'Incident 2', amount: 10000 },
      { value: 'incident3', label: 'Incident 3', amount: 15000 }
    ],
    // keep rigger/helper defaults if needed
    riggerAmount: 40000,
    helperAmount: 12000
  });

  const [errors, setErrors] = useState({});

  const [toast, setToast] = useState({
    show: false,
    title: '',
    variant: undefined
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const config = await getAdditionalParamsConfig();
      
      // Ensure we have default values for all required fields
      const safeConfig = {
        ...params, // Start with current default values
        ...config, // Override with any values from API
        // Ensure nested objects have defaults if missing
        usageFactors: {
          ...params.usageFactors,
          ...(config?.usageFactors || {})
        },
        riskFactors: {
          ...params.riskFactors,
          ...(config?.riskFactors || {})
        },
        shiftFactors: {
          ...params.shiftFactors,
          ...(config?.shiftFactors || {})
        },
        dayNightFactors: {
          ...params.dayNightFactors,
          ...(config?.dayNightFactors || {})
        },
        incidentalOptions: config?.incidentalOptions && Array.isArray(config.incidentalOptions) ? config.incidentalOptions : params.incidentalOptions,
        riggerAmount: config?.riggerAmount ?? params.riggerAmount,
        helperAmount: config?.helperAmount ?? params.helperAmount
      };
      
      setParams(safeConfig);
    } catch (error) {
      // Keep using default values defined in useState
      showToast('Error loading configuration, using defaults', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (title, variant = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const validate = () => {
    const newErrors = {};
    // Validate incidental amounts
    (params.incidentalOptions || []).forEach((opt) => {
      if (opt.amount === undefined || opt.amount === null) {
        newErrors[opt.value] = 'Amount is required';
      } else if (Number(opt.amount) < 0) {
        newErrors[opt.value] = 'Amount cannot be negative';
      }
    });

    // rigger/helper amounts
    if (params.riggerAmount === undefined || params.riggerAmount === null) {
      newErrors['riggerAmount'] = 'Rigger amount is required';
    } else if (Number(params.riggerAmount) < 0) {
      newErrors['riggerAmount'] = 'Rigger amount cannot be negative';
    }
    if (params.helperAmount === undefined || params.helperAmount === null) {
      newErrors['helperAmount'] = 'Helper amount is required';
    } else if (Number(params.helperAmount) < 0) {
      newErrors['helperAmount'] = 'Helper amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!validate()) {
        showToast('Please fix validation errors before saving', 'error');
        return;
      }
      setIsSaving(true);
      // Ensure incidentalOptions are numbers
      const normalized = {
        ...params,
        incidentalOptions: (params.incidentalOptions || []).map((o) => ({ ...o, amount: Number(o.amount) })) ,
        riggerAmount: Number(params.riggerAmount),
        helperAmount: Number(params.helperAmount)
      };
      await updateAdditionalParamsConfig(normalized);
      showToast('Parameters updated successfully');
    } catch (error) {
      showToast('Error saving parameters', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
    }

    const RateInput = ({
        value,
        onChange,
        label,
        isPercentage = false,
        errorKey
    }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <div className="relative mt-1">
                {!isPercentage && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                )}
                <Input
                    type="number"
                    value={value ?? ''} // ✅ Ensures input is always controlled (prevents cursor jump)
                    onChange={(e) => {
                        const raw = e.target.value; // ✅ Capture raw string
                        const parsed = parseFloat(raw); // ✅ Parse safely
                        onChange(raw === '' ? '' : isNaN(parsed) ? 0 : parsed); // ✅ Allow clearing, prevent NaN
                    }}
                    className={isPercentage ? "pr-8" : "pl-7"}
                    min="0"
                />
                {isPercentage && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Percent className="h-4 w-4 text-gray-400" />
                    </div>
                )}
            </div>
            {errorKey && errors?.[errorKey] && ( // ✅ Optional chaining prevents crash if errors is undefined
                <div className="text-xs text-red-600 mt-1">{errors[errorKey]}</div>
            )}
        </div>
    );



  const setIncidentAmount = (key, amount) => {
    setParams((prev) => {
      const opts = Array.isArray(prev.incidentalOptions) ? [...prev.incidentalOptions] : [];
      const idx = opts.findIndex((o) => o.value === key);
      const normalizedAmount = amount === null ? 0 : Number(amount);
      if (idx >= 0) {
        opts[idx] = { ...opts[idx], amount: normalizedAmount };
      } else {
        opts.push({ value: key, label: key, amount: normalizedAmount });
      }
      return { ...prev, incidentalOptions: opts };
    });
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Rates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-500" />
              <CardTitle>Usage Rates</CardTitle>
            </div>
          </CardHeader>          <CardContent className="space-y-4">
            <RateInput
              label="Normal Usage Factor"
              value={params.usageFactors.normal}
              onChange={(value) => setParams(prev => ({
                ...prev,
                usageFactors: { ...prev.usageFactors, normal: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Medium Usage Factor"
              value={params.usageFactors.medium}
              onChange={(value) => setParams(prev => ({
                ...prev,
                usageFactors: { ...prev.usageFactors, medium: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Heavy Usage Factor"
              value={params.usageFactors.heavy}
              onChange={(value) => setParams(prev => ({
                ...prev,
                usageFactors: { ...prev.usageFactors, heavy: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <CardTitle>Risk Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Low Risk"
              value={params.riskFactors.low}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, low: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Medium Risk"
              value={params.riskFactors.medium}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, medium: value }
              }))}
              isPercentage
            />
            <RateInput
              label="High Risk"
              value={params.riskFactors.high}
              onChange={(value) => setParams(prev => ({
                ...prev,
                riskFactors: { ...prev.riskFactors, high: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>        {/* Shift Factors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              <CardTitle>Shift Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Single Shift"
              value={params.shiftFactors.single}
              onChange={(value) => setParams(prev => ({
                ...prev,
                shiftFactors: { ...prev.shiftFactors, single: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Double Shift"
              value={params.shiftFactors.double}
              onChange={(value) => setParams(prev => ({
                ...prev,
                shiftFactors: { ...prev.shiftFactors, double: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>

        {/* Other Factors */}        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary-500" />
              <CardTitle>Day/Night Factors</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Day Factor"
              value={params.dayNightFactors.day}
              onChange={(value) => setParams(prev => ({
                ...prev,
                dayNightFactors: { ...prev.dayNightFactors, day: value }
              }))}
              isPercentage
            />
            <RateInput
              label="Night Factor"
              value={params.dayNightFactors.night}
              onChange={(value) => setParams(prev => ({
                ...prev,
                dayNightFactors: { ...prev.dayNightFactors, night: value }
              }))}
              isPercentage
            />
          </CardContent>
        </Card>

        {/* Incidental Charges Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <CardTitle>Incidental Charges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.incidentalOptions?.map((opt) => (
              <div key={opt.value} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{opt.label}</label>
                  <div className="text-xs text-gray-500">Default: ₹{opt.amount?.toLocaleString('en-IN') || 0}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={opt.amount}
                    onChange={(e) => setIncidentAmount(opt.value, Number(e.target.value))}
                    className="w-40"
                  />
                  {errors[opt.value] && <div className="text-xs text-red-600">{errors[opt.value]}</div>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rigger & Helper Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <CardTitle>Rigger & Helper Charges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RateInput
              label="Rigger Default Amount"
              value={params.riggerAmount}
              onChange={(value) => setParams(prev => ({ ...prev, riggerAmount: value }))}
              errorKey={'riggerAmount'}
            />
            <RateInput
              label="Helper Default Amount"
              value={params.helperAmount}
              onChange={(value) => setParams(prev => ({ ...prev, helperAmount: value }))}
              errorKey={'helperAmount'}
            />
          </CardContent>
        </Card>

      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
      </div>

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