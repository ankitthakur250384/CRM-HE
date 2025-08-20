import React from 'react';
import { Clock, Users, Truck, AlertTriangle, IndianRupee, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface QuotationSummaryProps {
  calculations: any;
  formData: any;
  additionalParams?: any;
  showGst?: boolean;
}

export const QuotationSummary: React.FC<QuotationSummaryProps> = ({ calculations, formData, showGst = true }) => {
  // Ensure calculations are properly structured
  const safeCalculations = {
    workingCost: calculations?.workingCost || 0,
    foodAccomCost: calculations?.foodAccomCost || 0,
    transportCost: calculations?.transportCost || 0,
    mobDemobCost: calculations?.mobDemobCost || 0,
    riskAdjustment: calculations?.riskAdjustment || 0,
    usageLoadFactor: calculations?.usageLoadFactor || 0,
    extraCharges: calculations?.extraCharges || 0,
    incidentalCost: calculations?.incidentalCost || 0,
    otherFactorsCost: calculations?.otherFactorsCost || 0,
    subtotal: calculations?.subtotal || 0,
    gstAmount: calculations?.gstAmount || 0,
    totalAmount: calculations?.totalAmount || 0
  };

  // Log for debugging
  console.log('QuotationSummary received calculations:', calculations);
  console.log('Using safe calculations:', safeCalculations);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Working Cost</span>
        </div>
        <span className="font-bold text-blue-900">{formatCurrency(safeCalculations.workingCost)}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Food & Accommodation</span>
        </div>
        <span className="font-bold text-green-900">{formatCurrency(safeCalculations.foodAccomCost)}</span>
      </div>
      
      {safeCalculations.transportCost > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Transport Cost</span>
          </div>
          <span className="font-bold text-purple-900">{formatCurrency(safeCalculations.transportCost)}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-gray-900">Mob/Demob Cost</span>
        </div>
        <span className="font-bold text-orange-900">{formatCurrency(safeCalculations.mobDemobCost)}</span>
      </div>
      
      {(safeCalculations.riskAdjustment > 0 || safeCalculations.usageLoadFactor > 0) && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-gray-900">Risk & Usage</span>
          </div>
          <span className="font-bold text-red-900">{formatCurrency(safeCalculations.riskAdjustment + safeCalculations.usageLoadFactor)}</span>
        </div>
      )}
      
      {safeCalculations.extraCharges > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Extra Commercial Charges</span>
          </div>
          <span className="font-bold text-purple-900">{formatCurrency(safeCalculations.extraCharges)}</span>
        </div>
      )}
      
      {safeCalculations.incidentalCost > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">Incidental Charges</span>
          </div>
          <span className="font-bold text-indigo-900">{formatCurrency(safeCalculations.incidentalCost)}</span>
        </div>
      )}
      
      {safeCalculations.otherFactorsCost > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-medium text-gray-900">Other Factors</span>
          </div>
          <span className="font-bold text-cyan-900">{formatCurrency(safeCalculations.otherFactorsCost)}</span>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">{formatCurrency(safeCalculations.totalAmount - safeCalculations.gstAmount)}</span>
          </div>
          {showGst && formData?.includeGst && safeCalculations.gstAmount > 0 && (
            <div className="flex justify-between text-sm text-gray-700">
              <span>GST (18%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(safeCalculations.gstAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-gray-300">
            <span className="text-lg font-bold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(safeCalculations.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
