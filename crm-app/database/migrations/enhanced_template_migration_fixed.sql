-- Enhanced Template System Database Migration - FIXED VERSION
-- This fixes the foreign key and table creation order issues

BEGIN;

-- Drop tables if they exist (to start fresh)
DROP TABLE IF EXISTS enhanced_template_usage_logs CASCADE;
DROP TABLE IF EXISTS enhanced_template_category_mappings CASCADE;
DROP TABLE IF EXISTS enhanced_templates CASCADE;
DROP TABLE IF EXISTS enhanced_template_categories CASCADE;
DROP VIEW IF EXISTS enhanced_template_stats CASCADE;
DROP FUNCTION IF EXISTS update_enhanced_template_updated_at() CASCADE;

-- Create enhanced_template_categories table first
CREATE TABLE enhanced_template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6b7280',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced_templates table (main table)
CREATE TABLE enhanced_templates (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('etpl_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'MODERN',
    elements JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0
);

-- Create junction table for template-category relationships  
CREATE TABLE enhanced_template_category_mappings (
    template_id VARCHAR(50) REFERENCES enhanced_templates(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES enhanced_template_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (template_id, category_id)
);

-- Create enhanced_template_usage_logs table for analytics
CREATE TABLE enhanced_template_usage_logs (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) REFERENCES enhanced_templates(id) ON DELETE CASCADE,
    quotation_id VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- 'preview', 'generate_pdf', 'email_sent'
    user_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_enhanced_templates_created_by ON enhanced_templates(created_by);
CREATE INDEX idx_enhanced_templates_theme ON enhanced_templates(theme);
CREATE INDEX idx_enhanced_templates_is_active ON enhanced_templates(is_active);
CREATE INDEX idx_enhanced_templates_is_default ON enhanced_templates(is_default);
CREATE INDEX idx_enhanced_templates_name ON enhanced_templates(name);
CREATE INDEX idx_enhanced_templates_usage_count ON enhanced_templates(usage_count);
CREATE INDEX idx_enhanced_template_usage_logs_template_id ON enhanced_template_usage_logs(template_id);
CREATE INDEX idx_enhanced_template_usage_logs_quotation_id ON enhanced_template_usage_logs(quotation_id);
CREATE INDEX idx_enhanced_template_usage_logs_action ON enhanced_template_usage_logs(action);
CREATE INDEX idx_enhanced_template_usage_logs_created_at ON enhanced_template_usage_logs(created_at);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enhanced_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_enhanced_templates_updated_at
    BEFORE UPDATE ON enhanced_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_template_updated_at();

-- Insert default template categories
INSERT INTO enhanced_template_categories (name, description, color, display_order) VALUES
    ('Professional', 'Corporate and business templates', '#1f2937', 1),
    ('Modern', 'Contemporary and minimal designs', '#2563eb', 2),
    ('Creative', 'Artistic and colorful templates', '#7c3aed', 3),
    ('Classic', 'Traditional and elegant designs', '#059669', 4),
    ('Quotation', 'Quotation-specific templates', '#f59e0b', 5);

-- Insert a default enhanced template
INSERT INTO enhanced_templates (
    id,
    name,
    description,
    theme,
    elements,
    settings,
    branding,
    is_default
) VALUES (
    'etpl_default_001',
    'ASP Cranes Default Enhanced',
    'Default enhanced quotation template with professional styling',
    'PROFESSIONAL',
    '[
        {
            "id": "header_1",
            "type": "header",
            "visible": true,
            "content": {
                "title": "ASP CRANES",
                "subtitle": "QUOTATION"
            },
            "style": {
                "fontSize": "28px",
                "color": "#0f172a",
                "fontWeight": "bold",
                "textAlign": "center"
            },
            "position": { "x": 0, "y": 0, "width": "100%", "height": "auto" }
        },
        {
            "id": "company_info_1",
            "type": "company_info",
            "visible": true,
            "content": {
                "fields": [
                    "{{company.name}}",
                    "{{company.address}}",
                    "{{company.city}}, {{company.state}} {{company.zip}}",
                    "Phone: {{company.phone}}",
                    "Email: {{company.email}}"
                ]
            },
            "style": {
                "fontSize": "14px",
                "color": "#374151"
            },
            "position": { "x": 0, "y": 120, "width": "50%", "height": "auto" }
        },
        {
            "id": "client_info_1",
            "type": "client_info",
            "visible": true,
            "content": {
                "title": "Bill To:",
                "fields": [
                    "{{client.name}}",
                    "{{client.address}}",
                    "{{client.city}}, {{client.state}} {{client.zip}}"
                ]
            },
            "style": {
                "fontSize": "14px",
                "color": "#374151"
            },
            "position": { "x": "50%", "y": 120, "width": "50%", "height": "auto" }
        },
        {
            "id": "quotation_info_1",
            "type": "quotation_info",
            "visible": true,
            "content": {
                "fields": [
                    "Quotation #: {{quotation.number}}",
                    "Date: {{quotation.date}}",
                    "Valid Until: {{quotation.valid_until}}",
                    "Terms: {{quotation.terms}}"
                ]
            },
            "style": {
                "fontSize": "14px",
                "color": "#374151"
            },
            "position": { "x": 0, "y": 220, "width": "100%", "height": "auto" }
        },
        {
            "id": "items_table_1",
            "type": "items_table",
            "visible": true,
            "content": {
                "columns": [
                    { "key": "description", "label": "Description", "width": "40%" },
                    { "key": "quantity", "label": "Qty", "width": "15%" },
                    { "key": "unit_price", "label": "Unit Price", "width": "20%" },
                    { "key": "total", "label": "Total", "width": "25%" }
                ]
            },
            "style": {
                "fontSize": "14px",
                "borderColor": "#d1d5db"
            },
            "position": { "x": 0, "y": 300, "width": "100%", "height": "auto" }
        },
        {
            "id": "totals_1",
            "type": "totals",
            "visible": true,
            "content": {
                "fields": [
                    { "label": "Subtotal", "value": "{{totals.subtotal}}" },
                    { "label": "Tax", "value": "{{totals.tax}}" },
                    { "label": "Total", "value": "{{totals.total}}" }
                ]
            },
            "style": {
                "fontSize": "14px",
                "fontWeight": "bold"
            },
            "position": { "x": "70%", "y": 500, "width": "30%", "height": "auto" }
        },
        {
            "id": "terms_1",
            "type": "terms",
            "visible": true,
            "content": {
                "title": "Terms & Conditions",
                "text": "1. All prices are in USD and exclusive of applicable taxes.\\n2. This quotation is valid for 30 days from the date of issue.\\n3. Payment terms: Net 30 days.\\n4. Delivery terms to be confirmed upon order placement."
            },
            "style": {
                "fontSize": "12px",
                "color": "#6b7280"
            },
            "position": { "x": 0, "y": 600, "width": "100%", "height": "auto" }
        }
    ]',
    '{
        "pageSize": "A4",
        "orientation": "portrait",
        "margins": {
            "top": 20,
            "right": 20,
            "bottom": 20,
            "left": 20
        },
        "fonts": {
            "primary": "Arial, sans-serif",
            "secondary": "Times New Roman, serif"
        }
    }',
    '{
        "logo": null,
        "primaryColor": "#0f172a",
        "secondaryColor": "#6b7280",
        "accentColor": "#2563eb"
    }',
    true
);

-- Create view for template statistics
CREATE VIEW enhanced_template_stats AS
SELECT 
    t.id,
    t.name,
    t.theme,
    t.usage_count,
    COUNT(ul.id) as recent_usage_count,
    COUNT(DISTINCT ul.quotation_id) as unique_quotations,
    MAX(ul.created_at) as last_used,
    t.created_at,
    t.updated_at
FROM enhanced_templates t
LEFT JOIN enhanced_template_usage_logs ul ON t.id = ul.template_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.theme, t.usage_count, t.created_at, t.updated_at
ORDER BY t.usage_count DESC, t.updated_at DESC;

-- Add comments for documentation
COMMENT ON TABLE enhanced_templates IS 'Stores enhanced quotation templates with InvoiceNinja-style builder capabilities';
COMMENT ON COLUMN enhanced_templates.elements IS 'JSON array containing template elements and their configurations';
COMMENT ON COLUMN enhanced_templates.settings IS 'Template-level settings like page size, margins, fonts';
COMMENT ON COLUMN enhanced_templates.branding IS 'Branding elements like logo, colors, fonts';
COMMENT ON TABLE enhanced_template_usage_logs IS 'Tracks template usage for analytics and optimization';
COMMENT ON VIEW enhanced_template_stats IS 'Provides usage statistics for enhanced templates';

COMMIT;
