import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Template } from '../../types/template';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Eye,
  Settings,
  FileText,
  Table,
  Type,
  Palette,
  Layout
} from 'lucide-react';

interface TemplateSection {
  id: string;
  type: 'header' | 'customer_info' | 'equipment_table' | 'terms' | 'pricing' | 'bank_details' | 'footer' | 'custom';
  title: string;
  enabled: boolean;
  order: number;
  content: string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    fontSize?: string;
    padding?: string;
    margin?: string;
  };
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  website: string;
  logo: string;
}

interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  baseFontSize: string;
  headerFontSize: string;
  tableHeaderBg: string;
  borderColor: string;
}

interface EquipmentColumn {
  id: string;
  label: string;
  placeholder: string;
  width: string;
  align: 'left' | 'center' | 'right';
  type: 'text' | 'number' | 'currency';
}

interface DynamicTemplateBuilderProps {
  template?: Template;
  onSave: (template: Template) => void;
  onPreview?: (content: string) => void;
}

const defaultSections: TemplateSection[] = [
  {
    id: 'header',
    type: 'header',
    title: 'Header & Company Details',
    enabled: true,
    order: 1,
    content: '',
  },
  {
    id: 'customer_info',
    type: 'customer_info',
    title: 'Customer Information',
    enabled: true,
    order: 2,
    content: '',
  },
  {
    id: 'equipment_table',
    type: 'equipment_table',
    title: 'Equipment Table',
    enabled: true,
    order: 3,
    content: '',
  },
  {
    id: 'terms',
    type: 'terms',
    title: 'Terms & Conditions',
    enabled: true,
    order: 4,
    content: '',
  },
  {
    id: 'pricing',
    type: 'pricing',
    title: 'Pricing Summary',
    enabled: true,
    order: 5,
    content: '',
  },
  {
    id: 'bank_details',
    type: 'bank_details',
    title: 'Bank Details',
    enabled: true,
    order: 6,
    content: '',
  },
  {
    id: 'footer',
    type: 'footer',
    title: 'Footer',
    enabled: true,
    order: 7,
    content: '',
  }
];

const defaultEquipmentColumns: EquipmentColumn[] = [
  { id: 'sr', label: 'Sr.', placeholder: '{{sr_number}}', width: '8%', align: 'center', type: 'text' },
  { id: 'capacity', label: 'Capacity', placeholder: '{{equipment_capacity}}', width: '15%', align: 'center', type: 'text' },
  { id: 'job_type', label: 'Job Type\nIncluding', placeholder: '{{job_type_details}}', width: '25%', align: 'left', type: 'text' },
  { id: 'duration', label: 'Job Duration\nIn Month', placeholder: '{{project_duration}}', width: '12%', align: 'center', type: 'text' },
  { id: 'rental', label: 'Rental\nGST 18%', placeholder: '{{monthly_rental}}', width: '15%', align: 'right', type: 'currency' },
  { id: 'mob_demob', label: 'Mob-Demob\n10,000/-\n+ GST 18%', placeholder: 'Included', width: '12%', align: 'center', type: 'text' },
  { id: 'de_mob', label: 'De-Mob\n10,000/-\n+ GST 18%', placeholder: 'Included', width: '13%', align: 'center', type: 'text' }
];

export function DynamicTemplateBuilder({ template, onSave, onPreview }: DynamicTemplateBuilderProps) {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [sections, setSections] = useState<TemplateSection[]>(defaultSections);
  const [equipmentColumns, setEquipmentColumns] = useState<EquipmentColumn[]>(defaultEquipmentColumns);
  const [activeTab, setActiveTab] = useState<'layout' | 'styling' | 'preview'>('layout');
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'ASP CRANES - AADISHAKTI PROJECTS',
    address: '{{company_address}}',
    phone: '{{company_phone}}',
    email: '{{company_email}}',
    gst: '{{company_gst}}',
    website: '{{company_website}}',
    logo: 'ASP'
  });

  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>({
    primaryColor: '#FF6B00',
    secondaryColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif',
    baseFontSize: '12px',
    headerFontSize: '18px',
    tableHeaderBg: '#f8f9fa',
    borderColor: '#ddd'
  });

  const moveSectionUp = useCallback((index: number) => {
    if (index > 0) {
      setSections(prev => {
        const newSections = [...prev];
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        return newSections.map((section, i) => ({ ...section, order: i + 1 }));
      });
    }
  }, []);

  const moveSectionDown = useCallback((index: number) => {
    setSections(prev => {
      if (index < prev.length - 1) {
        const newSections = [...prev];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        return newSections.map((section, i) => ({ ...section, order: i + 1 }));
      }
      return prev;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(section => 
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  }, []);

  const addCustomSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: `custom_${Date.now()}`,
      type: 'custom',
      title: 'Custom Section',
      enabled: true,
      order: sections.length + 1,
      content: '<div>Custom content here...</div>'
    };
    setSections(prev => [...prev, newSection]);
  }, [sections.length]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(section => section.id !== id));
  }, []);

  // const updateSectionContent = useCallback((id: string, content: string) => {
  //   setSections(prev => prev.map(section => 
  //     section.id === id ? { ...section, content } : section
  //   ));
  // }, []);

  const addEquipmentColumn = useCallback(() => {
    const newColumn: EquipmentColumn = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      placeholder: '{{new_field}}',
      width: '10%',
      align: 'center',
      type: 'text'
    };
    setEquipmentColumns(prev => [...prev, newColumn]);
  }, []);

  const removeEquipmentColumn = useCallback((id: string) => {
    setEquipmentColumns(prev => prev.filter(col => col.id !== id));
  }, []);

  const updateEquipmentColumn = useCallback((id: string, updates: Partial<EquipmentColumn>) => {
    setEquipmentColumns(prev => prev.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  }, []);

  const generateTemplateContent = useCallback(() => {
    const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    
    let content = `<div style="font-family: ${templateStyle.fontFamily}; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333; font-size: ${templateStyle.baseFontSize};">`;

    enabledSections.forEach(section => {
      switch (section.type) {
        case 'header':
          content += generateHeaderSection();
          break;
        case 'customer_info':
          content += generateCustomerSection();
          break;
        case 'equipment_table':
          content += generateEquipmentTableSection();
          break;
        case 'terms':
          content += generateTermsSection();
          break;
        case 'pricing':
          content += generatePricingSection();
          break;
        case 'bank_details':
          content += generateBankDetailsSection();
          break;
        case 'footer':
          content += generateFooterSection();
          break;
        case 'custom':
          content += section.content;
          break;
      }
    });

    content += '</div>';
    return content;
  }, [sections, templateStyle, companyInfo, equipmentColumns]);

  const generateHeaderSection = () => `
    <!-- Header with Logo and Company Details -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid ${templateStyle.primaryColor}; padding-bottom: 20px;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="background: ${templateStyle.primaryColor}; color: white; padding: 8px 16px; font-weight: bold; font-size: ${templateStyle.headerFontSize}; margin-right: 15px; border-radius: 4px;">
            ${companyInfo.logo}
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: ${templateStyle.primaryColor}; margin: 0; line-height: 1;">CRANES</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">AADISHAKTI PROJECTS</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #666; line-height: 1.4;">
          <strong>${companyInfo.name}</strong><br>
          ${companyInfo.address}<br>
          Phone: ${companyInfo.phone}<br>
          Email: ${companyInfo.email}<br>
          GST: ${companyInfo.gst}
        </div>
      </div>
      <div style="text-align: center; background: ${templateStyle.secondaryColor}; padding: 15px; border-radius: 4px; min-width: 200px;">
        <h1 style="margin: 0; font-size: 20px; color: #333; font-weight: bold;">QUOTATION</h1>
        <div style="margin-top: 10px; font-size: 12px;">
          <div><strong>QUOTE/</strong>{{quotation_number}}</div>
          <div style="margin-top: 5px;"><strong>Date:</strong> {{quotation_date}}</div>
        </div>
      </div>
    </div>`;

  const generateCustomerSection = () => `
    <!-- Customer Information -->
    <div style="margin-bottom: 25px;">
      <div style="background: ${templateStyle.secondaryColor}; padding: 12px; margin-bottom: 15px; border-left: 4px solid ${templateStyle.primaryColor};">
        <strong style="color: #333; font-size: 14px;">M/s. {{customer_name}}</strong><br>
        <div style="margin-top: 5px; font-size: 12px; color: #666;">
          {{customer_company}}<br>
          {{customer_address}}
        </div>
      </div>
      
      <table style="width: 100%; font-size: 12px; margin-bottom: 15px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <strong>Job Location:</strong> {{job_location}}<br>
            <strong>Kind Attn:</strong> {{customer_contact_person}}<br>
            <strong>Mobile:</strong> {{customer_phone}}
          </td>
          <td style="width: 50%; vertical-align: top;">
            <strong>Subject:</strong> {{quotation_subject}}<br>
            <strong>Reference:</strong> {{reference_details}}
          </td>
        </tr>
      </table>
    </div>`;

  const generateEquipmentTableSection = () => {
    let tableContent = `
    <!-- Equipment Table -->
    <div style="margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid ${templateStyle.borderColor};">
        <thead>
          <tr style="background: ${templateStyle.tableHeaderBg};">`;
    
    equipmentColumns.forEach(col => {
      tableContent += `
            <th style="border: 1px solid ${templateStyle.borderColor}; padding: 8px; text-align: ${col.align}; font-weight: bold; width: ${col.width};">${col.label.replace(/\n/g, '<br>')}</th>`;
    });

    tableContent += `
          </tr>
        </thead>
        <tbody>
          <tr>`;

    equipmentColumns.forEach(col => {
      tableContent += `
            <td style="border: 1px solid ${templateStyle.borderColor}; padding: 8px; text-align: ${col.align};">${col.placeholder}</td>`;
    });

    tableContent += `
          </tr>
        </tbody>
      </table>
      
      <!-- Additional Equipment Details -->
      <div style="margin-top: 15px; font-size: 11px; line-height: 1.5;">
        <ul style="margin: 0; padding-left: 15px;">
          <li>All Rates on "As Hire".</li>
          <li><strong>Duty days = 26 + OT</strong></li>
          <li><strong>Duty Hours 8 hours including lunch + OT on pro-rata basis.</strong></li>
          <li>Fuel required on site will be in the Hirer's Scope.</li>
          <li><strong>OT will be calculated by dividing the month sum by 26 days & 08 hours.</strong></li>
        </ul>
      </div>
    </div>`;

    return tableContent;
  };

  const generateTermsSection = () => `
    <!-- Commercial Terms -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid ${templateStyle.borderColor}; padding-bottom: 5px;">
        1. COMMERCIAL TERMS
      </h3>
      
      <div style="font-size: 11px; line-height: 1.6; margin-bottom: 15px;">
        <p style="margin: 8px 0;"><strong>a.</strong> Only Electronic Fund Transfer is Acceptable, bank details mentioned below.</p>
        
        <p style="margin: 8px 0;"><strong>b. Matching and Deal Confirmation:</strong> Matching towards the Site is subject to receiving 
        <strong>50% of Monthly Rent (with GST) and Full mobilization and Demobilization charges 
        (with GST), along with Official Work order (with wet seal and signature) by Official 
        Letterhead of your company.</strong></p>
        
        <p style="margin: 8px 0;"><strong>c.</strong> Compliance: <strong>GST</strong> and any other government taxes compliance or duties, if any 
        applicable in your area/region, related to hire and working at site will be applicable as 
        extra on actual. The Service Provider will not be liable for any compliance, other 
        than for the Crew and the equipment. TF and ESIC, if applicable at the site, will 
        be on "The Hirer". TPI required on site will be in the Hirer's scope.</p>
      </div>
    </div>`;

  const generatePricingSection = () => `
    <!-- Pricing Summary -->
    <div style="margin-bottom: 25px; background: ${templateStyle.secondaryColor}; padding: 15px; border-radius: 4px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">
        Pricing Summary
      </h3>
      <table style="width: 100%; font-size: 12px;">
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid ${templateStyle.borderColor};"><strong>Subtotal:</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid ${templateStyle.borderColor};">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid ${templateStyle.borderColor};"><strong>GST (18%):</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid ${templateStyle.borderColor};">{{gst_amount}}</td>
        </tr>
        <tr style="background: #fff; font-weight: bold;">
          <td style="padding: 8px 0; font-size: 14px;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-size: 14px; color: ${templateStyle.primaryColor};"><strong>{{total_amount}}</strong></td>
        </tr>
      </table>
    </div>`;

  const generateBankDetailsSection = () => `
    <!-- Bank Details -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid ${templateStyle.borderColor}; padding-bottom: 5px;">
        Our Bank Details:
      </h3>
      
      <div style="background: ${templateStyle.secondaryColor}; padding: 15px; border-radius: 4px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <strong>AADISHAKTI PROJECTS</strong><br>
            IDFC First Bank<br>
            Main (Raipur) Branch,<br>
            Raipur, Chhattisgarh<br>
            A/c: <strong>{{bank_account}}</strong><br>
            IFSC: <strong>{{bank_ifsc}}</strong>
          </div>
          <div style="text-align: center; padding: 20px;">
            <div style="border: 2px solid #333; padding: 15px; font-size: 10px;">
              <strong>SCAN & PAY</strong><br>
              [QR CODE PLACEHOLDER]<br>
              <small>Use WhatsApp scanner or any UPI QR scanner</small>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  const generateFooterSection = () => `
    <!-- Footer -->
    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid ${templateStyle.borderColor}; padding-top: 15px;">
      <p style="margin: 0 0 5px 0; font-weight: bold;">Truly,</p>
      <p style="margin: 0 0 5px 0;"><strong>For, Aadishakti Projects</strong></p>
      <p style="margin: 0 0 15px 0;">(Establishment of Rajdev Group)</p>
      
      <div style="font-size: 11px; color: #888;">
        <p style="margin: 0 0 2px 0;"><strong>GST No: ${companyInfo.gst}</strong></p>
        <div style="margin-top: 10px;">
          <strong>Contact Information:</strong><br>
          📍 ${companyInfo.address}<br>
          📞 ${companyInfo.phone} | 📧 ${companyInfo.email}<br>
          🌐 ${companyInfo.website}
        </div>
      </div>
      
      <div style="margin-top: 15px; background: ${templateStyle.primaryColor}; color: white; padding: 8px; border-radius: 4px; font-weight: bold;">
        WE LIFT YOU UP
      </div>
    </div>`;

  const handleSave = useCallback(() => {
    const content = generateTemplateContent();
    const newTemplate: Template = {
      id: template?.id || `tmpl_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      content,
      createdAt: template?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: template?.createdBy || 'user',
      isDefault: template?.isDefault || false
    };
    onSave(newTemplate);
  }, [template, templateName, templateDescription, generateTemplateContent, onSave]);

  const handlePreview = useCallback(() => {
    const content = generateTemplateContent();
    if (onPreview) {
      onPreview(content);
    }
  }, [generateTemplateContent, onPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
            />
            <Input
              label="Description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Enter template description..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {[
          { id: 'layout', label: 'Layout', icon: Layout },
          { id: 'styling', label: 'Styling', icon: Palette },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="Logo Text"
                  value={companyInfo.logo}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, logo: e.target.value }))}
                />
                <Input
                  label="Address Placeholder"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                />
                <Input
                  label="Phone Placeholder"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  label="Email Placeholder"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  label="GST Placeholder"
                  value={companyInfo.gst}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, gst: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipment Table Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                Equipment Table Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Table Columns</h4>
                  <Button onClick={addEquipmentColumn} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Column
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Label</th>
                        <th className="border border-gray-300 p-2 text-left">Placeholder</th>
                        <th className="border border-gray-300 p-2 text-left">Width</th>
                        <th className="border border-gray-300 p-2 text-left">Align</th>
                        <th className="border border-gray-300 p-2 text-left">Type</th>
                        <th className="border border-gray-300 p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentColumns.map((column) => (
                        <tr key={column.id}>
                          <td className="border border-gray-300 p-2">
                            <TextArea
                              value={column.label}
                              onChange={(e) => updateEquipmentColumn(column.id, { label: e.target.value })}
                              rows={2}
                              className="w-full text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Input
                              value={column.placeholder}
                              onChange={(e) => updateEquipmentColumn(column.id, { placeholder: e.target.value })}
                              className="text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Input
                              value={column.width}
                              onChange={(e) => updateEquipmentColumn(column.id, { width: e.target.value })}
                              className="text-sm"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <select
                              value={column.align}
                              onChange={(e) => updateEquipmentColumn(column.id, { align: e.target.value as any })}
                              className="w-full p-1 border rounded text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <select
                              value={column.type}
                              onChange={(e) => updateEquipmentColumn(column.id, { type: e.target.value as any })}
                              className="w-full p-1 border rounded text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="currency">Currency</option>
                            </select>
                          </td>
                          <td className="border border-gray-300 p-2">
                            <Button
                              onClick={() => removeEquipmentColumn(column.id)}
                              size="sm"
                              variant="outline"
                              disabled={equipmentColumns.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Template Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Manage Sections</h4>
                  <Button onClick={addCustomSection} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Section
                  </Button>
                </div>

                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div key={section.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleSection(section.id)}
                          className="rounded"
                        />
                        <span className="font-medium">{section.title}</span>
                        <span className="text-sm text-gray-500 capitalize">{section.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => moveSectionUp(index)}
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => moveSectionDown(index)}
                          size="sm"
                          variant="outline"
                          disabled={index === sections.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                        {section.type === 'custom' && (
                          <Button
                            onClick={() => removeSection(section.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Styling Tab */}
      {activeTab === 'styling' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Template Styling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={templateStyle.primaryColor}
                  onChange={(e) => setTemplateStyle(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={templateStyle.secondaryColor}
                  onChange={(e) => setTemplateStyle(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Color
                </label>
                <input
                  type="color"
                  value={templateStyle.borderColor}
                  onChange={(e) => setTemplateStyle(prev => ({ ...prev, borderColor: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <Input
                label="Font Family"
                value={templateStyle.fontFamily}
                onChange={(e) => setTemplateStyle(prev => ({ ...prev, fontFamily: e.target.value }))}
              />
              <Input
                label="Base Font Size"
                value={templateStyle.baseFontSize}
                onChange={(e) => setTemplateStyle(prev => ({ ...prev, baseFontSize: e.target.value }))}
              />
              <Input
                label="Header Font Size"
                value={templateStyle.headerFontSize}
                onChange={(e) => setTemplateStyle(prev => ({ ...prev, headerFontSize: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Template Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border border-gray-300 rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: generateTemplateContent() }}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button onClick={handlePreview} variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          Preview Template
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}

export default DynamicTemplateBuilder;
