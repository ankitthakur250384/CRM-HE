# Database Migration: Add Missing Columns to Quotations Table

## Overview
This migration adds the missing columns (`incident1`, `incident2`, `incident3`, `rigger_amount`, `helper_amount`, `primary_equipment_id`, `equipment_snapshot`) to the quotations table that are expected by the application code.

## Steps to Execute

### 1. Run the Database Migration
Execute the SQL script to add the missing columns:

```bash
# Connect to your PostgreSQL database and run:
psql -h your_host -U your_user -d your_database -f add_missing_columns.sql
```

Or copy and paste the following SQL commands directly:

```sql
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_primary_equipment ON quotations(primary_equipment_id);
```

### 2. Verify the Migration
Check that the columns were added successfully:

```sql
\d quotations;
```

You should see the new columns in the table structure:
- `incident1` (TEXT)
- `incident2` (TEXT) 
- `incident3` (TEXT)
- `rigger_amount` (NUMERIC(12,2))
- `helper_amount` (NUMERIC(12,2))
- `primary_equipment_id` (VARCHAR(50))
- `equipment_snapshot` (JSONB)

### 3. Application Code Changes
The application code has been updated to work with these new columns:

#### Changes Made:
1. **INSERT Query**: Restored to include all new columns in quotation creation
2. **UPDATE Query**: Restored to include all new columns in quotation updates
3. **Response Mapping**: Restored to return actual column values instead of null
4. **Request Handling**: Restored destructuring to accept new fields from frontend

#### Files Modified:
- `quotationRoutes.mjs` - Restored INSERT/UPDATE queries and response mapping

### 4. Test the Migration
After running the migration:

1. **Test Quotation Creation**: Try creating a new quotation via the API
2. **Test Quotation Update**: Try updating an existing quotation
3. **Verify Data**: Check that the new fields are properly stored and retrieved

### 5. Frontend Integration
The frontend can now send these additional fields:
- `primaryEquipmentId` - ID of the primary equipment
- `equipmentSnapshot` - JSON snapshot of equipment details
- `incident1`, `incident2`, `incident3` - Text fields for incident descriptions
- `riggerAmount`, `helperAmount` - Numeric values for rigger and helper costs

## Expected Results

After successful migration:
- ✅ Quotation creation will work without database errors
- ✅ New fields will be properly stored in the database
- ✅ API responses will include actual values for new fields
- ✅ Frontend can send and receive the additional quotation data

## Rollback (if needed)
If you need to rollback the migration:

```sql
-- Remove the new columns (WARNING: This will delete data!)
ALTER TABLE quotations DROP COLUMN IF EXISTS incident1;
ALTER TABLE quotations DROP COLUMN IF EXISTS incident2;
ALTER TABLE quotations DROP COLUMN IF EXISTS incident3;
ALTER TABLE quotations DROP COLUMN IF EXISTS rigger_amount;
ALTER TABLE quotations DROP COLUMN IF EXISTS helper_amount;
ALTER TABLE quotations DROP COLUMN IF EXISTS primary_equipment_id;
ALTER TABLE quotations DROP COLUMN IF EXISTS equipment_snapshot;

-- Remove the constraints
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_rigger_amount_positive;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_helper_amount_positive;

-- Remove the index
DROP INDEX IF EXISTS idx_quotations_primary_equipment;
```

## Production Deployment
For production deployment:
1. Schedule maintenance window
2. Backup the database before migration
3. Run the migration script
4. Deploy the updated application code
5. Test thoroughly
6. Monitor for any issues