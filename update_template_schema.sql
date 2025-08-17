-- Update quotation_templates table to support modern template builder
-- Add missing columns for modern template functionality

-- Add elements column for storing template components
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;

-- Add styles column for storing template styling
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS styles JSONB DEFAULT '{}'::jsonb;

-- Add layout column for storing layout configuration
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS layout JSONB DEFAULT '{}'::jsonb;

-- Add tags column for template categorization
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add thumbnail column for template preview
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add category column for template organization
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';

-- Add usage_count column for analytics
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0);

-- Add is_active column for soft delete functionality
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add version column for template versioning
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 CHECK (version > 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_templates_elements ON quotation_templates USING gin (elements);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_styles ON quotation_templates USING gin (styles);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_layout ON quotation_templates USING gin (layout);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_tags ON quotation_templates USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_category ON quotation_templates(category);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_is_active ON quotation_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_usage_count ON quotation_templates(usage_count DESC);

-- Add comments for documentation
COMMENT ON COLUMN quotation_templates.elements IS 'JSONB array of template elements with type, content, and configuration';
COMMENT ON COLUMN quotation_templates.styles IS 'JSONB object containing global template styles and theme configuration';
COMMENT ON COLUMN quotation_templates.layout IS 'JSONB object containing layout settings and responsive configuration';
COMMENT ON COLUMN quotation_templates.tags IS 'Array of tags for categorizing and searching templates';
COMMENT ON COLUMN quotation_templates.thumbnail IS 'URL or path to template preview thumbnail image';
COMMENT ON COLUMN quotation_templates.category IS 'Template category (general, professional, modern, etc.)';
COMMENT ON COLUMN quotation_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON COLUMN quotation_templates.is_active IS 'Whether the template is active and available for use';
COMMENT ON COLUMN quotation_templates.version IS 'Template version number for tracking changes';

-- Create template search function using full-text search
CREATE OR REPLACE FUNCTION search_templates(
    search_term TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE(
    id VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    content TEXT,
    elements JSONB,
    styles JSONB,
    layout JSONB,
    tags TEXT[],
    thumbnail TEXT,
    category VARCHAR(50),
    usage_count INTEGER,
    is_default BOOLEAN,
    is_active BOOLEAN,
    version INTEGER,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.description, t.content, t.elements, t.styles, t.layout,
        t.tags, t.thumbnail, t.category, t.usage_count, t.is_default, t.is_active,
        t.version, t.created_by, t.created_at, t.updated_at
    FROM quotation_templates t
    WHERE t.is_active = true
      AND (
        t.name ILIKE '%' || search_term || '%' 
        OR t.description ILIKE '%' || search_term || '%'
        OR t.category ILIKE '%' || search_term || '%'
        OR search_term = ANY(t.tags)
      )
    ORDER BY 
        CASE 
            WHEN t.name ILIKE search_term THEN 1
            WHEN t.name ILIKE search_term || '%' THEN 2
            WHEN t.description ILIKE search_term || '%' THEN 3
            ELSE 4
        END,
        t.usage_count DESC,
        t.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create template categories table for better organization
CREATE TABLE IF NOT EXISTS template_categories (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'tcat_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2563eb', -- Hex color code
    icon VARCHAR(50), -- Icon name or class
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for template_categories updated_at
CREATE TRIGGER update_template_categories_updated_at 
BEFORE UPDATE ON template_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default template categories
INSERT INTO template_categories (name, description, color, icon, sort_order) VALUES
('general', 'General purpose templates', '#6b7280', 'FileText', 1),
('professional', 'Professional business templates', '#2563eb', 'Briefcase', 2),
('modern', 'Modern design templates', '#7c3aed', 'Sparkles', 3),
('construction', 'Construction industry templates', '#ea580c', 'HardHat', 4),
('equipment', 'Equipment rental templates', '#059669', 'Truck', 5)
ON CONFLICT (name) DO NOTHING;

-- Create template history table for versioning
CREATE TABLE IF NOT EXISTS template_history (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL, -- Full template snapshot
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')),
    change_summary TEXT,
    changed_by VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for template history
CREATE INDEX IF NOT EXISTS idx_template_history_template_id ON template_history(template_id);
CREATE INDEX IF NOT EXISTS idx_template_history_created_at ON template_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_history_change_type ON template_history(change_type);

-- Update existing templates to have default values for new columns
UPDATE quotation_templates 
SET 
    elements = '[]'::jsonb,
    styles = '{}'::jsonb,
    layout = '{}'::jsonb,
    tags = ARRAY[]::TEXT[],
    category = 'general',
    usage_count = 0,
    is_active = true,
    version = 1
WHERE elements IS NULL OR styles IS NULL OR layout IS NULL;

COMMENT ON TABLE quotation_templates IS 'Modern quotation templates with rich element support, styling, and versioning';
COMMENT ON TABLE template_categories IS 'Categories for organizing and filtering quotation templates';
COMMENT ON TABLE template_history IS 'Version history and change tracking for quotation templates';
