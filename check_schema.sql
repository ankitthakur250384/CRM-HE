-- Check current database schema to understand existing columns
\d template_history
\d quotation_templates
\d template_categories
\d template_usage

-- Check what columns exist in template_history
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'template_history' 
ORDER BY ordinal_position;

-- Check what columns exist in quotation_templates
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quotation_templates' 
ORDER BY ordinal_position;
