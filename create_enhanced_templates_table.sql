-- Enhanced Templates Table Creation Script
-- Creates table for storing enhanced quotation templates

CREATE TABLE IF NOT EXISTS enhanced_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'MODERN',
    category VARCHAR(100) DEFAULT 'Quotation',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thumbnail TEXT,
    elements JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    branding JSONB DEFAULT '{}'::jsonb,
    usage_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_theme ON enhanced_templates(theme);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_category ON enhanced_templates(category);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_active ON enhanced_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_created_by ON enhanced_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_enhanced_templates_created_at ON enhanced_templates(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enhanced_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_enhanced_templates_updated_at ON enhanced_templates;
CREATE TRIGGER update_enhanced_templates_updated_at
    BEFORE UPDATE ON enhanced_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_enhanced_templates_updated_at();

-- Insert a sample template to get started (optional)
INSERT INTO enhanced_templates (
    id, name, description, theme, category, is_default, is_active, 
    created_by, elements, settings, branding
) VALUES (
    'tpl_default_001',
    'Default ASP Cranes Template',
    'Standard quotation template for ASP Cranes',
    'MODERN',
    'Quotation',
    true,
    true,
    'system',
    '[
        {
            "id": "header-1",
            "type": "header",
            "content": {"title": "ASP CRANES", "subtitle": "Professional Equipment Solutions"},
            "visible": true,
            "style": {"fontSize": "24px", "color": "#0052CC", "textAlign": "center"}
        },
        {
            "id": "company-info-1", 
            "type": "company_info",
            "content": {
                "fields": ["{{company.name}}", "{{company.address}}", "{{company.phone}}"],
                "layout": "vertical"
            },
            "visible": true,
            "style": {"fontSize": "14px"}
        }
    ]'::jsonb,
    '{
        "pageSize": "A4",
        "margins": {"top": 20, "right": 20, "bottom": 20, "left": 20}
    }'::jsonb,
    '{
        "primaryColor": "#0052CC",
        "secondaryColor": "#1f2937",
        "logoUrl": null
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON enhanced_templates TO your_app_user;
