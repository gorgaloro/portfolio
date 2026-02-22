# Admin Console: Core Tab Structure (v1)

This document outlines the foundational layout for the rebuilt admin console.  
The design focuses on modularity, clarity, and extensibility — enabling future integration across all projects within the allenwalker.info ecosystem.

---

## 1. Home (Dashboard)

### Purpose
Serve as the default landing page and mission control panel for system visibility and high-level operations.

### Features
- System connection status (API, Supabase, HubSpot, OpenAI)
- Most recent enrichment and sync operations
- AI usage metrics (token counts, runtime duration)
- Summary of new or pending referral pages
- Quick access to key functions (Run Sync, Generate Page, Edit Config)

### Expected Behavior
Displays system health and recent activity at a glance. Users can quickly identify sync issues, model anomalies, or pending updates.

---

## 2. Referrals

### Purpose
Provide a dedicated workspace for managing internal referral workflows — from AI extraction and scoring to page generation.

### Subsections

#### A. Jobs & Companies
- Display list of synced jobs and associated company data.
- Allow manual refresh or enrichment per job.
- Link to data sources for validation.

#### B. AI Extraction & Scoring
- Run keyword extraction for Industry, Process, and Technical pillars.
- Initiate resume-to-job comparison and generate preliminary fit scores.
- View raw AI output and normalized keyword rankings.

#### C. Attributes Editor
- View extracted attributes organized by pillar.
- Rename, merge, or move attributes between categories.
- Apply manual overrides for fit color (Green, Yellow, Grey).
- Option to hide or suppress specific attributes.

#### D. Preview Builder
- Combine narrative and attribute data into a referral page preview.
- Edit narrative copy before publication.
- Manually re-run narrative generation or apply overrides.
- Review and approve the final referral presentation.

#### E. Generated Pages
- Display a list of all generated referral pages with timestamp and fit score summary.
- Support filtering by company, status (Draft / Published), or date.
- Enable regeneration, duplication, or deletion of pages.

### Expected Behavior
This section allows end-to-end management of referral data — from input extraction to final output publishing — ensuring transparency and control at each stage.

---

## 3. Configuration

### Purpose
Central hub for adjusting AI logic, scoring parameters, and synchronization settings.

### Subsections

#### A. AI & Models
- Select or switch AI model versions.
- Adjust temperature, response length, and retry thresholds.

#### B. Scoring Settings
- Tune JD vs. Title weighting ratios.
- Modify Pareto curve decay settings.
- Define fit thresholds for Green, Yellow, and Grey indicators.

#### C. Prompts & Templates
- Edit prompt templates for extraction, scoring, and narrative generation.
- Test prompt behavior in a sandbox before deploying changes.

#### D. Sync & Scheduling
- Set sync frequency for external data sources.
- Manually trigger or pause scheduled syncs.
- Configure cron timing and retry policies.

#### E. Access Control
- Manage authorized users, API keys, and credentials.
- Define admin roles and permission levels.

### Expected Behavior
Changes to configuration automatically apply to subsequent enrichment or generation processes. No redeployment required.

---

## 4. Data & Logs

### Purpose
Provide transparency and traceability for all system operations.

### Subsections

#### A. Sync History
- List completed and pending sync operations.
- Display duration, record counts, and outcome status.

#### B. AI Calls Log
- Record all AI API calls, including token usage and latency.
- Highlight errors or unusually long response times.

#### C. Generated Artifacts
- Store links to generated content such as JSON, Markdown, or HTML.
- Allow download or inspection for debugging or reuse.

#### D. Activity Tracker
- Record human actions taken in the admin (e.g., edits, overrides, regenerations).

### Expected Behavior
Logs and history allow users to monitor performance, trace issues, and validate data lineage.

---

## 5. Experiments / Sandbox (Optional)

### Purpose
Provide a safe environment to test new AI prompts, scoring logic, or parameter configurations before deploying them to production.

### Features
- Test prompt responses on sample data.
- Compare old vs. new enrichment logic side-by-side.
- Save experiment snapshots for future reference.

### Expected Behavior
Changes and experiments in this area do not affect live data until explicitly promoted or merged into the main configuration.

---
