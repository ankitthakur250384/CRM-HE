/**
 * Responsive Quotation Template
 * Based on the provided HTML template with enhanced features
 */

import { TemplateElement } from '../services/modernTemplateService';

export const responsiveQuotationTemplate: TemplateElement[] = [
  // Header Section
  {
    id: 'header',
    type: 'header',
    content: 'QUOTATION',
    styles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#222',
      textAlign: 'center',
      margin: '0 0 20px 0',
      padding: '10px 0',
      borderBottom: '3px solid #444'
    }
  },

  // Company Logo (placeholder)
  {
    id: 'company-logo',
    type: 'image',
    content: 'Company Logo',
    config: {
      src: '/logo-placeholder.png',
      alt: 'Company Logo',
      maxWidth: '100px'
    },
    styles: {
      textAlign: 'center',
      margin: '0 0 10px 0'
    }
  },

  // Company Information
  {
    id: 'company-info',
    type: 'text',
    content: `<strong>{{company.name}}</strong><br>
{{company.address}}<br>
Phone: {{company.phone}} | Email: {{company.email}} | Website: {{company.website}}`,
    styles: {
      fontSize: '14px',
      margin: '0 0 20px 0',
      padding: '10px',
      backgroundColor: '#f9f9f9'
    }
  },

  // Quotation Meta Information
  {
    id: 'quotation-meta',
    type: 'text',
    content: `<p><strong>Quotation No:</strong> {{quotation.number}}</p>
<p><strong>Date:</strong> {{quotation.date}}</p>
<p><strong>Validity:</strong> {{quotation.validity}}</p>`,
    styles: {
      fontSize: '14px',
      margin: '0 0 20px 0',
      padding: '10px',
      backgroundColor: '#eef',
      borderRadius: '6px'
    }
  },

  // Customer Information
  {
    id: 'customer-info',
    type: 'text',
    content: `<p><strong>To:</strong></p>
<p>{{customer.name}}<br>
{{customer.company}}<br>
{{customer.email}}</p>`,
    styles: {
      fontSize: '14px',
      margin: '0 0 20px 0'
    }
  },

  // Equipment/Items Table
  {
    id: 'items-table',
    type: 'table',
    content: 'Equipment & Services',
    config: {
      columns: ['Description', 'Quantity', 'Unit Price', 'Total'],
      rows: [
        ['{{equipment.name}}', '{{equipment.quantity}}', '{{equipment.rate}}', '{{equipment.total}}']
      ],
      showHeader: true,
      responsive: true
    },
    styles: {
      width: '100%',
      margin: '0 0 20px 0',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px'
    }
  },

  // Grand Total
  {
    id: 'grand-total',
    type: 'text',
    content: `<div style="text-align: right; font-weight: bold; font-size: 16px; padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6;">
<strong>Grand Total: ₹{{quotation.total}}</strong>
</div>`,
    styles: {
      margin: '10px 0 20px 0'
    }
  },

  // Terms & Conditions
  {
    id: 'terms-conditions',
    type: 'text',
    content: `<div style="background: #fef7e0; padding: 15px; border-left: 4px solid #f1c40f; font-size: 13px;">
<p><strong>Terms & Conditions:</strong></p>
<p>{{terms}}</p>
</div>`,
    styles: {
      margin: '20px 0'
    }
  },

  // Footer/Signature
  {
    id: 'footer-signature',
    type: 'text',
    content: `<div style="margin-top: 40px; text-align: right; font-style: italic; font-size: 14px;">
<p>Authorized Signatory</p>
<p>[Company Stamp / Signature]</p>
</div>`,
    styles: {
      margin: '40px 0 0 0'
    }
  }
];

// Template metadata
export const responsiveQuotationTemplateMetadata = {
  name: 'Responsive Professional Quotation',
  description: 'A responsive, professional quotation template with clean design and mobile-friendly layout',
  category: 'professional',
  tags: ['responsive', 'professional', 'modern', 'equipment'],
  thumbnail: null,
  styles: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f9f9f9',
    color: '#333',
    margin: '20px',
    // Responsive styles
    '@media (max-width: 768px)': {
      margin: '10px',
      fontSize: '12px'
    },
    '@media (max-width: 480px)': {
      fontSize: '10px'
    }
  },
  layout: {
    type: 'single-column',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  }
};

// CSS Styles for the template
export const responsiveQuotationTemplateCSS = `
<style>
  .quotation-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 20px;
    color: #333;
    background-color: #f9f9f9;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .equipment-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    background: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    font-size: 14px;
  }
  
  .equipment-table, .equipment-table th, .equipment-table td {
    border: 1px solid #ccc;
  }
  
  .equipment-table th {
    background: #444;
    color: #fff;
    text-align: center;
    font-size: 14px;
    padding: 8px;
  }
  
  .equipment-table td {
    padding: 8px;
    word-wrap: break-word;
  }
  
  .equipment-table tbody tr:nth-child(even) {
    background: #f2f2f2;
  }
  
  /* Responsive Styling */
  @media (max-width: 768px) {
    .quotation-container {
      margin: 10px;
    }
    .equipment-table, .equipment-table th, .equipment-table td {
      font-size: 12px;
    }
  }
  
  @media (max-width: 480px) {
    .equipment-table, .equipment-table thead, .equipment-table tbody, 
    .equipment-table th, .equipment-table td, .equipment-table tr {
      display: block;
      width: 100%;
    }
    
    .equipment-table thead tr {
      display: none;
    }
    
    .equipment-table td {
      display: flex;
      justify-content: space-between;
      border: none;
      border-bottom: 1px solid #ccc;
      padding: 8px 5px;
    }
    
    .equipment-table td:before {
      content: attr(data-label);
      font-weight: bold;
      flex-basis: 50%;
    }
  }
  
  .action-btns {
    margin-bottom: 20px;
  }
  
  .btn {
    display: inline-block;
    margin-right: 10px;
    padding: 10px 20px;
    background: #007BFF;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
  }
  
  .btn:hover {
    background: #0056b3;
  }
  
  @media (max-width: 768px) {
    .btn {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      margin-bottom: 10px;
    }
  }
</style>
`;
