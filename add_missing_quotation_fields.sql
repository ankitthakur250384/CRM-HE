-- Add missing fields to quotations table
-- Run this script to add fields that are needed for the quotation functionality

-- Add dealType field
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deal_type VARCHAR(50);

-- Add runningCostPerKm field  
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS running_cost_per_km NUMERIC(10, 2) DEFAULT 0 CHECK (running_cost_per_km >= 0);

-- Add selectedEquipment as JSONB field to store equipment data
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS selected_equipment JSONB;

-- Add selectedMachines as JSONB field to store machines data
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS selected_machines JSONB;

-- Update comments for clarity
COMMENT ON COLUMN quotations.deal_type IS 'Type of deal associated with this quotation';
COMMENT ON COLUMN quotations.running_cost_per_km IS 'Running cost per kilometer for transport calculations';
COMMENT ON COLUMN quotations.selected_equipment IS 'JSON data for selected equipment including rates and details';
COMMENT ON COLUMN quotations.selected_machines IS 'JSON array of selected machines with quantities and rates';

-- Create indexes for better performance on JSONB fields
CREATE INDEX IF NOT EXISTS idx_quotations_selected_equipment ON quotations USING gin (selected_equipment);
CREATE INDEX IF NOT EXISTS idx_quotations_selected_machines ON quotations USING gin (selected_machines);
