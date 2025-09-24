-- Migration: Add rigger_amount and helper_amount columns to quotations
-- Safe to run repeatedly: checks for existence before adding

ALTER TABLE IF EXISTS quotations
  ADD COLUMN IF NOT EXISTS rigger_amount NUMERIC(12,2) DEFAULT NULL;

ALTER TABLE IF EXISTS quotations
  ADD COLUMN IF NOT EXISTS helper_amount NUMERIC(12,2) DEFAULT NULL;

-- Optional: backfill from existing other_factors array if you want to populate the new columns
-- Uncomment and run once if needed
-- UPDATE quotations
-- SET rigger_amount = CASE WHEN other_factors @> ARRAY['rigger']::text[] THEN (SELECT (value->>'riggerAmount')::numeric FROM config WHERE name='additionalParams' LIMIT 1) ELSE NULL END,
--     helper_amount = CASE WHEN other_factors @> ARRAY['helper']::text[] THEN (SELECT (value->>'helperAmount')::numeric FROM config WHERE name='additionalParams' LIMIT 1) ELSE NULL END
-- WHERE other_factors IS NOT NULL;
