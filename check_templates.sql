-- Check if quotation_templates table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quotation_templates'
ORDER BY ordinal_position;

-- Show all templates
SELECT 
    id,
    name,
    description,
    CASE 
        WHEN length(content) > 50 THEN substring(content, 1, 50) || '...'
        ELSE content
    END as content_preview,
    is_default,
    created_at,
    created_by
FROM quotation_templates
ORDER BY created_at DESC;
