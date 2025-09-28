-- Fix the constraint errors from the migration
-- Add the missing constraints using a different approach

DO $$ 
BEGIN
    -- Add rigger_amount constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'quotations_rigger_amount_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_rigger_amount_positive 
        CHECK (rigger_amount IS NULL OR rigger_amount >= 0);
    END IF;
    
    -- Add helper_amount constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'quotations_helper_amount_positive'
    ) THEN
        ALTER TABLE quotations ADD CONSTRAINT quotations_helper_amount_positive 
        CHECK (helper_amount IS NULL OR helper_amount >= 0);
    END IF;
END $$;