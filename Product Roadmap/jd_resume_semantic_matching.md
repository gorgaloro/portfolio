# Instruction: JD ↔ Resume Semantic Matching Enhancement

## Objective
Improve the accuracy and interpretability of keyword matching between Job Descriptions (JD) and Allen Walker’s resume by upgrading from literal keyword comparison to **semantic vector matching** using OpenAI embeddings.

This ensures that related but differently worded phrases (e.g., “cross-functional collaboration” vs. “collaboration across teams”) are properly recognized as partial or full matches.  
The goal is to achieve human-like contextual matching while maintaining compatibility with existing Supabase + OpenAI infrastructure.

---

## 1. Scope
- Applies to JD keywords extracted by the Industry / Process / Technical (Pillar) model.  
- Compares against resume keywords extracted and stored in Supabase.  
- Each comparison is limited to the same pillar type (Industry → Industry, Process → Process, etc.).  
- Outputs a **match score (0–1)** and a **fit category (Green / Yellow / Grey)** per keyword.

---

## 2. Problem (Current v1 Behavior)
The existing implementation uses **literal or token-based** string comparison, which fails to:
- Recognize contextually equivalent wording  
- Assign credit for partial matches or synonyms  
- Differentiate between near matches and unrelated text  

As a result, relevant terms (e.g., “cross-functional team leadership”) may not map to JD keywords (“cross-functional collaboration”), undercounting overall fit.

---

## 3. Solution Overview
Enhance the matching pipeline by introducing:
1. **Semantic vector comparison** using OpenAI embeddings  
2. **Weighted scoring tiers** for full / partial matches  
3. **Synonym and phrase expansion** for recall improvement  
4. **Pillar-scoped evaluation** to prevent cross-category confusion  
5. **Hybrid matching** (semantic + lexical) for robustness

---

## 4. Implementation Steps

### Step 1 — Generate Embeddings
For each extracted keyword (JD and Resume), generate embeddings using:

```
model: "text-embedding-3-small"
```

Batch embeddings for cost efficiency.  
Store each vector in Supabase in `embeddings` or `keyword_vectors` table with fields:
```json
{
  "term": "cross-functional collaboration",
  "pillar": "process",
  "source": "JD",
  "embedding": [ ... ]
}
```

Resume keywords use `"source": "resume"`.

---

### Step 2 — Pairwise Matching
For each JD keyword, compare only against **resume keywords within the same pillar**.

Compute cosine similarity:
```python
cosine = dot(a, b) / (norm(a) * norm(b))
```

Store the **max score per JD keyword**.

---

### Step 3 — Define Match Tiers
Apply the following thresholds and colors:

| Range | Fit Type | Color | Weight |
|-------|-----------|--------|--------|
| ≥ 0.80 | Strong Match | Green | 1.00 |
| 0.60–0.79 | Partial Match | Yellow | 0.65 |
| < 0.60 | Weak / No Match | Grey | 0.00 |

**Notes:**
- The 65% partial score preserves your existing “yellow” logic.  
- Color codes directly integrate into the visualization UI.

---

### Step 4 — Optional Lexical Fallback
To strengthen edge cases (acronyms or near-exact phrases):
- Compute a lexical ratio using `rapidfuzz.fuzz.partial_ratio(term1, term2)`  
- Combine results:
```
final_score = 0.7 * semantic_score + 0.3 * lexical_ratio
```
If `final_score >= 0.80`, treat as Green even if raw embedding < 0.80.

---

### Step 5 — Keyword Expansion (Synonym Boost)
Before embedding, enrich each JD keyword using OpenAI synonym expansion:
```
System: You are a keyword enrichment engine.
User: For the phrase "cross-functional collaboration", generate 3 semantically similar alternatives that might appear in resumes.
```
Store results in a `keyword_aliases` table:
```json
{
  "keyword": "cross-functional collaboration",
  "aliases": ["team collaboration", "cross-department coordination", "multi-team projects"]
}
```
During matching, embed all aliases for comparison and take the **highest similarity**.

---

### Step 6 — Pillar-Scoped Aggregation
After all JD keywords are scored:
- Group matches by pillar  
- Compute average match score per pillar  
- Output per-pillar summary and overall weighted average.

Example output (JSON):
```json
{
  "industry": { "avg_score": 0.72, "top_matches": 5 },
  "process": { "avg_score": 0.83, "top_matches": 8 },
  "technical": { "avg_score": 0.61, "top_matches": 6 },
  "overall_fit": 0.73
}
```

---

## 5. Display Mapping (Visual)
Use existing green/yellow/grey indicators in the referral page UI.

| Color | Meaning | Example |
|--------|----------|----------|
| 🟢 Green | Strong match (≥ 0.80) | “Project Management” ↔ “Managed enterprise projects” |
| 🟡 Yellow | Partial match (0.60–0.79) | “Cross-functional collaboration” ↔ “Collaborated across departments” |
| ⚪ Grey | No match (< 0.60) | “Healthcare compliance” ↔ *no similar resume content* |

---

## 6. Acceptance Criteria
- [ ] Resume keywords and JD keywords compared semantically, not literally.  
- [ ] Each JD term receives a cosine similarity score.  
- [ ] Matches color-coded (Green / Yellow / Grey).  
- [ ] Average fit scores generated per pillar and overall.  
- [ ] Optional lexical fallback integrated for better recall.  
- [ ] Existing visualization components remain unchanged.  
- [ ] All outputs stored in Supabase (`fit_score_details`).

---

## 7. Implementation Notes (for Windsurf)
- Reuse existing OpenAI client integration and Supabase schema.  
- Create a small helper function: `get_semantic_fit_score(jd_keywords, resume_keywords)` returning pillar-structured scores.  
- Preserve modularity so this can later be reused for candidate-to-job comparison outside referrals.

---

## 8. Future Enhancements
- Add adaptive weighting (different thresholds per pillar).  
- Store embeddings for all new resumes to enable instant comparison.  
- Add a “confidence narrative” summarizing where alignment is strongest or weakest.  
- Explore fine-tuned similarity model for improved domain precision.

---

## Summary
This upgrade transitions your system from **literal matching** to **semantic understanding**, making the JD–resume fit analysis more nuanced, fair, and representative of real-world alignment.  
It also future-proofs your referral and fit-score workflow by supporting intelligent keyword mapping, weighted scoring, and contextual matching — giving internal referrers a clearer, data-backed story of fit.
