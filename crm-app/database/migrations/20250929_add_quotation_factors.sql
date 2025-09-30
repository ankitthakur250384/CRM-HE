-- Migration: Add shift_factor, day_night_factor, incidental_total, and riskandusagecost to quotations
-- Ensures the application can INSERT/UPDATE quotations that reference these columns
BEGIN;

ALTER TABLE IF EXISTS quotations
    ADD COLUMN IF NOT EXISTS shift_factor NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (shift_factor >= 0);

ALTER TABLE IF EXISTS quotations
    ADD COLUMN IF NOT EXISTS day_night_factor NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (day_night_factor >= 0);

ALTER TABLE IF EXISTS quotations
    ADD COLUMN IF NOT EXISTS incidental_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (incidental_total >= 0);

ALTER TABLE IF EXISTS quotations
    ADD COLUMN IF NOT EXISTS riskandusagecost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (riskandusagecost >= 0);

CREATE INDEX IF NOT EXISTS idx_quotations_shift_factor ON quotations(shift_factor);
CREATE INDEX IF NOT EXISTS idx_quotations_day_night_factor ON quotations(day_night_factor);
CREATE INDEX IF NOT EXISTS idx_quotations_incidental_total ON quotations(incidental_total);
CREATE INDEX IF NOT EXISTS idx_quotations_riskandusagecost ON quotations(riskandusagecost);

COMMIT;
