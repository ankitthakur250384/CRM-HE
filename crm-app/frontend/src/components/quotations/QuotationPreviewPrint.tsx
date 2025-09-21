import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Printer, Eye, Download, Mail, X } from 'lucide-react';
import { generateAndDownloadPDF, generateAndOpenPDF } from '../../services/pdfGenerator';

interface QuotationPreviewPrintProps {
  quotationId: string;
  quotationData?: any;
}

const QuotationPreviewPrint: React.FC<QuotationPreviewPrintProps> = ({
  quotationId,
  quotationData
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Simple quotation data for testing
  const defaultQuotationData = {
    id: quotationId,
    customer_name: "Sample Customer",
    customer_email: "customer@example.com",
    customer_phone: "+91-9876543210",
    machine_type: "Mobile Crane",
    order_type: "Rental",
    number_of_days: 5,
    working_hours: 8,
    total_cost: 50000,
    created_at: new Date().toISOString(),
    status: "draft"
  };

  const data = quotationData || defaultQuotationData;

  // Fetch default template configuration on component mount
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        
        // First, get the default template configuration
        const configResponse = await fetch(`${apiUrl}/config/defaultTemplate`, {
          headers: {
            'X-Bypass-Auth': 'development-only-123'
          }
        });
        
        if (configResponse.ok) {
          const configResult = await configResponse.json();
          const config = configResult.data || configResult;
          console.log('🔧 Default template config:', config);
          
          if (config && config.defaultTemplateId) {
            // Fetch the actual template
            const templateResponse = await fetch(`${apiUrl}/templates/enhanced/${config.defaultTemplateId}`, {
              headers: {
                'X-Bypass-Auth': 'development-only-123'
              }
            });
            
            if (templateResponse.ok) {
              const template = await templateResponse.json();
              console.log('📋 Fetched default template:', template);
              setDefaultTemplate(template.data || template);
            } else {
              console.warn('Failed to fetch default template, using fallback');
              setError('Failed to load default template');
            }
          } else {
            console.warn('No default template configured, using fallback');
            setError('No default template configured');
          }
        } else {
          console.warn('Failed to fetch default template config, using fallback');
          setError('Failed to load template configuration');
        }
      } catch (error) {
        console.error('Error fetching default template:', error);
        setError('Error loading template');
      }
    };

    fetchDefaultTemplate();
  }, []);

  const generateTemplatePreview = async () => {
    if (!defaultTemplate) {
      throw new Error('No default template available - Template builder system is required');
    }

    console.log('🎨 [QuotationPreview] Using template builder system with template:', defaultTemplate.name);
    console.log('📋 Template data:', defaultTemplate);
    console.log('📊 Quotation data:', data);
    
    // Use the template builder API to generate the preview
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    console.log('🌐 API URL:', apiUrl);
    
    const requestPayload = {
      templateId: defaultTemplate.id,
      quotationData: data
    };
    console.log('📤 Request payload:', requestPayload);
    
    const response = await fetch(`${apiUrl}/templates/enhanced/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bypass-Auth': 'development-only-123'
      },
      body: JSON.stringify(requestPayload)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Template preview API failed:', response.status, errorText);
      throw new Error(`Template API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 API response:', result);
    
    const generatedHtml = result.data?.html || result.html;
    
    if (!generatedHtml) {
      console.error('❌ No HTML returned from template API');
      console.log('Response structure:', Object.keys(result));
      throw new Error('Template API returned no HTML content');
    }

    console.log('✅ Successfully generated template-based preview');
    console.log('📄 Generated HTML length:', generatedHtml.length);
    return generatedHtml;
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🎨 Generating template-based preview...');
      const html = await generateTemplatePreview();
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to generate preview: ${errorMessage}`);
      alert(`Preview failed: ${errorMessage}\n\nPlease ensure:\n1. Backend server is running\n2. Default template is configured\n3. Template builder system is working`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      console.log('🖨️ Generating template-based print content...');
      const html = await generateTemplatePreview();
      
      // Use the new PDF generation service
      await generateAndOpenPDF(html, {
        filename: `ASP_Cranes_Quotation_${quotationId}.pdf`,
        format: 'a4',
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Error generating print content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Print failed: ${errorMessage}\n\nPlease ensure the template builder system is working correctly.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      console.log('💾 Generating template-based download content...');
      const html = await generateTemplatePreview();
      
      // Use the new PDF generation service
      await generateAndDownloadPDF(
        html,
        `ASP_Cranes_Quotation_${quotationId}.pdf`,
        {
          format: 'a4',
          orientation: 'portrait'
        }
      );
    } catch (error) {
      console.error('Error generating download content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Download failed: ${errorMessage}\n\nPlease ensure the template builder system is working correctly.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmail = () => {
    const subject = `Quotation #${quotationId} from ASP Cranes`;
    const body = `Dear ${data.customer_name},\n\nPlease find attached the quotation for your crane rental requirements.\n\nThank you for choosing ASP Cranes.\n\nBest regards,\nASP Cranes Team`;
    const mailtoLink = `mailto:${data.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <div className="quotation-preview-print">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Quotation Actions</h3>
        
        {/* Template Status Display */}
        {defaultTemplate && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Using template: <strong>{defaultTemplate.name}</strong>
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ {error} - Using fallback template
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={handlePreview}
            disabled={isLoading}
            className="flex flex-col items-center space-y-2 h-16"
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">Preview</span>
          </Button>

          <Button 
            onClick={handlePrint}
            disabled={isLoading}
            className="flex flex-col items-center space-y-2 h-16"
          >
            <Printer className="h-5 w-5" />
            <span className="text-xs">Print</span>
          </Button>

          <Button 
            onClick={handleDownload}
            disabled={isLoading}
            className="flex flex-col items-center space-y-2 h-16"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">Download</span>
          </Button>

          <Button 
            onClick={handleEmail}
            disabled={isLoading}
            className="flex flex-col items-center space-y-2 h-16"
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">Email</span>
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-4xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Quotation Preview</h3>
              <div className="flex items-center space-x-2">
                <Button onClick={handlePrint} size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  onClick={() => setIsPreviewOpen(false)}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-full p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0 rounded"
                title="Quotation Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationPreviewPrint;
