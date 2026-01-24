-- Migration: Add custom_medications table for user-defined medications
-- This table stores medications that users enter manually so they appear in future searches

CREATE TABLE IF NOT EXISTS custom_medications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  format TEXT,
  dosage TEXT,
  category TEXT,
  prescription_type TEXT DEFAULT 'padrao',
  route TEXT DEFAULT 'oral',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_custom_medications_user_id ON custom_medications(user_id);

-- Create index for name search
CREATE INDEX IF NOT EXISTS idx_custom_medications_name ON custom_medications(name);
