-- Ensure Default Template Exists
-- This script ensures the default template exists in the enhanced_templates table

-- First, check if the default template exists
INSERT INTO enhanced_templates (
    id, name, description, theme, category, is_default, is_active, 
    created_by, elements, settings, branding
) VALUES (
    'tpl_default_001',
    'Default ASP Cranes Template',
    'Standard quotation template for ASP Cranes with professional layout',
    'MODERN',
    'Quotation',
    true,
    true,
    'system',
    '[
        {
            "id": "header-1",
            "type": "header",
            "content": {
                "title": "ASP CRANES",
                "subtitle": "Professional Equipment Solutions",
                "logoUrl": ""
            },
            "visible": true,
            "style": {
                "fontSize": "28px",
                "fontWeight": "bold",
                "color": "#0052CC",
                "textAlign": "center",
                "marginBottom": "20px"
            }
        },
        {
            "id": "company-info-1", 
            "type": "company_info",
            "content": {
                "fields": [
                    "{{company.name}}",
                    "{{company.address}}",
                    "Phone: {{company.phone}}",
                    "Email: {{company.email}}"
                ],
                "layout": "vertical"
            },
            "visible": true,
            "style": {
                "fontSize": "14px",
                "lineHeight": "1.5",
                "marginBottom": "30px"
            }
        },
        {
            "id": "customer-info-1",
            "type": "customer_info", 
            "content": {
                "title": "Bill To:",
                "fields": [
                    "{{customer.name}}",
                    "{{customer.address}}",
                    "Contact: {{customer.contact}}",
                    "Phone: {{customer.phone}}"
                ]
            },
            "visible": true,
            "style": {
                "fontSize": "14px",
                "marginBottom": "20px"
            }
        },
        {
            "id": "quotation-details-1",
            "type": "quotation_details",
            "content": {
                "fields": [
                    "Quotation #: {{quotation.number}}",
                    "Date: {{quotation.date}}",
                    "Valid Until: {{quotation.validUntil}}"
                ]
            },
            "visible": true,
            "style": {
                "fontSize": "14px",
                "marginBottom": "30px"
            }
        },
        {
            "id": "items-table-1",
            "type": "items_table",
            "content": {
                "headers": ["Description", "Quantity", "Unit", "Rate", "Amount"],
                "showTotals": true
            },
            "visible": true,
            "style": {
                "marginBottom": "30px"
            }
        },
        {
            "id": "totals-1",
            "type": "totals",
            "content": {
                "showSubtotal": true,
                "showTax": true,
                "showTotal": true
            },
            "visible": true,
            "style": {
                "fontSize": "16px",
                "fontWeight": "bold",
                "textAlign": "right",
                "marginBottom": "30px"
            }
        },
        {
            "id": "footer-1",
            "type": "footer",
            "content": {
                "text": "Thank you for choosing ASP Cranes for your equipment needs."
            },
            "visible": true,
            "style": {
                "fontSize": "12px",
                "textAlign": "center",
                "marginTop": "40px",
                "borderTop": "1px solid #ccc",
                "paddingTop": "20px"
            }
        }
    ]'::jsonb,
    '{
        "pageSize": "A4",
        "orientation": "portrait",
        "margins": {
            "top": 25,
            "right": 25,
            "bottom": 25,
            "left": 25
        },
        "fontSize": 14,
        "fontFamily": "Arial, sans-serif"
    }'::jsonb,
    '{
        "primaryColor": "#0052CC",
        "secondaryColor": "#1f2937",
        "accentColor": "#f59e0b",
        "logoUrl": "",
        "showLogo": true,
        "companyColors": {
            "primary": "#0052CC",
            "secondary": "#ffffff"
        }
    }'::jsonb
) ON CONFLICT (id) 
DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    theme = EXCLUDED.theme,
    elements = EXCLUDED.elements,
    settings = EXCLUDED.settings,
    branding = EXCLUDED.branding,
    updated_at = CURRENT_TIMESTAMP;

-- Ensure only one default template
UPDATE enhanced_templates 
SET is_default = false 
WHERE id != 'tpl_default_001' AND is_default = true;

-- Verify the template exists
SELECT id, name, description, is_default, is_active, created_at 
FROM enhanced_templates 
WHERE id = 'tpl_default_001';
