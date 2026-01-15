-- Migration: Add prescription_type column to medications table
-- This column supports the new multi-type prescription system

ALTER TABLE medications ADD COLUMN IF NOT EXISTS prescription_type TEXT DEFAULT 'padrao';

-- Update comment for documentation
COMMENT ON COLUMN medications.prescription_type IS 'Type of prescription: padrao, especial, A, B1, B2, C';
