-- Multi-clinic memberships table
-- Supports multiple clinic accesses per professional/secretary while keeping users.clinic_id as active clinic context.

CREATE TABLE IF NOT EXISTS clinic_memberships (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_memberships_clinic_user_unique
  ON clinic_memberships (clinic_id, user_id);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_user_id
  ON clinic_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_clinic_memberships_clinic_id
  ON clinic_memberships (clinic_id);

-- Backfill from legacy users.clinic_id / users.clinic_role
INSERT INTO clinic_memberships (clinic_id, user_id, role, created_at)
SELECT
  u.clinic_id,
  u.id,
  COALESCE(NULLIF(u.clinic_role, ''), 'member'),
  COALESCE(u.created_at, NOW())
FROM users u
WHERE u.clinic_id IS NOT NULL
ON CONFLICT (clinic_id, user_id) DO UPDATE
SET role = EXCLUDED.role;

-- Ensure clinic administrators always have admin membership
INSERT INTO clinic_memberships (clinic_id, user_id, role, created_at)
SELECT
  c.id,
  c.admin_user_id,
  'admin',
  COALESCE(c.created_at, NOW())
FROM clinics c
ON CONFLICT (clinic_id, user_id) DO UPDATE
SET role = 'admin';

-- Rehydrate active clinic context for users missing users.clinic_id or users.clinic_role
WITH first_membership AS (
  SELECT DISTINCT ON (m.user_id)
    m.user_id,
    m.clinic_id,
    m.role
  FROM clinic_memberships m
  ORDER BY m.user_id, m.created_at DESC, m.id DESC
)
UPDATE users u
SET
  clinic_id = COALESCE(u.clinic_id, fm.clinic_id),
  clinic_role = COALESCE(NULLIF(u.clinic_role, ''), fm.role)
FROM first_membership fm
WHERE u.id = fm.user_id
  AND (u.clinic_id IS NULL OR u.clinic_role IS NULL OR u.clinic_role = '');
