-- PrimeOSHub canonical DB schema migration
-- Date: 2026-06-14
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- Usage: psql -U <user> -d <db> -f database/primeos_schema_migration_2026_06_14.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin','user','device')),
  firebase_uid TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
  key UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS api_keys_owner_idx ON api_keys(owner_user_id);

-- DEVICES (Palit Pandora / Jetson nodes, etc.)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  device_type TEXT,
  platform TEXT,
  last_seen TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS devices_user_idx ON devices(user_id);

-- DEVICE SYNC STATE (for offline sync / change tracking)
CREATE TABLE IF NOT EXISTS device_sync_state (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  last_seq BIGINT DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  pending_changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_sync_device_idx ON device_sync_state(device_id);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  clinic_id UUID, -- optional multi-tenant clinic reference
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  dob DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_owner_idx ON patients(owner_user_id);
CREATE INDEX IF NOT EXISTS patients_full_name_idx ON patients(full_name);

-- DENTISTS
CREATE TABLE IF NOT EXISTS dentists (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  license_number TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dentists_user_idx ON dentists(user_id);

-- APPOINTMENTS (typed fields + JSONB payload for extensibility)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','completed','no_show')),
  reason TEXT,
  notes TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_start_idx ON appointments(start_at);
CREATE INDEX IF NOT EXISTS appointments_dentist_idx ON appointments(dentist_id);

-- ATTACHMENTS (files stored in object storage; DB holds refs)
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_table TEXT,
  related_id UUID,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attachments_related_idx ON attachments(related_table, related_id);

-- MODELS (local model metadata for Jetson / inference)
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
  name TEXT NOT NULL,
  version TEXT,
  model_type TEXT, -- e.g. ggml, torch
  quantized BOOLEAN DEFAULT FALSE,
  local_path TEXT, -- path on device
  metadata JSONB,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS models_name_idx ON models(name);

-- CHANGE LOG (for device-driven sync / audit trail)
CREATE TABLE IF NOT EXISTS change_log (
  id BIGSERIAL PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('insert','update','delete')),
  table_name TEXT NOT NULL,
  record_id UUID,
  payload JSONB,
  origin_device_id UUID,
  origin_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS change_log_table_idx ON change_log(table_name);
CREATE INDEX IF NOT EXISTS change_log_origin_device_idx ON change_log(origin_device_id);

-- SIMPLE AUDIT TRIGGER (example: log changes to change_log) -- optional
-- Uncomment and adapt if automatic change capture is desired.
--
-- CREATE OR REPLACE FUNCTION audit_changes_to_change_log() RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO change_log (operation_type, table_name, record_id, payload, origin_device_id, origin_user_id)
--   VALUES (TG_OP::text, TG_TABLE_NAME, NEW.id::uuid, to_jsonb(NEW), NULL, NULL);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- Example: attach to patients and appointments
-- CREATE TRIGGER patients_audit AFTER INSERT OR UPDATE OR DELETE ON patients
--   FOR EACH ROW EXECUTE FUNCTION audit_changes_to_change_log();

-- Apply update_updated_at trigger to tables that have updated_at
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name='updated_at' AND table_schema='public' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at_trg ON %I;', t.table_name, t.table_name);
    EXECUTE format('CREATE TRIGGER %I_updated_at_trg BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t.table_name, t.table_name);
  END LOOP;
END $$;

-- SAMPLE RLS POLICIES (Supabase-style). Adapt to your auth system or remove for non-RLS setups.
-- Enable RLS where sensitive data must be restricted.
-- Note: auth.uid() is Supabase-specific; change to your auth claims or current_setting(...) if using other systems.

-- Enable RLS on patients and appointments
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policy: users can SELECT/UPDATE patients they own
CREATE POLICY IF NOT EXISTS "users_can_manage_own_patients" ON patients
  FOR ALL USING (owner_user_id = auth.uid()::uuid)
  WITH CHECK (owner_user_id = auth.uid()::uuid);

-- Policy: dentists and admins can view appointments for their practice; patients can view their own appointments
CREATE POLICY IF NOT EXISTS "appointments_select_policy" ON appointments
  FOR SELECT USING (
    -- allow patient owner
    (SELECT owner_user_id FROM patients WHERE patients.id = appointments.patient_id) = auth.uid()::uuid
    OR
    -- allow dentist (if dentist.user_id matches)
    (SELECT user_id FROM dentists WHERE dentists.id = appointments.dentist_id) = auth.uid()::uuid
    OR
    -- allow admins
    (SELECT role FROM users WHERE users.id = auth.uid()::uuid) = 'admin'
  );

-- Policy: appointments insert/update permitted when origin user is patient or dentist or admin
CREATE POLICY IF NOT EXISTS "appointments_insert_update_policy" ON appointments
  FOR INSERT, UPDATE USING (true) WITH CHECK (
    (EXISTS (SELECT 1 FROM patients WHERE patients.id = NEW.patient_id AND patients.owner_user_id = auth.uid()::uuid))
    OR (EXISTS (SELECT 1 FROM dentists WHERE dentists.id = NEW.dentist_id AND dentists.user_id = auth.uid()::uuid))
    OR ((SELECT role FROM users WHERE users.id = auth.uid()::uuid) = 'admin')
  );

-- Policy: attachments only visible to record owners or admins
CREATE POLICY IF NOT EXISTS "attachments_owner_or_admin" ON attachments
  FOR ALL USING (
    (owner_user_id = auth.uid()::uuid)
    OR (SELECT role FROM users WHERE users.id = auth.uid()::uuid) = 'admin'
  );

-- GRANTS (basic)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC; -- adjust to least privilege in production

-- END OF MIGRATION

COMMENT ON TABLE users IS 'Core user accounts: supports device accounts and admin role.';
COMMENT ON TABLE device_sync_state IS 'Per-device sync state for offline-first replication.';

-- Migration finished
