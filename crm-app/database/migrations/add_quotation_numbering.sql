-- Migration: Add quotation numbering system
-- Purpose: Replace UUID-based quotation IDs with meaningful sequential numbers like ASP-Q-001

-- Add quotation_number field to quotations table
ALTER TABLE quotations 
ADD COLUMN quotation_number VARCHAR(20) UNIQUE;

-- Create a sequence for quotation numbering
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;

-- Create function to generate quotation numbers
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_num INTEGER;
    formatted_number VARCHAR(20);
BEGIN
    -- Get next sequence value
    next_num := nextval('quotation_number_seq');
    
    -- Format as ASP-Q-XXX (3 digits with leading zeros)
    formatted_number := 'ASP-Q-' || LPAD(next_num::TEXT, 3, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate quotation numbers for new records
CREATE OR REPLACE FUNCTION set_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate number if not provided
    IF NEW.quotation_number IS NULL THEN
        NEW.quotation_number := generate_quotation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new quotations
DROP TRIGGER IF EXISTS quotation_number_trigger ON quotations;
CREATE TRIGGER quotation_number_trigger
    BEFORE INSERT ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION set_quotation_number();

-- Update existing quotations with sequential numbers
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    -- Update existing quotations with sequential numbers based on creation date
    FOR rec IN 
        SELECT id FROM quotations 
        WHERE quotation_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        UPDATE quotations 
        SET quotation_number = 'ASP-Q-' || LPAD(counter::TEXT, 3, '0')
        WHERE id = rec.id;
        
        counter := counter + 1;
    END LOOP;
    
    -- Reset sequence to continue from where we left off
    PERFORM setval('quotation_number_seq', counter);
END $$;

-- Add index for quotation_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);

-- Create a view for quotation management that uses quotation_number as the primary identifier
CREATE OR REPLACE VIEW quotation_list AS
SELECT 
    q.id,
    q.quotation_number,
    q.customer_name,
    q.customer_contact->>'email' as customer_email,
    q.customer_contact->>'phone' as customer_phone,
    q.customer_contact->>'address' as customer_address,
    q.machine_type,
    q.order_type,
    q.number_of_days,
    q.working_hours,
    q.total_cost,
    q.status,
    q.created_at,
    q.updated_at,
    q.site_distance,
    q.usage,
    q.shift,
    q.food_resources,
    q.accom_resources,
    q.risk_factor,
    q.mob_demob_cost,
    q.working_cost,
    q.food_accom_cost,
    q.gst_amount,
    q.total_rent
FROM quotations q
ORDER BY q.created_at DESC;

-- Add comments for documentation
COMMENT ON COLUMN quotations.quotation_number IS 'Human-readable quotation number in format ASP-Q-XXX';
COMMENT ON FUNCTION generate_quotation_number() IS 'Generates sequential quotation numbers in format ASP-Q-XXX';
COMMENT ON VIEW quotation_list IS 'Simplified view for quotation management with human-readable identifiers';