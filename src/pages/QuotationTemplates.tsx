import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Template } from '../types/template';
import { Plus, FileText, Edit2, Trash2, Copy, Eye, RefreshCw } from 'lucide-react';
import { StructuredTemplateEditor } from '../components/quotations/StructuredTemplateEditor';
import { TemplatePreview } from '../components/quotations/TemplatePreview';
import { Toast } from '../components/common/Toast';
import { validateTemplate } from '../utils/templateMerger';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/firestore/templateService';
import { useAuthStore } from '../store/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { VisualTemplateEditor } from '../components/quotations/VisualTemplateEditor';
import { Input } from '../components/common/Input';
import { TextArea } from '../components/common/TextArea';
import { PreviewModal } from '../components/quotations/PreviewModal';
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function QuotationTemplates() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editMode, setEditMode] = useState<'new' | 'edit'>('new');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(false);
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
    navigate(`/templates/edit/${template.id}`);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const now = new Date().toISOString();
    const duplicatedTemplate: Template = {
      ...template,
        id: '',
      name: `${template.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.email || 'unknown',
        isDefault: false
      };
      await createTemplate(duplicatedTemplate);
      setToast({
        show: true,
        title: 'Template duplicated successfully',
        variant: 'success'
      });
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      setToast({
        show: true,
        title: 'Failed to duplicate template',
        variant: 'error'
      });
    }
  };

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
    setPreviewTemplate(null);
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotation Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage templates for generating quotations.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Template
        </Button>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          
          <div className="flex gap-4 mb-4">
            <Button
              variant={isVisualMode ? 'default' : 'outline'}
              onClick={() => setIsVisualMode(true)}
            >
              Visual Editor
            </Button>
            <Button
              variant={!isVisualMode ? 'default' : 'outline'}
              onClick={() => setIsVisualMode(false)}
            >
              HTML Editor
            </Button>
            </div>
            
          {isVisualMode ? (
            <VisualTemplateEditor
              template={templateForm}
              onChange={(updatedTemplate) => setTemplateForm(updatedTemplate)}
            />
          ) : (
            <div className="space-y-4">
              <TextArea
                label="HTML Content"
                value={templateForm.content}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                  setTemplateForm({ ...templateForm, content: e.target.value })}
                rows={20}
              />
              <div className="text-sm text-gray-500">
                Use double curly braces for placeholders, e.g. {"{{customer_name}}"}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button
              onClick={handleSaveTemplate}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
      </Modal>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={selectedTemplate}
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}