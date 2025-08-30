import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Template } from '../types/template';
import { Plus, FileText, RefreshCw } from 'lucide-react';

import { Toast } from '../components/common/Toast';

import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/templateService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
// import { VisualTemplateEditor } from '../components/quotations/VisualTemplateEditor';
// import { ProfessionalTemplateBuilder } from '../components/quotations/ProfessionalTemplateBuilder';
// import { DynamicTemplateBuilder } from '../components/quotations/DynamicTemplateBuilder';
import { Input } from '../components/common/Input';
import { TextArea } from '../components/common/TextArea';
import TemplatePreviewModal from '../components/templates/TemplatePreviewModal';
import { TemplateCard } from '../components/quotations/TemplateCard';
import { useToast } from '../hooks/useToast';

const defaultTemplate: Template = {
  id: 'default',
  name: 'Default Quotation Template',
  description: 'Standard quotation template with company branding and placeholders',
  content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 15px;">
    <div style="text-align: center; margin-bottom: 15px;">
      <h1 style="color: #0052CC; margin: 0; font-size: 22px; font-weight: 600;">ASP CRANES</h1>
      <h2 style="color: #42526E; margin: 2px 0; font-size: 16px; font-weight: 500;">QUOTATION</h2>
      <hr style="border: none; height: 1px; background: #0052CC; margin: 8px 0 0 0;">
    </div>

    <table style="width: 100%; margin-bottom: 15px; font-size: 13px;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <strong style="color: #42526E;">From:</strong><br>
          <strong>{{company_name}}</strong><br>
          {{company_address}}<br>
          Phone: {{company_phone}}<br>
          Email: {{company_email}}<br>
          GST: {{company_gst}}
        </td>
        <td style="width: 50%; vertical-align: top;">
          <strong style="color: #42526E;">To:</strong><br>
          <strong>{{customer_name}}</strong><br>
          {{customer_designation}}<br>
          {{customer_company}}<br>
          {{customer_address}}<br>
          Phone: {{customer_phone}}<br>
          Email: {{customer_email}}
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px;">
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Quotation ID:</strong> {{quotation_number}}</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Valid Until:</strong> {{valid_until}}</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Date:</strong> {{quotation_date}}</td>
        <td style="padding: 6px 10px; border: 1px solid #DFE1E6;"><strong>Order Type:</strong> {{order_type}}</td>
      </tr>
    </table>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Equipment & Project Details</strong>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; width: 160px;"><strong>Equipment</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{equipment_name}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Duration</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{project_duration}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Working Hours</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{working_hours}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Shift Type</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{shift_type}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;"><strong>Base Rate</strong></td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">{{base_rate}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Pricing Summary</strong>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6;">Subtotal</td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; text-align: right; width: 160px;">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA;">GST (18%)</td>
          <td style="padding: 6px 10px; border: 1px solid #DFE1E6; background: #F8F9FA; text-align: right;">{{gst_amount}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; font-weight: 600;">Total Amount</td>
          <td style="padding: 6px 10px; border: 1px solid #0052CC; background: #0052CC; color: white; text-align: right; font-weight: 600;">{{total_amount}}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 15px;">
      <strong style="color: #172B4D; font-size: 13px; display: block; margin-bottom: 8px;">Terms & Conditions</strong>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #42526E;">
        <li style="margin-bottom: 2px;">Payment Terms: {{payment_terms}}</li>
        <li style="margin-bottom: 2px;">GST @18% will be charged extra as applicable</li>
        <li style="margin-bottom: 2px;">Mobilization charges will be billed extra based on distance</li>
        <li style="margin-bottom: 2px;">Working hours: Standard 8-hour shift. Additional hours will be charged extra</li>
        <li style="margin-bottom: 2px;">Operator & fuel will be provided by ASP Cranes</li>
        <li style="margin-bottom: 2px;">Client to provide necessary permissions & clearances</li>
        <li style="margin-bottom: 2px;">Rate validity: {{validity_period}}</li>
        <li style="margin-bottom: 2px;">Insurance coverage as per standard terms</li>
      </ol>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #42526E; font-size: 13px;">
      <p style="margin: 0 0 2px 0;"><strong>Thank you for your business!</strong></p>
      <p style="margin: 0;">For any queries, please contact us at {{company_phone}} or email at {{company_email}}</p>
    </div>
  </div>`,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function QuotationTemplates() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  // Removed unused state: const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // We still need setEditMode but not the value directly
  const [_, setEditMode] = useState<'new' | 'edit'>('new');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'dynamic' | 'professional'>('visual');
  const [templateForm, setTemplateForm] = useState<Template>({
    id: '',
    name: '',
    description: '',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: user?.email || 'unknown',
    isDefault: false
  });
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'sales_agent') {
      navigate('/dashboard');
      return;
    }

    loadTemplates();
  }, [isAuthenticated, user, navigate]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTemplates = await getTemplates();
      setTemplates(fetchedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      setError('Failed to load templates');
      showToast({
        title: 'Error',
        message: 'Failed to load templates',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    navigate('/templates/new');
  };

  const handleEditTemplate = (template: Template) => {
    setTemplateForm(template);
    setEditMode('edit');
    // Determine the appropriate editor mode based on template content
    if (template.elements && Array.isArray(template.elements) && template.elements.length > 0) {
      setEditorMode('dynamic');
    } else if (template.content && template.content.includes('<')) {
      setEditorMode('html');
    } else {
      setEditorMode('visual');
    }
    setIsCreateModalOpen(true);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  // Removed unused handleDuplicateTemplate function

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      showToast({
        title: 'Success',
        message: 'Template deleted successfully',
        type: 'success'
      });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast({
        title: 'Error',
        message: 'Failed to delete template',
        type: 'error'
      });
    }
  };

  const handleSaveTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (templateForm.id) {
        // Update existing template
        await updateTemplate(templateForm.id, {
          ...templateForm,
          updatedAt: new Date().toISOString()
        });
        setToast({
          show: true,
          title: 'Template updated successfully',
          variant: 'success'
        });
      } else {
        // Create new template
        const now = new Date().toISOString();
        const newTemplate = {
          ...templateForm,
          id: `template-${Date.now()}`,
          createdAt: now,
          updatedAt: now
        };
        await createTemplate(newTemplate);
        setToast({
          show: true,
          title: 'Template created successfully',
          variant: 'success'
        });
      }

      handleCloseModal();
      loadTemplates(); // Refresh the templates list
    } catch (error) {
      console.error('Error saving template:', error);
      setToast({
        show: true,
        title: 'Failed to save template',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsEditOpen(false);
    setTemplateForm({
      id: '',
      name: '',
      description: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.email || 'unknown',
      isDefault: false
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      const template = templates.find(t => t.id === id);
      if (template) {
        // First, remove default from all templates
        await Promise.all(
          templates
            .filter(t => t.isDefault)
            .map(t => updateTemplate(t.id, { ...t, isDefault: false }))
        );

        // Then set the new default
        await updateTemplate(id, {
          ...template,
          isDefault: true
        });

        showToast({
          title: 'Success',
          message: 'Default template updated successfully',
          type: 'success'
        });
        loadTemplates();
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      showToast({
        title: 'Error',
        message: 'Failed to set default template',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">{error}</div>
        <Button onClick={loadTemplates}>Retry</Button>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'sales_agent')) {
    return null;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-gray-500">No templates found</div>
        <Button onClick={handleCreateTemplate}>Create Template</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quotation Templates</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Create and manage quotation templates for your business
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setIsCreateModalOpen(true);
              setEditMode('new');
              setTemplateForm({
                id: '',
                name: '',
                description: '',
                content: defaultTemplate.content || '',
                elements: defaultTemplate.elements || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.email || 'unknown',
                isDefault: false
              });
            }}
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Basic Template
          </Button>
          <Button 
            onClick={() => {
              setIsCreateModalOpen(true);
              setEditMode('new');
              setEditorMode('dynamic');
              setTemplateForm({
                id: '',
                name: 'ASP Cranes Professional Template',
                description: 'Professional quotation template with equipment breakdown table',
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.email || 'unknown',
                isDefault: false
              });
            }}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Professional Template
          </Button>
          <Button 
            onClick={() => {
              setIsCreateModalOpen(true);
              setEditMode('new');
              setEditorMode('html');
              setTemplateForm({
                id: '',
                name: 'Responsive Quotation Template',
                description: 'Mobile-friendly responsive quotation template with modern design',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
      color: #333;
      background-color: #f9f9f9;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #444;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #222;
    }
    .company-info, .customer-info {
      margin-bottom: 20px;
      font-size: 14px;
    }
    .meta {
      margin-bottom: 20px;
      background: #eef;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: #fff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      font-size: 14px;
    }
    table, th, td {
      border: 1px solid #ccc;
    }
    th {
      background: #444;
      color: #fff;
      text-align: center;
      font-size: 14px;
      padding: 8px;
    }
    td {
      padding: 8px;
      word-wrap: break-word;
    }
    tbody tr:nth-child(even) {
      background: #f2f2f2;
    }
    .terms {
      margin-top: 20px;
      background: #fef7e0;
      padding: 15px;
      border-left: 4px solid #f1c40f;
      font-size: 13px;
    }
    .footer {
      margin-top: 40px;
      text-align: right;
      font-style: italic;
      font-size: 14px;
    }
    /* Responsive Styling */
    @media (max-width: 768px) {
      body { margin: 10px; }
      table, th, td { font-size: 12px; }
      .header h1 { font-size: 20px; }
    }
    @media (max-width: 480px) {
      table, thead, tbody, th, td, tr {
        display: block;
        width: 100%;
      }
      thead tr { display: none; }
      td {
        display: flex;
        justify-content: space-between;
        border: none;
        border-bottom: 1px solid #ccc;
        padding: 8px 5px;
      }
      td:before {
        content: attr(data-label);
        font-weight: bold;
        flex-basis: 50%;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>QUOTATION</h1>
  </div>

  <div class="company-info">
    <strong>{{company.name}}</strong><br>
    {{company.address}}<br>
    Phone: {{company.phone}} | Email: {{company.email}}
  </div>

  <div class="meta">
    <p><strong>Quotation No:</strong> {{quotation.number}}</p>
    <p><strong>Date:</strong> {{quotation.date}}</p>
    <p><strong>Validity:</strong> {{quotation.validity}}</p>
  </div>

  <div class="customer-info">
    <p><strong>To:</strong></p>
    <p>{{customer.name}}<br>
       {{customer.company}}<br>
       {{customer.email}}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-label="Description">{{equipment.name}}</td>
        <td data-label="Qty">{{equipment.quantity}}</td>
        <td data-label="Unit Price">₹{{equipment.rate}}</td>
        <td data-label="Total">₹{{equipment.total}}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right;"><strong>Grand Total</strong></td>
        <td><strong>₹{{quotation.total}}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="terms">
    <p><strong>Terms & Conditions:</strong></p>
    <p>{{terms}}</p>
  </div>

  <div class="footer">
    <p>Authorized Signatory</p>
    <p>[Company Stamp / Signature]</p>
  </div>
</body>
</html>`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.email || 'unknown',
                isDefault: false
              });
            }}
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Use Responsive Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load templates</h3>
            <p className="text-gray-500 mb-4 text-center">There was an error loading your templates.</p>
            <Button onClick={loadTemplates}>Try Again</Button>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4 text-center">Create your first quotation template to get started.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setEditMode('new');
                  setTemplateForm({
                    id: '',
                    name: '',
                    description: '',
                    content: defaultTemplate.content || '',
                    elements: defaultTemplate.elements || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: user?.email || 'unknown',
                    isDefault: false
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Basic Template
              </Button>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setEditMode('new');
                  setEditorMode('dynamic');
                  setTemplateForm({
                    id: '',
                    name: 'ASP Cranes Professional Template',
                    description: 'Professional quotation template with equipment breakdown table',
                    content: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: user?.email || 'unknown',
                    isDefault: false
                  });
                }}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Professional
              </Button>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setEditMode('new');
                  setEditorMode('html');
                  setTemplateForm({
                    id: '',
                    name: 'Responsive Quotation Template',
                    description: 'Mobile-friendly responsive quotation template',
                    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #444; padding-bottom: 10px; }
    .header h1 { margin: 0; font-size: 24px; color: #222; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #444; color: #fff; }
    @media (max-width: 480px) {
      table, thead, tbody, th, td, tr { display: block; width: 100%; }
      thead tr { display: none; }
      td { display: flex; justify-content: space-between; }
      td:before { content: attr(data-label); font-weight: bold; }
    }
  </style>
</head>
<body>
  <div class="header"><h1>QUOTATION</h1></div>
  <div><strong>{{company.name}}</strong><br>{{company.address}}</div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      <tr>
        <td data-label="Description">{{equipment.name}}</td>
        <td data-label="Qty">{{equipment.quantity}}</td>
        <td data-label="Price">₹{{equipment.rate}}</td>
        <td data-label="Total">₹{{equipment.total}}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: user?.email || 'unknown',
                    isDefault: false
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Responsive
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleEditTemplate(template)}
              onDelete={() => handleDeleteTemplate(template.id)}
              onPreview={() => handlePreviewTemplate(template)}
              onSetDefault={() => handleSetDefault(template.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditOpen}
        onClose={handleCloseModal}
        title={isEditOpen ? 'Edit Template' : 'Create Template'}
        size="full"
      >
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={templateForm.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setTemplateForm({ ...templateForm, name: e.target.value })}
          />
          
          <div className="flex gap-2 sm:gap-4 mb-4">
            <Button
              variant={editorMode === 'visual' ? 'default' : 'outline'}
              onClick={() => {
                setEditorMode('visual');
              }}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Visual Editor
            </Button>
            <Button
              variant={editorMode === 'dynamic' ? 'default' : 'outline'}
              onClick={() => {
                setEditorMode('dynamic');
              }}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Dynamic Builder
            </Button>
            <Button
              variant={editorMode === 'professional' ? 'default' : 'outline'}
              onClick={() => {
                setEditorMode('professional');
              }}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Professional Builder
            </Button>
            <Button
              variant={editorMode === 'html' ? 'default' : 'outline'}
              onClick={() => {
                setEditorMode('html');
              }}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              HTML Editor
            </Button>
          </div>
            
          {editorMode === 'visual' ? (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p>Visual Template Editor not available</p>
            </div>
          ) : editorMode === 'dynamic' ? (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p>Dynamic Template Builder not available</p>
            </div>
          ) : editorMode === 'professional' ? (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p>Professional Template Builder not available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <TextArea
                label="HTML Content"
                value={templateForm.content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                  setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={20}
              />
              <div className="text-xs sm:text-sm text-gray-500">
                Use double curly braces for placeholders, e.g. {"{{customer_name}}"}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        elements={previewTemplate?.elements || []}
        templateName={previewTemplate?.name}
      />

      {/* Toast */}
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