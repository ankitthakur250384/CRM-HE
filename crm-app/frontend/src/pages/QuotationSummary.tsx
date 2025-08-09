import React from 'react';
import { Clock, Users, Truck, AlertTriangle, IndianRupee, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface QuotationSummaryProps {
  calculations: any;
  formData: any;
  additionalParams: any;
  showGst?: boolean;
}

const INCIDENTAL_OPTIONS = [
  { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
  { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
  { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
];

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({ calculations, formData, additionalParams, showGst = true }) => (
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
        {formatCurrency(formData.incidentalCharges.reduce((sum: number, val: string) => {
          const found = INCIDENTAL_OPTIONS.find((opt: any) => opt.value === val);
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
    <div className="mt-6 pt-4 border-t border-gray-200">
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-700">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-900">{formatCurrency(calculations.totalAmount - calculations.gstAmount)}</span>
        </div>
        {showGst && formData.includeGst && (
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
    </div>
  </div>
);
