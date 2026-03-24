ALTER TABLE medications
ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id);

ALTER TABLE medications
ADD COLUMN IF NOT EXISTS end_date TEXT;

CREATE INDEX IF NOT EXISTS idx_medications_profile_id ON medications(profile_id);

CREATE TABLE IF NOT EXISTS medication_history (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  name TEXT NOT NULL,
  format TEXT,
  dosage TEXT,
  dosage_unit TEXT DEFAULT 'mg',
  frequency TEXT,
  notes TEXT,
  start_date TEXT,
  end_date TEXT,
  occurred_at TIMESTAMP DEFAULT NOW() NOT NULL,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_medication_history_profile_id
ON medication_history(profile_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_medication_history_medication_id
ON medication_history(medication_id);
