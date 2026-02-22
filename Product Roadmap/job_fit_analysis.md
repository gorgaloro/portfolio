# Epic: Job Description Fit Analysis System

## Goal
Create an automated workflow that evaluates how well a candidate’s background aligns with a specific job description, combining both **AI-based semantic understanding** and **weighted quantitative scoring**.  
The purpose is to surface clear, visual indicators of fit for each job — giving referrers and hiring contacts a concise and trustworthy summary.

---

## User Narrative

As a candidate using the internal referral page,
I want the system to analyze each job posting automatically,
so that I can display a **data-driven fit summary** for every role I’m targeting.

The system should:
- Parse any new job description text from HubSpot/Supabase deals.
- Identify and rank keywords that define success in the role.
- Compare those attributes against both my resume and a general market baseline for the same title.
- Produce a final weighted fit score with visual indicators (green, yellow, grey).
- Store all results in Supabase for downstream display on my referral page.

---

## Functional Flow

1. **JD → OpenAI (Extraction Phase)**
   - When a new job description is ingested, send the full text to OpenAI.
   - OpenAI extracts up to 15 key attributes and categorizes them under three fit areas:
     - Industry Fit  
     - Process Fit  
     - Technical Fit
   - Each attribute receives a **JD Rank (1–15)** indicating its relative importance in the job posting.

2. **Title → OpenAI (Normalization Phase)**
   - In parallel, send the job title to OpenAI.
   - The model returns how those same 15 attributes would typically be ranked for that title across the broader labor market.
   - These rankings become the **Title Rank (1–15)** and serve as a normalization layer to offset any JD bias.

3. **Rank Fusion**
   - Supabase blends the two rankings:
     - `JD Rank = 70% weight`
     - `Title Rank = 30% weight`
   - A **Final Rank** is calculated for each attribute and normalized into a weighted score (100–5 scale).
   - This creates a unified priority list for the role.

4. **Candidate → OpenAI (Fit Assessment)**
   - The candidate profile (resume summary, skills, project history) is passed to OpenAI.
   - For each of the 15 attributes, OpenAI assigns a **Fit Color**:
     - 🟩 Green = directly demonstrated experience  
     - 🟨 Yellow = adjacent or partial experience  
     - ⬜ Grey = limited or no experience  
   - The color acts as a multiplier for the weighted score:
     - Green = 1.0  
     - Yellow = 0.65  
     - Grey = 0  

5. **Supabase Fit Calculation**
   - Supabase applies the formula:
     - `Weighted Score = Attribute Weight × Fit Multiplier`
   - Sum all weighted scores, divide by the total possible (580 points).
   - Output the **Overall Fit %** plus subtotals for Industry, Process, and Technical Fit.

6. **Display on Referral Page**
   - Each evaluated job record displays:
     - Three labeled columns (Industry, Process, Technical)
     - Up to five colored markers per column
     - Numeric Fit Score (e.g., 83%)
     - Narrative summary (neutral voice: “Brings a strong foundation in…”)
   - The goal is to make the summary both visually clear and emotionally neutral — objective, data-based, and easy for referrers to trust.

---

## Acceptance Criteria

- [ ] System can extract and categorize 15 ranked attributes per JD.
- [ ] Title-based normalization applies a 70/30 weighting blend.
- [ ] Fit colors correctly adjust final score using defined multipliers.
- [ ] Results stored in Supabase with schema fields:
  - `attribute_name`
  - `category` (industry/process/technical)
  - `jd_rank`
  - `title_rank`
  - `final_rank`
  - `weight`
  - `fit_color`
  - `fit_multiplier`
  - `weighted_score`
  - `total_fit_percent`
- [ ] Referral page displays visual markers and numeric score.
- [ ] Narrative summary generated in neutral third-person tone.

---

## Desired Outcome

A complete, automated feedback loop connecting OpenAI → Supabase → Windsurf UI:
- **Accuracy:** Reduces JD noise and bias using dual ranking.
- **Transparency:** Displays the reasoning behind each score.
- **Efficiency:** Auto-evaluates all new job deals every sync.
- **Clarity:** Allows referrers to instantly understand where the candidate is strong or adjacent.

---

## Future Enhancements (Backlog)

- **Dynamic Weight Calibration Panel**
  - Add an internal “Control Panel” accessible from the Windsurf dashboard.
  - The panel allows editing of rank weighting factors (e.g., 70/30 JD–Title blend, point scales, and fit multipliers).
  - Include real-time preview graphs showing how changes would alter final scoring outcomes.
  - Option to store custom presets for specific role families or industries.

- **Adaptive Role Archetypes**
  - Expand the Role Archetype Library to include more standardized titles across industries.
  - Allow AI to update archetype weights dynamically based on new job descriptions encountered over time.

- **Historical Analytics**
  - Track score distributions across all evaluated jobs to reveal patterns in strong vs. weak fits.
  - Provide insights like “average Process Fit” or “common Industry Gaps” to guide learning and targeting.

- **Interactive Visualizations**
  - Add optional progress bars, radar charts, and “confidence heatmaps” for visual storytelling.
  - Include hover tooltips explaining which attributes contributed most to the overall fit score.

- **Trend Indicators**
  - Show progress over time, such as rising average fit scores or improved technical alignment.
  - Allow snapshot comparison between older and newer evaluations.

- **Automation Enhancements**
  - Schedule reanalysis of stored job records when candidate resume updates occur.
  - Auto-adjust weighting models as OpenAI extracts more normalized attribute patterns across roles.

---

## System Architecture

- **Sources**
  - HubSpot Deals (via existing `sync-hubspot-deals` Edge Function) provide title, company, and job URL; JD text can be stored in `hubspot_deals.properties` or an auxiliary table.
- **Processing**
  - New Edge Function: `analyze-job-fit` (idempotent, batch-capable) orchestrates OpenAI calls, fuses ranks, writes results.
  - Optional GitHub Action (cron) to re-run analysis nightly or on demand.
- **Storage**
  - Results written to dedicated `job_fit_*` tables, keyed by `deal_id` (HubSpot) for easy joins with companies and contacts.
- **Presentation**
  - Referral page fetches precomputed summaries and attribute rows for visual indicators.

### High-level Flow
1. Select targets: new/updated deals with JD text, or query param `deal_id`.
2. Extract 15 attributes + JD Rank; normalize to Title Rank; compute Final Rank and weights.
3. Assess candidate fit colors; compute weighted scores and overall/subcategory %.
4. Upsert attributes and summary rows; expose via a simple view for the UI.

---

## Data Model (Supabase)

```sql
-- Core summary for each analyzed job (one row per deal)
create table if not exists job_fit_summary (
  id bigserial primary key,
  deal_id bigint not null unique,
  company_id bigint,
  company_name text,
  job_title text,
  jd_text text,
  analyzed_at timestamptz not null default now(),
  total_fit_percent numeric(5,2) not null,
  industry_fit_percent numeric(5,2) not null,
  process_fit_percent numeric(5,2) not null,
  technical_fit_percent numeric(5,2) not null,
  narrative text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Attribute-level details (up to 15 rows per deal)
create table if not exists job_fit_attributes (
  id bigserial primary key,
  deal_id bigint not null references job_fit_summary(deal_id) on delete cascade,
  attribute_name text not null,
  category text check (category in ('industry','process','technical')) not null,
  jd_rank smallint not null,
  title_rank smallint not null,
  final_rank smallint not null,
  weight smallint not null,
  fit_color text check (fit_color in ('green','yellow','grey')) not null,
  fit_multiplier numeric(3,2) not null,
  weighted_score smallint not null,
  created_at timestamptz not null default now()
);

create index if not exists job_fit_attributes_deal_id_idx on job_fit_attributes(deal_id);

-- Convenience view for UI
create or replace view job_fit_view as
select s.deal_id,
       s.company_id,
       s.company_name,
       s.job_title,
       s.total_fit_percent,
       s.industry_fit_percent,
       s.process_fit_percent,
       s.technical_fit_percent,
       s.narrative
  from job_fit_summary s;
```

Notes:
- `deal_id` joins directly to `hubspot_deals.deal_id`; company info can be joined via `hubspot_deal_companies_view` when needed.
- JD text may be stored in `job_fit_summary.jd_text` for reproducibility, or referenced if already present in deals properties.

---

## Scoring Rubric (Concrete)

- 15 attributes per role, ranked and fused (70% JD Rank + 30% Title Rank) to produce `final_rank` (1 = highest priority).
- Weighting model is configurable. The default mode is Pareto (see `Product Roadmap/weighted_rank_pareto.md`).
  - Pareto mode: `weight_i = top_weight × decay^(i-1)` with `top_weight=100`, `decay=0.6` (configurable).
  - List mode: fallback to an explicit `rank_weights` array when `weighting.mode = "list"`.
  - Denominator `W_total` is `Σ(weight_i)` computed from the active mode.
  - For historical reference, the prior fixed list was:

| Rank | Weight |
|------|--------|
| 1    | 100    |
| 2    | 75     |
| 3    | 60     |
| 4    | 50     |
| 5    | 45     |
| 6    | 40     |
| 7    | 35     |
| 8    | 32     |
| 9    | 30     |
| 10   | 28     |
| 11   | 25     |
| 12   | 25     |
| 13   | 20     |
| 14   | 10     |
| 15   | 5      |

Sum = 580 (only when using this fixed list).

Fit multipliers:
- Green = 1.00
- Yellow = 0.65
- Grey = 0.00

Formulas:
- `weighted_score = weight × fit_multiplier`
- `total_fit_percent = round(100 * Σ(weighted_score) / Σ(weight), 2)` where `Σ(weight)` is `W_total` from the active weighting mode.
- Category % computed by dividing by the category’s `Σ(weighted_score)` over that category’s `Σ(weight)`.

---

## Edge Function: analyze-job-fit

- Path: `/functions/v1/analyze-job-fit`
- Auth: Service key or signed backend request only (not public).
- Inputs:
  - `deal_id` (single) or `since` timestamp (batch), optional `limit`.
  - Flags: `recompute=true` to overwrite existing rows.
- Steps:
  1. Load JD text + meta from `hubspot_deals` (and company via view).
  2. OpenAI call (extraction): return 15 attributes with categories + JD Rank.
  3. OpenAI call (title normalization): same attributes with Title Rank.
  4. Rank fusion, weight mapping.
  5. OpenAI call (candidate fit): color per attribute + short neutral narrative.
  6. Compute scores and upsert into `job_fit_summary` and `job_fit_attributes`.
- Output: JSON summary of: analyzed count, updated rows, and errors.

Prompt contracts (sketch):
- Extraction: “Return exactly 15 attributes as JSON [{name, category, jd_rank}] from this JD; categories limited to industry/process/technical.”
- Title normalization: “Given title X, provide ranks for the same attributes as JSON [{name, title_rank}].”
- Candidate fit: “Given these attributes and this profile, assign fit_color per attribute and 2–3 sentence neutral narrative.”

---

## Security, Cost, and Reliability

- Keys: store OpenAI key in Supabase secrets; never expose client-side.
- Idempotency: upsert by `deal_id`; recompute flag controls overwrites.
- Backoff: retry transient OpenAI failures; log rows in an errors table.
- Cost control: cap batch size and attributes; reuse normalization for repeated titles.

---

## MVP Scope (2–3 days)

- Schema and migrations for `job_fit_summary` and `job_fit_attributes`.
- Minimal `analyze-job-fit` function with:
  - deterministic prompts,
  - rank fusion + weights,
  - summary + attributes upsert.
- GitHub Action to run nightly for newly modified deals with JD text.
- Referral page: read-only display of summary score and three headers with placeholder chips (no interactivity).

---

## Implementation Plan

1. DDL: create tables + view and indexes.
2. Function: skeleton endpoints + OpenAI clients + mapping utilities.
3. Wiring: select eligible deals (recently updated, have JD text).
4. Upsert logic and simple error reporting.
5. UI: minimal fetch hook + render numeric score and colored markers.
6. CI: nightly GitHub Action and manual dispatch.

---

## Test Plan

- Unit tests for rank fusion, weight mapping, and scoring math with canned inputs.
- Dry-run OpenAI responses with mocked payloads; assert upsert shapes.
- Golden file test for end-to-end: a sample JD + resume → stable output.

---

## Open Questions

- Where should canonical JD text live (deals.properties vs. dedicated column)?
- Single candidate profile blob vs. structured skills/experience tables?
- Do we denormalize company name in `job_fit_summary` for faster reads, or always join the view?
