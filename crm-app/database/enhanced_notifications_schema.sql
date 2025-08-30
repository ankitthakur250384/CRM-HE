-- Enhanced Notification System Database Schema
-- Run this to upgrade your notification system

-- ========== NOTIFICATION TEMPLATES ==========

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'tpl_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    template_type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    email_template TEXT,
    sms_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_notification_templates_updated_at 
BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== NOTIFICATION RULES ==========

-- Create notification rules table
CREATE TABLE IF NOT EXISTS notification_rules (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'rule_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    event_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_roles TEXT[] NOT NULL,
    channels TEXT[] NOT NULL DEFAULT '{"in_app"}',
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_notification_rules_updated_at 
BEFORE UPDATE ON notification_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== SCHEDULED NOTIFICATIONS ==========

-- Create scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'sched_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    type VARCHAR(50) NOT NULL,
    recipients JSONB NOT NULL,
    data JSONB NOT NULL,
    channels JSONB NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_at ON scheduled_notifications(scheduled_at);

-- ========== NOTIFICATION LOGS ==========

-- Create notification logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    message_id VARCHAR(255),
    error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- ========== ENHANCE EXISTING NOTIFICATIONS TABLE ==========

-- Add priority column to existing notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add metadata column for additional data
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add expiry for temporary notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for priority
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- ========== USER NOTIFICATION PREFERENCES ==========

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'pref_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
    user_id VARCHAR(50) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    channels JSONB NOT NULL DEFAULT '["in_app"]',
    is_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_user_notification_preferences_updated_at 
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- ========== INSERT DEFAULT TEMPLATES ==========

-- Insert default notification templates
INSERT INTO notification_templates (template_type, name, subject_template, message_template, email_template, sms_template) VALUES
('lead_created', 'New Lead Created', 
 'New Lead: {{customerName}}', 
 'New lead received from {{customerName}} for {{serviceNeeded}}',
 '<h2>New Lead Notification</h2><p>A new lead has been created:</p><ul><li><strong>Customer:</strong> {{customerName}}</li><li><strong>Company:</strong> {{companyName}}</li><li><strong>Service:</strong> {{serviceNeeded}}</li><li><strong>Location:</strong> {{siteLocation}}</li></ul><p><a href="{{leadUrl}}">View Lead Details</a></p>',
 'New lead from {{customerName}} for {{serviceNeeded}}. Check CRM for details.'),

('quotation_created', 'Quotation Created', 
 'Quotation Created: {{quotationId}}', 
 'Quotation {{quotationId}} created for {{customerName}}',
 '<h2>Quotation Created</h2><p>Quotation #{{quotationId}} has been created for {{customerName}}.</p><ul><li><strong>Amount:</strong> ₹{{totalCost}}</li><li><strong>Machine:</strong> {{machineType}}</li><li><strong>Duration:</strong> {{numberOfDays}} days</li></ul><p><a href="{{quotationUrl}}">View Quotation</a></p>',
 'Quotation {{quotationId}} created for {{customerName}} - ₹{{totalCost}}'),

('job_assigned', 'Job Assignment', 
 'Job Assignment: {{jobTitle}}', 
 'You have been assigned to job: {{jobTitle}}',
 '<h2>Job Assignment</h2><p>You have been assigned to the following job:</p><ul><li><strong>Job:</strong> {{jobTitle}}</li><li><strong>Customer:</strong> {{customerName}}</li><li><strong>Location:</strong> {{location}}</li><li><strong>Start Date:</strong> {{startDate}}</li></ul><p><a href="{{jobUrl}}">View Job Details</a></p>',
 'Job assigned: {{jobTitle}} at {{location}} starting {{startDate}}'),

('deal_won', 'Deal Closed', 
 'Deal Closed: {{dealTitle}}', 
 'Congratulations! Deal "{{dealTitle}}" worth ₹{{dealValue}} has been won!',
 '<h2>🎉 Deal Won!</h2><p>Congratulations on closing the deal!</p><ul><li><strong>Deal:</strong> {{dealTitle}}</li><li><strong>Value:</strong> ₹{{dealValue}}</li><li><strong>Customer:</strong> {{customerName}}</li></ul><p>Great work on this success!</p>',
 '🎉 Deal won! {{dealTitle}} - ₹{{dealValue}} from {{customerName}}'),

('followup_reminder', 'Follow-up Reminder', 
 'Follow-up Reminder: {{customerName}}', 
 'Time to follow up with {{customerName}}',
 '<h2>Follow-up Reminder</h2><p>It''s time to follow up with {{customerName}}.</p><ul><li><strong>Last Contact:</strong> {{lastContact}}</li><li><strong>Status:</strong> {{status}}</li><li><strong>Service Needed:</strong> {{serviceNeeded}}</li></ul><p><a href="{{leadUrl}}">View Lead Details</a></p>',
 'Follow-up reminder: {{customerName}} - {{serviceNeeded}}'),

('job_completed', 'Job Completed', 
 'Job Completed: {{jobTitle}}', 
 'Job {{jobTitle}} has been completed successfully',
 '<h2>Job Completed</h2><p>The following job has been completed:</p><ul><li><strong>Job:</strong> {{jobTitle}}</li><li><strong>Customer:</strong> {{customerName}}</li><li><strong>Completed Date:</strong> {{completedDate}}</li></ul><p><a href="{{jobUrl}}">View Job Details</a></p>',
 'Job completed: {{jobTitle}} for {{customerName}}'),

('payment_overdue', 'Payment Overdue', 
 'Payment Overdue: {{invoiceNumber}}', 
 'Payment for invoice {{invoiceNumber}} is overdue',
 '<h2>Payment Overdue</h2><p>Payment for the following invoice is overdue:</p><ul><li><strong>Invoice:</strong> {{invoiceNumber}}</li><li><strong>Amount:</strong> ₹{{amount}}</li><li><strong>Due Date:</strong> {{dueDate}}</li><li><strong>Customer:</strong> {{customerName}}</li></ul><p>Please follow up for payment collection.</p>',
 'Payment overdue: Invoice {{invoiceNumber}} - ₹{{amount}} from {{customerName}}')

ON CONFLICT (template_type) DO UPDATE SET
    subject_template = EXCLUDED.subject_template,
    message_template = EXCLUDED.message_template,
    email_template = EXCLUDED.email_template,
    sms_template = EXCLUDED.sms_template,
    updated_at = CURRENT_TIMESTAMP;

-- ========== INSERT DEFAULT RULES ==========

-- Insert default notification rules
INSERT INTO notification_rules (event_type, name, user_roles, channels) VALUES
('lead_created', 'New Lead Notifications', '{"sales_agent", "admin"}', '{"in_app", "email"}'),
('quotation_created', 'Quotation Created Notifications', '{"sales_agent", "admin"}', '{"in_app", "email"}'),
('job_assigned', 'Job Assignment Notifications', '{"operator", "operations_manager"}', '{"in_app", "email", "sms"}'),
('deal_won', 'Deal Won Notifications', '{"sales_agent", "admin"}', '{"in_app", "email"}'),
('followup_reminder', 'Follow-up Reminders', '{"sales_agent"}', '{"in_app", "email"}'),
('job_completed', 'Job Completion Notifications', '{"operations_manager", "admin"}', '{"in_app", "email"}'),
('payment_overdue', 'Payment Overdue Notifications', '{"admin", "sales_agent"}', '{"in_app", "email"}')

ON CONFLICT (event_type) DO UPDATE SET
    user_roles = EXCLUDED.user_roles,
    channels = EXCLUDED.channels,
    updated_at = CURRENT_TIMESTAMP;

-- ========== CREATE FUNCTIONS ==========

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id VARCHAR(50))
RETURNS TABLE(
    notification_type VARCHAR(50),
    channels JSONB,
    is_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.notification_type,
        p.channels,
        p.is_enabled
    FROM user_notification_preferences p
    WHERE p.user_id = p_user_id
    AND p.is_enabled = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========== INDEXES FOR PERFORMANCE ==========

-- Additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_event_type ON notification_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority ON notifications(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc ON notifications(created_at DESC);

-- ========== COMMENTS ==========

COMMENT ON TABLE notification_templates IS 'Templates for different types of notifications';
COMMENT ON TABLE notification_rules IS 'Rules defining who gets notified for different events';
COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled for future delivery';
COMMENT ON TABLE notification_logs IS 'Log of all sent notifications for tracking';
COMMENT ON TABLE user_notification_preferences IS 'User-specific notification preferences';

-- ========== SUCCESS MESSAGE ==========

DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Notification System schema created successfully!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '- Notification templates and rules';
    RAISE NOTICE '- Scheduled notifications';
    RAISE NOTICE '- Notification logging and tracking';
    RAISE NOTICE '- User notification preferences';
    RAISE NOTICE '- Multiple channels (email, SMS, in-app)';
    RAISE NOTICE '- Priority levels and expiry dates';
END;
$$;
