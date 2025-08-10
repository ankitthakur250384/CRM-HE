import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { 
  FileText, 
  User, 
  Building, 
  Truck, 
  Calculator, 
  IndianRupee, 
  Calendar, 
  MapPin,
  Settings,
  AlertTriangle,
  Users,
  Clock
} from 'lucide-react';

interface PrintOption {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  defaultChecked: boolean;
}

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedOptions: string[]) => void;
}

const PRINT_OPTIONS: PrintOption[] = [
  // Customer Information
  {
    id: 'customer_details',
    label: 'Customer Details',
    description: 'Customer name, contact information, and address',
    category: 'Customer Information',
    icon: <User className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'company_info',
    label: 'Company Information',
    description: 'Company name and business details',
    category: 'Customer Information',
    icon: <Building className="w-4 h-4" />,
    defaultChecked: true
  },
  
  // Project Details
  {
    id: 'project_duration',
    label: 'Project Duration',
    description: 'Number of days and working hours',
    category: 'Project Details',
    icon: <Calendar className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'site_location',
    label: 'Site Location & Distance',
    description: 'Work site location and distance from base',
    category: 'Project Details',
    icon: <MapPin className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'shift_details',
    label: 'Shift & Working Hours',
    description: 'Shift type, day/night, and working schedule',
    category: 'Project Details',
    icon: <Clock className="w-4 h-4" />,
    defaultChecked: true
  },
  
  // Equipment Information
  {
    id: 'equipment_list',
    label: 'Equipment List',
    description: 'Selected machines and equipment details',
    category: 'Equipment Information',
    icon: <Truck className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'equipment_rates',
    label: 'Equipment Base Rates',
    description: 'Base rental rates for each equipment',
    category: 'Equipment Information',
    icon: <IndianRupee className="w-4 h-4" />,
    defaultChecked: false
  },
  
  // Cost Breakdown
  {
    id: 'working_cost',
    label: 'Working Cost',
    description: 'Basic working cost calculation',
    category: 'Cost Breakdown',
    icon: <Calculator className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'food_accommodation',
    label: 'Food & Accommodation',
    description: 'Food and accommodation charges',
    category: 'Cost Breakdown',
    icon: <Users className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'mob_demob',
    label: 'Mobilization/Demobilization',
    description: 'Transportation and setup costs',
    category: 'Cost Breakdown',
    icon: <Truck className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'risk_usage',
    label: 'Risk & Usage Factors',
    description: 'Risk assessment and usage load factors',
    category: 'Cost Breakdown',
    icon: <AlertTriangle className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'extra_charges',
    label: 'Extra Commercial Charges',
    description: 'Additional commercial charges',
    category: 'Cost Breakdown',
    icon: <IndianRupee className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'incidental_charges',
    label: 'Incidental Charges',
    description: 'Miscellaneous and incidental costs',
    category: 'Cost Breakdown',
    icon: <Settings className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'other_factors',
    label: 'Other Factors',
    description: 'Rigger, helper, and other operational factors',
    category: 'Cost Breakdown',
    icon: <Users className="w-4 h-4" />,
    defaultChecked: true
  },
  
  // Financial Summary
  {
    id: 'cost_summary',
    label: 'Cost Summary',
    description: 'Detailed breakdown of all costs',
    category: 'Financial Summary',
    icon: <Calculator className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'gst_details',
    label: 'GST Details',
    description: 'GST calculation and total amount',
    category: 'Financial Summary',
    icon: <IndianRupee className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'total_amount',
    label: 'Total Amount',
    description: 'Final total amount including all charges',
    category: 'Financial Summary',
    icon: <IndianRupee className="w-4 h-4" />,
    defaultChecked: true
  },
  
  // Terms & Conditions
  {
    id: 'terms_conditions',
    label: 'Terms & Conditions',
    description: 'Payment terms and business conditions',
    category: 'Terms & Conditions',
    icon: <FileText className="w-4 h-4" />,
    defaultChecked: true
  },
  {
    id: 'payment_terms',
    label: 'Payment Terms',
    description: 'Payment schedule and billing details',
    category: 'Terms & Conditions',
    icon: <IndianRupee className="w-4 h-4" />,
    defaultChecked: true
  }
];

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onClose,
  onPrint
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    PRINT_OPTIONS.filter(option => option.defaultChecked).map(option => option.id)
  );

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOptions(PRINT_OPTIONS.map(option => option.id));
  };

  const handleDeselectAll = () => {
    setSelectedOptions([]);
  };

  const handlePrint = () => {
    onPrint(selectedOptions);
    onClose();
  };

  const groupedOptions = PRINT_OPTIONS.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, PrintOption[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Options" size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Select the information you want to include in your quotation print:
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-4">
          {Object.entries(groupedOptions).map(([category, options]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-gray-900">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {options.map(option => (
                    <div key={option.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleOptionToggle(option.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={option.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {option.icon}
                          <span className="text-sm font-medium text-gray-900">
                            {option.label}
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Selected: {selectedOptions.length} of {PRINT_OPTIONS.length} options
            </span>
          </div>
          <p className="text-xs text-blue-700">
            Your quotation will be generated with the selected information. 
            You can always come back and modify these settings for future prints.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={selectedOptions.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Generate PDF ({selectedOptions.length} items)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
