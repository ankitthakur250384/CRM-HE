-- Migration: Add quotation_number column to quotations table
-- This adds a human-readable sequential quotation number (ASP-Q-001 format)

-- Step 1: Add the quotation_number column
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quotation_number VARCHAR(50);

-- Step 2: Create a sequence for auto-incrementing quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START WITH 1;

-- Step 3: Create a function to generate quotation numbers
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
    seq_val INTEGER;
BEGIN
    seq_val := nextval('quotation_number_seq');
    RETURN 'ASP-Q-' || LPAD(seq_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update existing quotations with generated quotation numbers
-- First, reset the sequence to start after existing quotations
SELECT setval('quotation_number_seq', COALESCE((SELECT COUNT(*) FROM quotations), 0));

-- Update existing records with generated quotation numbers
UPDATE quotations 
SET quotation_number = generate_quotation_number()
WHERE quotation_number IS NULL;

-- Step 5: Create a trigger to auto-generate quotation numbers for new records
CREATE OR REPLACE FUNCTION auto_generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quotation_number IS NULL THEN
        NEW.quotation_number := generate_quotation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_generate_quotation_number ON quotations;
CREATE TRIGGER trigger_generate_quotation_number
    BEFORE INSERT ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_quotation_number();

-- Step 6: Add a unique constraint on quotation_number
ALTER TABLE quotations ADD CONSTRAINT unique_quotation_number UNIQUE (quotation_number);

-- Step 7: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);

-- Verification queries (uncomment to run manually):
-- SELECT id, quotation_number, customer_name, created_at FROM quotations ORDER BY created_at;
-- SELECT 'ASP-Q-' || LPAD(nextval('quotation_number_seq')::TEXT, 3, '0') AS next_quotation_number;