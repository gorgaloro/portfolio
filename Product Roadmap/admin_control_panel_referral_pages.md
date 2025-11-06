# Epic: Admin Control Panel & Referral Page Lifecycle Management

## Overview
This epic defines the internal admin control panel for configuring AI scoring, managing referral page generation, editing AI outputs, and handling updates when new jobs sync in from HubSpot via Supabase.

---

## User Story 5b: Edit and Reclassify Attributes
**As Allen,**  
I want to rewrite, rename, or reclassify extracted attributes after AI analysis,  
so the referral page reflects my skills more naturally and reads like an assessment rather than raw keyword extraction.

### Why
- AI may return generic verbs (“manage timelines”) instead of skill-like phrases (“plan and lead cross-functional timelines”).
- Some keywords fall under incorrect pillars.
- Some low-value attributes should be hidden.

### Requirements
Each attribute row should support:
- Editable `label`
- Selectable `pillar` (Industry | Process | Technical)
- Selectable `color` (Green | Yellow | Grey)
- Toggle `visible` (show/hide)

Edits are persisted in an override table with keys: `run_id`, `job_id`, `attribute_id`.

### Scoring
- Rewording keeps score constant.
- Pillar changes recompute summaries.
- Color changes recalculate fit.
- Hidden attributes are excluded from display.

### UI
Table layout with reset option per row.  
Columns: Attribute | Pillar | Color | Visible

---

## User Story 5c: “Skillier” Suggestion for Attribute Text
**As Allen,**  
I want a one-click way to rewrite generic attributes into short, human-readable skill labels,  
so the referral page reads naturally while staying concise.

### Behavior
- “Suggest skill label” button triggers OpenAI.  
- Input: current attribute, pillar, JD context.  
- Output: concise label (≤5 words, configurable).

### Config
- Key: `skiller.max_words`
- Default: 5
- Stored in settings/config table under group: `prompts` or `display`.

### Prompt Shape
System: “You rewrite short capability labels for referral pages.”  
User: “Rewrite this attribute into a concise skill phrase, max {{skiller.max_words}} words.”

### UI
Shows “Suggestion: ____ [Use]”.  
Selecting “Use” replaces text inline.

### Acceptance
- Suggestion limited by config value.  
- No pillar/score resets on use.  
- Edits persist.

---

## User Story 7: View and Manage Generated Referral Pages
**As Allen,**  
I want to view, edit, or regenerate referral pages,  
so I can update them as new data becomes available.

### Data Model
`referral_pages` or `referral_runs` table fields:
- id, company_id/name, created_at, jobs_included[], snapshot_config_version, status, last_checked_for_updates

### UI
List view with: Page name | Created | Jobs | Status | “Needs Update” badge  
Actions: View | Edit | Regenerate

### Acceptance
- Displays all generated pages.  
- Editable and regenerable from admin UI.  
- Accurate status indicators.

---

## User Story 8: Detect New Jobs for Existing Pages
**As Allen,**  
I want to know when new HubSpot jobs are synced for an existing company,  
so I can decide whether to include them in my referral page.

### Logic
1. For each referral page, query Supabase for latest company jobs.  
2. Compare to `jobs_included`.  
3. If differences found, mark page `needs_update = true`.

### UI
Badge “New Jobs Available” → click to open job inclusion dialog.  
Check options:
- [x] Include new job  
- [ ] Ignore for now

### Acceptance
- Automatic detection of missing jobs.  
- Clear visual alerts.  
- Selective inclusion and enrichment.

---

## User Story 9: Ignore / Snooze New Jobs
**As Allen,**  
I want to snooze new jobs for a company,  
so I’m not constantly prompted about ones I don’t plan to include.

### Behavior
- “Ignore this job” toggle in job inclusion dialog.  
- Ignored jobs stored under `referral_page_ignored_jobs` table keyed by page + job.  
- Ignored jobs excluded from update detection.

### Acceptance
- Ignored jobs suppress “Needs Update.”  
- Admin can reinclude ignored jobs later.

---

## Implementation Notes
- Published pages remain immutable snapshots.  
- “Regenerate” spawns a new version under same public URL.  
- “Needs update” computed dynamically from Supabase–HubSpot deltas.  
- Future enhancement: email alert or dashboard notification when new jobs sync for tracked companies.
