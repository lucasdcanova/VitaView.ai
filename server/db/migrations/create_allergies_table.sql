-- Migration to create allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  allergen_type TEXT NOT NULL DEFAULT 'medication',
  reaction TEXT,
  severity TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_allergies_user_id ON allergies(user_id);

-- Insert example data (optional - remove if not needed)
-- INSERT INTO allergies (user_id, allergen, allergen_type, reaction, severity, notes) 
-- VALUES (1, 'Penicilina', 'medication', 'Erupção cutânea', 'moderada', 'Alergia descoberta em 2020');