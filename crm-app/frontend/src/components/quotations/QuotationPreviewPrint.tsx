import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Printer, Eye, Download, Mail, X } from 'lucide-react';

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

  const generateSimplePreview = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${data.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .company-tagline {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 20px;
          }
          .quotation-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .detail-item {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            color: #374151;
          }
          .detail-value {
            color: #6b7280;
          }
          .cost-section {
            margin-top: 40px;
            padding: 20px;
            background: #f0f9ff;
            border-left: 4px solid #2563eb;
            border-radius: 0 8px 8px 0;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          }
          .terms {
            margin-top: 40px;
            padding: 20px;
            background: #fef7ed;
            border-left: 4px solid #f59e0b;
            border-radius: 0 8px 8px 0;
          }
          .signature-section {
            margin-top: 60px;
            text-align: right;
            padding-top: 40px;
            border-top: 1px solid #e5e7eb;
          }
          .signature-line {
            border-bottom: 1px solid #374151;
            width: 200px;
            margin: 40px 0 10px auto;
          }
          @media print {
            body { margin: 0; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">ASP CRANES</div>
            <div class="company-tagline">Professional Crane Services | Your Trusted Partner</div>
            <div class="quotation-title">QUOTATION</div>
          </div>

          <div class="details-grid">
            <div>
              <div class="detail-item">
                <div class="detail-label">Quotation ID:</div>
                <div class="detail-value">#${data.id}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${new Date(data.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Machine Type:</div>
                <div class="detail-value">${data.machine_type}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Order Type:</div>
                <div class="detail-value">${data.order_type}</div>
              </div>
            </div>
            <div>
              <div class="detail-item">
                <div class="detail-label">Customer:</div>
                <div class="detail-value">${data.customer_name}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email:</div>
                <div class="detail-value">${data.customer_email || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${data.customer_phone || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status:</div>
                <div class="detail-value">${data.status}</div>
              </div>
            </div>
          </div>

          <div class="cost-section">
            <h3 style="margin-top: 0; color: #2563eb;">Project Details</h3>
            <div class="details-grid" style="background: white; margin: 20px 0;">
              <div>
                <div class="detail-item">
                  <div class="detail-label">Duration:</div>
                  <div class="detail-value">${data.number_of_days} days</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Working Hours:</div>
                  <div class="detail-value">${data.working_hours} hours/day</div>
                </div>
              </div>
              <div>
                <div class="detail-item">
                  <div class="detail-label">Total Hours:</div>
                  <div class="detail-value">${data.number_of_days * data.working_hours} hours</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Rate:</div>
                  <div class="detail-value">₹${Math.round(data.total_cost / (data.number_of_days * data.working_hours))}/hour</div>
                </div>
              </div>
            </div>
            <div class="total-amount">
              Total Amount: ₹${data.total_cost.toLocaleString('en-IN')}
            </div>
          </div>

          <div class="terms">
            <h3 style="margin-top: 0; color: #f59e0b;">Terms & Conditions</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Payment Terms: 50% advance, balance on completion</li>
              <li>Equipment delivery within 2-3 working days from advance payment</li>
              <li>Fuel charges extra as per actual consumption</li>
              <li>All rates are subject to site conditions and accessibility</li>
              <li>This quotation is valid for 15 days from date of issue</li>
              <li>Mobilization and demobilization charges as applicable</li>
            </ul>
          </div>

          <div class="signature-section">
            <strong>For ASP Cranes</strong>
            <div class="signature-line"></div>
            <div style="font-size: 12px; color: #6b7280;">Authorized Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const handlePreview = () => {
    setIsLoading(true);
    try {
      const html = generateSimplePreview();
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const html = generateSimplePreview();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const html = generateSimplePreview();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation_${quotationId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
