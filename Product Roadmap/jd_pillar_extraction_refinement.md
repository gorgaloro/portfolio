# Instruction: Job Description Keyword Extraction by Pillar (Refined Version)

## Objective
Improve the accuracy and clarity of keyword extraction from job descriptions by separating the process into three distinct conceptual pillars:

1. **Industry** – the *environment or domain* the role operates in  
2. **Process** – the *responsibilities and operational mechanics* of the role  
3. **Technical** – the *systems, tools, and applied technical domains* enabling the work

This approach ensures that extracted keywords are semantically grouped, interpretable, and aligned with the “where / how / what” framework that mirrors real-world job structure.

---

## 1. Input
**Input parameters:**
- Raw job description text
- Optional: Company name (used to infer domain context)
- Optional: Normalized job title (for secondary context)

---

## 2. Pillar 1 — Industry / Domain / Context Keywords
**Purpose:** Identify sector-level and organizational context signals that describe *where* the work happens — the external market, operating environment, and organizational type.

**Concept:**  
This pillar captures the environmental and economic layer of the job — what kind of company this is, what space it operates in, and the type of ecosystem it serves.

**Prompt pseudo-structure:**
- **System:** “You extract industry, domain, and organizational context keywords from job descriptions. Use the company name and general market knowledge to infer missing context.”
- **User Content Includes:**
  - Full JD text
  - Optional company name (to infer likely industry)
  - Instruction to ignore process or technical terms unless they are clearly sector-specific

**Key instructions:**
- Identify up to **10** keywords or short phrases describing the employer’s **sector**, **market**, **audience**, or **operating context**.  
- Include inferred descriptors if the JD omits industry context (e.g., Databricks → *data/AI SaaS*; Parsons → *infrastructure / defense*).  
- Include phrases such as “regulated healthcare provider,” “B2B SaaS,” “public sector contractor,” “utility and energy infrastructure,” “startup environment.”  
- Exclude responsibilities, methods, or tools (those belong to Process or Technical pillars).  
- Label each entry with `pillar: industry`.  
- Output as a JSON array.

**Example Output:**
```json
{
  "keywords": [
    { "term": "critical infrastructure", "pillar": "industry" },
    { "term": "public sector utilities", "pillar": "industry" },
    { "term": "engineering and construction services", "pillar": "industry" },
    { "term": "federal and state compliance", "pillar": "industry" },
    { "term": "large-scale capital projects", "pillar": "industry" }
  ]
}
```

---

## 3. Pillar 2 — Process / Responsibilities / Operational Mechanics Keywords
**Purpose:** Identify the actions, workflows, and responsibilities that describe *how* the work gets done — the verbs and functions that define the day-to-day operations of the role.

**Concept:**  
This pillar represents the **mechanics of execution** — the planning, coordination, and delivery tasks that connect objectives to outcomes.  
It captures the verbs, responsibilities, and collaboration structures in the job description.

**Prompt pseudo-structure:**
- **System:** “You extract process, responsibility, and execution-related keywords from job descriptions. Focus on the verbs and functional duties that describe how the person operates within the organization.”
- **User Content Includes:**
  - Full JD text
  - Guidance to identify activity- and responsibility-based terms, not tools or systems

**Key instructions:**
- Identify up to **10** keywords or short phrases describing **duties, responsibilities, and operational mechanics**.  
- Focus on *actions* and *mechanics* of the job: planning, coordinating, analyzing, scheduling, tracking, communicating, managing, reporting, or delivering.  
- Include concepts like: `budget tracking`, `schedule management`, `vendor coordination`, `risk mitigation`, `stakeholder communication`.  
- Exclude system names, technical frameworks, or industry context.  
- Label each entry with `pillar: process`.  
- Output as a JSON array.

**Example Output:**
```json
{
  "keywords": [
    { "term": "project schedule management", "pillar": "process" },
    { "term": "cross-functional team coordination", "pillar": "process" },
    { "term": "risk and issue tracking", "pillar": "process" },
    { "term": "vendor oversight", "pillar": "process" },
    { "term": "change management and documentation", "pillar": "process" },
    { "term": "budget forecasting", "pillar": "process" },
    { "term": "stakeholder reporting", "pillar": "process" },
    { "term": "governance support", "pillar": "process" },
    { "term": "quality review", "pillar": "process" },
    { "term": "deliverable tracking", "pillar": "process" }
  ]
}
```

**Clarification:**  
- **Process = actions and responsibilities.**  
- Use verbs and workflow nouns (plan, lead, coordinate, oversee, manage).  
- If the phrase includes a tool reference (e.g., “manage budgets in eBuilder”), only capture the *action* portion (“budget management”).  
- **Heuristic:**  
  - If it describes what someone *does*, it’s Process.  
  - If it describes what *system or tool* they use, it’s Technical.  
  - If it describes *which sector or environment*, it’s Industry.

---

## 4. Pillar 3 — Technical / Systems / Tooling Keywords
**Purpose:** Identify the technologies, systems, architectures, and applied technical knowledge that describe *what* the work is done with — the tangible tools and frameworks referenced in the job description.

**Concept:**  
This pillar represents the **enabling layer** — the digital and technical ecosystem that supports execution.  
It includes both specific named tools (e.g., Salesforce, eBuilder, Tableau) and generic technical domains (e.g., QA testing, data pipelines, engineering systems).

**Prompt pseudo-structure:**
- **System:** “You extract technical, system, and tooling keywords from job descriptions. Focus on technologies, architectures, standards, and applied technical domains that represent how work is performed through systems or specialized knowledge.”
- **User Content Includes:**
  - Full JD text
  - Guidance to emphasize named platforms, standards, and technical nouns

**Key instructions:**
- Identify up to **10** keywords or short phrases describing technologies, tools, systems, architectures, frameworks, or methodologies.  
- Include both proprietary and generic references (e.g., `SAP`, `eBuilder`, `data pipelines`, `QA testing systems`, `Agile framework`).  
- Include standards or methodologies when mentioned (`ITIL`, `ISO 9001`, `PMBOK`, `Scrum`).  
- Exclude verbs or responsibilities (those belong to Process).  
- Exclude industry or domain context (those belong to Industry).  
- Label each entry with `pillar: technical`.  
- Output as a JSON array.

**Clarification: Boundary Rule Between Process and Technical**
- When a phrase combines an *action* and a *technical object* (e.g., “manage data pipelines,” “analyze reports in Tableau”):  
  - Extract the *action* under **Process** (`data pipeline management`).  
  - Extract the *object/tool* under **Technical** (`Tableau`, `data pipelines`).  
- Do **not** duplicate the same phrase across pillars.  
- Generic technical domains (e.g., “network architecture”, “data pipelines”) may still qualify as **Technical** if they imply system-level expertise, not just task execution.

**Example Output:**
```json
{
  "keywords": [
    { "term": "Tableau", "pillar": "technical" },
    { "term": "data pipelines", "pillar": "technical" },
    { "term": "QA/QC testing tools", "pillar": "technical" },
    { "term": "project management software", "pillar": "technical" },
    { "term": "Microsoft SharePoint", "pillar": "technical" },
    { "term": "Agile methodology", "pillar": "technical" },
    { "term": "ITIL framework", "pillar": "technical" },
    { "term": "integration APIs", "pillar": "technical" },
    { "term": "construction management systems", "pillar": "technical" },
    { "term": "data visualization tools", "pillar": "technical" }
  ]
}
```

**Heuristic Summary:**
| Pillar | Focus | Key Question | Example |
|--------|--------|---------------|----------|
| **Industry** | Domain, environment, sector | *Where does this work happen?* | Healthcare, AI SaaS, Construction |
| **Process** | Responsibilities, operations, workflows | *How is the work done?* | Schedule management, risk tracking |
| **Technical** | Systems, tools, frameworks | *What enables the work?* | eBuilder, Tableau, ITIL, APIs |

---

## Acceptance Criteria
- [ ] Each pillar extracted independently with up to 10 results each.  
- [ ] Verbs and workflow phrases classified under Process.  
- [ ] Systems, tools, and frameworks classified under Technical.  
- [ ] Domain and market signals classified under Industry.  
- [ ] No duplicate phrases across pillars.  
- [ ] Each result clearly labeled with its pillar in JSON output.

---

## Implementation Note for Windsurf
- Maintain existing Supabase schema for storing results.  
- This phase focuses solely on **pillar-level keyword extraction**.  
- Ranking, weighting, and scoring logic occur downstream in separate workflows.
