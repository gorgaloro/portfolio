# Admin Control Panel – Referral Page Workflow

## Epic: Admin Configuration and Control Panel

### Purpose
The admin control panel provides a centralized interface for configuration, management, and oversight of referral page generation workflows. It allows adjustment of scoring parameters, model behavior, and visual presentation. Administrators can review AI-generated data, modify logic, and regenerate referral pages when conditions change.

### Workflow Overview
The control panel enables administrators to manage system configurations that determine how job and candidate data are evaluated. All updates apply automatically in subsequent processing cycles. The interface provides a consolidated view of all generated pages and supports versioned regeneration.

### Functional Details
- Administrators configure settings such as scoring behavior, alignment color ranges, and text-generation preferences.  
- Adjustments are applied globally for all future analyses without requiring code deployment.  
- The control panel displays an index of previously generated referral pages, with access to review, edit, or regenerate them.  
- The system periodically checks for new data and flags pages needing updates.

### Expected Results
Administrative users have full visibility and control over system behavior. Updates to configuration and scoring logic propagate seamlessly through the workflow, ensuring outputs remain current and aligned with evolving requirements.

### Future Enhancements
Future iterations may introduce version tracking and rollback capabilities for configuration changes, along with contextual analytics for evaluating the impact of parameter adjustments.

---

## Epic: Attribute Review and Adjustment

### Purpose
This workflow enables the review and refinement of AI-generated attributes following an enrichment cycle. It allows administrators to clarify, reorganize, or suppress individual items to improve the quality and tone of the referral page output.

### Workflow Overview
After enrichment, extracted attributes are presented for human validation. Administrators can edit attribute text, modify classification, and adjust relevance indicators to refine the final presentation of candidate alignment.

### Functional Details
- Administrators can rename attributes to use more descriptive or human-readable phrasing.  
- Items can be reassigned between pillars to correct categorization.  
- Non-essential attributes can be hidden from the published page.  
- Alignment indicators may be adjusted to reflect human judgment.  
- All refinements are stored separately to preserve original model output for reference.

### Expected Results
Referral pages reflect nuanced, context-aware interpretations of AI-generated content. Human intervention ensures that the presentation aligns with real-world understanding and professional tone.

### Future Enhancements
Optional support for bulk-edit tools and attribute comparison features may be introduced to streamline the review process.

---

## Epic: Skill Label Assistance

### Purpose
The skill label assistant generates concise, human-readable skill phrases from extracted attributes, improving clarity and presentation consistency across referral pages.

### Workflow Overview
Administrators can request AI-suggested replacements for keyword-based phrases. The assistant leverages contextual data to create short, descriptive skill summaries optimized for readability and display.

### Functional Details
- Suggestions are generated individually and reviewed by the administrator before acceptance.  
- Word count for suggestions is limited by a configurable setting.  
- The administrator may accept, reject, or manually adjust the suggested label.  
- Suggestions retain contextual consistency with the job description and pillar category.

### Expected Results
Referral pages display streamlined, natural language descriptors rather than repetitive or technical phrases. The result improves scanability for internal referrers reviewing candidate strengths.

### Future Enhancements
Possible extensions include stylistic tuning for tone and length preferences and batch suggestion generation for larger sets of attributes.

---

## Epic: Referral Page Generation

### Purpose
Referral page generation produces a company-specific summary of candidate alignment across multiple roles. Each page presents enriched job data, AI-driven evaluations, and edited attribute summaries in a cohesive layout.

### Workflow Overview
Administrators select a company and associated jobs for analysis. The system processes the data, generates alignment assessments, and presents a preview for review and editing. Once finalized, the referral page becomes part of the published set.

### Functional Details
- Administrators initiate generation for one or more companies.  
- The system performs enrichment and calculates alignment metrics.  
- Job and candidate information are summarized in a standardized format.  
- Administrators review and approve the layout before publication.  
- Published pages remain available for viewing and future updates.

### Expected Results
Generated referral pages provide a clear, data-backed overview of how the candidate aligns with key opportunities. They offer a consistent and credible presentation framework for referral communications.

### Future Enhancements
Future updates may introduce automated pagination, design templates, and dynamic linking between referral pages and source job systems.

---

## Epic: Referral Page Lifecycle Management

### Purpose
Lifecycle management ensures referral pages remain accurate, accessible, and reflective of the latest available data. The system provides visibility into existing pages and supports regeneration when updates occur.

### Workflow Overview
Administrators manage previously generated pages through a consolidated dashboard. The system identifies which pages require updates, allows edits or regenerations, and maintains continuity between versions.

### Functional Details
- Pages are listed chronologically with relevant metadata.  
- Administrators can open any existing page for edit, review, or regeneration.  
- The system automatically flags pages impacted by new job data or changed configurations.  
- Administrators can choose to include or ignore newly detected jobs.  
- Regenerated pages replace outdated versions while retaining original access links.

### Expected Results
All referral pages remain synchronized with the most recent data, ensuring up-to-date representation. Administrators can efficiently maintain and enhance content over time without redundancy.

### Future Enhancements
Notifications for newly detected updates and version comparison tools may be introduced for better tracking and validation.

---

## Epic: Continuous Synchronization and Update Detection

### Purpose
Continuous synchronization ensures all data sources remain current and relevant. The system routinely checks for new or modified job entries and identifies when updates affect existing referral content.

### Workflow Overview
A scheduled synchronization process retrieves the latest job and company data, compares it to previous records, and highlights any discrepancies that require administrative attention.

### Functional Details
- Synchronization runs at predefined intervals.  
- When new data is identified, related pages are automatically flagged.  
- The control panel visually indicates which pages need review.  
- Administrators can acknowledge, update, or ignore detected changes.  
- The process minimizes manual monitoring while maintaining freshness.

### Expected Results
Referral pages consistently reflect the latest job and company information, maintaining alignment with external systems. The synchronization cycle provides proactive update management and reduces manual intervention.

### Future Enhancements
Planned improvements include adjustable synchronization frequency and customizable alert preferences.

---

## Epic: Regeneration and Version Control

### Purpose
Regeneration enables referral pages to be updated using current enrichment logic and configuration values while preserving prior iterations for reference.

### Workflow Overview
When configuration parameters or enrichment results change, administrators can regenerate existing referral pages. The regenerated output supersedes the prior version while maintaining continuity for any shared access links.

### Functional Details
- Regeneration applies the latest logic and configuration without manual intervention.  
- Administrators may regenerate individual pages or batches.  
- The previous output remains archived for historical reference.  
- The system preserves the visual structure and URL continuity of regenerated pages.

### Expected Results
Referral pages remain consistent and current with the latest configuration and scoring models while maintaining backward compatibility for end users.

### Future Enhancements
Planned updates include visual comparison between versions, version history auditing, and change analytics to track evolution of scoring over time.
