-- Migration: Add dosage_unit column to medications table
-- Date: 2025-12-04
-- Description: Adds a dosage_unit column to store the unit of measurement separately from the dosage value

ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT 'mg';

-- Add comment to the column
COMMENT ON COLUMN medications.dosage_unit IS 'Unit of measurement for dosage (mg, g, ml, mcg, UI, %, gotas, comprimido(s), cápsula(s))';
