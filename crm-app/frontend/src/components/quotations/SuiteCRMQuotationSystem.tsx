import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Mail, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  X
} from 'lucide-react';

interface SuiteCRMQuotationSystemProps {
  quotationId: string;
  quotationData: any;
  onClose: () => void;
}

const SuiteCRMQuotationSystem: React.FC<SuiteCRMQuotationSystemProps> = ({
  quotationId,
  quotationData,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  // Function to convert number to words (simplified version)
  const convertToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
    if (num < 100000) return convertToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertToWords(num % 1000) : '');
    if (num < 10000000) return convertToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertToWords(num % 100000) : '');
    return convertToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertToWords(num % 10000000) : '');
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      if (!quotationData) {
        console.error('No quotation data available');
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: 'No quotation data available'
        }]);
        return;
      }
      
      const data = quotationData; // Alias for template usage
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quotation Preview</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            
            .quotation-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 40px;
              text-align: center;
              position: relative;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
              opacity: 0.3;
            }
            
            .company-logo {
              font-size: 36px;
              font-weight: 900;
              margin-bottom: 10px;
              letter-spacing: 2px;
              position: relative;
              z-index: 1;
            }
            
            .company-tagline {
              font-size: 16px;
              margin-bottom: 25px;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            
            .quotation-title {
              font-size: 28px;
              font-weight: 700;
              background: rgba(255,255,255,0.15);
              padding: 15px 30px;
              border-radius: 8px;
              display: inline-block;
              position: relative;
              z-index: 1;
            }
            
            .content {
              padding: 40px;
            }
            
            .quotation-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
              padding: 25px;
              background: #f8fafc;
              border-radius: 12px;
              border-left: 5px solid #3b82f6;
            }
            
            .meta-group h3 {
              color: #1e40af;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .section {
              margin-bottom: 30px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            
            .section h2 {
              color: #1e40af;
              margin-bottom: 15px;
              font-size: 20px;
            }
            
            .total-section {
              text-align: center;
              padding: 30px;
              background: #1e40af;
              color: white;
              border-radius: 12px;
              margin-top: 40px;
            }
            
            .total-amount {
              font-size: 36px;
              font-weight: 900;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="quotation-container">
            <div class="header">
              <div class="company-logo">ASP CRANES</div>
              <div class="company-tagline">Professional Crane Services</div>
              <div class="quotation-title">QUOTATION</div>
            </div>
            
            <div class="content">
              <div class="quotation-meta">
                <div class="meta-group">
                  <h3>Quotation Details</h3>
                  <div>ID: #${data.id}</div>
                  <div>Date: ${new Date(data.created_at).toLocaleDateString()}</div>
                  <div>Status: ${data.status}</div>
                </div>
                
                <div class="meta-group">
                  <h3>Customer Information</h3>
                  <div>Company: ${data.customer_name}</div>
                  <div>Email: ${data.customer_email || 'N/A'}</div>
                  <div>Phone: ${data.customer_phone || 'N/A'}</div>
                </div>
              </div>
              
              <div class="section">
                <h2>Project Details</h2>
                <p>Equipment: ${data.equipment_type}</p>
                <p>Duration: ${data.duration} days</p>
                <p>Location: ${data.location}</p>
              </div>
              
              <div class="total-section">
                <h3>Total Amount</h3>
                <div class="total-amount">₹${data.total_cost.toLocaleString()}</div>
                <div>(${convertToWords(data.total_cost)} Rupees Only)</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      if (data) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        }
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          type: 'success',
          message: 'Quotation preview opened successfully'
        }]);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        message: 'Error generating preview'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate preview on mount
  useEffect(() => {
    if (quotationData) {
      handlePreview();
    }
  }, [quotationData]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="suite-crm-quotation-system bg-gray-50 min-h-screen">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-center p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300
              ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
              ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'info' && <FileText className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Quotation #{quotationId}
                </h1>
              </div>
              {quotationData?.status && (
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${quotationData.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                  ${quotationData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${quotationData.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {quotationData.status.charAt(0).toUpperCase() + quotationData.status.slice(1)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span>Preview</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
              
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Quotation System
              </h3>
              <p className="text-gray-500">
                Click "Preview" to view the quotation details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuiteCRMQuotationSystem;