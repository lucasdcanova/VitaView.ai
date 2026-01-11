CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  doctor_name TEXT NOT NULL,
  doctor_crm TEXT NOT NULL,
  doctor_specialty TEXT,
  medications JSON NOT NULL,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  observations TEXT,
  pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  doctor_name TEXT NOT NULL,
  doctor_crm TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_doc TEXT,
  type TEXT NOT NULL,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  days_off TEXT,
  cid TEXT,
  start_time TEXT,
  end_time TEXT,
  custom_text TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  pdf_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  crm TEXT NOT NULL,
  specialty TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
