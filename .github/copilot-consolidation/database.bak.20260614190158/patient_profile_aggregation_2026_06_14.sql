-- Patient profile aggregation and search helpers
-- Date: 2026-06-14
-- Purpose: build denormalized patient_profiles table for fast single-page rendering
-- Requires: change_log table present (see primeos_schema_migration_2026_06_14.sql)

-- Idempotent

CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_id UUID PRIMARY KEY,
  profile JSONB NOT NULL,
  search_tsv tsvector,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup & search
CREATE INDEX IF NOT EXISTS patient_profiles_profile_gin_idx ON patient_profiles USING GIN (profile);
CREATE INDEX IF NOT EXISTS patient_profiles_search_tsv_idx ON patient_profiles USING GIN (search_tsv);

-- Builder function: aggregate patient, appointments, attachments, related dentists
CREATE OR REPLACE FUNCTION build_patient_profile(p_patient_id UUID) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  p RECORD;
  appts JSONB;
  atts JSONB;
  dentists JSONB;
  combined JSONB;
  txt TEXT;
BEGIN
  IF p_patient_id IS NULL THEN
    RETURN;
  END IF;

  -- base patient
  SELECT to_jsonb(pat) INTO p
  FROM (SELECT id, full_name, email, phone, dob, metadata, created_at, updated_at FROM patients WHERE id = p_patient_id) as pat;
  IF NOT FOUND THEN
    -- If patient deleted, remove profile
    DELETE FROM patient_profiles WHERE patient_id = p_patient_id;
    RETURN;
  END IF;

  -- appointments list
  SELECT jsonb_agg(to_jsonb(r) - 'payload') INTO appts
  FROM (
    SELECT a.id, a.start_at, a.end_at, a.status, a.reason, a.notes, a.dentist_id
    FROM appointments a
    WHERE a.patient_id = p_patient_id
    ORDER BY a.start_at DESC
    LIMIT 200
  ) r;
  IF appts IS NULL THEN appts = '[]'::jsonb; END IF;

  -- attachments
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', att.id, 'storage_path', att.storage_path, 'content_type', att.content_type, 'related_table', att.related_table)), '[]'::jsonb) INTO atts
  FROM attachments att
  WHERE att.related_table = 'patients' AND att.related_id = p_patient_id;

  -- dentists referenced in appointments (small set)
  SELECT COALESCE(jsonb_agg(distinct jsonb_build_object('id', d.id, 'full_name', d.full_name, 'email', d.email)), '[]'::jsonb) INTO dentists
  FROM dentists d JOIN appointments a ON a.dentist_id = d.id
  WHERE a.patient_id = p_patient_id;

  -- combine
  combined = jsonb_build_object(
    'patient', p,
    'appointments', appts,
    'attachments', atts,
    'dentists', dentists
  );

  -- build searchable text (concatenate important fields)
  txt = (
    COALESCE((p->>'full_name'), '') || ' ' ||
    COALESCE((p->>'email'), '') || ' ' ||
    COALESCE((p->>'phone'), '') || ' '
  );

  -- include appointments text
  IF appts <> '[]'::jsonb THEN
    txt = txt || ' ' || (
      SELECT string_agg(coalesce(a->>'reason','') || ' ' || coalesce(a->>'notes',''), ' ') FROM jsonb_array_elements(appts) as a
    );
  END IF;

  -- upsert into patient_profiles
  INSERT INTO patient_profiles (patient_id, profile, search_tsv, updated_at)
  VALUES (p_patient_id, combined, to_tsvector('simple', txt), now())
  ON CONFLICT (patient_id) DO UPDATE SET profile = EXCLUDED.profile, search_tsv = EXCLUDED.search_tsv, updated_at = now();
END; $$;

-- Convenience: refresh all (careful on large DBs)
CREATE OR REPLACE FUNCTION build_all_patient_profiles() RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  pid RECORD;
BEGIN
  FOR pid IN SELECT id FROM patients LOOP
    PERFORM build_patient_profile(pid.id);
  END LOOP;
END; $$;

-- Trigger enqueuer: mark change_log for background worker to process
CREATE OR REPLACE FUNCTION enqueue_patient_profile_refresh() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_uuid UUID;
BEGIN
  -- Determine patient id depending on source table
  IF TG_TABLE_NAME = 'patients' THEN
    IF (TG_OP = 'DELETE') THEN
      target_uuid = OLD.id;
    ELSE
      target_uuid = NEW.id;
    END IF;
  ELSIF TG_TABLE_NAME = 'appointments' THEN
    IF (TG_OP = 'DELETE') THEN
      target_uuid = OLD.patient_id;
    ELSE
      target_uuid = NEW.patient_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'attachments' THEN
    -- attachments related to patients only
    IF (TG_OP = 'DELETE') THEN
      IF OLD.related_table = 'patients' THEN
        target_uuid = OLD.related_id;
      END IF;
    ELSE
      IF NEW.related_table = 'patients' THEN
        target_uuid = NEW.related_id;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'dentists' THEN
    -- on dentist change, refresh all patients that reference them (cheap approximate: enqueue affected patients via join)
    IF (TG_OP = 'DELETE') THEN
      -- enqueue patients previously linked
      INSERT INTO change_log (operation_type, table_name, record_id, payload) 
      SELECT 'update', 'patient_profile', a.patient_id, NULL FROM appointments a WHERE a.dentist_id = OLD.id;
      RETURN NULL;
    ELSE
      INSERT INTO change_log (operation_type, table_name, record_id, payload) 
      SELECT 'update', 'patient_profile', a.patient_id, NULL FROM appointments a WHERE a.dentist_id = NEW.id;
      RETURN NULL;
    END IF;
  END IF;

  IF target_uuid IS NOT NULL THEN
    INSERT INTO change_log (operation_type, table_name, record_id, payload) VALUES ('update', 'patient_profile', target_uuid, NULL);
  END IF;
  RETURN NULL;
END; $$;

-- Attach triggers to source tables
DROP TRIGGER IF EXISTS patients_enqueue_patient_profile_refresh_trg ON patients;
CREATE TRIGGER patients_enqueue_patient_profile_refresh_trg AFTER INSERT OR UPDATE OR DELETE ON patients FOR EACH ROW EXECUTE FUNCTION enqueue_patient_profile_refresh();

DROP TRIGGER IF EXISTS appointments_enqueue_patient_profile_refresh_trg ON appointments;
CREATE TRIGGER appointments_enqueue_patient_profile_refresh_trg AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION enqueue_patient_profile_refresh();

DROP TRIGGER IF EXISTS attachments_enqueue_patient_profile_refresh_trg ON attachments;
CREATE TRIGGER attachments_enqueue_patient_profile_refresh_trg AFTER INSERT OR UPDATE OR DELETE ON attachments FOR EACH ROW EXECUTE FUNCTION enqueue_patient_profile_refresh();

DROP TRIGGER IF EXISTS dentists_enqueue_patient_profile_refresh_trg ON dentists;
CREATE TRIGGER dentists_enqueue_patient_profile_refresh_trg AFTER INSERT OR UPDATE OR DELETE ON dentists FOR EACH ROW EXECUTE FUNCTION enqueue_patient_profile_refresh();

-- Simple worker helper: claim & process a change_log row for patient_profile
-- This function processes one pending change_log entry and returns true if processed.
CREATE OR REPLACE FUNCTION process_one_patient_profile_change() RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r FROM change_log WHERE table_name = 'patient_profile' AND applied = FALSE ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  PERFORM build_patient_profile(r.record_id);

  UPDATE change_log SET applied = TRUE, applied_at = now() WHERE id = r.id;
  RETURN TRUE;
END; $$;

-- End of aggregation migration
