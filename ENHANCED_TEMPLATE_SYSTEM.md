# Enhanced Template Builder & PDF Generation System

## Overview

The Enhanced Template Builder is a professional quotation template creation system inspired by InvoiceNinja's design capabilities. It provides a visual drag-and-drop interface for creating sophisticated quotation templates with advanced PDF generation features.

## 🚀 Features

### Template Builder
- **Visual Drag & Drop Interface** - Intuitive template element positioning
- **Professional Themes** - Modern, Classic, Professional, and Creative themes
- **Element Library** - Header, Company Info, Client Info, Items Table, Totals, Terms, Custom Text, Images, Signatures
- **Real-time Preview** - See changes instantly
- **Responsive Design** - Templates work on desktop, tablet, and mobile
- **Template Management** - Save, duplicate, delete, and organize templates

### PDF Generation
- **High-Quality PDFs** - Professional-grade PDF output using Puppeteer
- **Multiple Formats** - A4, Letter, Legal page sizes
- **Watermark Support** - Add custom watermarks and branding
- **Batch Processing** - Generate multiple PDFs simultaneously
- **Custom Styling** - CSS-based styling with theme support

### Advanced Features
- **Template Analytics** - Track usage and performance
- **Variable Replacement** - Dynamic content with placeholders
- **Multi-language Support** - Ready for internationalization
- **API Integration** - RESTful API for all operations
- **Database Optimization** - Efficient storage and retrieval

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- React 18+
- Express.js 4+

### Quick Setup

1. **Run the setup script:**
   ```bash
   # Linux/Mac
   ./setup_enhanced_templates.sh
   
   # Windows
   setup_enhanced_templates.bat
   ```

2. **Manual Installation (if needed):**
   ```bash
   # Backend dependencies
   cd crm-app/backend
   npm install puppeteer@^22.0.0 multer@^1.4.5-lts.1
   
   # Frontend dependencies (should already be installed)
   cd ../frontend
   npm install react-beautiful-dnd@^13.1.1 lucide-react@^0.344.0
   ```

3. **Database Migration:**
   ```bash
   psql -h YOUR_HOST -d YOUR_DATABASE -U YOUR_USER -f enhanced_template_migration.sql
   ```

## 📁 File Structure

```
├── crm-app/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── EnhancedTemplateBuilder.mjs    # Core template service
│   │   │   │   └── AdvancedPDFGenerator.mjs       # PDF generation service
│   │   │   └── routes/
│   │   │       └── enhancedTemplateRoutes.mjs     # API endpoints
│   │   └── uploads/
│   │       ├── templates/                         # Template assets
│   │       └── logos/                            # Logo uploads
│   └── frontend/
│       └── src/
│           ├── components/quotations/
│           │   └── EnhancedTemplateBuilder.tsx    # Visual builder component
│           └── pages/quotations/
│               └── EnhancedTemplateManager.tsx    # Template management page
├── enhanced_template_migration.sql                # Database schema
├── setup_enhanced_templates.sh                   # Linux/Mac setup
└── setup_enhanced_templates.bat                  # Windows setup
```

## 🗄️ Database Schema

### Tables Created
- `enhanced_templates` - Template definitions and metadata
- `enhanced_template_categories` - Template categorization
- `enhanced_template_category_mappings` - Category relationships
- `enhanced_template_usage_logs` - Analytics and usage tracking

### Key Fields
- **Templates**: id, name, description, theme, elements (JSONB), settings, branding
- **Categories**: Professional, Modern, Creative, Classic
- **Usage Logs**: template_id, quotation_id, action, metadata, timestamps

## 🔌 API Endpoints

### Template Management
```
GET    /api/templates/enhanced/list                # List all templates
POST   /api/templates/enhanced/create              # Create new template
GET    /api/templates/enhanced/:id                 # Get template details
PUT    /api/templates/enhanced/:id                 # Update template
DELETE /api/templates/enhanced/:id                 # Delete template
POST   /api/templates/enhanced/duplicate           # Duplicate template
```

### Preview & Generation
```
POST   /api/templates/enhanced/preview             # Generate HTML preview
POST   /api/templates/enhanced/generate-pdf        # Generate PDF
POST   /api/templates/enhanced/generate-quotation-pdf  # Generate quotation PDF
POST   /api/templates/enhanced/batch-pdf           # Batch PDF generation
```

### Utilities
```
GET    /api/templates/enhanced/info                # System information
GET    /api/templates/enhanced/sample-data         # Sample data for testing
POST   /api/templates/enhanced/upload-logo         # Upload company logo
```

## 🎨 Template Elements

### Available Element Types

1. **Header** - Company title and quotation header
2. **Company Info** - Business details and contact information
3. **Client Info** - Customer billing information
4. **Quotation Info** - Quote number, date, terms
5. **Items Table** - Line items with descriptions, quantities, prices
6. **Totals** - Subtotal, tax, and total calculations
7. **Terms** - Terms and conditions text
8. **Custom Text** - Flexible text content
9. **Image** - Logo and image placeholders
10. **Signature** - Signature fields and areas

### Element Properties
- **Content** - Text, data bindings, and formatting
- **Style** - Colors, fonts, sizes, alignment
- **Position** - X/Y coordinates, width, height
- **Visibility** - Show/hide elements conditionally

## 🎯 Variable System

### Supported Variables

#### Company Variables
```
{{company.name}}        # Company name
{{company.address}}     # Business address
{{company.city}}        # City
{{company.state}}       # State/Province
{{company.zip}}         # Postal code
{{company.phone}}       # Phone number
{{company.email}}       # Email address
{{company.website}}     # Website URL
```

#### Client Variables
```
{{client.name}}         # Client company name
{{client.contact}}      # Contact person
{{client.address}}      # Client address
{{client.city}}         # Client city
{{client.state}}        # Client state
{{client.zip}}          # Client postal code
{{client.phone}}        # Client phone
{{client.email}}        # Client email
```

#### Quotation Variables
```
{{quotation.number}}    # Quote number
{{quotation.date}}      # Quote date
{{quotation.valid_until}}  # Expiration date
{{quotation.terms}}     # Payment terms
{{quotation.notes}}     # Additional notes
```

#### Financial Variables
```
{{totals.subtotal}}     # Subtotal amount
{{totals.tax}}          # Tax amount
{{totals.total}}        # Total amount
{{totals.currency}}     # Currency symbol
```

## 🎨 Themes

### Available Themes

1. **Modern** - Clean, minimal design with blue accents
2. **Classic** - Traditional, elegant styling
3. **Professional** - Corporate, dark theme
4. **Creative** - Vibrant, artistic design

### Theme Customization
- Primary color schemes
- Font selections
- Layout variations
- Element styling defaults

## 📊 Usage Examples

### Creating a New Template

```javascript
// Frontend - Template Manager
const handleCreateNew = () => {
  setSelectedTemplate(null);
  setShowBuilder(true);
};

// API Call - Create Template
const response = await fetch('/api/templates/enhanced/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Professional Invoice',
    description: 'Corporate-style template',
    theme: 'PROFESSIONAL',
    elements: templateElements
  })
});
```

### Generating a PDF

```javascript
// Generate PDF from template
const response = await fetch('/api/templates/enhanced/generate-quotation-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    templateId: 'template-uuid',
    quotationId: 'quotation-uuid',
    options: {
      format: 'A4',
      orientation: 'portrait',
      quality: 'HIGH'
    }
  })
});
```

### Element Configuration

```javascript
// Sample element configuration
const headerElement = {
  id: 'header_1',
  type: 'header',
  visible: true,
  content: {
    title: 'ASP CRANES',
    subtitle: 'PROFESSIONAL QUOTATION'
  },
  style: {
    fontSize: '28px',
    color: '#0f172a',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  position: {
    x: 0,
    y: 0,
    width: '100%',
    height: 'auto'
  }
};
```

## 🔧 Configuration

### Environment Variables

```bash
# PDF Generation
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PDF_GENERATION_TIMEOUT=30000

# File Upload
MAX_LOGO_SIZE=5242880  # 5MB
UPLOAD_PATH=/uploads

# Template Settings
DEFAULT_THEME=MODERN
MAX_TEMPLATE_ELEMENTS=50
```

### Server Configuration

```javascript
// In server.mjs
app.use('/api/templates/enhanced', enhancedTemplateRoutes);
```

## 🚀 Integration Guide

### Adding to Existing Application

1. **Mount Routes** (already done):
   ```javascript
   import enhancedTemplateRoutes from './routes/enhancedTemplateRoutes.mjs';
   app.use('/api/templates/enhanced', enhancedTemplateRoutes);
   ```

2. **Add Navigation**:
   ```jsx
   <NavLink to="/quotations/enhanced-templates">
     Enhanced Templates
   </NavLink>
   ```

3. **Route Configuration**:
   ```jsx
   <Route 
     path="/quotations/enhanced-templates" 
     component={EnhancedTemplateManager} 
   />
   ```

### Customization Options

1. **Theme Extension**:
   ```javascript
   const CUSTOM_THEMES = {
     CORPORATE: {
       name: 'Corporate',
       primaryColor: '#1a365d',
       description: 'Professional corporate style'
     }
   };
   ```

2. **Element Types**:
   ```javascript
   const CUSTOM_ELEMENTS = {
     QR_CODE: 'qr_code',
     BARCODE: 'barcode',
     CHART: 'chart'
   };
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Puppeteer Installation**:
   ```bash
   # If Puppeteer fails to install
   npm install puppeteer --unsafe-perm=true
   ```

2. **PDF Generation Timeout**:
   ```javascript
   // Increase timeout in AdvancedPDFGenerator.mjs
   const PDF_OPTIONS = {
     timeout: 60000  // 60 seconds
   };
   ```

3. **Database Connection**:
   ```sql
   -- Verify tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'enhanced_%';
   ```

4. **File Permissions**:
   ```bash
   # Ensure upload directories are writable
   chmod 755 crm-app/backend/uploads/templates
   chmod 755 crm-app/backend/uploads/logos
   ```

### Performance Optimization

1. **Database Indexing**:
   ```sql
   CREATE INDEX idx_enhanced_templates_theme ON enhanced_templates(theme);
   CREATE INDEX idx_enhanced_templates_created_at ON enhanced_templates(created_at);
   ```

2. **PDF Caching**:
   ```javascript
   // Implement PDF caching in production
   const pdfCache = new Map();
   ```

3. **Template Compilation**:
   ```javascript
   // Pre-compile templates for better performance
   const compiledTemplates = new Map();
   ```

## 📈 Analytics & Monitoring

### Usage Tracking

The system automatically tracks:
- Template usage frequency
- PDF generation counts
- Popular template themes
- User interaction patterns

### Database Views

```sql
-- Template usage statistics
SELECT * FROM enhanced_template_stats;

-- Popular themes
SELECT theme, COUNT(*) as count 
FROM enhanced_templates 
WHERE is_active = true 
GROUP BY theme;
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Template marketplace
- [ ] Advanced variable system
- [ ] Real-time collaboration
- [ ] Template versioning
- [ ] Custom element types
- [ ] Multi-language templates
- [ ] Template inheritance
- [ ] Advanced analytics dashboard

### Extension Points
- Custom element types
- Theme plugins
- Variable processors
- Export formats
- Integration connectors

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Examine the console logs
4. Verify database connectivity
5. Test with sample data

## 📜 License

This enhanced template system is part of the ASP Cranes CRM application and follows the same licensing terms as the main application.

---

*Built with inspiration from InvoiceNinja's template system and tailored for ASP Cranes CRM's specific needs.*
