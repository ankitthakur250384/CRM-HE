-- Fix template_history table structure
-- This script adds missing columns and recreates the trigger function

-- First, check if the columns exist and add them if they don't
ALTER TABLE template_history 
ADD COLUMN IF NOT EXISTS action VARCHAR(20),
ADD COLUMN IF NOT EXISTS old_values JSONB,
ADD COLUMN IF NOT EXISTS new_values JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Update the log_template_changes function to match the actual table structure
CREATE OR REPLACE FUNCTION log_template_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        old_data := NULL;
        new_data := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := row_to_json(OLD)::JSONB;
        new_data := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := row_to_json(OLD)::JSONB;
        new_data := NULL;
    END IF;

    -- Insert into template_history
    INSERT INTO template_history (
        template_id,
        action,
        old_values,
        new_values,
        change_summary,
        user_id,
        created_at
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
        COALESCE(NEW.created_by, OLD.created_by),
        NOW()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_log_template_changes ON quotation_templates;
CREATE TRIGGER trigger_log_template_changes
    AFTER INSERT OR UPDATE OR DELETE ON quotation_templates
    FOR EACH ROW EXECUTE FUNCTION log_template_changes();

-- Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_template_history_action ON template_history(action);
CREATE INDEX IF NOT EXISTS idx_template_history_created_at ON template_history(created_at);
