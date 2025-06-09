import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Toast } from '../common/Toast';
import { Template } from '../../types/template';
import { Quotation } from '../../types/quotation';
import { mergeQuotationWithTemplate, getAvailablePlaceholders } from '../../utils/templateMerger';
import { Eye, Download, Send, FileText, Info } from 'lucide-react';

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
  foodResources: 2,
  accomResources: 2,
  siteDistance: 50,
  usage: 'normal',
  riskFactor: 'low',
  extraCharge: 5000,
  incidentalCharges: ['incident1', 'incident2'],
  otherFactorsCharge: 2000,
  billing: 'gst',
  baseRate: 4000,
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
  createdBy: 'system',
  status: 'draft',
  machineType: 'crane',
  otherFactors: ['rigger', 'area', 'customerReputation']
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
  }, [template]);

  const previewQuotation = quotation || SAMPLE_QUOTATION;

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  // Merge template with quotation data
  let mergedContent = '';
  try {
    mergedContent = mergeQuotationWithTemplate(previewQuotation, template);
  } catch (err) {
    console.error('Error merging template:', err);
    setError('Failed to merge template with quotation data');
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
        </CardHeader>
        <CardContent>
          {mergedContent ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: mergedContent }} 
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              No preview available
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