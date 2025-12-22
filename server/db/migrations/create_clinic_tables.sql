-- Migration to add clinics and clinic_invitations tables for multi-professional clinic support
-- Also adds clinicId and clinicRole to users table

-- Add clinic columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_role TEXT;

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  admin_user_id INTEGER NOT NULL REFERENCES users(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  max_professionals INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create clinic_invitations table
CREATE TABLE IF NOT EXISTS clinic_invitations (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics(id),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_token ON clinic_invitations(token);
CREATE INDEX IF NOT EXISTS idx_clinic_invitations_clinic_id ON clinic_invitations(clinic_id);
