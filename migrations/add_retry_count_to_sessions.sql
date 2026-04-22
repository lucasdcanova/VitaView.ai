ALTER TABLE consultation_recording_sessions
ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
