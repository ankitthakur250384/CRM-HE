import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { FormInput } from '../components/common/FormInput';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { updateQuotationConfig } from '../services/configService';
import { useQuotationConfigStore } from '../store/quotationConfigStore';

export function QuotationConfig() {
  const { orderTypeLimits, fetchConfig, updateConfig } = useQuotationConfigStore();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; variant?: 'success' | 'error' }>({
    show: false,
    title: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, variant });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate the configuration
      const orderTypes = ['micro', 'small', 'monthly', 'yearly'] as const;
      let isValid = true;
      let previousMax = 0;

      for (const type of orderTypes) {
        const config = orderTypeLimits[type];
        if (config.minDays <= previousMax) {
          showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} minimum days must be greater than previous maximum`, 'error');
          isValid = false;
          break;
        }
        if (config.maxDays <= config.minDays) {
          showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} maximum days must be greater than minimum days`, 'error');
          isValid = false;
          break;
        }
        previousMax = config.maxDays;
      }

      if (!isValid) {
        return;
      }

      await updateQuotationConfig({
        orderTypeLimits
      });

      // Update the store with new values
      updateConfig(orderTypeLimits);
      
      showToast('Configuration saved successfully');
    } catch (error) {
      showToast('Error saving configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    orderType: keyof typeof orderTypeLimits,
    field: 'minDays' | 'maxDays',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    const newLimits = {
      ...orderTypeLimits,
      [orderType]: {
        ...orderTypeLimits[orderType],
        [field]: numValue
      }
    };
    updateConfig(newLimits);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['micro', 'small', 'monthly', 'yearly'] as const).map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type} Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormInput
                type="number"
                label="Minimum Days"
                value={orderTypeLimits[type].minDays}
                onChange={(e) => handleInputChange(type, 'minDays', e.target.value)}
                min="1"
              />
              <FormInput
                type="number"
                label="Maximum Days"
                value={orderTypeLimits[type].maxDays}
                onChange={(e) => handleInputChange(type, 'maxDays', e.target.value)}
                min={orderTypeLimits[type].minDays + 1}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          leftIcon={isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
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