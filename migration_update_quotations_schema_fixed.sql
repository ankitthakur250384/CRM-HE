-- Migration script to update quotations table schema (Fixed version)
-- Date: 2025-09-27
-- Description: Add new columns and constraints to match the updated quotations table schema

-- Start transaction
BEGIN;

-- Add new columns to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS primary_equipment_id VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS equipment_snapshot JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident1 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident2 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident3 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS rigger_amount NUMERIC(12, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS helper_amount NUMERIC(12, 2);

-- Add foreign key constraint for primary_equipment_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_primary_equipment_id_fkey' 
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE quotations 
        ADD CONSTRAINT quotations_primary_equipment_id_fkey 
        FOREIGN KEY (primary_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add default value to shift column if it doesn't have one
ALTER TABLE quotations ALTER COLUMN shift SET DEFAULT 'single';

-- Update existing NULL values in shift column to 'single' if any exist
UPDATE quotations SET shift = 'single' WHERE shift IS NULL;

-- Add NOT NULL constraint to shift column if it doesn't have one
DO $$ 
BEGIN
    -- Check if shift column allows NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'shift' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE quotations ALTER COLUMN shift SET NOT NULL;
    END IF;
END $$;

-- Create index for primary equipment lookup
CREATE INDEX IF NOT EXISTS idx_quotations_primary_equipment ON quotations(primary_equipment_id);

-- Helper function to safely add constraints
CREATE OR REPLACE FUNCTION add_constraint_if_not_exists(
    table_name TEXT,
    constraint_name TEXT,
    constraint_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = add_constraint_if_not_exists.constraint_name
        AND table_name = add_constraint_if_not_exists.table_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s', 
                      add_constraint_if_not_exists.table_name, 
                      add_constraint_if_not_exists.constraint_name, 
                      constraint_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraints using the helper function
SELECT add_constraint_if_not_exists('quotations', 'quotations_rigger_amount_check', 
    'CHECK (rigger_amount IS NULL OR rigger_amount >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_helper_amount_check', 
    'CHECK (helper_amount IS NULL OR helper_amount >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_number_of_days_check', 
    'CHECK (number_of_days > 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_working_hours_check', 
    'CHECK (working_hours > 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_food_resources_check', 
    'CHECK (food_resources >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_accom_resources_check', 
    'CHECK (accom_resources >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_site_distance_check', 
    'CHECK (site_distance >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_mob_demob_check', 
    'CHECK (mob_demob >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_mob_relaxation_check', 
    'CHECK (mob_relaxation >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_extra_charge_check', 
    'CHECK (extra_charge >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_other_factors_charge_check', 
    'CHECK (other_factors_charge >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_total_rent_check', 
    'CHECK (total_rent >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_total_cost_check', 
    'CHECK (total_cost >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_working_cost_check', 
    'CHECK (working_cost IS NULL OR working_cost >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_mob_demob_cost_check', 
    'CHECK (mob_demob_cost IS NULL OR mob_demob_cost >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_food_accom_cost_check', 
    'CHECK (food_accom_cost IS NULL OR food_accom_cost >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_usage_load_factor_check', 
    'CHECK (usage_load_factor IS NULL OR usage_load_factor >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_risk_adjustment_check', 
    'CHECK (risk_adjustment IS NULL OR risk_adjustment >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_gst_amount_check', 
    'CHECK (gst_amount IS NULL OR gst_amount >= 0)');

SELECT add_constraint_if_not_exists('quotations', 'quotations_version_check', 
    'CHECK (version > 0)');

-- Ensure include_gst has proper default and NOT NULL
ALTER TABLE quotations ALTER COLUMN include_gst SET DEFAULT TRUE;
UPDATE quotations SET include_gst = TRUE WHERE include_gst IS NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'include_gst' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE quotations ALTER COLUMN include_gst SET NOT NULL;
    END IF;
END $$;

-- Ensure version has proper default and NOT NULL
ALTER TABLE quotations ALTER COLUMN version SET DEFAULT 1;
UPDATE quotations SET version = 1 WHERE version IS NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'version' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE quotations ALTER COLUMN version SET NOT NULL;
    END IF;
END $$;

-- Ensure total_cost has proper default and NOT NULL
ALTER TABLE quotations ALTER COLUMN total_cost SET DEFAULT 0;
UPDATE quotations SET total_cost = 0 WHERE total_cost IS NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'total_cost' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE quotations ALTER COLUMN total_cost SET NOT NULL;
    END IF;
END $$;

-- Ensure status has proper default and NOT NULL
ALTER TABLE quotations ALTER COLUMN status SET DEFAULT 'draft';
UPDATE quotations SET status = 'draft' WHERE status IS NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotations' 
        AND column_name = 'status' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE quotations ALTER COLUMN status SET NOT NULL;
    END IF;
END $$;

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS add_constraint_if_not_exists(TEXT, TEXT, TEXT);

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Added new columns and constraints to quotations table.';
END
$$;

-- Commit transaction
COMMIT;

-- Verification queries (run outside transaction)
DO $$
DECLARE
    column_count INTEGER;
    rec RECORD;
BEGIN
    -- Check if new columns were added
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'quotations' 
    AND column_name IN ('primary_equipment_id', 'equipment_snapshot', 'incident1', 'incident2', 'incident3', 'rigger_amount', 'helper_amount');
    
    RAISE NOTICE 'Verification: Found % new columns in quotations table', column_count;
    
    -- List key columns for verification
    RAISE NOTICE 'Key columns in quotations table:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'quotations'
        AND column_name IN ('primary_equipment_id', 'equipment_snapshot', 'incident1', 'incident2', 'incident3', 'rigger_amount', 'helper_amount', 'shift', 'version', 'status', 'total_cost', 'include_gst')
        ORDER BY column_name
    LOOP
        RAISE NOTICE '  %: % (nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, COALESCE(rec.column_default, 'NULL');
    END LOOP;
END
$$;