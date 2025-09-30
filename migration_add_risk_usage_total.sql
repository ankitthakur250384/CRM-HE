-- Migration: Add risk_usage_total column to quotations table
-- This column will store the combined Risk & Usage value calculated as 
-- X% of Monthly Base Rate of Equipment(s) in the quotation

ALTER TABLE quotations 
ADD COLUMN risk_usage_total DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to document the column purpose
COMMENT ON COLUMN quotations.risk_usage_total IS 'Combined Risk & Usage total calculated as X% of Monthly Base Rate of Equipment(s)';

-- Update existing records to calculate risk_usage_total from existing risk_adjustment and usage_load_factor
UPDATE quotations 
SET risk_usage_total = COALESCE(risk_adjustment, 0) + COALESCE(usage_load_factor, 0)
WHERE risk_usage_total IS NULL OR risk_usage_total = 0;

-- Verify the migration
SELECT COUNT(*) as total_records, 
       COUNT(CASE WHEN risk_usage_total > 0 THEN 1 END) as records_with_risk_usage_total
FROM quotations;