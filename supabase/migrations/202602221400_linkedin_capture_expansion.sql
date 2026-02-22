-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: LinkedIn Capture Expansion
-- Adds normalized tables for experience, education, and certifications.
-- Adds captured_date and past_experience_summary to hubspot_contacts.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. linkedin_experience — one row per role
CREATE TABLE IF NOT EXISTS linkedin_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id BIGINT NOT NULL REFERENCES hubspot_contacts(contact_id) ON DELETE CASCADE,
  company_name TEXT,
  job_title TEXT,
  duration_text TEXT,
  responsibilities TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  employment_type TEXT,
  location TEXT,
  order_index INT DEFAULT 0,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_contact ON linkedin_experience(contact_id);
CREATE INDEX IF NOT EXISTS idx_experience_current ON linkedin_experience(contact_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_experience_company ON linkedin_experience(company_name);

-- 2. linkedin_education — one row per school
CREATE TABLE IF NOT EXISTS linkedin_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id BIGINT NOT NULL REFERENCES hubspot_contacts(contact_id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  order_index INT DEFAULT 0,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_contact ON linkedin_education(contact_id);
CREATE INDEX IF NOT EXISTS idx_education_institution ON linkedin_education(institution);

-- 3. linkedin_certification — one row per cert (searchable)
CREATE TABLE IF NOT EXISTS linkedin_certification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id BIGINT NOT NULL REFERENCES hubspot_contacts(contact_id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_contact ON linkedin_certification(contact_id);
CREATE INDEX IF NOT EXISTS idx_cert_name ON linkedin_certification USING GIN (to_tsvector('english', certification_name));
CREATE INDEX IF NOT EXISTS idx_cert_issuer ON linkedin_certification(issuing_organization);

-- 4. Expand hubspot_contacts with new columns
ALTER TABLE hubspot_contacts ADD COLUMN IF NOT EXISTS captured_date TIMESTAMPTZ;
ALTER TABLE hubspot_contacts ADD COLUMN IF NOT EXISTS past_experience_summary TEXT;

-- 5. RLS policies (service_role full access)
ALTER TABLE linkedin_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_certification ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'linkedin_experience', 'linkedin_education', 'linkedin_certification'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "service_role_full_%1$s" ON %1$I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. New tables: linkedin_experience, linkedin_education, linkedin_certification
-- New columns on hubspot_contacts: captured_date, past_experience_summary
-- ─────────────────────────────────────────────────────────────────────────────
