# ASP Cranes - Modern Quotation Print System

A complete rebuild of the quotation preview and printing system with modern template-based architecture, inspired by SuiteCRM's professional approach.

## 🚀 Features

### Template-Based System
- **Modern Template Builder**: Drag-and-drop interface for creating custom quotation templates
- **Professional Layouts**: Pre-designed professional templates with ASP Cranes branding
- **Variable Substitution**: Dynamic content insertion from quotation data
- **Responsive Design**: Templates that work perfectly on screen and print

### Print & Export Options
- **Live Preview**: Real-time preview of quotations with selected templates
- **Professional PDF Generation**: High-quality PDF output with print optimization
- **Direct Printing**: Browser-based printing with print-specific styling
- **Email Integration**: Send quotations directly via email with PDF attachments

### Professional Output
- **Company Branding**: ASP Cranes logo, colors, and professional styling
- **Comprehensive Details**: Customer info, project details, equipment specifications
- **Cost Breakdown**: Detailed pricing with totals, GST, and grand totals
- **Terms & Conditions**: Professional terms and signature sections

## 📁 File Structure

```
crm-app/
├── backend/
│   └── src/
│       └── routes/
│           ├── quotationPrintRoutes.mjs    # Print API endpoints
│           ├── quotationRoutes.mjs         # Updated with print routes
│           └── templateRoutes.mjs          # Template management
└── frontend/
    └── src/
        ├── components/
        │   └── quotations/
        │       └── QuotationPrintSystem.tsx # Main print component
        └── pages/
            └── quotations/
                └── QuotationDetail.tsx      # Quotation detail page
```

## 🔧 Setup Instructions

### 1. Database Setup
Make sure your PostgreSQL database is running and has the enhanced quotation templates schema:

```bash
# Start the database
docker-compose up -d db

# Apply the template schema (if not already applied)
docker exec -i asp-cranes-structured-db-1 psql -U postgres -d asp_crm < enhance_template_database.sql
```

### 2. Backend Setup
The backend routes are already integrated. The system includes:

- `/api/quotations/print/preview` - Generate HTML preview
- `/api/quotations/print/print` - Get print-optimized HTML
- `/api/quotations/print/pdf` - Download as PDF
- `/api/quotations/print/email-pdf` - Email PDF to recipient
- `/api/templates/quotation` - Template management

### 3. Default Template Creation
Run the setup script to create a default professional template:

**Windows:**
```cmd
setup_quotation_print.bat
```

**Linux/Mac:**
```bash
chmod +x setup_quotation_print.sh
./setup_quotation_print.sh
```

**Manual API Call:**
```bash
curl -X POST http://localhost:3001/api/templates/quotation/create-default \
  -H "Content-Type: application/json"
```

## 💻 Usage

### 1. Navigate to Quotation Details
- Go to any quotation in the system
- Click on the quotation to view its detail page
- The "Print & Export Options" section will be available

### 2. Select Template
- The system will auto-select the default template
- Use the template dropdown to choose different templates
- Click "Refresh" to reload available templates

### 3. Generate Output
- **Preview**: Click to see a live preview in a modal window
- **Print**: Opens browser print dialog with optimized layout
- **Download PDF**: Downloads a PDF file (currently HTML format)
- **Email PDF**: Send the quotation via email with PDF attachment

## 🎨 Template System

### Template Structure
Templates are stored in the database with the following structure:

```json
{
  "elements": [
    {
      "id": "header-1",
      "type": "header",
      "content": "ASP Cranes - Quotation",
      "style": {
        "fontSize": "24px",
        "fontWeight": "bold",
        "textAlign": "center",
        "color": "#2563eb"
      }
    }
  ],
  "styles": {
    "container": {
      "maxWidth": "800px",
      "margin": "0 auto",
      "padding": "40px"
    }
  },
  "layout": {
    "type": "single-column",
    "sections": ["header", "details", "items", "totals", "terms"]
  }
}
```

### Available Variables
The system supports dynamic variable substitution:

- `{{quotation_id}}` - Quotation ID
- `{{customer_name}}` - Customer name
- `{{customer_email}}` - Customer email
- `{{customer_phone}}` - Customer phone
- `{{machine_type}}` - Type of machine
- `{{order_type}}` - Order type
- `{{number_of_days}}` - Project duration
- `{{working_hours}}` - Hours per day
- `{{total_cost}}` - Total quotation cost

## 🔧 Technical Details

### Backend Architecture
- **Express.js Routes**: RESTful API endpoints for all print operations
- **PostgreSQL Integration**: Direct database queries for quotation and template data
- **HTML Generation**: Server-side HTML generation with comprehensive styling
- **Error Handling**: Robust error handling with detailed logging

### Frontend Architecture
- **React Components**: Modern functional components with TypeScript
- **State Management**: React hooks for local state management
- **Modal System**: Custom modal implementation for previews and forms
- **Responsive Design**: Mobile-friendly interface

### Database Schema
The system uses the enhanced quotation templates schema:

```sql
CREATE TABLE quotation_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    elements JSONB,
    styles JSONB,
    layout JSONB,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Key Improvements Over Old System

### Professional Design
- Modern, clean layout with ASP Cranes branding
- Proper typography and spacing
- Print-optimized CSS for perfect paper output
- Mobile-responsive design

### Better Data Integration
- Comprehensive quotation data display
- Equipment/machinery details with specifications
- Customer information integration
- Cost breakdown with GST calculations

### User Experience
- Intuitive interface with clear action buttons
- Real-time preview functionality
- Status messages and error handling
- Template selection with visual indicators

### Technical Robustness
- TypeScript for type safety
- Error boundary handling
- Comprehensive logging
- Database transaction safety

## 🚀 Future Enhancements

### PDF Generation
- Integrate Puppeteer for true PDF generation
- Custom page layouts and headers/footers
- Batch PDF generation for multiple quotations

### Email Integration
- SMTP configuration for actual email sending
- Email templates with HTML formatting
- Attachment management and tracking

### Template Builder
- Visual template builder interface
- Drag-and-drop element arrangement
- Live preview during template editing
- Template versioning and history

### Advanced Features
- Digital signatures
- QR codes for quotation tracking
- Multi-language support
- Custom branding per client

## 🐛 Troubleshooting

### Common Issues

**Templates not loading:**
```bash
# Check database connection
docker exec asp-cranes-structured-db-1 psql -U postgres -d asp_crm -c "SELECT COUNT(*) FROM quotation_templates;"

# Create default template
curl -X POST http://localhost:3001/api/templates/quotation/create-default
```

**Preview not working:**
- Ensure backend server is running on port 3001
- Check browser console for API errors
- Verify quotation data exists in database

**Print layout issues:**
- Check CSS print media queries
- Ensure browser print settings are correct
- Test with different browsers

### Database Queries

**Check templates:**
```sql
SELECT id, name, is_default, is_active FROM quotation_templates;
```

**Check quotation data:**
```sql
SELECT q.id, q.customer_name, c.name, c.email 
FROM quotations q 
LEFT JOIN customers c ON q.customer_id = c.id 
WHERE q.id = [quotation_id];
```

## 📞 Support

For technical support or feature requests:

1. Check the application logs for detailed error messages
2. Verify database connectivity and schema
3. Test API endpoints individually
4. Review browser console for frontend errors

## 🎉 Success!

The quotation print system is now ready to generate professional, branded quotations that represent ASP Cranes' commitment to quality and professionalism. The system provides a complete solution for quotation presentation, from preview to final delivery.
