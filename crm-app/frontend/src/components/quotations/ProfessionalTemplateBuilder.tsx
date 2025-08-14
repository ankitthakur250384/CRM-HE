import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Template } from '../../types/template';
import {
  Type,
  Table,
  FileText,
  Hash,
  Calendar,
  DollarSign,
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  Save,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

interface ProfessionalTemplateBuilderProps {
  template: Template;
  onChange: (template: Template) => void;
  onSave?: () => void;
  onPreview?: () => void;
}

interface TemplateSection {
  id: string;
  name: string;
  content: string;
  type: 'header' | 'customer' | 'equipment' | 'terms' | 'pricing' | 'footer';
  enabled: boolean;
  order: number;
}

interface EquipmentRow {
  id: string;
  sr: string;
  capacity: string;
  jobType: string;
  duration: string;
  rental: string;
  mobDemob: string;
  deMob: string;
}

const defaultSections: TemplateSection[] = [
  {
    id: 'header',
    name: 'Header & Company Details',
    type: 'header',
    enabled: true,
    order: 1,
    content: `<!-- Header with Logo and Company Details -->`
  },
  {
    id: 'customer',
    name: 'Customer Information',
    type: 'customer',
    enabled: true,
    order: 2,
    content: `<!-- Customer Information -->`
  },
  {
    id: 'equipment',
    name: 'Equipment Table',
    type: 'equipment',
    enabled: true,
    order: 3,
    content: `<!-- Equipment Table -->`
  },
  {
    id: 'terms',
    name: 'Terms & Conditions',
    type: 'terms',
    enabled: true,
    order: 4,
    content: `<!-- Commercial Terms -->`
  },
  {
    id: 'pricing',
    name: 'Pricing Summary',
    type: 'pricing',
    enabled: true,
    order: 5,
    content: `<!-- Pricing Summary -->`
  },
  {
    id: 'footer',
    name: 'Footer & Bank Details',
    type: 'footer',
    enabled: true,
    order: 6,
    content: `<!-- Footer -->`
  }
];

const placeholderOptions = [
  { value: '{{company_name}}', label: 'Company Name', icon: Building },
  { value: '{{company_address}}', label: 'Company Address', icon: MapPin },
  { value: '{{company_phone}}', label: 'Company Phone', icon: Phone },
  { value: '{{company_email}}', label: 'Company Email', icon: Mail },
  { value: '{{company_gst}}', label: 'Company GST', icon: Hash },
  { value: '{{customer_name}}', label: 'Customer Name', icon: User },
  { value: '{{customer_company}}', label: 'Customer Company', icon: Building },
  { value: '{{customer_address}}', label: 'Customer Address', icon: MapPin },
  { value: '{{customer_phone}}', label: 'Customer Phone', icon: Phone },
  { value: '{{customer_email}}', label: 'Customer Email', icon: Mail },
  { value: '{{quotation_number}}', label: 'Quotation Number', icon: Hash },
  { value: '{{quotation_date}}', label: 'Quotation Date', icon: Calendar },
  { value: '{{valid_until}}', label: 'Valid Until', icon: Calendar },
  { value: '{{equipment_name}}', label: 'Equipment Name', icon: FileText },
  { value: '{{project_duration}}', label: 'Project Duration', icon: Calendar },
  { value: '{{total_amount}}', label: 'Total Amount', icon: DollarSign },
  { value: '{{subtotal}}', label: 'Subtotal', icon: DollarSign },
  { value: '{{gst_amount}}', label: 'GST Amount', icon: DollarSign }
];

export function ProfessionalTemplateBuilder({ 
  template, 
  onChange, 
  onSave, 
  onPreview 
}: ProfessionalTemplateBuilderProps) {
  const [sections, setSections] = useState<TemplateSection[]>(defaultSections);
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([
    {
      id: '1',
      sr: '1',
      capacity: '{{equipment_capacity}}',
      jobType: '{{job_type_details}}',
      duration: '{{project_duration}}',
      rental: '{{monthly_rental}}',
      mobDemob: 'Included',
      deMob: 'Included'
    }
  ]);
  const [companyDetails] = useState({
    name: '{{company_name}}',
    address: '{{company_address}}',
    phone: '{{company_phone}}',
    email: '{{company_email}}',
    gst: '{{company_gst}}',
    logo: 'ASP CRANES'
  });
  const [styling, setStyling] = useState({
    primaryColor: '#FF6B00',
    secondaryColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px'
  });

  const handleSectionToggle = useCallback((sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  }, []);

  const handleSectionContentChange = useCallback((sectionId: string, content: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, content }
        : section
    ));
  }, []);

  const addEquipmentRow = () => {
    const newRow: EquipmentRow = {
      id: String(equipmentRows.length + 1),
      sr: String(equipmentRows.length + 1),
      capacity: '',
      jobType: '',
      duration: '',
      rental: '',
      mobDemob: 'Included',
      deMob: 'Included'
    };
    setEquipmentRows([...equipmentRows, newRow]);
  };

  const removeEquipmentRow = (id: string) => {
    setEquipmentRows(equipmentRows.filter(row => row.id !== id));
  };

  const updateEquipmentRow = (id: string, field: keyof EquipmentRow, value: string) => {
    setEquipmentRows(equipmentRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Helper function for inserting placeholders (can be used later for enhanced editing)
  /*
  const insertPlaceholder = (textareaId: string, placeholder: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newValue = before + placeholder + after;
      
      // Update the content based on which textarea
      if (textareaId.startsWith('section-')) {
        const sectionId = textareaId.replace('section-', '');
        handleSectionContentChange(sectionId, newValue);
      }
      
      // Set cursor position after inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };
  */

  const generateTemplate = useCallback(() => {
    const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    
    let content = `<div style="font-family: ${styling.fontFamily}; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333;">`;
    
    enabledSections.forEach(section => {
      switch (section.type) {
        case 'header':
          content += `
    <!-- Header with Logo and Company Details -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid ${styling.primaryColor}; padding-bottom: 20px;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="background: ${styling.primaryColor}; color: white; padding: 8px 16px; font-weight: bold; font-size: 18px; margin-right: 15px; border-radius: 4px;">
            ASP
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: ${styling.primaryColor}; margin: 0; line-height: 1;">CRANES</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">AADISHAKTI PROJECTS</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #666; line-height: 1.4;">
          <strong>${companyDetails.name}</strong><br>
          ${companyDetails.address}<br>
          Phone: ${companyDetails.phone}<br>
          Email: ${companyDetails.email}<br>
          GST: ${companyDetails.gst}
        </div>
      </div>
      <div style="text-align: center; background: ${styling.secondaryColor}; padding: 15px; border-radius: 4px; min-width: 200px;">
        <h1 style="margin: 0; font-size: 20px; color: #333; font-weight: bold;">QUOTATION</h1>
        <div style="margin-top: 10px; font-size: 12px;">
          <div><strong>QUOTE/</strong>{{quotation_number}}</div>
          <div style="margin-top: 5px;"><strong>Date:</strong> {{quotation_date}}</div>
        </div>
      </div>
    </div>`;
          break;
          
        case 'customer':
          content += `
    <!-- Customer Information -->
    <div style="margin-bottom: 25px;">
      <div style="background: ${styling.secondaryColor}; padding: 12px; margin-bottom: 15px; border-left: 4px solid ${styling.primaryColor};">
        <strong style="color: #333; font-size: 14px;">M/s. {{customer_name}}</strong><br>
        <div style="margin-top: 5px; font-size: 12px; color: #666;">
          {{customer_company}}<br>
          {{customer_address}}
        </div>
      </div>
    </div>`;
          break;
          
        case 'equipment':
          content += `
    <!-- Equipment Table -->
    <div style="margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #ddd;">
        <thead>
          <tr style="background: ${styling.secondaryColor};">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Sr.</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Capacity</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Job Type<br>Including</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Duration</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Rental<br>GST 18%</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Mob-Demob</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">De-Mob</th>
          </tr>
        </thead>
        <tbody>`;
        
        equipmentRows.forEach(row => {
          content += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.sr}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.capacity}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.jobType}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.duration}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${row.rental}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.mobDemob}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.deMob}</td>
          </tr>`;
        });
        
        content += `
        </tbody>
      </table>
    </div>`;
          break;
          
        case 'pricing':
          content += `
    <!-- Pricing Summary -->
    <div style="margin-bottom: 25px; background: ${styling.secondaryColor}; padding: 15px; border-radius: 4px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">
        Pricing Summary
      </h3>
      <table style="width: 100%; font-size: 12px;">
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong>Subtotal:</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong>GST (18%):</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">{{gst_amount}}</td>
        </tr>
        <tr style="background: #fff; font-weight: bold;">
          <td style="padding: 8px 0; font-size: 14px;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-size: 14px; color: ${styling.primaryColor};"><strong>{{total_amount}}</strong></td>
        </tr>
      </table>
    </div>`;
          break;
          
        case 'footer':
          content += `
    <!-- Footer -->
    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
      <p style="margin: 0 0 5px 0; font-weight: bold;">Truly,</p>
      <p style="margin: 0 0 5px 0;"><strong>For, Aadishakti Projects</strong></p>
      <p style="margin: 0 0 15px 0;">(Establishment of Rajdev Group)</p>
      
      <div style="margin-top: 15px; background: ${styling.primaryColor}; color: white; padding: 8px; border-radius: 4px; font-weight: bold;">
        WE LIFT YOU UP
      </div>
    </div>`;
          break;
      }
    });
    
    content += `</div>`;
    
    const updatedTemplate: Template = {
      ...template,
      content,
      updatedAt: new Date().toISOString()
    };
    
    onChange(updatedTemplate);
  }, [sections, equipmentRows, companyDetails, styling, template, onChange]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Template Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Template Name"
                value={template.name}
                onChange={(e) => onChange({ ...template, name: e.target.value })}
              />
              <Input
                label="Description"
                value={template.description || ''}
                onChange={(e) => onChange({ ...template, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Styling Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Styling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={styling.primaryColor}
                  onChange={(e) => setStyling(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={styling.secondaryColor}
                  onChange={(e) => setStyling(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <Input
                label="Font Family"
                value={styling.fontFamily}
                onChange={(e) => setStyling(prev => ({ ...prev, fontFamily: e.target.value }))}
              />
              <Input
                label="Base Font Size"
                value={styling.fontSize}
                onChange={(e) => setStyling(prev => ({ ...prev, fontSize: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Equipment Table Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              Equipment Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Sr.</th>
                      <th className="border border-gray-300 p-2 text-left">Capacity</th>
                      <th className="border border-gray-300 p-2 text-left">Job Type</th>
                      <th className="border border-gray-300 p-2 text-left">Duration</th>
                      <th className="border border-gray-300 p-2 text-left">Rental</th>
                      <th className="border border-gray-300 p-2 text-left">Mob-Demob</th>
                      <th className="border border-gray-300 p-2 text-left">De-Mob</th>
                      <th className="border border-gray-300 p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentRows.map((row) => (
                      <tr key={row.id}>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.sr}
                            onChange={(e) => updateEquipmentRow(row.id, 'sr', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.capacity}
                            onChange={(e) => updateEquipmentRow(row.id, 'capacity', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.jobType}
                            onChange={(e) => updateEquipmentRow(row.id, 'jobType', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.duration}
                            onChange={(e) => updateEquipmentRow(row.id, 'duration', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.rental}
                            onChange={(e) => updateEquipmentRow(row.id, 'rental', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.mobDemob}
                            onChange={(e) => updateEquipmentRow(row.id, 'mobDemob', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={row.deMob}
                            onChange={(e) => updateEquipmentRow(row.id, 'deMob', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeEquipmentRow(row.id)}
                            disabled={equipmentRows.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={addEquipmentRow} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment Row
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Template Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={section.id}
                    checked={section.enabled}
                    onChange={() => handleSectionToggle(section.id)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={section.id} className="text-sm font-medium">
                    {section.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Helper */}
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {placeholderOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      navigator.clipboard.writeText(option.value);
                    }}
                    className="flex items-center gap-2 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm"
                    title={`Click to copy: ${option.value}`}
                  >
                    <IconComponent className="w-4 h-4 text-gray-500" />
                    <span className="font-mono text-xs text-blue-600">{option.value}</span>
                    <span className="text-gray-600">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button onClick={generateTemplate} variant="outline">
            Generate Template
          </Button>
          <div className="flex gap-2">
            {onPreview && (
              <Button onClick={onPreview} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
            {onSave && (
              <Button onClick={onSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default ProfessionalTemplateBuilder;
