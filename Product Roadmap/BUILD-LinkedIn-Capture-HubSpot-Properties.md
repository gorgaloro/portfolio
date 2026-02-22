# BUILD: LinkedIn Capture — HubSpot Property Updates

**Date:** 2026-02-22
**Context:** The LinkedIn Capture extension now extracts comprehensive profile data (experiences, education, certifications, past experience summary, capture date). The API route and Supabase tables are updated to store this data. HubSpot needs 2 new custom contact properties so the enriched data flows through.

---

## Prerequisites

Before running any of the steps below:

1. **Run the Supabase migration** — paste the SQL from `supabase/migrations/202602221400_linkedin_capture_expansion.sql` into the Supabase Dashboard SQL Editor and execute. This creates 3 new tables (`linkedin_experience`, `linkedin_education`, `linkedin_certification`) and adds 2 columns (`captured_date`, `past_experience_summary`) to `hubspot_contacts`.

2. **Have your HubSpot PAT ready** — the same token used in `.env` as `HUBSPOT_ACCESS_TOKEN`. It needs `crm.schemas.contacts.write` and `crm.objects.contacts.write` scopes.

---

## Step 1 — Create 2 New HubSpot Contact Properties

**File to modify:** `scripts/deploy-hubspot-schema.mjs`

Add the following 2 property definitions to the contact properties section (after the existing 11 LinkedIn Capture properties around line ~200). These go inside the `main()` function alongside the other `createProperty('contacts', ...)` calls:

```javascript
// ─── New LinkedIn Capture Properties (Feb 2026) ───

await createProperty('contacts', {
  name: 'linkedin_past_experience_summary',
  label: 'LinkedIn Past Experience Summary',
  type: 'string',
  fieldType: 'textarea',
  groupName: 'linkedin_capture',
  description: 'Auto-generated summary of all past (non-current) roles from LinkedIn profile. Format: "Title at Company (Duration); Title at Company (Duration); ..."',
});

await createProperty('contacts', {
  name: 'linkedin_capture_date',
  label: 'LinkedIn Capture Date',
  type: 'date',
  fieldType: 'date',
  groupName: 'linkedin_capture',
  description: 'Date when the LinkedIn profile was captured by the extension.',
});
```

**Then run:**

```bash
HUBSPOT_TOKEN="pat-na1-..." node scripts/deploy-hubspot-schema.mjs --skip-migration
```

The `--skip-migration` flag skips the old submission_notes migration (already done). The script is idempotent — existing properties return "Already exists — skipping".

**Verify:** After running, check HubSpot → Contacts → Properties → "LinkedIn Capture" group. You should see these 2 new properties alongside the existing 11.

---

## Step 2 — Deploy the Updated API Route

The following files were modified and need to be deployed to Vercel:

### `src/app/api/admin/capture-contact/route.ts`
**Changes:**
- Added `ExperienceInput`, `CertificationInput` types
- Added `experiences`, `certifications`, `captured_date`, `rawPageText` to `ProfileInput`
- Added 4 new helper functions:
  - `saveExperienceRecords()` — inserts to `linkedin_experience` table
  - `saveEducationRecords()` — inserts to `linkedin_education` table
  - `saveCertificationRecords()` — inserts to `linkedin_certification` table
  - `summarizePastExperienceText()` — generates semicolon-separated summary of past roles
- Updated `handleExtract` — returns experiences/education/certifications/captured_date in response
- Updated `handleConfirm` — builds enriched profile with `past_experience_summary`, saves normalized records to 3 new Supabase tables, updates `captured_date` and `past_experience_summary` columns

### `src/lib/hubspot-contact-writer.ts`
**Changes:**
- Added `past_experience_summary` and `captured_date` to `ContactProfilePayload`
- Added `linkedin_past_experience_summary` and `linkedin_capture_date` to `buildContactProperties()` output

**Deploy:**

```bash
git add src/app/api/admin/capture-contact/route.ts src/lib/hubspot-contact-writer.ts
git commit -m "feat: save LinkedIn experiences, education, certifications to Supabase + HubSpot"
git push
```

Vercel auto-deploys from push. Verify the deployment succeeds in the Vercel dashboard.

---

## Step 3 — Update the Firefox Extension

The extension files live in `extension/linkedin-capture/` and are loaded locally — no deployment needed, just reload.

### Files changed:
- **`popup.js`** — Company alternatives UI, extracted data preview (experience/education/certs), updated save handler with company selection logic, better success display
- **`popup.html`** — Added `companyAlternatives` and `extractedPreview` containers
- **`popup.css`** — Styles for company cards, create-new-company form, collapsible preview sections

**Reload:**
1. Firefox → `about:debugging#/runtime/this-firefox`
2. Find "LinkedIn Capture" → click "Reload"

---

## Step 4 — End-to-End Test

1. Navigate to any LinkedIn profile in Firefox
2. Click the LinkedIn Capture extension icon
3. Click "Extract Profile"
4. **Verify the preview shows:**
   - Name, headline, location, captured date
   - Company match status (green/yellow/grey dot)
   - "Current Role" section with title + company
   - Collapsible "Experience" section with badge count
   - Collapsible "Education" section with badge count
   - Collapsible "Certifications" section with badge count (if any)
5. Select tags, add notes, click "Save Contact"
6. **Verify success banner shows:**
   - Name confirmed
   - HubSpot link (click to verify contact in HubSpot)
   - Supabase ID confirmation
7. **Verify in HubSpot:** Open the contact → check:
   - `linkedin_past_experience_summary` is populated (semicolon-separated past roles)
   - `linkedin_capture_date` shows the capture date
8. **Verify in Supabase:** Run these queries in the SQL Editor:
   ```sql
   SELECT * FROM linkedin_experience WHERE contact_id = <ID> ORDER BY order_index;
   SELECT * FROM linkedin_education WHERE contact_id = <ID> ORDER BY order_index;
   SELECT * FROM linkedin_certification WHERE contact_id = <ID>;
   SELECT captured_date, past_experience_summary FROM hubspot_contacts WHERE contact_id = <ID>;
   ```

---

## Data Flow Summary

```
LinkedIn Profile Page
    ↓ (popup.js extracts via document.body.innerText)
Extension Popup (preview with experiences/education/certs)
    ↓ (POST to /api/admin/capture-contact)
API Route — mode: extract
    ↓ (returns parsed data + company match + auto tags)
Extension Popup (user reviews, selects tags, picks company)
    ↓ (POST to /api/admin/capture-contact)
API Route — mode: confirm
    ├→ HubSpot Contact (upsert with past_experience_summary + capture_date)
    ├→ Supabase hubspot_contacts (snapshot row)
    ├→ Supabase linkedin_experience (N rows, one per role)
    ├→ Supabase linkedin_education (N rows, one per school)
    └→ Supabase linkedin_certification (N rows, one per cert)
```

---

## Rollback

If anything breaks:

- **HubSpot properties:** Properties can't be deleted via API once created, but they're harmless if unused. Just revert the `hubspot-contact-writer.ts` changes and the properties won't be populated.
- **Supabase tables:** `DROP TABLE IF EXISTS linkedin_experience, linkedin_education, linkedin_certification CASCADE;` and `ALTER TABLE hubspot_contacts DROP COLUMN IF EXISTS captured_date, DROP COLUMN IF EXISTS past_experience_summary;`
- **API route:** Revert to previous commit. The new save helpers are wrapped in try/catch so failures produce warnings, not hard errors.
