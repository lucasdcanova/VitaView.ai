-- Create triage records table
CREATE TABLE IF NOT EXISTS triage_records (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  profile_id INTEGER REFERENCES profiles(id),
  performed_by_user_id INTEGER NOT NULL REFERENCES users(id),
  performed_by_name TEXT NOT NULL,
  
  -- Anamnese curta
  chief_complaint TEXT NOT NULL,
  current_illness_history TEXT,
  pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
  
  -- Sinais vitais
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  temperature DECIMAL(4,2),
  oxygen_saturation INTEGER CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
  blood_glucose INTEGER,
  weight DECIMAL(5,2),
  height INTEGER,
  
  -- Classificação de Manchester
  manchester_priority TEXT NOT NULL CHECK (manchester_priority IN ('emergent', 'very_urgent', 'urgent', 'standard', 'non_urgent')),
  manchester_discriminator TEXT,
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_triage_appointment ON triage_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_triage_profile ON triage_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_triage_performed_by ON triage_records(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_triage_priority ON triage_records(manchester_priority);
CREATE INDEX IF NOT EXISTS idx_triage_created_at ON triage_records(created_at);
