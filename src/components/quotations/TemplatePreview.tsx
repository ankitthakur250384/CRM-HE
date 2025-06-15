import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate, getAvailablePlaceholders } from '../../utils/templateMerger';
import { FileText, Info, Download, Send, RefreshCw } from 'lucide-react';

// Sample quotation data for preview when no quotation is provided
const SAMPLE_QUOTATION: Quotation = {
  id: 'sample-quotation',
  leadId: 'sample-lead',
  customerId: 'sample-customer',
  customerName: 'Sample Company Ltd.',
  customerContact: {
    name: 'John Smith',
    email: 'john.smith@samplecompany.com',
    phone: '+91 98765 43210',
    company: 'Sample Company Ltd.',
    address: '123 Business Park, Tech City, State - 400001',
    designation: 'Procurement Manager'
  },
  orderType: 'monthly',
  numberOfDays: 30,
  workingHours: 8,  selectedEquipment: {
    id: 'sample-equipment',
    equipmentId: 'crane-001',
    name: '50T Mobile Crane',
    baseRates: {
      micro: 5000,
      small: 4500,
      monthly: 4000,
      yearly: 3500
    }
  },
  selectedMachines: [
    {
      id: 'sample-equipment',
      machineType: 'mobile_crane',
      equipmentId: 'crane-001',
      name: '50T Mobile Crane',      baseRates: {
        micro: 5000,
        small: 4500,
        monthly: 4000,
        yearly: 3500
      },
      baseRate: 4000,
      runningCostPerKm: 100,
      quantity: 1
    },
    {
      id: 'sample-equipment-2',
      machineType: 'mobile_crane',
      equipmentId: 'crane-002',
      name: '100T Mobile Crane',
      baseRates: {
        micro: 8000,
        small: 7500,
        monthly: 7000,
        yearly: 6500
      },
      baseRate: 7000,
      runningCostPerKm: 150,
      quantity: 2
    }
  ],
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'low',
  extraCharge: 5000,
  incidentalCharges: ['incident1', 'incident2'],
  otherFactorsCharge: 2000,  billing: 'gst',
  workingCost: 4000,
  includeGst: true,
  shift: 'single',
  dayNight: 'day',
  mobDemob: 15000,
  mobRelaxation: 5000,
  runningCostPerKm: 100,
  totalRent: 150000,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',  status: 'draft',
  machineType: 'mobile_crane',
  otherFactors: ['rigger', 'area', 'customer_reputation'],
  dealType: 'credit',
  sundayWorking: 'no'
};

interface TemplatePreviewProps {
  template: Template;
  quotation?: Quotation;
  onDownloadPDF?: () => void;
  onSendEmail?: () => void;
  className?: string;
}

export function TemplatePreview({ 
  template, 
  quotation, 
  onDownloadPDF, 
  onSendEmail,
  className = '' 
}: TemplatePreviewProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });
  // Validate template
  useEffect(() => {
    if (!template) {
      setError('Template is required');
      return;
    }
    if (!template.content) {
      setError('Template content is required');
      return;
    }
    setError(null);
    
    console.log("Template preview received template:", template);
    console.log("Template preview received quotation:", quotation);
  }, [template, quotation]);

  const previewQuotation = quotation || SAMPLE_QUOTATION;

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Merge template with quotation data
  let mergedContent = '';
  try {
    if (template && template.content) {
      mergedContent = mergeQuotationWithTemplate(previewQuotation, template);
      console.log("Generated merged content:", mergedContent ? mergedContent.substring(0, 100) + '...' : 'empty');
    } else {
      console.warn("Cannot merge template - missing template or content");
      mergedContent = '<div style="padding: 20px;">Template content could not be loaded</div>';
    }
  } catch (err) {
    console.error('Error merging template:', err);
    setError('Failed to merge template with quotation data');
    mergedContent = '<div style="padding: 20px; color: red;">Error generating preview</div>';
  }

  // Get available placeholders grouped by category
  const placeholders = getAvailablePlaceholders();
  const placeholdersByCategory = placeholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  const handleCopyContent = () => {
    if (!mergedContent) {
      showToast('No content to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(mergedContent).then(() => {
      showToast('Content copied to clipboard', 'success');
    }).catch(() => {
      showToast('Failed to copy content', 'error');
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Preview Mode:</strong> {quotation 
            ? 'Showing preview with actual quotation data.' 
            : 'Showing preview with sample data. Actual values will be used when generating the quotation.'}
        </p>
      </div>
      
      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template: {template.name || 'Untitled Template'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlaceholders(!showPlaceholders)}
                leftIcon={<Info className="w-4 h-4" />}
              >
                {showPlaceholders ? 'Hide' : 'Show'} Placeholders
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                disabled={!mergedContent}
              >
                Copy Content
              </Button>
            </div>
          </div>
        </CardHeader>
        {template.description && (
          <CardContent>
            <p className="text-sm text-gray-600">{template.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Available Placeholders */}
      {showPlaceholders && (
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(placeholdersByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map((placeholder) => (
                      <div
                        key={placeholder.key}
                        className="text-xs font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors"
                        title={placeholder.description}
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${placeholder.key}}}`);
                          showToast(`Copied {{${placeholder.key}}}`, 'success');
                        }}
                      >
                        {`{{${placeholder.key}}}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Click on any placeholder to copy it to your clipboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Merged Content Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quotation Preview</CardTitle>
            <div className="flex items-center gap-2">
              {onDownloadPDF && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadPDF}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download PDF
                </Button>
              )}
              {onSendEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSendEmail}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send Email
                </Button>
              )}
            </div>
          </div>
        </CardHeader>        <CardContent>
          {error ? (
            <div className="bg-red-50 border border-red-100 rounded-md p-4 text-red-800 text-sm mb-4">
              <p className="font-medium">Error: {error}</p>
              <p className="mt-1">Please try refreshing the page or select a different template.</p>
            </div>
          ) : null}
          
          {mergedContent ? (
            <div 
              className="prose max-w-none border rounded-md p-4"
              dangerouslySetInnerHTML={{ __html: mergedContent }} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 py-16 border border-dashed rounded-md">
              <RefreshCw className="w-8 h-8 animate-spin mb-4" />
              <p>Preparing preview...</p>
            </div>
          )}
          
          {template && !template.content && (
            <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-4 text-yellow-800 text-sm">
              <p className="font-medium">Warning: Template has no content</p>
              <p className="mt-1">This template appears to be empty. Please edit the template to add content.</p>
            </div>
          )}
        </CardContent>
      </Card>

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