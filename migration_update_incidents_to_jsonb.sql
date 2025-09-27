-- Alternative migration: Update incident fields to use structured JSONB
-- This provides better data structure for incidents with descriptions and amounts

BEGIN;

-- Option 1: Replace individual incident fields with structured JSONB array
-- DROP the individual incident columns if they exist and replace with structured data
DO $$
BEGIN
    -- Check if incident1 column exists and drop individual incident columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotations' AND column_name = 'incident1') THEN
        -- Migrate any existing data to the new structure first
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incidents_structured JSONB DEFAULT '[]'::jsonb;
        
        -- Migrate existing incident data to structured format
        UPDATE quotations SET incidents_structured = 
            CASE 
                WHEN incident1 IS NOT NULL OR incident2 IS NOT NULL OR incident3 IS NOT NULL THEN
                    jsonb_build_array(
                        CASE WHEN incident1 IS NOT NULL THEN 
                            jsonb_build_object('description', incident1, 'amount', 0, 'type', 'incident') 
                        END,
                        CASE WHEN incident2 IS NOT NULL THEN 
                            jsonb_build_object('description', incident2, 'amount', 0, 'type', 'incident') 
                        END,
                        CASE WHEN incident3 IS NOT NULL THEN 
                            jsonb_build_object('description', incident3, 'amount', 0, 'type', 'incident') 
                        END
                    )
                ELSE '[]'::jsonb
            END
        WHERE incident1 IS NOT NULL OR incident2 IS NOT NULL OR incident3 IS NOT NULL;
        
        -- Drop old columns after migration
        ALTER TABLE quotations DROP COLUMN IF EXISTS incident1;
        ALTER TABLE quotations DROP COLUMN IF EXISTS incident2;
        ALTER TABLE quotations DROP COLUMN IF EXISTS incident3;
        
        -- Rename the new column to replace the old structure
        ALTER TABLE quotations RENAME COLUMN incidents_structured TO incidents;
        
        RAISE NOTICE 'Migrated incidents to structured JSONB format';
    ELSE
        -- If no existing incident columns, just add the new structured column
        ALTER TABLE quotations ADD COLUMN IF NOT EXISTS incidents JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added new structured incidents JSONB column';
    END IF;
END $$;

-- Add constraint to ensure incidents is always an array
ALTER TABLE quotations ADD CONSTRAINT IF NOT EXISTS quotations_incidents_is_array 
CHECK (jsonb_typeof(incidents) = 'array');

-- Create index for efficient JSON queries on incidents
CREATE INDEX IF NOT EXISTS idx_quotations_incidents ON quotations USING gin(incidents);

COMMIT;

-- Example of how the new incidents structure would look:
/*
incidents: [
  {
    "description": "Site access difficulty",
    "amount": 5000.00,
    "type": "incident",
    "category": "site_condition"
  },
  {
    "description": "Additional safety equipment required",
    "amount": 2000.00,
    "type": "safety",
    "category": "equipment"
  }
]
*/

-- Example queries for the new structure:
/*
-- Get all quotations with specific incident types
SELECT id, incidents FROM quotations 
WHERE incidents @> '[{"type": "incident"}]';

-- Get total incident amounts
SELECT id, 
       (SELECT SUM((elem->>'amount')::numeric) 
        FROM jsonb_array_elements(incidents) elem) as total_incident_cost
FROM quotations 
WHERE jsonb_array_length(incidents) > 0;

-- Add new incident to existing quotation
UPDATE quotations 
SET incidents = incidents || '[{"description": "New incident", "amount": 1000, "type": "incident"}]'::jsonb 
WHERE id = 'your-quotation-id';
*/