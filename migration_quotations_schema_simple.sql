-- Migration: Update quotations table schema
-- This adds new columns and constraints to match updated requirements

-- Step 1: Add new columns to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS primary_equipment_id VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS equipment_snapshot JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident1 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident2 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident3 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS rigger_amount NUMERIC(12, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS helper_amount NUMERIC(12, 2);

-- Step 2: Add foreign key constraint for primary_equipment_id
ALTER TABLE quotations 
ADD CONSTRAINT IF NOT EXISTS fk_quotations_primary_equipment 
FOREIGN KEY (primary_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

-- Step 3: Set default values and update existing data
ALTER TABLE quotations ALTER COLUMN shift SET DEFAULT 'single';
UPDATE quotations SET shift = 'single' WHERE shift IS NULL;

ALTER TABLE quotations ALTER COLUMN include_gst SET DEFAULT TRUE;
UPDATE quotations SET include_gst = TRUE WHERE include_gst IS NULL;

ALTER TABLE quotations ALTER COLUMN version SET DEFAULT 1;
UPDATE quotations SET version = 1 WHERE version IS NULL;

ALTER TABLE quotations ALTER COLUMN total_cost SET DEFAULT 0;
UPDATE quotations SET total_cost = 0 WHERE total_cost IS NULL;

ALTER TABLE quotations ALTER COLUMN status SET DEFAULT 'draft';
UPDATE quotations SET status = 'draft' WHERE status IS NULL;

-- Step 4: Add NOT NULL constraints where needed
ALTER TABLE quotations ALTER COLUMN shift SET NOT NULL;
ALTER TABLE quotations ALTER COLUMN include_gst SET NOT NULL;
ALTER TABLE quotations ALTER COLUMN version SET NOT NULL;
ALTER TABLE quotations ALTER COLUMN total_cost SET NOT NULL;
ALTER TABLE quotations ALTER COLUMN status SET NOT NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotations_primary_equipment ON quotations(primary_equipment_id);

-- Step 6: Add check constraints (dropping existing ones first if they exist)
-- Note: We'll handle constraint conflicts manually by dropping if exists

-- Order type constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%order_type%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_order_type_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_order_type_check 
CHECK (order_type IN ('micro', 'small', 'monthly', 'yearly'));

-- Usage constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%usage%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_usage_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_usage_check 
CHECK (usage IN ('normal', 'heavy'));

-- Risk factor constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%risk_factor%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_risk_factor_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_risk_factor_check 
CHECK (risk_factor IN ('low', 'medium', 'high'));

-- Shift constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%shift%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_shift_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_shift_check 
CHECK (shift IN ('single', 'double'));

-- Day/Night constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%day_night%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_day_night_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_day_night_check 
CHECK (day_night IN ('day', 'night'));

-- Billing constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%billing%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_billing_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_billing_check 
CHECK (billing IN ('gst', 'non_gst'));

-- Sunday working constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%sunday_working%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_sunday_working_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_sunday_working_check 
CHECK (sunday_working IN ('yes', 'no'));

-- Status constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%status%' 
               AND table_name = 'quotations') THEN
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
    END IF;
END $$;
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected'));

-- Step 7: Add numeric validation constraints for new fields
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_rigger_amount_positive 
CHECK (rigger_amount IS NULL OR rigger_amount >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_helper_amount_positive 
CHECK (helper_amount IS NULL OR helper_amount >= 0);

-- Step 8: Add validation for existing numeric fields
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_number_of_days_positive 
CHECK (number_of_days > 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_working_hours_positive 
CHECK (working_hours > 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_site_distance_positive 
CHECK (site_distance >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_total_rent_positive 
CHECK (total_rent >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_version_positive 
CHECK (version > 0);

-- Verification: Show updated table structure
\d quotations;

-- Show column count verification
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'quotations';

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND column_name IN ('primary_equipment_id', 'equipment_snapshot', 'incident1', 'incident2', 'incident3', 'rigger_amount', 'helper_amount')
ORDER BY column_name;