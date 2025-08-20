# Quotation Preview and Printing System

This system implements a SuiteCRM-inspired approach to quotation preview and printing, adapted for your modern template system.

## Key Features

### 1. **Template-Based Printing**
- Uses your existing modern template system
- Supports multiple templates with user selection
- Configurable default templates
- Real-time preview before printing

### 2. **Multiple Output Formats**
- **Preview**: HTML preview in modal
- **Print**: Direct browser printing
- **PDF**: Download as PDF file
- **Email**: Send PDF via email

### 3. **SuiteCRM-Inspired Architecture**
- Variable substitution (e.g., `{{quotation_number}}`, `{{customer_name}}`)
- Template categories and organization
- Print-specific styling
- Configurable defaults

## Components

### Frontend Components

#### `QuotationPreviewPrint.tsx`
Main component for preview/print functionality:
```tsx
<QuotationPreviewPrint 
  quotationId="q123" 
  quotationData={quotationData}
/>
```

#### `TemplateConfig.tsx`
Admin component for configuring default templates:
```tsx
<TemplateConfig onConfigUpdate={() => console.log('Config updated')} />
```

### Backend Routes

#### `/api/quotations/preview` (POST)
Generate HTML preview from template:
```json
{
  "quotationId": "q123",
  "templateId": "qtpl_abc123",
  "format": "html"
}
```

#### `/api/quotations/print` (POST)
Generate print-optimized HTML:
```json
{
  "quotationId": "q123",
  "templateId": "qtpl_abc123"
}
```

#### `/api/quotations/pdf` (POST)
Generate and download PDF:
```json
{
  "quotationId": "q123",
  "templateId": "qtpl_abc123"
}
```

#### `/api/config/templates` (GET/POST)
Manage template configuration:
```json
{
  "defaultQuotationTemplate": "qtpl_abc123",
  "defaultInvoiceTemplate": "qtpl_def456",
  "enableTemplateSelection": true
}
```

## Template Variables

The system supports these template variables:

### Company Information
- `{{company_name}}`
- `{{company_address}}`
- `{{company_phone}}`
- `{{company_email}}`

### Quotation Details
- `{{quotation_number}}`
- `{{quotation_date}}`
- `{{quotation_validity}}`
- `{{total_amount}}`

### Customer Information
- `{{customer_name}}`
- `{{customer_email}}`
- `{{customer_phone}}`
- `{{customer_address}}`

## Usage Examples

### 1. Basic Usage in Quotation View
```tsx
import { QuotationPreviewPrint } from '../components/quotations/QuotationPreviewPrint';

function QuotationDetailPage({ quotation }) {
  return (
    <div>
      {/* Other quotation details */}
      
      <div className="mt-4">
        <QuotationPreviewPrint 
          quotationId={quotation.id}
          quotationData={quotation}
        />
      </div>
    </div>
  );
}
```

### 2. Admin Template Configuration
```tsx
import { TemplateConfig } from '../components/templates/TemplateConfig';

function AdminSettingsPage() {
  return (
    <div>
      <h2>Template Settings</h2>
      <TemplateConfig 
        onConfigUpdate={() => {
          // Refresh data or show success message
          toast.success('Template configuration updated');
        }}
      />
    </div>
  );
}
```

### 3. Custom Template Creation
```tsx
// In your ModernTemplateBuilder component
const quotationTemplate = {
  name: "Professional Quotation",
  category: "quotation",
  elements: [
    {
      type: "header",
      content: "{{company_name}}",
      style: { fontSize: "24px", fontWeight: "bold" }
    },
    {
      type: "field",
      content: "Quotation No: {{quotation_number}}",
      style: { fontSize: "14px" }
    },
    {
      type: "field", 
      content: "Date: {{quotation_date}}",
      style: { fontSize: "14px" }
    },
    {
      type: "table",
      content: "{{items_table}}", // Auto-generated from quotation items
      style: { marginTop: "20px" }
    }
  ]
};
```

## Database Schema Updates

The system requires these database enhancements:

### 1. System Configuration Table
```sql
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Template Categories
Templates should have proper categories:
- `quotation`
- `invoice` 
- `report`
- `general`

## Next Steps

1. **Run the database migration** to fix the template triggers
2. **Add the QuotationPreviewPrint component** to your quotation detail pages
3. **Configure default templates** using the TemplateConfig component
4. **Test the preview and print functionality**
5. **Optional**: Implement PDF generation using Puppeteer for production

## SuiteCRM Compatibility Features

This implementation includes SuiteCRM-inspired features:

- **Template popup selection** (like SuiteCRM's template chooser)
- **Variable substitution system** (similar to SuiteCRM's field mapping)
- **Print-optimized styling** (SuiteCRM's print CSS patterns)
- **Multi-format output** (HTML, PDF, Email like SuiteCRM)
- **Configurable defaults** (SuiteCRM's template configuration)

The system is designed to be familiar to users coming from SuiteCRM while leveraging your modern React/TypeScript stack.
