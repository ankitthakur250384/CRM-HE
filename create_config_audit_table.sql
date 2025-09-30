-- Config Audit Trail Table
-- This table tracks all configuration changes with user information and timestamps
-- without modifying the existing config table structure

CREATE TABLE IF NOT EXISTS config_audit (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('aud_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8)),
    config_id VARCHAR(50) NOT NULL, -- References config.id
    config_name VARCHAR(255) NOT NULL, -- References config.name
    action VARCHAR(20) NOT NULL, -- 'UPDATE', 'CREATE', 'DELETE'
    old_value JSONB, -- Previous value (NULL for CREATE)
    new_value JSONB, -- New value (NULL for DELETE)
    changed_by VARCHAR(255), -- User ID or name who made the change
    changed_by_email VARCHAR(255), -- User email for better tracking
    change_reason TEXT, -- Optional reason for the change
    ip_address INET, -- IP address of the user making the change
    user_agent TEXT, -- Browser/client information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    CONSTRAINT fk_config_audit_config_id FOREIGN KEY (config_id) REFERENCES config(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_config_audit_config_id ON config_audit(config_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_config_name ON config_audit(config_name);
CREATE INDEX IF NOT EXISTS idx_config_audit_changed_by ON config_audit(changed_by);
CREATE INDEX IF NOT EXISTS idx_config_audit_created_at ON config_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_action ON config_audit(action);

-- Create a function to automatically log config changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
DECLARE
    audit_action VARCHAR(20);
    old_val JSONB;
    new_val JSONB;
BEGIN
    -- Determine the action
    IF TG_OP = 'DELETE' THEN
        audit_action := 'DELETE';
        old_val := OLD.value;
        new_val := NULL;
        
        INSERT INTO config_audit (
            config_id, config_name, action, old_value, new_value,
            changed_by, change_reason
        ) VALUES (
            OLD.id, OLD.name, audit_action, old_val, new_val,
            'SYSTEM', 'Configuration deleted'
        );
        
        RETURN OLD;
        
    ELSIF TG_OP = 'UPDATE' THEN
        audit_action := 'UPDATE';
        old_val := OLD.value;
        new_val := NEW.value;
        
        -- Only log if the value actually changed
        IF OLD.value IS DISTINCT FROM NEW.value THEN
            INSERT INTO config_audit (
                config_id, config_name, action, old_value, new_value,
                changed_by, change_reason
            ) VALUES (
                NEW.id, NEW.name, audit_action, old_val, new_val,
                'SYSTEM', 'Configuration updated'
            );
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'INSERT' THEN
        audit_action := 'CREATE';
        old_val := NULL;
        new_val := NEW.value;
        
        INSERT INTO config_audit (
            config_id, config_name, action, old_value, new_value,
            changed_by, change_reason
        ) VALUES (
            NEW.id, NEW.name, audit_action, old_val, new_val,
            'SYSTEM', 'Configuration created'
        );
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log all config changes
DROP TRIGGER IF EXISTS config_audit_trigger ON config;
CREATE TRIGGER config_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON config
    FOR EACH ROW
    EXECUTE FUNCTION log_config_change();

-- Comment on table and columns for documentation
COMMENT ON TABLE config_audit IS 'Audit trail for all configuration changes in the system';
COMMENT ON COLUMN config_audit.config_id IS 'References the config.id that was changed';
COMMENT ON COLUMN config_audit.config_name IS 'Name of the configuration setting that was changed';
COMMENT ON COLUMN config_audit.action IS 'Type of action performed: CREATE, UPDATE, or DELETE';
COMMENT ON COLUMN config_audit.old_value IS 'Previous value before the change (NULL for CREATE operations)';
COMMENT ON COLUMN config_audit.new_value IS 'New value after the change (NULL for DELETE operations)';
COMMENT ON COLUMN config_audit.changed_by IS 'User ID or identifier of who made the change';
COMMENT ON COLUMN config_audit.changed_by_email IS 'Email address of the user who made the change';
COMMENT ON COLUMN config_audit.change_reason IS 'Optional reason or description for the change';
COMMENT ON COLUMN config_audit.ip_address IS 'IP address from which the change was made';
COMMENT ON COLUMN config_audit.user_agent IS 'Browser or client information of the user';