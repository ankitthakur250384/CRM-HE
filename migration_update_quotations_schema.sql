-- Migration script to update quotations table schema
-- Date: 2025-09-27
-- Description: Add new columns and constraints to match the updated quotations table schema

-- Start transaction
BEGIN;

-- Add new columns to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS primary_equipment_id VARCHAR(50) REFERENCES equipment(id) ON DELETE SET NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS equipment_snapshot JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident1 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident2 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident3 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS rigger_amount NUMERIC(12, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS helper_amount NUMERIC(12, 2);

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

-- Verify all existing constraints are in place
-- (These should already exist from the original schema, but ensuring they're present)

-- Ensure order_type constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'order_type'
        AND cc.constraint_name LIKE '%order_type%'
    ) THEN
        -- Get the actual constraint name
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'order_type'
            AND cc.constraint_name LIKE '%order_type%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_order_type_check 
    CHECK (order_type IN ('micro', 'small', 'monthly', 'yearly'));
END $$;

-- Ensure usage constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing usage constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'usage'
        AND cc.constraint_name LIKE '%usage%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'usage'
            AND cc.constraint_name LIKE '%usage%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_usage_check 
    CHECK (usage IN ('normal', 'heavy'));
END $$;

-- Ensure risk_factor constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing risk_factor constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'risk_factor'
        AND cc.constraint_name LIKE '%risk_factor%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'risk_factor'
            AND cc.constraint_name LIKE '%risk_factor%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_risk_factor_check 
    CHECK (risk_factor IN ('low', 'medium', 'high'));
END $$;

-- Ensure shift constraint includes all required values and has default
DO $$ 
BEGIN
    -- Drop existing shift constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'shift'
        AND cc.constraint_name LIKE '%shift%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'shift'
            AND cc.constraint_name LIKE '%shift%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_shift_check 
    CHECK (shift IN ('single', 'double'));
END $$;

-- Ensure day_night constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing day_night constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'day_night'
        AND cc.constraint_name LIKE '%day_night%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'day_night'
            AND cc.constraint_name LIKE '%day_night%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_day_night_check 
    CHECK (day_night IN ('day', 'night'));
END $$;

-- Ensure billing constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing billing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'billing'
        AND cc.constraint_name LIKE '%billing%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'billing'
            AND cc.constraint_name LIKE '%billing%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_billing_check 
    CHECK (billing IN ('gst', 'non_gst'));
END $$;

-- Ensure sunday_working constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing sunday_working constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'sunday_working'
        AND cc.constraint_name LIKE '%sunday_working%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'sunday_working'
            AND cc.constraint_name LIKE '%sunday_working%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_sunday_working_check 
    CHECK (sunday_working IN ('yes', 'no'));
END $$;

-- Ensure status constraint includes all required values
DO $$ 
BEGIN
    -- Drop existing status constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'status'
        AND cc.constraint_name LIKE '%status%'
    ) THEN
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT cc.constraint_name INTO constraint_name_var
            FROM information_schema.check_constraints cc
            JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
            WHERE ccu.table_name = 'quotations' AND ccu.column_name = 'status'
            AND cc.constraint_name LIKE '%status%'
            LIMIT 1;
            
            IF constraint_name_var IS NOT NULL THEN
                EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || constraint_name_var;
            END IF;
        END;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected'));
END $$;

-- Add validation constraints for new numeric fields
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_rigger_amount_check 
CHECK (rigger_amount IS NULL OR rigger_amount >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_helper_amount_check 
CHECK (helper_amount IS NULL OR helper_amount >= 0);

-- Add validation for all numeric fields to ensure they are non-negative
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_number_of_days_check 
CHECK (number_of_days > 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_working_hours_check 
CHECK (working_hours > 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_food_resources_check 
CHECK (food_resources >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_accom_resources_check 
CHECK (accom_resources >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_site_distance_check 
CHECK (site_distance >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_mob_demob_check 
CHECK (mob_demob >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_mob_relaxation_check 
CHECK (mob_relaxation >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_extra_charge_check 
CHECK (extra_charge >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_other_factors_charge_check 
CHECK (other_factors_charge >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_total_rent_check 
CHECK (total_rent >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_total_cost_check 
CHECK (total_cost >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_working_cost_check 
CHECK (working_cost IS NULL OR working_cost >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_mob_demob_cost_check 
CHECK (mob_demob_cost IS NULL OR mob_demob_cost >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_food_accom_cost_check 
CHECK (food_accom_cost IS NULL OR food_accom_cost >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_usage_load_factor_check 
CHECK (usage_load_factor IS NULL OR usage_load_factor >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_risk_adjustment_check 
CHECK (risk_adjustment IS NULL OR risk_adjustment >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_gst_amount_check 
CHECK (gst_amount IS NULL OR gst_amount >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_version_check 
CHECK (version > 0);

-- Ensure include_gst has proper default
ALTER TABLE quotations ALTER COLUMN include_gst SET DEFAULT TRUE;

-- Update any NULL values in include_gst to TRUE
UPDATE quotations SET include_gst = TRUE WHERE include_gst IS NULL;

-- Make include_gst NOT NULL
ALTER TABLE quotations ALTER COLUMN include_gst SET NOT NULL;

-- Ensure version has proper default
ALTER TABLE quotations ALTER COLUMN version SET DEFAULT 1;

-- Update any NULL values in version to 1
UPDATE quotations SET version = 1 WHERE version IS NULL;

-- Make version NOT NULL
ALTER TABLE quotations ALTER COLUMN version SET NOT NULL;

-- Ensure total_cost has proper default
ALTER TABLE quotations ALTER COLUMN total_cost SET DEFAULT 0;

-- Update any NULL values in total_cost to 0
UPDATE quotations SET total_cost = 0 WHERE total_cost IS NULL;

-- Make total_cost NOT NULL
ALTER TABLE quotations ALTER COLUMN total_cost SET NOT NULL;

-- Ensure status has proper default
ALTER TABLE quotations ALTER COLUMN status SET DEFAULT 'draft';

-- Update any NULL values in status to 'draft'
UPDATE quotations SET status = 'draft' WHERE status IS NULL;

-- Make status NOT NULL
ALTER TABLE quotations ALTER COLUMN status SET NOT NULL;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Added new columns and constraints to quotations table.';
END
$$;

-- Commit transaction
COMMIT;

-- Verify the changes
DO $$
DECLARE
    column_count INTEGER;
    constraint_count INTEGER;
BEGIN
    -- Check if new columns were added
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'quotations' 
    AND column_name IN ('primary_equipment_id', 'equipment_snapshot', 'incident1', 'incident2', 'incident3', 'rigger_amount', 'helper_amount');
    
    -- Check if constraints were added
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'quotations'
    AND cc.constraint_name LIKE 'quotations_%_check';
    
    RAISE NOTICE 'Verification: Found % new columns and % check constraints', column_count, constraint_count;
    
    -- List all columns in quotations table for verification
    RAISE NOTICE 'All columns in quotations table:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'quotations'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % (nullable: %, default: %)', rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
END
$$;