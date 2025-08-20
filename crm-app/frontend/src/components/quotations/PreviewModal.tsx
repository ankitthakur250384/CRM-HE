import React from 'react';
import { Modal } from '../common/Modal';
import { Template } from '../../types/template';
import { RefreshCw } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

const sampleData = {
  company_name: 'ASP Cranes',
  company_address: '123 Industrial Park, Mumbai, India',
  company_phone: '+91 98765 43210',
  company_email: 'info@aspcranes.com',
  company_gst: 'GST123456789',
  customer_name: 'John Smith',
  customer_designation: 'Project Manager',
  customer_company: 'ABC Construction Ltd.',
  customer_address: '456 Construction Site, Delhi, India',
  customer_phone: '+91 98765 12345',
  customer_email: 'john@abcconstruction.com',
  quotation_number: 'QT-2024-001',
  valid_until: '2024-04-30',
  quotation_date: '2024-03-31',
  order_type: 'Rental',
  equipment_name: 'Mobile Crane - 50T',
  project_duration: '30 days',
  working_hours: '8 hours per day',
  shift_type: 'Single Shift',
  base_rate: '₹25,000 per day',
  subtotal: '₹750,000',
  gst_amount: '₹135,000',
  total_amount: '₹885,000',
  payment_terms: '50% advance, 50% within 30 days',
  validity_period: '30 days'
};

export function PreviewModal({ isOpen, onClose, template }: PreviewModalProps) {
  if (!isOpen) return null;

  if (!template) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-4" />
          <p>Loading template...</p>
        </div>
      </Modal>
    );
  }

  // Function to render elements-based templates
  const renderElementsTemplate = (elements: any[]) => {
    return elements.map((element, index) => {
      switch (element.type) {
        case 'header':
          return (
            <div key={index} className="header-section mb-6 p-4 border-b-2 border-blue-600">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-blue-600">{element.content || 'ASP CRANES'}</h1>
                  <p className="text-gray-600">{element.subtitle || 'Crane Rental & Equipment Solutions'}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-blue-600">QUOTATION</h2>
                  <p>Quote #: QT-2024-001</p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          );
        case 'customer_info':
          return (
            <div key={index} className="customer-info mb-6">
              <h3 className="text-lg font-bold text-blue-600 mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold">Bill To:</h4>
                  <p>ABC Construction Ltd.</p>
                  <p>John Smith</p>
                  <p>+91 98765 12345</p>
                  <p>john@abcconstruction.com</p>
                </div>
                <div>
                  <h4 className="font-semibold">Project Details:</h4>
                  <p>Construction Project</p>
                  <p>Mumbai, India</p>
                  <p>Duration: 30 days</p>
                  <p>Start Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          );
        case 'table':
          return (
            <div key={index} className="equipment-table mb-6">
              <h3 className="text-lg font-bold text-blue-600 mb-3">{element.title || 'Equipment & Services'}</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {(element.columns || ['Item', 'Description', 'Qty', 'Duration', 'Rate/Day', 'Amount']).map((col: string, colIndex: number) => (
                      <th key={colIndex} className="border border-gray-300 p-3 text-left">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">50T Mobile Crane</td>
                    <td className="border border-gray-300 p-3">Heavy lifting crane with operator</td>
                    <td className="border border-gray-300 p-3">1</td>
                    <td className="border border-gray-300 p-3">30 days</td>
                    <td className="border border-gray-300 p-3">₹25,000</td>
                    <td className="border border-gray-300 p-3">₹750,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        case 'pricing':
          return (
            <div key={index} className="pricing mb-6 bg-gray-50 p-4 rounded">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>₹750,000</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Delivery & Setup:</span>
                <span>₹15,000</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Insurance (5%):</span>
                <span>₹37,500</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (18%):</span>
                <span>₹135,000</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>₹937,500</span>
              </div>
            </div>
          );
        case 'terms':
          return (
            <div key={index} className="terms mb-6">
              <h3 className="text-lg font-bold text-blue-600 mb-3">{element.title || 'Terms & Conditions'}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {(element.items || [
                  'Payment due within 30 days of invoice date',
                  'Equipment must be returned in same condition as delivered',
                  'Customer responsible for fuel and routine maintenance'
                ]).map((item: string, itemIndex: number) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          );
        case 'footer':
          return (
            <div key={index} className="footer mt-8 pt-4 border-t text-center text-gray-600 text-sm">
              <p>{element.content || 'Thank you for choosing ASP Cranes. © 2025 ASP Cranes. All rights reserved.'}</p>
            </div>
          );
        default:
          return (
            <div key={index} className="custom-section mb-4">
              <div dangerouslySetInnerHTML={{ __html: element.content || '' }} />
            </div>
          );
      }
    });
  };

  try {
    let previewContent: string | React.ReactNode;

    // Check if template has elements (modern builder)
    if (template.elements && Array.isArray(template.elements) && template.elements.length > 0) {
      previewContent = (
        <div className="template-preview">
          {renderElementsTemplate(template.elements)}
        </div>
      );
    } else if (template.content) {
      // Replace placeholders with sample data for HTML templates
      previewContent = Object.entries(sampleData).reduce(
        (content, [key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          return content.replace(regex, value);
        },
        template.content
      );
    } else if (template.elements && Array.isArray(template.elements)) {
      // Modern template with elements but no content
      previewContent = '<div class="p-8"><h2>Modern Template Preview</h2><p>Template: ' + template.name + '</p><p>This template was created with the Template Builder and contains ' + template.elements.length + ' elements.</p></div>';
    } else {
      previewContent = '<div class="text-gray-500 p-8 text-center">No content available for preview</div>';
    }

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="prose max-w-none">
          {typeof previewContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: previewContent }} />
          ) : (
            previewContent
          )}
        </div>
      </Modal>
    );
  } catch (error) {
    console.error('Error rendering template preview:', error);
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Template Preview"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-8 text-red-500">
          <p>Error rendering template preview</p>
          <p className="text-sm mt-2">Please check the template content for any issues.</p>
        </div>
      </Modal>
    );
  }
} 