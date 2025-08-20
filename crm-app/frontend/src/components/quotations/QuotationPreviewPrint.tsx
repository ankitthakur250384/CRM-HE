import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Printer, Eye, Download, Mail } from 'lucide-react';

interface QuotationPreviewPrintProps {
  quotationId: string;
  quotationData?: any;
  onPreview?: (templateId: string) => void;
  onPrint?: (templateId: string) => void;
  onDownloadPdf?: (templateId: string) => void;
  onEmailPdf?: (templateId: string) => void;
}

export const QuotationPreviewPrint: React.FC<QuotationPreviewPrintProps> = ({
  quotationId,
  quotationData,
  onPreview,
  onPrint,
  onDownloadPdf,
  onEmailPdf
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Fetch available templates
  React.useEffect(() => {
    fetchAvailableTemplates();
    fetchTemplateConfig();
  }, []);

  const fetchTemplateConfig = async () => {
    try {
      const response = await fetch('/api/config/templates');
      const result = await response.json();
      if (result.success && result.data) {
        // Set default template if configured and template selection is disabled
        if (!result.data.enableTemplateSelection && result.data.defaultQuotationTemplate) {
          setSelectedTemplate(result.data.defaultQuotationTemplate);
        }
      }
    } catch (error) {
      console.error('Error fetching template config:', error);
    }
  };

  const fetchAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/templates/modern?category=quotation&isActive=true');
      const result = await response.json();
      if (result.success) {
        setAvailableTemplates(result.data);
        // Set default template if only one exists
        if (result.data.length === 1) {
          setSelectedTemplate(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const generatePreview = async (templateId: string) => {
    try {
      const response = await fetch('/api/quotations/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId,
          templateId,
          format: 'html'
        })
      });

      const result = await response.json();
      if (result.success) {
        setPreviewHtml(result.html);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const executeAction = async (action: string, templateId?: string) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let responseType: 'json' | 'blob' = 'json';

      switch (action) {
        case 'preview':
          await generatePreview(templateId || selectedTemplate);
          return;
        case 'print':
          endpoint = '/api/quotations/print';
          break;
        case 'pdf':
          endpoint = '/api/quotations/pdf';
          responseType = 'blob';
          break;
        case 'email':
          endpoint = '/api/quotations/email-pdf';
          break;
      }

      const requestBody: any = { quotationId };
      if (templateId || selectedTemplate) {
        requestBody.templateId = templateId || selectedTemplate;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (responseType === 'blob') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation_${quotationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        if (result.success) {
          if (action === 'print') {
            // Open print dialog with the generated content
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(result.html);
              printWindow.document.close();
              printWindow.print();
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    }
  };

  const handleActionClick = async (action: string) => {
    setPendingAction(action);
    
    // Check if template selection is required
    try {
      const configResponse = await fetch('/api/config/templates');
      const configResult = await configResponse.json();
      
      if (configResult.success && configResult.data) {
        const config = configResult.data;
        
        // If template selection is disabled and there's a default, use it
        if (!config.enableTemplateSelection && config.defaultQuotationTemplate) {
          executeAction(action, config.defaultQuotationTemplate);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
    
    if (availableTemplates.length === 1) {
      // If only one template, use it directly
      executeAction(action, availableTemplates[0].id);
    } else if (selectedTemplate) {
      // If template is already selected, use it
      executeAction(action, selectedTemplate);
    } else {
      // Show template selection dialog
      setIsTemplateDialogOpen(true);
    }
  };

  const handleTemplateSelect = () => {
    if (selectedTemplate && pendingAction) {
      executeAction(pendingAction, selectedTemplate);
      setIsTemplateDialogOpen(false);
      setPendingAction('');
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Preview Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActionClick('preview')}
        className="flex items-center space-x-1"
      >
        <Eye className="h-4 w-4" />
        <span>Preview</span>
      </Button>

      {/* Print Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActionClick('print')}
        className="flex items-center space-x-1"
      >
        <Printer className="h-4 w-4" />
        <span>Print</span>
      </Button>

      {/* Download PDF Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActionClick('pdf')}
        className="flex items-center space-x-1"
      >
        <Download className="h-4 w-4" />
        <span>PDF</span>
      </Button>

      {/* Email PDF Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleActionClick('email')}
        className="flex items-center space-x-1"
      >
        <Mail className="h-4 w-4" />
        <span>Email</span>
      </Button>

      {/* Template Selection Modal */}
      {isTemplateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Template</h3>
            <div className="space-y-4">
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a template...</option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              {selectedTemplate && (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsTemplateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleTemplateSelect}>
                    Continue with {pendingAction}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Quotation Preview</h3>
            <div className="flex-1 w-full border overflow-hidden">
              <iframe
                ref={previewRef}
                srcDoc={previewHtml}
                className="w-full h-96"
                title="Quotation Preview"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleActionClick('print');
                }}
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
