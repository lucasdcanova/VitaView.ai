CREATE TABLE IF NOT EXISTS consultation_recording_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id INTEGER REFERENCES clinics(id) ON DELETE SET NULL,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
  patient_name TEXT,
  status TEXT NOT NULL DEFAULT 'recording',
  transcription TEXT,
  anamnesis TEXT,
  extracted_data JSONB,
  last_error TEXT,
  retention_expires_at TIMESTAMP NOT NULL,
  finalized_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultation_recording_segments (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES consultation_recording_sessions(session_id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'stored',
  last_error TEXT,
  retention_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS consultation_recording_segments_session_segment_idx
  ON consultation_recording_segments(session_id, segment_index);

CREATE INDEX IF NOT EXISTS consultation_recording_sessions_retention_idx
  ON consultation_recording_sessions(retention_expires_at);

CREATE INDEX IF NOT EXISTS consultation_recording_segments_retention_idx
  ON consultation_recording_segments(retention_expires_at);
