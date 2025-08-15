-- Update quotation_templates table to support new template builder structure
-- Add elements field for drag-and-drop template structure
-- Add fields for usage tracking and tags

ALTER TABLE quotation_templates 
ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS styles JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Create index for better performance on elements field
CREATE INDEX IF NOT EXISTS idx_quotation_templates_elements ON quotation_templates USING gin (elements);

-- Create index for styles field
CREATE INDEX IF NOT EXISTS idx_quotation_templates_styles ON quotation_templates USING gin (styles);

-- Create index for tags
CREATE INDEX IF NOT EXISTS idx_quotation_templates_tags ON quotation_templates USING gin (tags);

-- Update existing templates to have empty elements array if they don't have it
UPDATE quotation_templates 
SET elements = '[]'::jsonb 
WHERE elements IS NULL;

-- Add constraint to ensure elements is always an array (skip if exists)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE quotation_templates 
        ADD CONSTRAINT check_elements_is_array 
        CHECK (jsonb_typeof(elements) = 'array');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Sample template with new structure (optional, for testing)
INSERT INTO quotation_templates (
    name, 
    description, 
    content, 
    elements,
    is_default,
    created_by,
    usage_count,
    tags
) VALUES (
    'Modern Template Builder Sample',
    'Sample template created with the new drag-and-drop builder',
    '<div>Sample HTML content</div>',
    '[
        {
            "id": "element_1",
            "type": "text",
            "content": "Sample text element",
            "styles": {
                "fontSize": 16,
                "fontWeight": "bold",
                "textAlign": "center"
            }
        },
        {
            "id": "element_2", 
            "type": "field",
            "fieldType": "customer.name",
            "styles": {
                "fontSize": 14,
                "textAlign": "left"
            }
        }
    ]'::jsonb,
    false,
    'usr_admin01',
    0,
    ARRAY['sample', 'modern']
);
