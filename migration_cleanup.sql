-- Migration cleanup: Fix remaining issues from the main migration
-- This addresses the syntax errors and missing constraints

-- Step 1: Add the foreign key constraint (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_quotations_primary_equipment' 
        AND table_schema = 'public'
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE quotations 
        ADD CONSTRAINT fk_quotations_primary_equipment 
        FOREIGN KEY (primary_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 2: Add the missing validation constraints (without IF NOT EXISTS)
DO $$ 
BEGIN
    -- Rigger amount constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_rigger_amount_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_rigger_amount_positive 
        CHECK (rigger_amount IS NULL OR rigger_amount >= 0);
    END IF;

    -- Helper amount constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_helper_amount_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_helper_amount_positive 
        CHECK (helper_amount IS NULL OR helper_amount >= 0);
    END IF;

    -- Number of days constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_number_of_days_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_number_of_days_positive 
        CHECK (number_of_days > 0);
    END IF;

    -- Working hours constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_working_hours_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_working_hours_positive 
        CHECK (working_hours > 0);
    END IF;

    -- Site distance constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_site_distance_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_site_distance_positive 
        CHECK (site_distance >= 0);
    END IF;

    -- Total rent constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_total_rent_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_total_rent_positive 
        CHECK (total_rent >= 0);
    END IF;

    -- Version constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'quotations' 
        AND cc.constraint_name = 'quotations_version_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_version_positive 
        CHECK (version > 0);
    END IF;
END $$;

-- Step 3: Verification - show that migration was successful
SELECT 'Migration completed successfully!' as status;

-- Show the new columns that were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND column_name IN ('primary_equipment_id', 'equipment_snapshot', 'incident1', 'incident2', 'incident3', 'rigger_amount', 'helper_amount')
ORDER BY column_name;

-- Show foreign key constraints
SELECT tc.constraint_name, tc.table_name, kcu.column_name, 
       ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'quotations'
AND tc.constraint_name = 'fk_quotations_primary_equipment';

-- Show check constraints for new fields
SELECT cc.constraint_name, cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'quotations'
AND cc.constraint_name IN (
    'quotations_rigger_amount_positive',
    'quotations_helper_amount_positive',
    'quotations_number_of_days_positive',
    'quotations_working_hours_positive',
    'quotations_site_distance_positive',
    'quotations_total_rent_positive',
    'quotations_version_positive'
)
ORDER BY cc.constraint_name;