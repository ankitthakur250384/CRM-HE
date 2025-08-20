import { useState, useEffect } from 'react';
// Utility: Filter mergedContent or data based on selectedOptions
function filterContentByOptions(mergedContent: string, selectedOptions: string[]) {
  // Example: Remove sections from mergedContent that are not in selectedOptions
  // This is a placeholder. You should adapt this to your template structure.
  let filteredContent = mergedContent;

  // Example: Remove customer details if not selected
  if (!selectedOptions.includes('customer_details')) {
    filteredContent = filteredContent.replace(/<div[^>]*id=["']customer-details["'][^>]*>[\s\S]*?<\/div>/gi, '');
  }
  // Add similar blocks for other options as needed

  // You can also use selectedOptions to filter data objects before rendering
  return filteredContent;
}
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate } from '../../utils/templateMerger';
import { calculateQuotationTotals } from '../../utils/professionalTemplateRenderer';
import { QuotationSummary } from '../../pages/QuotationSummary';
import { PrintOptionsModal } from './PrintOptionsModal';
import { FileText, Info, Download, Send, RefreshCw } from 'lucide-react';

// Sample quotation data for preview when no quotation is provided
// This matches the database schema and backend transformation
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
  machineType: 'mobile_crane',
  orderType: 'monthly',
  numberOfDays: 30,
  workingHours: 8,
  selectedEquipment: {
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
      name: '50T Mobile Crane',
      baseRates: {
        micro: 5000,
        small: 4500,
        monthly: 4000,
        yearly: 3500
      },
      baseRate: 4000,
      runningCostPerKm: 100,
      quantity: 1
    }
  ],
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'medium',
  extraCharge: 5000,
  incidentalCharges: ['incident1', 'incident2'],
  otherFactorsCharge: 2000,
  billing: 'gst',
  includeGst: true,
  shift: 'single',
  dayNight: 'day',
  mobDemob: 15000,
  mobRelaxation: 5000,
  runningCostPerKm: 100,
  // Pre-calculated values (as would come from database)
  totalRent: 960000, // 4000 * 8 * 30 = 960,000
  workingCost: 960000,
  mobDemobCost: 15000,
  foodAccomCost: 390000, // (2*2500 + 2*4000) * 30 = 390,000
  usageLoadFactor: 0, // Normal usage = 0
  riskAdjustment: 8000, // Medium risk = 8000
  gstAmount: 243000, // 18% of total before GST (approximately)
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  status: 'draft',
  otherFactors: ['rigger', 'area'],
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
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedContent, setMergedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const previewQuotation = quotation || SAMPLE_QUOTATION;

  // Generate template content when component mounts or data changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!template) {
        setError('Template is required');
        return;
      }
      if (!template.content && !template.elements) {
        setError('Template content is required');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Template preview received template:", template);
        console.log("Template preview received quotation:", quotation);

        const result = await mergeQuotationWithTemplate(previewQuotation, template);
        console.log("Generated merged content length:", result?.length || 0);
        console.log("Generated merged content preview:", result ? result.substring(0, 200) : 'empty');
        console.log("Template structure:", {
          id: template.id,
          name: template.name,
          hasContent: !!template.content,
          hasElements: !!template.elements,
          elementsCount: template.elements?.length || 0
        });
        
        if (result && result.trim()) {
          setMergedContent(result);
        } else {
          console.warn("Cannot merge template - missing template or content");
          setMergedContent('<div style="padding: 20px;">Template content could not be loaded</div>');
        }
      } catch (err) {
        console.error('Error merging template:', err);
        setError('Failed to merge template with quotation data');
        setMergedContent('<div style="padding: 20px; color: red;">Error generating preview</div>');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [template, quotation]);

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Define available placeholders
  const placeholders = [
    { key: 'customer_name', label: 'Customer Name', category: 'Customer' },
    { key: 'equipment_name', label: 'Equipment Name', category: 'Equipment' },
    { key: 'project_duration', label: 'Project Duration', category: 'Project' },
    { key: 'total_amount', label: 'Total Amount', category: 'Financial' },
  ];
  const placeholdersByCategory = placeholders.reduce((acc: any, placeholder: any) => {
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

  const handleDownload = () => {
    setShowPrintOptions(true);
  };

  // This function will filter the content based on selected options and trigger PDF generation
  const handlePrintWithOptions = (selectedOptions: string[]) => {
    showToast(`Generating PDF with ${selectedOptions.length} selected options`, 'success');
    // Filter the content based on selected options
    const filteredContent = filterContentByOptions(mergedContent, selectedOptions);

    // Example: Use html2pdf or jsPDF to generate PDF from filteredContent
    // Here is a placeholder for integration:
    // html2pdf().from(filteredContent).save();
    // OR
    // const doc = new jsPDF();
    // doc.text(filteredContent, 10, 10);
    // doc.save('quotation.pdf');

    // For now, just log the filtered content
    console.log('Filtered content for PDF:', filteredContent);

    // If you want to use the original onDownloadPDF, you can pass filteredContent or selectedOptions
    if (onDownloadPDF) {
      onDownloadPDF();
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-red-800">
          <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Preview Mode:</strong> {quotation 
            ? 'Showing preview with actual quotation data.' 
            : 'Showing preview with sample data. Actual values will be used when generating the quotation.'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Template Preview */}
        <div className="flex-1">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <CardTitle className="text-base sm:text-lg">Quotation Preview</CardTitle>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleDownload}
                    className="flex items-center gap-1 w-full sm:w-auto"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    Download PDF
                  </Button>
                  {onSendEmail && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={onSendEmail}
                      className="flex items-center gap-1 w-full sm:w-auto"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      Send Email
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {error ? (
                <div className="bg-red-50 border border-red-100 rounded-md p-3 sm:p-4 text-red-800 text-xs sm:text-sm mb-3 sm:mb-4">
                  <p className="font-medium">Error: {error}</p>
                  <p className="mt-1">Please try refreshing the page or select a different template.</p>
                </div>
              ) : null}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-gray-500 py-8 sm:py-16 border border-dashed rounded-md">
                  <RefreshCw className="w-6 sm:w-8 h-6 sm:h-8 animate-spin mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm">Preparing preview...</p>
                </div>
              ) : mergedContent ? (
                <div 
                  className="prose max-w-none border rounded-md p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: mergedContent }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 py-8 sm:py-16 border border-dashed rounded-md">
                  <FileText className="w-6 sm:w-8 h-6 sm:h-8 mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-xs sm:text-sm">No content available</p>
                </div>
              )}
              {template && !template.content && !template.elements && !isLoading && (
                <div className="mt-3 sm:mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-3 sm:p-4 text-yellow-800 text-xs sm:text-sm">
                  <p className="font-medium">Warning: Template has no content</p>
                  <p className="mt-1">This template appears to be empty. Please edit the template to add content.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Quotation Summary */}
        <div className="w-full md:w-80 bg-white rounded-lg shadow p-6 mt-6 md:mt-0">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Quotation Summary</h3>
          <QuotationSummary 
            calculations={(() => {
              console.log('🔍 TemplatePreview: Which quotation are we using?');
              console.log('📋 quotation prop passed to TemplatePreview:', quotation);
              console.log('📋 previewQuotation (quotation || SAMPLE_QUOTATION):', previewQuotation);
              console.log('📋 Using sample data?', !quotation);
              
              const calcs = calculateQuotationTotals(previewQuotation);
              console.log('🧮 TemplatePreview calculations result:', calcs);
              console.log('📋 Preview quotation data used for calculation:', {
                foodResources: previewQuotation.foodResources,
                accomResources: previewQuotation.accomResources,
                numberOfDays: previewQuotation.numberOfDays,
                mobDemob: previewQuotation.mobDemob,
                extraCharge: previewQuotation.extraCharge,
                workingCost: previewQuotation.workingCost,
                totalRent: previewQuotation.totalRent
              });
              return calcs;
            })()}
            formData={{
              extraCharge: previewQuotation.extraCharge || 0,
              incidentalCharges: previewQuotation.incidentalCharges || [],
              otherFactors: previewQuotation.otherFactors || [],
              includeGst: previewQuotation.includeGst
            }}
            additionalParams={{
              riggerAmount: 40000,
              helperAmount: 12000
            }}
          />
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
              Template: {template.name || 'Untitled Template'}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowPlaceholders(!showPlaceholders)}
                className="flex items-center gap-1 w-full sm:w-auto"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                {showPlaceholders ? 'Hide' : 'Show'} Placeholders
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopyContent}
                disabled={!mergedContent}
                className="w-full sm:w-auto"
              >
                Copy Content
              </Button>
            </div>
          </div>
        </CardHeader>
        {template.description && (
          <CardContent className="px-3 sm:px-6">
            <p className="text-xs sm:text-sm text-gray-600">{template.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Available Placeholders */}
      {showPlaceholders && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(placeholdersByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(items as any[]).map((placeholder: any) => (
                      <div
                        key={placeholder.key}
                        className="text-xs font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 transition-colors truncate"
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
            <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
              Click on any placeholder to copy it to your clipboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}

      {/* Print Options Modal */}
      <PrintOptionsModal
        isOpen={showPrintOptions}
        onClose={() => setShowPrintOptions(false)}
        onPrint={handlePrintWithOptions}
      />
    </div>
  );
}