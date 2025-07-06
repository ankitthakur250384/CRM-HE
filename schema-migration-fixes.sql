-- Comprehensive Schema Migration Script
-- This script applies all the necessary fixes to bring the database schema up to production standards
-- Run this script on an existing database to apply all the discussed fixes

-- ========== SAFETY CHECKS ==========
-- Backup reminder
-- IMPORTANT: Create a backup before running this script!
-- pg_dump -h localhost -U aspcranes_admin -d aspcranes_db > backup_before_migration.sql

-- ========== DATA PREPARATION ==========

-- 1. Clean up orphaned quotations by creating default leads for them
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Check for quotations without deal_id or lead_id
    SELECT COUNT(*) INTO orphan_count
    FROM quotations 
    WHERE deal_id IS NULL AND lead_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE 'Found % orphaned quotations. Creating default leads...', orphan_count;
        
        -- Create default leads for orphaned quotations
        INSERT INTO leads (
            id, customer_id, customer_name, email, phone, service_needed, 
            site_location, start_date, rental_days, status, assigned_to
        )
        SELECT 
            'lead_' || SUBSTRING(uuid_generate_v4()::text FROM 1 FOR 8),
            q.customer_id,
            q.customer_name,
            COALESCE(c.email, 'unknown@aspcranes.com'),
            COALESCE(c.phone, '0000000000'),
            'Crane rental for ' || q.machine_type,
            'Not specified',
            CURRENT_DATE,
            q.number_of_days,
            'converted',
            q.created_by
        FROM quotations q
        LEFT JOIN customers c ON q.customer_id = c.id
        WHERE q.deal_id IS NULL AND q.lead_id IS NULL;
        
        -- Update orphaned quotations with new lead_ids
        UPDATE quotations 
        SET lead_id = subquery.lead_id
        FROM (
            SELECT 
                q.id as quotation_id,
                l.id as lead_id
            FROM quotations q
            JOIN leads l ON l.customer_name = q.customer_name 
                AND l.service_needed = 'Crane rental for ' || q.machine_type
                AND l.status = 'converted'
            WHERE q.deal_id IS NULL AND q.lead_id IS NULL
        ) AS subquery
        WHERE quotations.id = subquery.quotation_id;
        
        RAISE NOTICE 'Created default leads and updated quotations.';
    END IF;
END $$;

-- 2. Ensure all quotations have valid customer_id
UPDATE quotations 
SET customer_id = subquery.customer_id
FROM (
    SELECT 
        q.id as quotation_id,
        c.id as customer_id
    FROM quotations q
    LEFT JOIN customers c ON c.name = q.customer_name
    WHERE q.customer_id IS NULL AND c.id IS NOT NULL
) AS subquery
WHERE quotations.id = subquery.quotation_id;

-- Create default customers for quotations without valid customer_id
INSERT INTO customers (name, company_name, contact_name, email, phone, address, type)
SELECT DISTINCT 
    q.customer_name,
    q.customer_name,
    q.customer_name,
    'unknown@aspcranes.com',
    '0000000000',
    'Address not specified',
    'other'
FROM quotations q
LEFT JOIN customers c ON c.name = q.customer_name
WHERE q.customer_id IS NULL AND c.id IS NULL;

-- Update quotations with new customer_ids
UPDATE quotations 
SET customer_id = c.id
FROM customers c
WHERE quotations.customer_id IS NULL 
AND c.name = quotations.customer_name;

-- ========== SCHEMA MODIFICATIONS ==========

-- 3. Add missing columns
BEGIN;

-- Add deal_id to quotations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'deal_id'
    ) THEN
        ALTER TABLE quotations ADD COLUMN deal_id VARCHAR(50);
        RAISE NOTICE 'Added deal_id column to quotations';
    END IF;
END $$;

-- Add total_cost to quotations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE quotations ADD COLUMN total_cost NUMERIC(12, 2) DEFAULT 0 CHECK (total_cost >= 0);
        UPDATE quotations SET total_cost = total_rent WHERE total_cost IS NULL;
        RAISE NOTICE 'Added total_cost column to quotations';
    END IF;
END $$;

-- Add notes to quotations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'notes'
    ) THEN
        ALTER TABLE quotations ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to quotations';
    END IF;
END $$;

-- Add customer_contact to deals if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'customer_contact'
    ) THEN
        ALTER TABLE deals ADD COLUMN customer_contact JSONB;
        RAISE NOTICE 'Added customer_contact column to deals';
    END IF;
END $$;

COMMIT;

-- 4. Add foreign key constraints if they don't exist
BEGIN;

-- Add deal_id foreign key to quotations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_deal_id_fkey' 
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE quotations 
        ADD CONSTRAINT quotations_deal_id_fkey 
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added deal_id foreign key to quotations';
    END IF;
END $$;

COMMIT;

-- 5. Modify nullable constraints
BEGIN;

-- Make customer_id NOT NULL in quotations
ALTER TABLE quotations ALTER COLUMN customer_id SET NOT NULL;

-- Make customer_id NOT NULL in deals
ALTER TABLE deals ALTER COLUMN customer_id SET NOT NULL;

-- Make customer_id NOT NULL in jobs
ALTER TABLE jobs ALTER COLUMN customer_id SET NOT NULL;

-- Make customer_id NOT NULL in site_assessments
ALTER TABLE site_assessments ALTER COLUMN customer_id SET NOT NULL;

-- Make created_by NOT NULL where appropriate
ALTER TABLE deals ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE deals ALTER COLUMN assigned_to SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE leads ALTER COLUMN assigned_to SET NOT NULL;
ALTER TABLE site_assessments ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE quotations ALTER COLUMN created_by SET NOT NULL;

-- Make total_cost NOT NULL in quotations
ALTER TABLE quotations ALTER COLUMN total_cost SET NOT NULL;

COMMIT;

-- 6. Add business logic constraints
BEGIN;

-- Quotation must have deal_id OR lead_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotation_must_have_deal_or_lead' 
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE quotations 
        ADD CONSTRAINT quotation_must_have_deal_or_lead 
        CHECK (deal_id IS NOT NULL OR lead_id IS NOT NULL);
        RAISE NOTICE 'Added business logic constraint: quotations must have deal or lead';
    END IF;
END $$;

-- Job date validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_job_dates' 
        AND table_name = 'jobs'
    ) THEN
        ALTER TABLE jobs 
        ADD CONSTRAINT check_job_dates 
        CHECK (scheduled_end_date >= scheduled_start_date);
        RAISE NOTICE 'Added job date validation constraint';
    END IF;
END $$;

-- Job actual date validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_job_actual_dates' 
        AND table_name = 'jobs'
    ) THEN
        ALTER TABLE jobs 
        ADD CONSTRAINT check_job_actual_dates 
        CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date);
        RAISE NOTICE 'Added job actual date validation constraint';
    END IF;
END $$;

-- Equipment capacity validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_equipment_capacity_weight' 
        AND table_name = 'equipment'
    ) THEN
        ALTER TABLE equipment 
        ADD CONSTRAINT check_equipment_capacity_weight 
        CHECK (max_lifting_capacity > 0 AND unladen_weight > 0);
        RAISE NOTICE 'Added equipment capacity validation constraint';
    END IF;
END $$;

-- Deal probability validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_deal_probability' 
        AND table_name = 'deals'
    ) THEN
        ALTER TABLE deals 
        ADD CONSTRAINT check_deal_probability 
        CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));
        RAISE NOTICE 'Added deal probability validation constraint';
    END IF;
END $$;

COMMIT;

-- 7. Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_deal_id ON quotations(deal_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_created_by ON deals(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_assessments_created_by ON site_assessments(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_templates_created_by ON quotation_templates(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_templates_is_default ON quotation_templates(is_default);

-- Performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_value ON deals(value);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_total_cost ON quotations(total_cost);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_lifting_capacity ON equipment(max_lifting_capacity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_dates ON jobs(scheduled_start_date, scheduled_end_date);

-- Compound indexes for junction tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_machines_quotation_equipment ON quotation_machines(quotation_id, equipment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_equipment_job_equipment ON job_equipment(job_id, equipment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_operators_job_operator ON job_operators(job_id, operator_id);

-- ========== VERIFICATION ==========

-- 8. Final verification queries
DO $$
DECLARE
    fk_count INTEGER;
    orphan_quotations INTEGER;
    null_customer_quotations INTEGER;
BEGIN
    -- Count foreign key constraints
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    -- Check for orphaned quotations
    SELECT COUNT(*) INTO orphan_quotations
    FROM quotations 
    WHERE deal_id IS NULL AND lead_id IS NULL;
    
    -- Check for quotations without customer_id
    SELECT COUNT(*) INTO null_customer_quotations
    FROM quotations 
    WHERE customer_id IS NULL;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Total foreign key constraints: %', fk_count;
    RAISE NOTICE 'Orphaned quotations (without deal or lead): %', orphan_quotations;
    RAISE NOTICE 'Quotations without customer_id: %', null_customer_quotations;
    
    IF orphan_quotations = 0 AND null_customer_quotations = 0 THEN
        RAISE NOTICE '✅ Schema migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️  Some data integrity issues remain. Please review manually.';
    END IF;
END $$;

-- Log successful completion
INSERT INTO audit_logs (action, entity_type, entity_id, changes, created_at)
VALUES (
    'SCHEMA_MIGRATION',
    'DATABASE',
    'aspcranes_db',
    '{
        "description": "Applied comprehensive schema fixes",
        "changes": [
            "Added missing foreign keys",
            "Enforced NOT NULL constraints", 
            "Added business logic constraints",
            "Added performance indexes",
            "Cleaned up orphaned data"
        ]
    }'::jsonb,
    CURRENT_TIMESTAMP
);

RAISE NOTICE 'Schema migration logged in audit_logs table.';
RAISE NOTICE 'Migration completed at: %', CURRENT_TIMESTAMP;
