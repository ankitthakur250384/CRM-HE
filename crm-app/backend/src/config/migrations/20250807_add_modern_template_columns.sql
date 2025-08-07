-- Migration: Add missing columns for modern templates
ALTER TABLE quotation_templates
  ADD COLUMN IF NOT EXISTS elements JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS thumbnail TEXT;
