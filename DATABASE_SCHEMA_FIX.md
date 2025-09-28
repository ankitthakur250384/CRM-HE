# Database Schema Mismatch Fix Summary

## Problem Identified
The quotation creation API was failing with error:
```
Error creating quotation: error: column "primary_equipment_id" of relation "quotations" does not exist
```

## Root Cause
The code was trying to insert data into columns that don't exist in the current database schema:
- `primary_equipment_id`
- `equipment_snapshot` 
- `incident1`, `incident2`, `incident3`
- `rigger_amount`, `helper_amount`

These columns were intended to be added via migration files, but the migration was never run on the production database.

## Fixes Applied

### 1. Fixed INSERT Query in quotationRoutes.mjs
**Before:**
```sql
INSERT INTO quotations (
  id, customer_id, customer_name, ..., 
  primary_equipment_id, equipment_snapshot,
  incident1, incident2, incident3, rigger_amount, helper_amount
) VALUES (
  $1, $2, $3, ..., $34, $35, $36, $37, $38, $39, $40, $41, $42
)
```

**After:**
```sql 
INSERT INTO quotations (
  id, customer_id, customer_name, ...,
  deal_id, lead_id
) VALUES (
  $1, $2, $3, ..., $33, $34
)
```

### 2. Fixed UPDATE Query in quotationRoutes.mjs
**Before:**
```sql
UPDATE quotations SET 
  ...,
  primary_equipment_id = $33,
  equipment_snapshot = $34,
  incident1 = $35,
  incident2 = $36, 
  incident3 = $37,
  rigger_amount = $38,
  helper_amount = $39
WHERE id = $40
```

**After:**
```sql
UPDATE quotations SET
  ...,
  sunday_working = $32
WHERE id = $33
```

### 3. Fixed Response Mapping
Changed references to non-existent columns to return null values or defaults:
```javascript
// Before: quotation.primary_equipment_id (undefined)
// After: null

primaryEquipmentId: null,
equipmentSnapshot: null,
incident1: null,
incident2: null,
incident3: null,
riggerAmount: 0,
helperAmount: 0,
```

### 4. Removed Non-existent Fields from Destructuring
Removed variables that don't correspond to database columns from the request body destructuring in the UPDATE route.

## Current Database Schema
Based on the provided table structure, the quotations table has these columns:
- Standard quotation fields (id, customer_id, machine_type, etc.)
- Does NOT have: primary_equipment_id, equipment_snapshot, incident1-3, rigger_amount, helper_amount

## Expected Result
After these fixes:
- ✅ Quotation creation should work without database errors
- ✅ Quotation updates should work without column errors  
- ✅ API responses will include the expected fields (with null/default values)
- ✅ Frontend functionality should continue working normally

## Migration Options (Future)
If you want to add the missing columns later:
1. Run the migration script: `migration_quotations_schema_simple.sql`
2. Update the code to use the new columns
3. Test thoroughly before deployment

## Testing Command
To test the fix, try creating a new quotation via the API.