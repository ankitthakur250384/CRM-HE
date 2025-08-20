-- Fix template_history triggers and functions to use correct column names
-- This script consolidates the conflicting triggers and uses the actual database columns

-- First, drop the conflicting triggers
DROP TRIGGER IF EXISTS trigger_log_template_changes ON quotation_templates;
DROP TRIGGER IF EXISTS trg_template_history ON quotation_templates;

-- Drop the old functions
DROP FUNCTION IF EXISTS log_template_changes();
DROP FUNCTION IF EXISTS create_template_history();

-- Create a single, correct function that uses the actual column names
CREATE OR REPLACE FUNCTION create_template_history()
RETURNS TRIGGER AS $$
DECLARE
    change_type_val TEXT;
    old_data JSONB;
    new_data JSONB;
    version_num INTEGER;
BEGIN
    -- Determine change type
    IF TG_OP = 'INSERT' THEN
        change_type_val := 'CREATE';
        old_data := NULL;
        new_data := row_to_json(NEW)::JSONB;
        version_num := NEW.version;
    ELSIF TG_OP = 'UPDATE' THEN
        change_type_val := 'UPDATE';
        old_data := row_to_json(OLD)::JSONB;
        new_data := row_to_json(NEW)::JSONB;
        version_num := NEW.version;
    ELSIF TG_OP = 'DELETE' THEN
        change_type_val := 'DELETE';
        old_data := row_to_json(OLD)::JSONB;
        new_data := NULL;
        version_num := OLD.version;
    END IF;

    -- Insert into template_history using the correct column names
    INSERT INTO template_history (
        template_id,
        snapshot,
        change_type,
        change_summary,
        changed_by,
        changed_at,
        version_number,
        action,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        COALESCE(new_data, old_data),
        change_type_val,
        CASE
            WHEN change_type_val = 'CREATE' THEN 'Template created'
            WHEN change_type_val = 'UPDATE' THEN 'Template updated'
            WHEN change_type_val = 'DELETE' THEN 'Template deleted'
        END,
        COALESCE(NEW.created_by, OLD.created_by),
        CURRENT_TIMESTAMP,
        version_num,
        change_type_val,
        old_data,
        new_data,
        NOW()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the single consolidated trigger
CREATE TRIGGER trg_template_history
    AFTER INSERT OR UPDATE OR DELETE ON quotation_templates
    FOR EACH ROW EXECUTE FUNCTION create_template_history();
