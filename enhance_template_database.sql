-- Enhanced Template Builder Migration
-- Adds comprehensive template system with SuiteCRM-inspired features

-- Drop existing template tables if they exist (for clean migration)
-- DROP TABLE IF EXISTS template_history CASCADE;
-- DROP TABLE IF EXISTS template_categories CASCADE;
-- DROP TABLE IF EXISTS template_versions CASCADE;

-- Enhanced quotation templates table with advanced features
-- First, add missing columns to existing table if it exists
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'elements') THEN
        ALTER TABLE quotation_templates ADD COLUMN elements JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'styles') THEN
        ALTER TABLE quotation_templates ADD COLUMN styles JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'layout') THEN
        ALTER TABLE quotation_templates ADD COLUMN layout JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'tags') THEN
        ALTER TABLE quotation_templates ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'thumbnail') THEN
        ALTER TABLE quotation_templates ADD COLUMN thumbnail TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'category') THEN
        ALTER TABLE quotation_templates ADD COLUMN category VARCHAR(100) DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'usage_count') THEN
        ALTER TABLE quotation_templates ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'is_active') THEN
        ALTER TABLE quotation_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'version') THEN
        ALTER TABLE quotation_templates ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'field_mappings') THEN
        ALTER TABLE quotation_templates ADD COLUMN field_mappings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'conditional_logic') THEN
        ALTER TABLE quotation_templates ADD COLUMN conditional_logic JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quotation_templates' AND column_name = 'calculation_rules') THEN
        ALTER TABLE quotation_templates ADD COLUMN calculation_rules JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create template categories table for better organization
CREATE TABLE IF NOT EXISTS template_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50) DEFAULT 'FileText',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for template_categories updated_at
CREATE TRIGGER update_template_categories_updated_at 
BEFORE UPDATE ON template_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create template versions table for version control
CREATE TABLE IF NOT EXISTS template_versions (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) REFERENCES quotation_templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    elements JSONB NOT NULL DEFAULT '[]',
    styles JSONB DEFAULT '{}',
    layout JSONB DEFAULT '{}',
    content TEXT,
    change_summary TEXT,
    created_by VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, version_number)
);

-- Create template history table for audit trail
CREATE TABLE IF NOT EXISTS template_history (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) REFERENCES quotation_templates(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'CLONE')),
    old_values JSONB,
    new_values JSONB,
    change_summary TEXT,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create template usage tracking table
CREATE TABLE IF NOT EXISTS template_usage (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) REFERENCES quotation_templates(id) ON DELETE CASCADE,
    quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    usage_type VARCHAR(20) DEFAULT 'GENERATE' CHECK (usage_type IN ('GENERATE', 'PREVIEW', 'DOWNLOAD', 'EMAIL')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create template sharing table for collaborative features
CREATE TABLE IF NOT EXISTS template_sharing (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) REFERENCES quotation_templates(id) ON DELETE CASCADE,
    shared_by VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
    shared_with VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'VIEW' CHECK (permission_level IN ('VIEW', 'EDIT', 'ADMIN')),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, shared_with)
);

-- Create trigger for template_sharing updated_at
CREATE TRIGGER update_template_sharing_updated_at 
BEFORE UPDATE ON template_sharing
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quotation_templates_category ON quotation_templates(category);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_tags ON quotation_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_elements ON quotation_templates USING GIN(elements);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_is_active ON quotation_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_usage_count ON quotation_templates(usage_count DESC);

-- Template versions indexes
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(template_id, version_number DESC);

-- Template history indexes
CREATE INDEX IF NOT EXISTS idx_template_history_template_id ON template_history(template_id);
CREATE INDEX IF NOT EXISTS idx_template_history_action ON template_history(action);
CREATE INDEX IF NOT EXISTS idx_template_history_created_at ON template_history(created_at DESC);

-- Template usage indexes
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_quotation_id ON template_usage(quotation_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_created_at ON template_usage(created_at DESC);

-- Template sharing indexes
CREATE INDEX IF NOT EXISTS idx_template_sharing_template_id ON template_sharing(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sharing_shared_with ON template_sharing(shared_with);
CREATE INDEX IF NOT EXISTS idx_template_sharing_is_active ON template_sharing(is_active);

-- Insert default template categories
INSERT INTO template_categories (name, description, color, icon, sort_order) VALUES
    ('General', 'General purpose templates', '#3B82F6', 'FileText', 0),
    ('Professional', 'Professional business templates', '#059669', 'Briefcase', 1),
    ('Modern', 'Modern and contemporary designs', '#DC2626', 'Zap', 2),
    ('Minimal', 'Clean and minimal templates', '#7C3AED', 'Minus', 3),
    ('Detailed', 'Comprehensive detailed templates', '#EA580C', 'List', 4),
    ('Custom', 'Custom user-created templates', '#6B7280', 'Settings', 5)
ON CONFLICT (name) DO NOTHING;

-- Function to automatically update usage_count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotation_templates 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update usage count
DROP TRIGGER IF EXISTS trigger_update_template_usage_count ON template_usage;
CREATE TRIGGER trigger_update_template_usage_count
    AFTER INSERT ON template_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_template_usage_count();

-- Function to create template version on update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if elements, styles, or layout changed
    IF (OLD.elements IS DISTINCT FROM NEW.elements) OR 
       (OLD.styles IS DISTINCT FROM NEW.styles) OR 
       (OLD.layout IS DISTINCT FROM NEW.layout) OR
       (OLD.content IS DISTINCT FROM NEW.content) THEN
        
        INSERT INTO template_versions (
            template_id, 
            version_number, 
            elements, 
            styles, 
            layout, 
            content,
            change_summary,
            created_by
        ) VALUES (
            NEW.id,
            NEW.version,
            NEW.elements,
            NEW.styles,
            NEW.layout,
            NEW.content,
            'Automated version save',
            NEW.created_by
        );
        
        -- Update version number
        NEW.version = NEW.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic versioning
DROP TRIGGER IF EXISTS trigger_create_template_version ON quotation_templates;
CREATE TRIGGER trigger_create_template_version
    BEFORE UPDATE ON quotation_templates
    FOR EACH ROW
    EXECUTE FUNCTION create_template_version();

-- Function to log template changes
CREATE OR REPLACE FUNCTION log_template_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(20);
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type = 'CREATE';
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type = 'UPDATE';
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type = 'DELETE';
        old_data = to_jsonb(OLD);
        new_data = NULL;
    END IF;
    
    -- Insert into history
    INSERT INTO template_history (
        template_id,
        action,
        old_values,
        new_values,
        change_summary,
        user_id
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        old_data,
        new_data,
        CASE 
            WHEN action_type = 'CREATE' THEN 'Template created'
            WHEN action_type = 'UPDATE' THEN 'Template updated'
            WHEN action_type = 'DELETE' THEN 'Template deleted'
        END,
        COALESCE(NEW.created_by, OLD.created_by)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging changes
DROP TRIGGER IF EXISTS trigger_log_template_changes ON quotation_templates;
CREATE TRIGGER trigger_log_template_changes
    AFTER INSERT OR UPDATE OR DELETE ON quotation_templates
    FOR EACH ROW
    EXECUTE FUNCTION log_template_changes();

-- Create view for template analytics
CREATE OR REPLACE VIEW template_analytics AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.usage_count,
    t.is_active,
    t.created_at,
    t.updated_at,
    COUNT(DISTINCT tu.id) as total_uses,
    COUNT(DISTINCT tu.quotation_id) as unique_quotations,
    COUNT(DISTINCT tu.user_id) as unique_users,
    MAX(tu.created_at) as last_used_at,
    COUNT(DISTINCT tv.id) as version_count,
    array_agg(DISTINCT t.tags) as all_tags
FROM quotation_templates t
LEFT JOIN template_usage tu ON t.id = tu.template_id
LEFT JOIN template_versions tv ON t.id = tv.template_id
GROUP BY t.id, t.name, t.category, t.usage_count, t.is_active, t.created_at, t.updated_at;

-- Create view for user template permissions
CREATE OR REPLACE VIEW user_template_permissions AS
SELECT 
    t.id as template_id,
    t.name as template_name,
    t.created_by as owner_id,
    u.email as owner_email,
    ts.shared_with as user_id,
    us.email as user_email,
    CASE 
        WHEN t.created_by = ts.shared_with THEN 'OWNER'
        ELSE ts.permission_level
    END as permission_level,
    ts.expires_at,
    ts.is_active as sharing_active
FROM quotation_templates t
LEFT JOIN template_sharing ts ON t.id = ts.template_id
LEFT JOIN users u ON t.created_by = u.uid
LEFT JOIN users us ON ts.shared_with = us.uid
WHERE ts.is_active = TRUE OR ts.is_active IS NULL;

-- Grant necessary permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON quotation_templates TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_categories TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_versions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_history TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_usage TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_sharing TO PUBLIC;
GRANT SELECT ON template_analytics TO PUBLIC;
GRANT SELECT ON user_template_permissions TO PUBLIC;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Insert sample professional templates with enhanced features
INSERT INTO quotation_templates (
    id, name, description, content, elements, styles, category, tags, is_default, created_by
) VALUES (
    'qtpl_prof_001',
    'Professional Blue Template',
    'Clean professional template with blue accent colors',
    'Professional template with company header, quotation details, and summary',
    '[
        {
            "id": "header-1",
            "type": "header",
            "content": "{{company_name}}",
            "style": {
                "fontSize": "28px",
                "fontWeight": "bold",
                "color": "#2563eb",
                "textAlign": "center",
                "margin": "20px 0"
            }
        },
        {
            "id": "company-details",
            "type": "text",
            "content": "{{company_address}} | Phone: {{company_phone}} | Email: {{company_email}}",
            "style": {
                "fontSize": "12px",
                "textAlign": "center",
                "color": "#64748b",
                "margin": "0 0 30px 0"
            }
        },
        {
            "id": "quote-title",
            "type": "text",
            "content": "QUOTATION",
            "style": {
                "fontSize": "22px",
                "fontWeight": "bold",
                "textAlign": "center",
                "margin": "20px 0"
            }
        },
        {
            "id": "quote-number",
            "type": "field",
            "content": "Quotation No: {{quotation_number}}"
        },
        {
            "id": "quote-date",
            "type": "field",
            "content": "Date: {{quotation_date}}"
        },
        {
            "id": "customer-name",
            "type": "field",
            "content": "Customer: {{customer_name}}"
        },
        {
            "id": "equipment-table",
            "type": "table",
            "content": "Equipment Details"
        },
        {
            "id": "total-amount",
            "type": "calculation",
            "content": "Total Amount: {{total_amount}}",
            "style": {
                "fontSize": "18px",
                "fontWeight": "bold",
                "textAlign": "right"
            }
        },
        {
            "id": "terms",
            "type": "terms",
            "content": "TERMS AND CONDITIONS\n\n1. Payment Terms: 30% advance, 70% on completion\n2. Equipment delivery within 7 days\n3. Installation and commissioning included\n4. 1 year warranty on equipment"
        },
        {
            "id": "signature",
            "type": "signature",
            "content": "Authorized Signature"
        }
    ]'::jsonb,
    '{
        "primaryColor": "#2563eb",
        "secondaryColor": "#64748b",
        "accentColor": "#f1f5f9",
        "fontFamily": "Arial, sans-serif"
    }'::jsonb,
    'Professional',
    ARRAY['professional', 'blue', 'corporate', 'default'],
    true,
    (SELECT uid FROM users WHERE role = 'admin' LIMIT 1)
),
(
    'qtpl_mod_001',
    'Modern Orange Template',
    'Contemporary template with orange accents and clean lines',
    'Modern template with vibrant orange design elements',
    '[
        {
            "id": "header-modern",
            "type": "header",
            "content": "{{company_name}}",
            "style": {
                "fontSize": "26px",
                "fontWeight": "bold",
                "color": "#ea580c",
                "textAlign": "left",
                "margin": "15px 0"
            }
        },
        {
            "id": "quote-ref",
            "type": "field",
            "content": "Quote #{{quotation_number}}",
            "style": {
                "fontSize": "16px",
                "color": "#ea580c"
            }
        },
        {
            "id": "customer-details",
            "type": "text",
            "content": "Prepared for: {{customer_name}}\n{{customer_address}}",
            "style": {
                "margin": "20px 0"
            }
        },
        {
            "id": "equipment-list",
            "type": "table",
            "content": "Equipment & Services"
        },
        {
            "id": "summary",
            "type": "calculation",
            "content": "Total: {{total_amount}}",
            "style": {
                "fontSize": "20px",
                "fontWeight": "bold",
                "color": "#ea580c",
                "textAlign": "right"
            }
        }
    ]'::jsonb,
    '{
        "primaryColor": "#ea580c",
        "secondaryColor": "#78716c",
        "accentColor": "#fef7ed",
        "fontFamily": "Helvetica, Arial, sans-serif"
    }'::jsonb,
    'Modern',
    ARRAY['modern', 'orange', 'contemporary'],
    false,
    (SELECT uid FROM users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- Create comment for documentation
COMMENT ON TABLE quotation_templates IS 'Enhanced template system with SuiteCRM-inspired features supporting drag-and-drop builder, versioning, and advanced customization';
COMMENT ON TABLE template_categories IS 'Categorization system for organizing templates';
COMMENT ON TABLE template_versions IS 'Version control system for templates';
COMMENT ON TABLE template_history IS 'Audit trail for all template changes';
COMMENT ON TABLE template_usage IS 'Usage tracking and analytics for templates';
COMMENT ON TABLE template_sharing IS 'Collaborative sharing and permissions for templates';

COMMIT;
