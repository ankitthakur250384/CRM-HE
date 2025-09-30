-- Fix missing equipment data for existing quotations
-- This script adds equipment records to quotations that don't have any in quotation_machines

DO $$
DECLARE 
    quotation_record RECORD;
    equipment_record RECORD;
    daily_rate NUMERIC;
    total_days INTEGER;
BEGIN
    -- Loop through quotations that don't have equipment in quotation_machines
    FOR quotation_record IN 
        SELECT q.id, q.machine_type, q.number_of_days, q.working_cost, q.total_rent, q.total_cost
        FROM quotations q
        LEFT JOIN quotation_machines qm ON q.id = qm.quotation_id
        WHERE qm.quotation_id IS NULL
          AND q.machine_type IS NOT NULL
    LOOP
        RAISE NOTICE 'Processing quotation: % (machine_type: %)', quotation_record.id, quotation_record.machine_type;
        
        -- Find a suitable equipment of the same type
        SELECT id, name, equipment_id INTO equipment_record
        FROM equipment 
        WHERE category = quotation_record.machine_type
        LIMIT 1;
        
        IF equipment_record.id IS NOT NULL THEN
            -- Calculate daily rate from quotation data
            total_days := COALESCE(quotation_record.number_of_days, 1);
            daily_rate := COALESCE(
                quotation_record.working_cost / total_days,
                quotation_record.total_rent / total_days,
                quotation_record.total_cost / total_days,
                10000
            );
            
            -- Insert equipment record for this quotation
            INSERT INTO quotation_machines (
                quotation_id, 
                equipment_id, 
                quantity, 
                base_rate, 
                running_cost_per_km
            ) VALUES (
                quotation_record.id,
                equipment_record.id,
                1, -- Default quantity
                daily_rate,
                100 -- Default running cost per km
            );
            
            RAISE NOTICE 'Added equipment % (%) to quotation % with rate ₹%/day', 
                equipment_record.name, 
                equipment_record.equipment_id, 
                quotation_record.id, 
                daily_rate;
        ELSE
            RAISE NOTICE 'No equipment found for machine_type: %', quotation_record.machine_type;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Equipment data fix completed!';
END $$;