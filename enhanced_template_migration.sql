-- Enhanced Template System Database Migration
-- Creates tables for InvoiceNinja-style template builder functionality

-- Create enhanced_templates table for storing template definitions
CREATE TABLE IF NOT EXISTS enhanced_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'MODERN',
    elements JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced_template_categories table for organization
CREATE TABLE IF NOT EXISTS enhanced_template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6b7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for template-category relationships
CREATE TABLE IF NOT EXISTS enhanced_template_category_mappings (
    template_id UUID REFERENCES enhanced_templates(id) ON DELETE CASCADE,
    category_id UUID REFERENCES enhanced_template_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (template_id, category_id)
);

-- Create enhanced_template_usage_logs table for analytics
CREATE TABLE IF NOT EXISTS enhanced_template_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES enhanced_templates(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'preview', 'generate_pdf', 'email_sent'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_created_by ON enhanced_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_theme ON enhanced_templates(theme);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_is_active ON enhanced_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_is_default ON enhanced_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_enhanced_template_usage_logs_template_id ON enhanced_template_usage_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_template_usage_logs_quotation_id ON enhanced_template_usage_logs(quotation_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_template_usage_logs_action ON enhanced_template_usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_enhanced_template_usage_logs_created_at ON enhanced_template_usage_logs(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enhanced_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enhanced_templates_updated_at
    BEFORE UPDATE ON enhanced_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_template_updated_at();

-- Insert default template categories
INSERT INTO enhanced_template_categories (name, description, color) VALUES
    ('Professional', 'Corporate and business templates', '#1f2937'),
    ('Modern', 'Contemporary and minimal designs', '#2563eb'),
    ('Creative', 'Artistic and colorful templates', '#7c3aed'),
    ('Classic', 'Traditional and elegant designs', '#059669')
ON CONFLICT DO NOTHING;

-- Insert a default enhanced template
INSERT INTO enhanced_templates (
    name,
    description,
    theme,
    elements,
    settings,
    branding,
    is_default
) VALUES (
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
                "text": "1. All prices are in USD and exclusive of applicable taxes.\n2. This quotation is valid for 30 days from the date of issue.\n3. Payment terms: Net 30 days.\n4. Delivery terms to be confirmed upon order placement."
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
) ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON enhanced_templates TO postgres;
GRANT ALL PRIVILEGES ON enhanced_template_categories TO postgres;
GRANT ALL PRIVILEGES ON enhanced_template_category_mappings TO postgres;
GRANT ALL PRIVILEGES ON enhanced_template_usage_logs TO postgres;

-- Add comments for documentation
COMMENT ON TABLE enhanced_templates IS 'Stores enhanced quotation templates with InvoiceNinja-style builder capabilities';
COMMENT ON COLUMN enhanced_templates.elements IS 'JSON array containing template elements and their configurations';
COMMENT ON COLUMN enhanced_templates.settings IS 'Template-level settings like page size, margins, fonts';
COMMENT ON COLUMN enhanced_templates.branding IS 'Branding elements like logo, colors, fonts';
COMMENT ON TABLE enhanced_template_usage_logs IS 'Tracks template usage for analytics and optimization';

-- Create view for template statistics
CREATE OR REPLACE VIEW enhanced_template_stats AS
SELECT 
    t.id,
    t.name,
    t.theme,
    COUNT(ul.id) as usage_count,
    COUNT(DISTINCT ul.quotation_id) as unique_quotations,
    MAX(ul.created_at) as last_used,
    t.created_at,
    t.updated_at
FROM enhanced_templates t
LEFT JOIN enhanced_template_usage_logs ul ON t.id = ul.template_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.theme, t.created_at, t.updated_at
ORDER BY usage_count DESC, t.updated_at DESC;

COMMENT ON VIEW enhanced_template_stats IS 'Provides usage statistics for enhanced templates';

COMMIT;
