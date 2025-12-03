-- Add prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  doctor_crm TEXT NOT NULL,
  doctor_specialty TEXT,
  medications JSONB NOT NULL,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  observations TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_issue_date ON prescriptions(issue_date DESC);
