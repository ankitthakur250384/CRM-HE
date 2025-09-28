-- Add missing columns to quotations table
-- This will add the columns that were expected by the application code

-- Add incident columns
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident1 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident2 TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incident3 TEXT;

-- Add rigger and helper amount columns
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS rigger_amount NUMERIC(12,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS helper_amount NUMERIC(12,2);

-- Add primary equipment id and equipment snapshot columns
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS primary_equipment_id VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS equipment_snapshot JSONB;

-- Add constraints for positive amounts
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_rigger_amount_positive 
CHECK (rigger_amount IS NULL OR rigger_amount >= 0);

ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_helper_amount_positive 
CHECK (helper_amount IS NULL OR helper_amount >= 0);

-- Add foreign key constraint for primary_equipment_id (if equipment table exists)
-- Uncomment the following line if you have an equipment table
-- ALTER TABLE quotations 
-- ADD CONSTRAINT IF NOT EXISTS fk_quotations_primary_equipment 
-- FOREIGN KEY (primary_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_primary_equipment ON quotations(primary_equipment_id);

-- Show the updated table structure
\d quotations;