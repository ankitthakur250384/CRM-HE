/**
 * Modern Template Builder - SOTA Implementation
 * Complete drag-and-drop template builder with preview, editing, and persistence
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Trash2, Move, Type, Database, Grid, Image, Minus, Save, Eye,
  FileText, Settings, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { ModernTemplate, TemplateElement } from '../../services/modernTemplateService';
import TemplatePreviewModal from './TemplatePreviewModal';

// Drag item types
const ItemTypes = {
  ELEMENT: 'element',
  PALETTE_ITEM: 'palette_item'
};

// Enhanced element interface with proper config typing
export interface EnhancedTemplateElement extends TemplateElement {
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right';
    border?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    maxWidth?: string;
    minHeight?: string;
  };
  config?: {
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
    // Table configuration
    columns?: string[];
    rows?: string[][];
    showHeader?: boolean;
    columnWidths?: string[];
    // Image configuration
    src?: string;
    alt?: string;
    uploadedFile?: File;
    aspectRatio?: string;
    // Enhanced configurations
    condition?: string;
    loopSource?: string;
    cssClasses?: string;
    attributes?: string;
    visibilityRules?: string;
    customCss?: string;
  };
}

interface ModernTemplateBuilderProps {
  template?: ModernTemplate;
  onSave: (template: Omit<ModernTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

// Enhanced palette items with SuiteCRM-inspired features
const paletteItems = [
  { 
    type: 'header', 
    label: 'Header Section', 
    icon: Type, 
    description: 'Company logo and title',
    defaultContent: 'Company Header',
    category: 'layout'
  },
  { 
    type: 'text', 
    label: 'Text Block', 
    icon: Type, 
    description: 'Add custom text content',
    defaultContent: 'Your text content here',
    category: 'content'
  },
  { 
    type: 'field', 
    label: 'Dynamic Field', 
    icon: Database, 
    description: 'Insert quotation data',
    defaultContent: '{{customer_name}}',
    category: 'data'
  },
  { 
    type: 'calculation', 
    label: 'Calculation Field', 
    icon: Database, 
    description: 'Auto-calculated values',
    defaultContent: '{{total_amount}}',
    category: 'data'
  },
  { 
    type: 'conditional', 
    label: 'Conditional Block', 
    icon: Database, 
    description: 'Show/hide based on conditions',
    defaultContent: 'Content shown if condition is met',
    category: 'logic'
  },
  { 
    type: 'loop', 
    label: 'Repeating Section', 
    icon: Grid, 
    description: 'Loop through equipment items',
    defaultContent: 'Repeating content for each item',
    category: 'logic'
  },
  { 
    type: 'table', 
    label: 'Data Table', 
    icon: Grid, 
    description: 'Display equipment and pricing',
    defaultContent: 'Equipment Table',
    category: 'data'
  },
  { 
    type: 'signature', 
    label: 'Signature Block', 
    icon: Type, 
    description: 'Signature and approval area',
    defaultContent: 'Authorized Signature',
    category: 'content'
  },
  { 
    type: 'terms', 
    label: 'Terms & Conditions', 
    icon: FileText, 
    description: 'Legal terms and conditions',
    defaultContent: `TERMS AND CONDITIONS

1. SCOPE OF WORK
   - Equipment will be provided as per specifications mentioned in the quotation
   - Services include transportation, installation, and operation as agreed
   - Any additional work will be charged separately

2. PAYMENT TERMS
   - 30% advance payment before commencement of work
   - 40% payment upon delivery and installation
   - 30% payment upon completion of work
   - Payment to be made within 30 days of invoice date

3. LIABILITY
   - Company liability limited to equipment malfunction due to manufacturing defects
   - Client responsible for site safety and security
   - Insurance coverage as per applicable regulations

4. CANCELLATION
   - 48 hours notice required for cancellation
   - Cancellation charges may apply as per company policy
   - Advance payments are non-refundable after work commencement

5. FORCE MAJEURE
   - Company not liable for delays due to circumstances beyond control
   - Includes natural disasters, strikes, government regulations, etc.

For complete terms and conditions, please contact our office.`,
    category: 'content'
  },
  { 
    type: 'image', 
    label: 'Image/Logo', 
    icon: Image, 
    description: 'Company logo or images',
    defaultContent: 'Image Placeholder',
    category: 'content'
  },
  { 
    type: 'spacer', 
    label: 'Spacer', 
    icon: Minus, 
    description: 'Add vertical spacing',
    defaultContent: '',
    category: 'layout'
  },
  { 
    type: 'qr_code', 
    label: 'QR Code', 
    icon: Grid, 
    description: 'Generate QR code',
    defaultContent: 'QR Code for quotation',
    category: 'content'
  },
  { 
    type: 'barcode', 
    label: 'Barcode', 
    icon: Minus, 
    description: 'Generate barcode',
    defaultContent: 'Quotation barcode',
    category: 'content'
  }
] as const;

// Enhanced field options with more comprehensive data
const enhancedFieldOptions = [
  // Company Information
  { category: 'Company', value: '{{company_name}}', label: 'Company Name', description: 'Your company name' },
  { category: 'Company', value: '{{company_address}}', label: 'Company Address', description: 'Full company address' },
  { category: 'Company', value: '{{company_phone}}', label: 'Company Phone', description: 'Primary contact number' },
  { category: 'Company', value: '{{company_email}}', label: 'Company Email', description: 'Primary email address' },
  { category: 'Company', value: '{{company_website}}', label: 'Company Website', description: 'Company website URL' },
  { category: 'Company', value: '{{company_gst}}', label: 'Company GST', description: 'GST registration number' },
  { category: 'Company', value: '{{company_pan}}', label: 'Company PAN', description: 'PAN card number' },
  
  // Customer Information
  { category: 'Customer', value: '{{customer_name}}', label: 'Customer Name', description: 'Customer/client name' },
  { category: 'Customer', value: '{{customer_address}}', label: 'Customer Address', description: 'Customer address' },
  { category: 'Customer', value: '{{customer_phone}}', label: 'Customer Phone', description: 'Customer contact number' },
  { category: 'Customer', value: '{{customer_email}}', label: 'Customer Email', description: 'Customer email address' },
  { category: 'Customer', value: '{{customer_gst}}', label: 'Customer GST', description: 'Customer GST number' },
  { category: 'Customer', value: '{{customer_contact_person}}', label: 'Contact Person', description: 'Primary contact person' },
  
  // Quotation Details
  { category: 'Quotation', value: '{{quotation_number}}', label: 'Quotation Number', description: 'Unique quotation ID' },
  { category: 'Quotation', value: '{{quotation_date}}', label: 'Quotation Date', description: 'Date of quotation' },
  { category: 'Quotation', value: '{{quotation_validity}}', label: 'Quotation Validity', description: 'Valid until date' },
  { category: 'Quotation', value: '{{quotation_ref}}', label: 'Reference Number', description: 'Reference or PO number' },
  { category: 'Quotation', value: '{{quotation_subject}}', label: 'Subject', description: 'Quotation subject/title' },
  
  // Financial Information
  { category: 'Financial', value: '{{subtotal_amount}}', label: 'Subtotal Amount', description: 'Amount before tax' },
  { category: 'Financial', value: '{{gst_amount}}', label: 'GST Amount', description: 'Total GST amount' },
  { category: 'Financial', value: '{{discount_amount}}', label: 'Discount Amount', description: 'Total discount given' },
  { category: 'Financial', value: '{{total_amount}}', label: 'Total Amount', description: 'Final total amount' },
  { category: 'Financial', value: '{{total_amount_words}}', label: 'Amount in Words', description: 'Total amount in words' },
  { category: 'Financial', value: '{{advance_amount}}', label: 'Advance Amount', description: 'Advance payment required' },
  
  // Project Details
  { category: 'Project', value: '{{project_name}}', label: 'Project Name', description: 'Name of the project' },
  { category: 'Project', value: '{{project_location}}', label: 'Project Location', description: 'Work site location' },
  { category: 'Project', value: '{{project_duration}}', label: 'Project Duration', description: 'Total project duration' },
  { category: 'Project', value: '{{start_date}}', label: 'Start Date', description: 'Project start date' },
  { category: 'Project', value: '{{end_date}}', label: 'End Date', description: 'Project end date' },
  
  // Equipment Calculations
  { category: 'Calculations', value: '{{working_cost}}', label: 'Working Cost', description: 'Total working cost' },
  { category: 'Calculations', value: '{{mob_demob_cost}}', label: 'Mobilization Cost', description: 'Mobilization/demobilization cost' },
  { category: 'Calculations', value: '{{food_accom_cost}}', label: 'Food & Accommodation', description: 'Food and accommodation cost' },
  { category: 'Calculations', value: '{{fuel_cost}}', label: 'Fuel Cost', description: 'Total fuel cost' },
  { category: 'Calculations', value: '{{operator_cost}}', label: 'Operator Cost', description: 'Operator charges' },
  { category: 'Calculations', value: '{{transport_cost}}', label: 'Transport Cost', description: 'Transportation charges' },
  { category: 'Calculations', value: '{{number_of_days}}', label: 'Number of Days', description: 'Total working days' },
  
  // Dates and Times
  { category: 'DateTime', value: '{{current_date}}', label: 'Current Date', description: 'Today\'s date' },
  { category: 'DateTime', value: '{{current_time}}', label: 'Current Time', description: 'Current time' },
  { category: 'DateTime', value: '{{created_date}}', label: 'Created Date', description: 'Quotation creation date' },
  { category: 'DateTime', value: '{{last_modified}}', label: 'Last Modified', description: 'Last modification date' },
  
  // User Information
  { category: 'User', value: '{{created_by}}', label: 'Created By', description: 'User who created quotation' },
  { category: 'User', value: '{{sales_person}}', label: 'Sales Person', description: 'Assigned sales person' },
  { category: 'User', value: '{{manager}}', label: 'Manager', description: 'Reporting manager' }
];

// Template themes for quick styling
const templateThemes = [
  {
    id: 'professional',
    name: 'Professional Blue',
    description: 'Clean blue theme for corporate quotations',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f1f5f9',
      text: '#1e293b',
      background: '#ffffff'
    },
    fonts: {
      heading: 'font-bold text-lg',
      body: 'font-normal text-sm',
      small: 'font-normal text-xs'
    }
  },
  {
    id: 'modern',
    name: 'Modern Orange',
    description: 'Contemporary orange theme with clean lines',
    colors: {
      primary: '#ea580c',
      secondary: '#78716c',
      accent: '#fef7ed',
      text: '#292524',
      background: '#ffffff'
    },
    fonts: {
      heading: 'font-bold text-lg',
      body: 'font-normal text-sm',
      small: 'font-normal text-xs'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant Black',
    description: 'Sophisticated black and gold theme',
    colors: {
      primary: '#1f2937',
      secondary: '#d97706',
      accent: '#f9fafb',
      text: '#111827',
      background: '#ffffff'
    },
    fonts: {
      heading: 'font-bold text-lg',
      body: 'font-normal text-sm',
      small: 'font-normal text-xs'
    }
  }
];

// Element templates for quick insertion
const elementTemplates = [
  {
    id: 'responsive_professional',
    name: 'Responsive Professional Template',
    description: 'Complete responsive professional quotation template',
    elements: [
      {
        type: 'header',
        content: 'QUOTATION',
        style: { 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#222', 
          textAlign: 'center', 
          margin: '0 0 20px 0', 
          padding: '10px 0', 
          borderBottom: '3px solid #444' 
        }
      },
      {
        type: 'image',
        content: 'Company Logo',
        config: { src: '/logo-placeholder.png', alt: 'Company Logo', maxWidth: '100px' },
        style: { textAlign: 'center', margin: '0 0 10px 0' }
      },
      {
        type: 'text',
        content: '<strong>{{company.name}}</strong><br>{{company.address}}<br>Phone: {{company.phone}} | Email: {{company.email}} | Website: {{company.website}}',
        style: { fontSize: '14px', margin: '0 0 20px 0', padding: '10px', backgroundColor: '#f9f9f9' }
      },
      {
        type: 'text',
        content: '<p><strong>Quotation No:</strong> {{quotation.number}}</p><p><strong>Date:</strong> {{quotation.date}}</p><p><strong>Validity:</strong> {{quotation.validity}}</p>',
        style: { fontSize: '14px', margin: '0 0 20px 0', padding: '10px', backgroundColor: '#eef', borderRadius: '6px' }
      },
      {
        type: 'text',
        content: '<p><strong>To:</strong></p><p>{{customer.name}}<br>{{customer.company}}<br>{{customer.email}}</p>',
        style: { fontSize: '14px', margin: '0 0 20px 0' }
      },
      {
        type: 'table',
        content: 'Equipment & Services',
        config: {
          columns: ['Description', 'Quantity', 'Unit Price', 'Total'],
          rows: [['{{equipment.name}}', '{{equipment.quantity}}', '{{equipment.rate}}', '{{equipment.total}}']],
          showHeader: true,
          responsive: true
        },
        style: { width: '100%', margin: '0 0 20px 0', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }
      },
      {
        type: 'text',
        content: '<div style="text-align: right; font-weight: bold; font-size: 16px; padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6;"><strong>Grand Total: ₹{{quotation.total}}</strong></div>',
        style: { margin: '10px 0 20px 0' }
      },
      {
        type: 'text',
        content: '<div style="background: #fef7e0; padding: 15px; border-left: 4px solid #f1c40f; font-size: 13px;"><p><strong>Terms & Conditions:</strong></p><p>{{terms}}</p></div>',
        style: { margin: '20px 0' }
      },
      {
        type: 'text',
        content: '<div style="margin-top: 40px; text-align: right; font-style: italic; font-size: 14px;"><p>Authorized Signatory</p><p>[Company Stamp / Signature]</p></div>',
        style: { margin: '40px 0 0 0' }
      }
    ]
  },
  {
    id: 'company_header',
    name: 'Company Header Block',
    description: 'Complete company header with logo and details',
    elements: [
      {
        type: 'header',
        content: '{{company_name}}',
        style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0' }
      },
      {
        type: 'text',
        content: '{{company_address}} | Phone: {{company_phone}} | Email: {{company_email}}',
        style: { fontSize: '12px', textAlign: 'center', color: '#666666' }
      }
    ]
  },
  {
    id: 'quotation_details',
    name: 'Quotation Details Block',
    description: 'Standard quotation information section',
    elements: [
      {
        type: 'text',
        content: 'QUOTATION',
        style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0' }
      },
      {
        type: 'field',
        content: 'Quotation No: {{quotation_number}}'
      },
      {
        type: 'field',
        content: 'Date: {{quotation_date}}'
      },
      {
        type: 'field',
        content: 'Valid Until: {{quotation_validity}}'
      }
    ]
  },
  {
    id: 'customer_details',
    name: 'Customer Details Block',
    description: 'Customer information section',
    elements: [
      {
        type: 'text',
        content: 'BILL TO:',
        style: { fontWeight: 'bold', margin: '15px 0 5px 0' }
      },
      {
        type: 'field',
        content: '{{customer_name}}'
      },
      {
        type: 'field',
        content: '{{customer_address}}'
      },
      {
        type: 'field',
        content: 'Phone: {{customer_phone}}'
      }
    ]
  }
];

// Enhanced field options with better organization
const fieldOptions = enhancedFieldOptions;

// Table field options for dynamic table content (used in advanced table editing)
/*
const tableFieldOptions = [
  { value: '{{item_name}}', label: 'Item/Equipment Name' },
  { value: '{{item_description}}', label: 'Item Description' },
  { value: '{{item_model}}', label: 'Model/Type' },
  { value: '{{item_capacity}}', label: 'Capacity/Specification' },
  { value: '{{item_quantity}}', label: 'Quantity' },
  { value: '{{item_unit}}', label: 'Unit (hrs/days/months)' },
  { value: '{{item_rate}}', label: 'Rate per Unit' },
  { value: '{{item_amount}}', label: 'Line Amount' },
  { value: '{{item_duration}}', label: 'Duration' },
  { value: '{{item_location}}', label: 'Location' },
  { value: '{{item_operator}}', label: 'Operator Required' },
  { value: '{{item_fuel}}', label: 'Fuel Included' },
  { value: '{{item_transport}}', label: 'Transport Cost' },
  { value: '{{item_tax}}', label: 'Tax %' },
  { value: '{{item_remarks}}', label: 'Remarks/Notes' }
];
*/

// Enhanced Palette Item with categories
function PaletteItem({ item }: { item: typeof paletteItems[number] }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PALETTE_ITEM,
    item: { elementType: item.type, defaultContent: item.defaultContent },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const IconComponent = item.icon;
  
  // Category colors
  const categoryColors = {
    content: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    data: 'border-green-200 bg-green-50 hover:border-green-300',
    layout: 'border-purple-200 bg-purple-50 hover:border-purple-300',
    logic: 'border-orange-200 bg-orange-50 hover:border-orange-300'
  };

  return (
    <div 
      ref={drag}
      className={`
        cursor-move p-3 border rounded-lg shadow-sm
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${categoryColors[item.category] || 'border-gray-200 bg-white hover:border-gray-300'}
      `}
    >
      <div className="flex items-center gap-3">
        <IconComponent size={20} className="text-gray-700" />
        <div>
          <div className="font-medium text-sm text-gray-900">{item.label}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
      </div>
    </div>
  );
}

// Variable Insertion Panel - SuiteCRM inspired
function VariablePanel({ onInsertVariable }: { onInsertVariable: (variable: string) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Company');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [...new Set(fieldOptions.map(field => field.category))];
  
  const filteredFields = fieldOptions.filter(field => {
    const matchesCategory = selectedCategory === 'All' || field.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Insert Variables</h3>
        
        {/* Search */}
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search variables..."
          className="mb-3"
        />
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {['All', ...categories].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Variable List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFields.map((field, index) => (
          <div
            key={index}
            onClick={() => onInsertVariable(field.value)}
            className="p-2 rounded cursor-pointer hover:bg-gray-50 border-b border-gray-100"
          >
            <div className="font-medium text-sm text-gray-900">{field.label}</div>
            <div className="text-xs text-gray-500 mb-1">{field.description}</div>
            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Theme Selector Panel
function ThemePanel({ onApplyTheme }: { onApplyTheme: (theme: typeof templateThemes[0]) => void }) {
  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">Template Themes</h3>
      <div className="space-y-2">
        {templateThemes.map(theme => (
          <div
            key={theme.id}
            onClick={() => onApplyTheme(theme)}
            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: theme.colors.primary }}
              ></div>
              <div className="font-medium text-sm">{theme.name}</div>
            </div>
            <div className="text-xs text-gray-500">{theme.description}</div>
            <div className="flex gap-1 mt-2">
              {Object.values(theme.colors).slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Element Template Panel  
function ElementTemplatePanel({ onInsertTemplate }: { onInsertTemplate: (template: typeof elementTemplates[0]) => void }) {
  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">Quick Templates</h3>
      <div className="space-y-2">
        {elementTemplates.map(template => (
          <div
            key={template.id}
            onClick={() => onInsertTemplate(template)}
            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="font-medium text-sm text-gray-900">{template.name}</div>
            <div className="text-xs text-gray-500 mt-1">{template.description}</div>
            <div className="text-xs text-blue-600 mt-2">{template.elements.length} elements</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Element editor panel with SuiteCRM-inspired features
function ElementEditor({ 
  element, 
  onUpdate, 
  onClose 
}: { 
  element: EnhancedTemplateElement;
  onUpdate: (updates: Partial<EnhancedTemplateElement>) => void;
  onClose: () => void;
}) {
  const [localElement, setLocalElement] = useState(element);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

  const handleStyleChange = (styleKey: string, value: string) => {
    setLocalElement(prev => ({
      ...prev,
      style: { ...prev.style, [styleKey]: value }
    }));
    setHasChanges(true);
  };

  const handleContentChange = (content: string) => {
    setLocalElement(prev => ({ ...prev, content }));
    setHasChanges(true);
  };

  const handleConfigChange = (configKey: string, value: any) => {
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, [configKey]: value }
    }));
    setHasChanges(true);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, src, uploadedFile: file }
      }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const addTableRow = () => {
    const columns = localElement.config?.columns || ['Column 1', 'Column 2', 'Column 3'];
    const newRow = new Array(columns.length).fill('');
    setLocalElement(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rows: [...(prev.config?.rows || []), newRow]
      }
    }));
    setHasChanges(true);
  };

  const addTableColumn = () => {
    const columns = localElement.config?.columns || [];
    const rows = localElement.config?.rows || [];
    setLocalElement(prev => ({
      ...prev,
      config: {
        ...prev.config,
        columns: [...columns, `Column ${columns.length + 1}`],
        rows: rows.map(row => [...row, ''])
      }
    }));
    setHasChanges(true);
  };

  const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
    const rows = [...(localElement.config?.rows || [])];
    rows[rowIndex][colIndex] = value;
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, rows }
    }));
    setHasChanges(true);
  };

  const updateTableHeader = (colIndex: number, value: string) => {
    const columns = [...(localElement.config?.columns || [])];
    columns[colIndex] = value;
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, columns }
    }));
    setHasChanges(true);
  };

  const removeTableRow = (rowIndex: number) => {
    if ((localElement.config?.rows?.length || 0) > 1) {
      const rows = localElement.config?.rows?.filter((_, index) => index !== rowIndex) || [];
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, rows }
      }));
      setHasChanges(true);
    }
  };

  const removeTableColumn = (colIndex: number) => {
    if ((localElement.config?.columns?.length || 0) > 1) {
      const columns = localElement.config?.columns?.filter((_, index) => index !== colIndex) || [];
      const rows = localElement.config?.rows?.map(row => 
        row.filter((_, index) => index !== colIndex)
      ) || [];
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, columns, rows }
      }));
      setHasChanges(true);
    }
  };

  const applyChanges = () => {
    onUpdate(localElement);
    setHasChanges(false);
  };

  const resetChanges = () => {
    setLocalElement(element);
    setHasChanges(false);
  };

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Element</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {/* Element Type Badge */}
        <div className="mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {localElement.type}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'content', label: 'Content' },
          { id: 'style', label: 'Style' },
          { id: 'advanced', label: 'Advanced' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              {localElement.type === 'field' ? (
                <select
                  value={localElement.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a field...</option>
                  {enhancedFieldOptions.map((field, index) => (
                    <option key={index} value={field.value}>
                      {field.label} - {field.value}
                    </option>
                  ))}
                </select>
              ) : (
                <TextArea
                  value={localElement.content || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={localElement.type === 'terms' ? 10 : 3}
                  className="w-full"
                  placeholder="Enter content..."
                />
              )}
            </div>

            {/* Conditional Content */}
            {localElement.type === 'conditional' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <Input
                  value={localElement.config?.condition || ''}
                  onChange={(e) => handleConfigChange('condition', e.target.value)}
                  placeholder="e.g., {{total_amount}} > 10000"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Show this content only when condition is true
                </p>
              </div>
            )}

            {/* Loop Configuration */}
            {localElement.type === 'loop' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loop Over</label>
                <select
                  value={localElement.config?.loopSource || ''}
                  onChange={(e) => handleConfigChange('loopSource', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select data source...</option>
                  <option value="equipment_items">Equipment Items</option>
                  <option value="services">Services</option>
                  <option value="additional_costs">Additional Costs</option>
                </select>
              </div>
            )}

            {/* Table Configuration */}
            {localElement.type === 'table' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Table Structure</h4>
                
                <div className="flex gap-2">
                  <button
                    onClick={addTableColumn}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Column
                  </button>
                  <button
                    onClick={addTableRow}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + Row
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Headers</label>
                  {(localElement.config?.columns || []).map((column: string, colIndex: number) => (
                    <div key={colIndex} className="flex gap-2 mb-2">
                      <Input
                        value={column}
                        onChange={(e) => updateTableHeader(colIndex, e.target.value)}
                        placeholder={`Column ${colIndex + 1}`}
                        className="flex-1 text-sm"
                      />
                      <button
                        onClick={() => removeTableColumn(colIndex)}
                        disabled={(localElement.config?.columns?.length || 0) <= 1}
                        className="px-2 py-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Data Rows</label>
                  {(localElement.config?.rows || []).map((row: string[], rowIndex: number) => (
                    <div key={rowIndex} className="border border-gray-200 rounded p-2 mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium">Row {rowIndex + 1}</span>
                        <button
                          onClick={() => removeTableRow(rowIndex)}
                          disabled={(localElement.config?.rows?.length || 0) <= 1}
                          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                      {row.map((cell: string, colIndex: number) => (
                        <Input
                          key={colIndex}
                          value={cell}
                          onChange={(e) => updateTableCell(rowIndex, colIndex, e.target.value)}
                          placeholder={`${localElement.config?.columns?.[colIndex] || `Column ${colIndex + 1}`}`}
                          className="mb-1 text-sm"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            {localElement.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {localElement.config?.src && (
                  <img
                    src={localElement.config.src}
                    alt="Preview"
                    className="mt-2 max-w-full h-20 object-contain border border-gray-200 rounded"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Typography */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Typography</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                  <select
                    value={localElement.style?.fontSize || '14px'}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="10px">10px</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                  <select
                    value={localElement.style?.fontWeight || 'normal'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                    <option value="bolder">Extra Bold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Alignment</h4>
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleStyleChange('textAlign', value)}
                    className={`p-2 border rounded ${
                      localElement.style?.textAlign === value
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Colors</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localElement.style?.color || '#000000'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded"
                    />
                    <Input
                      value={localElement.style?.color || '#000000'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localElement.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded"
                    />
                    <Input
                      value={localElement.style?.backgroundColor || '#ffffff'}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="flex-1 text-xs"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Spacing</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Padding</label>
                  <Input
                    value={localElement.style?.padding || '8px'}
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    className="w-full text-xs"
                    placeholder="8px"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Margin</label>
                  <Input
                    value={localElement.style?.margin || '4px 0'}
                    onChange={(e) => handleStyleChange('margin', e.target.value)}
                    className="w-full text-xs"
                    placeholder="4px 0"
                  />
                </div>
              </div>
            </div>

            {/* Borders */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Borders</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Border</label>
                  <Input
                    value={localElement.style?.border || ''}
                    onChange={(e) => handleStyleChange('border', e.target.value)}
                    className="w-full text-xs"
                    placeholder="1px solid #ddd"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                  <Input
                    value={localElement.style?.borderRadius || ''}
                    onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                    className="w-full text-xs"
                    placeholder="4px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* CSS Classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSS Classes</label>
              <Input
                value={localElement.config?.cssClasses || ''}
                onChange={(e) => handleConfigChange('cssClasses', e.target.value)}
                className="w-full"
                placeholder="custom-class another-class"
              />
              <p className="text-xs text-gray-500 mt-1">
                Space-separated CSS class names
              </p>
            </div>

            {/* Custom Attributes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Attributes</label>
              <TextArea
                value={localElement.config?.attributes || ''}
                onChange={(e) => handleConfigChange('attributes', e.target.value)}
                rows={3}
                className="w-full"
                placeholder='{"data-id": "custom-id", "title": "Custom title"}'
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON object with custom HTML attributes
              </p>
            </div>

            {/* Visibility Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility Rules</label>
              <TextArea
                value={localElement.config?.visibilityRules || ''}
                onChange={(e) => handleConfigChange('visibilityRules', e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Show only if: {{field_name}} === 'value'"
              />
              <p className="text-xs text-gray-500 mt-1">
                Conditional visibility based on data values
              </p>
            </div>

            {/* Custom CSS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
              <TextArea
                value={localElement.config?.customCss || ''}
                onChange={(e) => handleConfigChange('customCss', e.target.value)}
                rows={4}
                className="w-full font-mono text-xs"
                placeholder="/* Custom CSS styles */
.custom-element {
  transform: rotate(45deg);
  transition: all 0.3s ease;
}"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <Button
            onClick={applyChanges}
            disabled={!hasChanges}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Apply Changes
          </Button>
          <Button
            onClick={resetChanges}
            disabled={!hasChanges}
            variant="ghost"
            className="flex-1"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}

// Template canvas element
function CanvasElement({ 
  element, 
  index, 
  onDelete, 
  onUpdateElement,
  onMoveUp, 
  onMoveDown, 
  onEdit,
  isFirst,
  isLast
}: {
  element: EnhancedTemplateElement;
  index: number;
  onDelete: (index: number) => void;
  onUpdateElement: (index: number, updates: Partial<EnhancedTemplateElement>) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (element: EnhancedTemplateElement, index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<'both' | 'width' | 'height'>('both');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const elementRef = React.useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent, mode: 'both' | 'width' | 'height' = 'both') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      });
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !elementRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    let newWidth = dragStart.width;
    let newHeight = dragStart.height;
    
    if (resizeMode === 'both' || resizeMode === 'width') {
      newWidth = Math.max(100, dragStart.width + deltaX);
    }
    
    if (resizeMode === 'both' || resizeMode === 'height') {
      newHeight = Math.max(100, dragStart.height + deltaY);
    }
    
    // Update the element style directly for immediate visual feedback
    if (resizeMode === 'both' || resizeMode === 'width') {
      elementRef.current.style.width = `${newWidth}px`;
    }
    if (resizeMode === 'both' || resizeMode === 'height') {
      elementRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleResizeEnd = () => {
    if (!isResizing || !elementRef.current) return;
    setIsResizing(false);
    
    // Update the element's style in the state
    const newWidth = elementRef.current.style.width;
    const newHeight = elementRef.current.style.height;
    
    onUpdateElement(index, {
      style: {
        ...element.style,
        width: newWidth,
        height: newHeight
      }
    });
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, dragStart]);
  const elementStyle = {
    fontSize: element.style?.fontSize || '14px',
    fontWeight: element.style?.fontWeight || 'normal',
    color: element.style?.color && element.style?.color !== '#ffffff' ? element.style.color : '#222',
    backgroundColor: element.style?.backgroundColor || '#fff',
    padding: element.style?.padding || '8px',
    margin: element.style?.margin || '0px',
    textAlign: element.style?.textAlign || 'left',
  } as React.CSSProperties;

  const renderElementContent = () => {
    switch (element.type) {
      case 'header':
        return (
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
            <h1 className="text-2xl font-bold" style={elementStyle}>
              {element.content || 'Company Header'}
            </h1>
          </div>
        );
      
      case 'text':
        return (
          <div style={elementStyle} className="whitespace-pre-wrap">
            {element.content || 'Text content'}
          </div>
        );
      
      case 'field':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2" style={elementStyle}>
            <span className="text-yellow-700">
              {element.content || '{{field_name}}'}
            </span>
          </div>
        );
      
      case 'table':
        const columns = element.config?.columns || ['Column 1', 'Column 2', 'Column 3'];
        const rows = element.config?.rows || [['Sample Data 1', 'Sample Data 2', 'Sample Data 3']];
        const showHeader = element.config?.showHeader !== false;
        
        return (
          <div 
            className="border border-gray-300 rounded overflow-hidden"
            style={{
              width: element.style?.width || 'auto',
              maxWidth: element.style?.maxWidth || '100%'
            }}
          >
            <table className="w-full" style={element.style}>
              {showHeader && (
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column, colIndex) => (
                      <th 
                        key={colIndex}
                        className="border border-gray-300 p-2 text-left font-medium text-gray-900"
                        style={{ 
                          width: element.config?.columnWidths?.[colIndex] || 'auto',
                          fontSize: element.style?.fontSize || '14px',
                          color: element.style?.color || '#1f2937'
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, colIndex) => (
                      <td 
                        key={colIndex}
                        className="border border-gray-300 p-2 text-gray-700"
                        style={{ 
                          width: element.config?.columnWidths?.[colIndex] || 'auto',
                          fontSize: element.style?.fontSize || '14px',
                          color: element.style?.color || '#374151',
                          textAlign: element.style?.textAlign || 'left'
                        }}
                      >
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'image':
        if (element.config?.src) {
          return (
            <div 
              ref={elementRef}
              className="relative border border-gray-300 rounded group/image bg-white"
              style={{
                width: element.style?.width || '150px',
                height: element.style?.height || '80px',
                maxWidth: element.style?.maxWidth || '300px',
                textAlign: element.style?.textAlign || 'center',
                minWidth: '80px',
                minHeight: '40px'
              }}
            >
              <img 
                src={element.config.src}
                alt={element.config.alt || 'Uploaded image'}
                className="w-full h-full object-contain"
                style={{
                  aspectRatio: element.config.aspectRatio || 'auto'
                }}
              />
              
              {/* Always visible resize indicator on hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover/image:border-blue-400 transition-all">
                {/* Highly visible resize handles */}
                <div className="absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity">
                  
                  {/* Corner resize handle - large and visible */}
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 border-4 border-white cursor-nw-resize hover:bg-blue-700 shadow-xl rounded-full flex items-center justify-center z-50"
                    onMouseDown={(e) => handleResizeStart(e, 'both')}
                    title="Drag to resize"
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Width resize handle */}
                  <div 
                    className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-blue-600 border-2 border-white cursor-e-resize hover:bg-blue-700 shadow-lg rounded-r z-40"
                    onMouseDown={(e) => handleResizeStart(e, 'width')}
                    title="Resize width"
                  >
                    <div className="h-3 w-1 bg-white mx-auto mt-1.5 rounded"></div>
                  </div>
                  
                  {/* Height resize handle */}
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-blue-600 border-2 border-white cursor-n-resize hover:bg-blue-700 shadow-lg rounded-b z-40"
                    onMouseDown={(e) => handleResizeStart(e, 'height')}
                    title="Resize height"
                  >
                    <div className="w-3 h-1 bg-white mx-auto mt-1 rounded"></div>
                  </div>
                  
                  {/* Size display */}
                  <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {element.style?.width || '150px'} × {element.style?.height || '80px'}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div 
            ref={elementRef}
            className="relative border-2 border-dashed border-gray-400 rounded p-4 text-center bg-gray-50 group/image"
            style={{
              width: element.style?.width || '150px',
              height: element.style?.height || '80px',
              maxWidth: '300px',
              minHeight: '60px',
              minWidth: '100px'
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <Image size={24} className="text-gray-400 mb-1" />
              <div className="text-xs text-gray-500">Upload Image</div>
              <div className="text-xs text-gray-400 mt-1">Logo / Company Image</div>
            </div>
            
            {/* Resize handles for placeholder */}
            <div className="absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity">
              <div 
                className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-600 border-2 border-white cursor-nw-resize hover:bg-blue-700 shadow-lg rounded-full flex items-center justify-center z-50"
                onMouseDown={(e) => handleResizeStart(e, 'both')}
                title="Drag to resize"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              
              {/* Size display */}
              <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {element.style?.width || '150px'} × {element.style?.height || '80px'}
              </div>
            </div>
          </div>
        );
      
      case 'terms':
        return (
          <div className="bg-gray-50 border border-gray-200 rounded p-4" style={elementStyle}>
            <h3 className="font-semibold mb-2">Terms & Conditions</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {element.content || 'Terms and conditions content will appear here...'}
            </div>
          </div>
        );
      
      case 'spacer':
        return (
          <div 
            className="border-2 border-dashed border-gray-300 bg-gray-50"
            style={{ height: element.content || '20px' }}
          >
            <div className="text-center text-xs text-gray-400 leading-5">
              Spacer ({element.content || '20px'})
            </div>
          </div>
        );
      
      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div className="group relative border border-gray-200 rounded-lg p-2 mb-2 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
      {/* Element Controls */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg border border-gray-300 p-1">
        <button
          onClick={() => onEdit(element, index)}
          className="p-1 h-6 w-6 rounded hover:bg-blue-50 transition-colors"
          style={{ 
            color: '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Edit Element"
        >
          <Settings size={12} color="#374151" />
        </button>
        
        <button
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className="p-1 h-6 w-6 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
          style={{ 
            color: isFirst ? '#9ca3af' : '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Move Up"
        >
          <ArrowUp size={12} color={isFirst ? '#9ca3af' : '#374151'} />
        </button>
        
        <button
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className="p-1 h-6 w-6 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
          style={{ 
            color: isLast ? '#9ca3af' : '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Move Down"
        >
          <ArrowDown size={12} color={isLast ? '#9ca3af' : '#374151'} />
        </button>
        
        <button
          onClick={() => onDelete(index)}
          className="p-1 h-6 w-6 rounded hover:bg-red-50 transition-colors"
          style={{ 
            color: '#dc2626', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Delete Element"
        >
          <Trash2 size={12} color="#dc2626" />
        </button>
      </div>

      {/* Element Content */}
      <div className="pointer-events-none">
        {renderElementContent()}
      </div>

      {/* Drag Handle */}
      <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1">
        <Move size={12} className="text-gray-600 hover:text-gray-800" />
      </div>
    </div>
  );
}

// Template canvas with drop zone
function TemplateCanvas({ 
  elements, 
  onElementsChange, 
  onEditElement 
}: {
  elements: EnhancedTemplateElement[];
  onElementsChange: (elements: EnhancedTemplateElement[]) => void;
  onEditElement: (element: EnhancedTemplateElement, index: number) => void;
}) {
  // Use ref to always have the latest elements
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PALETTE_ITEM,
    drop: (item: { elementType: string; defaultContent: string }) => {
      const getDefaultConfig = (type: string) => {
        switch (type) {
          case 'table':
            return {
              columns: ['Sr.', 'Description of Equipment/Service', 'Capacity/Specification', 'Duration', 'Rate (₹)', 'Amount (₹)'],
              rows: [
                ['1', '{{item_name}}', '{{item_capacity}}', '{{item_duration}}', '{{item_rate}}', '{{item_amount}}'],
                ['2', 'Mobile Crane with Operator', '100MT Hydraulic', '1 Month', '7,85,000', '7,85,000'],
                ['3', 'Transportation & Mobilization', 'To & From Site', '1 Trip', '25,000', '25,000']
              ],
              showHeader: true,
              columnWidths: ['8%', '35%', '20%', '12%', '12%', '13%']
            };
          case 'image':
            return {
              src: '',
              alt: 'Company Logo',
              aspectRatio: '16/9',
              position: 'center'
            };
          case 'header':
            return {
              showLogo: true,
              showCompanyInfo: true,
              layout: 'left-right'
            };
          default:
            return {};
        }
      };

      const newElement: EnhancedTemplateElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: item.elementType as any,
        content: item.defaultContent || '',
        style: {
          fontSize: item.elementType === 'header' ? '18px' : item.elementType === 'table' ? '12px' : '14px',
          fontWeight: item.elementType === 'header' ? 'bold' : 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
          padding: item.elementType === 'table' ? '4px' : '8px',
          margin: '4px 0',
          textAlign: item.elementType === 'header' ? 'center' : 'left',
          width: item.elementType === 'image' ? '120px' : 'auto',
          height: item.elementType === 'image' ? '60px' : 'auto',
          maxWidth: '100%'
        },
        config: getDefaultConfig(item.elementType)
      };
      
      console.log('🔥 ADDING NEW ELEMENT');
      console.log('📊 Current elements before add:', elementsRef.current.map(el => ({ 
        id: el.id, 
        type: el.type, 
        content: (el.content || '').substring(0, 20) + '...' 
      })));
      console.log('➕ New element being added:', { id: newElement.id, type: newElement.type, content: newElement.content });
      const newElementsArray = [...elementsRef.current, newElement];
      console.log('📋 Final elements array:', newElementsArray.map(el => ({ id: el.id, type: el.type })));
      onElementsChange(newElementsArray);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleElementDelete = (index: number) => {
    onElementsChange(elementsRef.current.filter((_, i) => i !== index));
  };

  const handleElementUpdate = (index: number, updates: Partial<EnhancedTemplateElement>) => {
    console.log('handleElementUpdate called:', { index, updates, currentElement: elementsRef.current[index]?.id });
    const newElements = [...elementsRef.current];
    newElements[index] = { ...newElements[index], ...updates };
    console.log('Updated element:', newElements[index]);
    onElementsChange(newElements);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newElements = [...elementsRef.current];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      onElementsChange(newElements);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < elementsRef.current.length - 1) {
      const newElements = [...elementsRef.current];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      onElementsChange(newElements);
    }
  };

  return (
    <div
      ref={drop}
      className={`
        min-h-96 p-4 border-2 border-dashed rounded-lg
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        transition-colors duration-200
      `}
    >
      {elements.length === 0 ? (
        <div className="text-center py-12">
          <Type size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Start Building Your Template
          </h3>
          <p className="text-gray-500">
            Drag elements from the palette to create your quotation template
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((element, index) => (
            <CanvasElement
              key={element.id}
              element={element}
              index={index}
              onDelete={handleElementDelete}
              onUpdateElement={handleElementUpdate}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={onEditElement}
              isFirst={index === 0}
              isLast={index === elements.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Modern Template Builder Component
export default function ModernTemplateBuilder({ 
  template, 
  onSave, 
  onCancel
}: ModernTemplateBuilderProps) {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [elements, setElements] = useState<EnhancedTemplateElement[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingElement, setEditingElement] = useState<{ element: EnhancedTemplateElement; index: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'elements' | 'variables' | 'themes' | 'templates'>('elements');

  // Debug effect to track elements changes
  useEffect(() => {
    console.log('Elements state changed:', elements.map(el => ({ 
      id: el.id, 
      type: el.type,
      content: el.content?.substring(0, 20) + '...',
      configKeys: Object.keys(el.config || {})
    })));
  }, [elements]);

  // Load template data when component mounts or template prop changes
  useEffect(() => {
    console.log('🚨 TEMPLATE USEEFFECT TRIGGERED');
    console.log('📄 Template prop:', template);
    console.log('🔄 Current elements before template load:', elements.map(el => ({ id: el.id, type: el.type })));
    console.log('🎯 Elements length:', elements.length);
    
    if (template && template.elements && template.elements.length > 0) {
      console.log('✅ Loading template with elements:', template);
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      
      // Convert template elements to enhanced elements with default styling
      const enhancedElements: EnhancedTemplateElement[] = template.elements.map(el => ({
        ...el,
        style: {
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
          padding: '8px',
          margin: '4px 0',
          textAlign: 'left' as const,
          ...((el as any).style || {})
        }
      }));
      
      console.log('📋 Setting elements from template:', enhancedElements.map(el => ({ id: el.id, type: el.type })));
      setElements(enhancedElements);
    } else if (template) {
      console.log('⚠️ Template provided but no elements, setting name/description only');
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
    } else {
      console.log('❌ No template provided, keeping current state');
    }
  }, [template?.id, template?.name, template?.elements?.length]); // More specific dependencies

  // Handle cancel with unsaved changes check
  // const handleCancel = () => {
  //   const hasChanges = elements.length > 0 || templateName !== (template?.name || '') || templateDescription !== (template?.description || '');
  //   
  //   if (hasChanges) {
  //     const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
  //     if (!confirmCancel) return;
  //   }
  //   onCancel?.();
  // };

  // Handle variable insertion
  const handleInsertVariable = (variable: string) => {
    // Insert variable at current cursor position or add as new text element
    const newElement: EnhancedTemplateElement = {
      id: `element-${Date.now()}`,
      type: 'field',
      content: variable,
      style: {
        fontSize: '14px',
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: '8px',
        margin: '4px 0',
        textAlign: 'left' as const
      }
    };
    setElements(prev => [...prev, newElement]);
  };

  // Handle theme application
  const handleApplyTheme = (theme: typeof templateThemes[0]) => {
    setElements(prev => prev.map(element => ({
      ...element,
      style: {
        ...element.style,
        color: theme.colors.text,
        backgroundColor: element.type === 'header' ? theme.colors.accent : 'transparent'
      }
    })));
  };

  // Handle template insertion
  const handleInsertTemplate = (template: typeof elementTemplates[0]) => {
    const newElements: EnhancedTemplateElement[] = template.elements.map((el, index) => ({
      id: `template-${Date.now()}-${index}`,
      type: el.type as any,
      content: el.content,
      style: {
        fontSize: '14px',
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: '8px',
        margin: '4px 0',
        textAlign: 'left' as const,
        ...(el.style || {} as any)
      }
    }));
    setElements(prev => [...prev, ...newElements]);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (elements.length === 0) {
      setError('Please add at least one element to the template');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        elements: elements.map(el => ({
          id: el.id,
          type: el.type,
          content: el.content,
          fieldType: el.fieldType,
          style: el.style,
          config: el.config
        })),
        tags: template?.tags || [],
        usage_count: template?.usage_count || 0,
        createdBy: template?.createdBy || 'current-user',
        version: template?.version || 1,
        isDefault: template?.isDefault || false,
        isActive: template?.isActive !== false,
        category: template?.category || 'general',
        styles: template?.styles || {},
        layout: template?.layout || {},
        thumbnail: template?.thumbnail,
        content: template?.content || ''
      };

      await onSave(templateData);
      
      // Show success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Template saved successfully');
    } catch (error) {
      console.error('❌ Error saving template:', error);
      setError('Failed to save template. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    console.log('🔍 Preview button clicked');
    console.log('📊 Current elements:', elements.map(el => ({ id: el.id, type: el.type })));
    console.log('🏷️ Template name:', templateName);
    console.log('🎭 Show preview state:', showPreview);
    
    if (elements.length === 0) {
      console.log('❌ No elements to preview');
      setError('Please add elements to preview the template');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    console.log('✅ Opening preview modal');
    setShowPreview(true);
  };

  const handleEditElement = (element: EnhancedTemplateElement, index: number) => {
    setEditingElement({ element, index });
  };

  const handleElementEditorUpdate = (updates: Partial<EnhancedTemplateElement>) => {
    if (editingElement) {
      const newElements = [...elements];
      newElements[editingElement.index] = { ...newElements[editingElement.index], ...updates };
      setElements(newElements);
      console.log('🎨 Element updated:', updates);
    }
  };

  const handleElementEditorClose = () => {
    setEditingElement(null);
  };

  const handleElementsChange = useCallback((newElements: EnhancedTemplateElement[]) => {
    console.log('🎬 handleElementsChange called');
    console.log('📥 Incoming elements:', newElements.map(el => ({ id: el.id, type: el.type })));
    setElements(newElements);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
        {/* Success notification */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            ✅ Template saved successfully!
          </div>
        )}

        {/* Enhanced Left Sidebar with Tabs */}
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col lg:h-full max-h-screen">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'elements', label: 'Elements', icon: Grid },
              { id: 'variables', label: 'Variables', icon: Database },
              { id: 'themes', label: 'Themes', icon: Settings },
              { id: 'templates', label: 'Templates', icon: FileText }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    activePanel === tab.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent size={16} className="mx-auto mb-1" />
                  <div>{tab.label}</div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'elements' && (
              <div className="p-4 h-full overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Elements</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag elements to the canvas to build your template
                  </p>
                  
                  {/* Category Filter */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {['All', 'content', 'data', 'layout', 'logic'].map(category => (
                        <button
                          key={category}
                          className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {paletteItems.map((item) => (
                      <PaletteItem key={item.type} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'variables' && (
              <VariablePanel onInsertVariable={handleInsertVariable} />
            )}

            {activePanel === 'themes' && (
              <div className="h-full overflow-y-auto">
                <ThemePanel onApplyTheme={handleApplyTheme} />
              </div>
            )}

            {activePanel === 'templates' && (
              <div className="h-full overflow-y-auto">
                <ElementTemplatePanel onInsertTemplate={handleInsertTemplate} />
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name"
                  className="text-lg font-semibold mb-2"
                />
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Template Description (optional)"
                  className="text-sm"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  onClick={handlePreview}
                  disabled={elements.length === 0}
                  title="Preview template with sample data"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-400"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={saving || !templateName.trim() || elements.length === 0}
                  title="Save template to database"
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <TemplateCanvas
              elements={elements}
              onElementsChange={handleElementsChange}
              onEditElement={handleEditElement}
            />
          </div>
        </div>

        {/* Right Sidebar - Element Editor */}
        {editingElement && (
          <div className="fixed inset-0 lg:relative lg:inset-auto lg:w-80 lg:flex-shrink-0 z-30">
            <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={handleElementEditorClose}></div>
            <div className="absolute right-0 top-0 bottom-0 w-80 lg:relative lg:w-full">
              <ElementEditor
                element={editingElement.element}
                onUpdate={handleElementEditorUpdate}
                onClose={handleElementEditorClose}
              />
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            ✅ Template saved successfully!
          </div>
        )}
        
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            ❌ {error}
          </div>
        )}

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          elements={elements}
          templateName={templateName}
        />
      </div>
    </DndProvider>
  );
}
