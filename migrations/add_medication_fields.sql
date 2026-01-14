ALTER TABLE medications ADD COLUMN IF NOT EXISTS quantity TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS administration_route TEXT DEFAULT 'oral';
