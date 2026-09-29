# Group 1 product documentation

## Release update 29 September 2026

The local guidance/bilingual/calendar redesign is complete and GitHub-published. The bounded visual/search refinement and selected-date manager strip are integrated and engineering-accepted: 39 frontend tests/10 files, zero-warning lint, a 34-module build and eight isolated laptop/phone browser workflows passed. The prior 39 backend tests were reused; no backend code changed. Start with CURRENT_RELEASE.md for delivery status, then the detailed documents below.

[Current release, checks and remaining scope](CURRENT_RELEASE.md).

**Product:** Kitchen Guidance + Prep & Purchase (working name)  
**Version:** 1.1, 29 September 2026  
**Purpose:** capstone review, product decisions and phased implementation  
**Team:** Kelly Martin, Harshit Sahu, Moksh Jain, Nipun Agarwal and Ishaan Wadhwa

## Product direction

Help a cook resolve a specific preparation decision using the kitchen's current, manager-approved instructions when the experienced person is unavailable. Start with one professional kitchen in Delhi–Gurgaon. Preserve the existing prep/purchase tools; add connected planning and prepared-batch workflows only after evidence establishes their value.

**Evidence status:** the supplied project records contain zero completed field interviews and no real interview tapes. These documents specify a product hypothesis and proposed tests. They do not claim customer validation, proven waste reduction or product-market fit. The personas and journeys are provisional. Synthetic interviews and automated app tests are separately labelled.

The user has requested a Hindi/English interface toggle **and separately reviewed guidance in both languages**. This supersedes the older Hindi-only interface proposal. Broader multilingual support remains outside the current release. Documentation preceded implementation of the current local release. The RestaurantIQ-inspired shell, bilingual recipe search and scoped manager actions are integrated and verified.

**Later user steering on the same date:** add a weekly calendar, 30–100 portions in steps of ten, breakfast/lunch/dinner and editable serving times, and revamp the interface around the user. This authorizes a local menu-planning demo now, ahead of the earlier conditional weekly phase. It does not establish demand or validate weekly stock allocation. The exact scope and checks are recorded in the [usability implementation contract](UX_IMPLEMENTATION_CONTRACT.md); actual implementation results are in CURRENT_RELEASE.md and the application verification record.

## Read in this order

| Document | What it answers |
|---|---|
| [PRD](PRD.md) | What are we building, for whom, why, and under which acceptance criteria? |
| [Research insights and evidence](RESEARCH_INSIGHTS.md) | What do we know, what is hypothesized, and what must primary research establish? |
| [Personas](PERSONAS.md) | Who uses, maintains, approves and buys the product? |
| [Journeys and user stories](USER_JOURNEY_AND_STORIES.md) | How does the job unfold, including exceptions and testable stories? |
| [Success metrics and North Star](SUCCESS_METRICS.md) | How will we distinguish delivered value from feature usage? |
| [MoSCoW and RICE prioritization](PRIORITIZATION.md) | What belongs in the next release, and why are later bets conditional? |
| [Product roadmap](ROADMAP.md) | What is Now, Next and Later, with phase gates, tests and owners? |
| [Source register and course alignment](SOURCES_AND_COURSE_ALIGNMENT.md) | Which supplied materials informed each decision? |
| [Kitchen MVP usability design report](Kitchen%20MVP%20Usability%20Design%20Report.docx) · [reading copy](design-report-preview/index.html) | Persona aligned simplification, official meez/Apicbase/Paprika interaction review, RestaurantIQ-inspired refinement criteria and proposed usability checks. The UI refinement is engineering-accepted; Word pagination remains unverified. |
| [RestaurantIQ design reuse assessment](RESTAURANTIQ_DESIGN_REUSE.md) | Source patterns, local adaptations and constraints for the current bounded UI refinement. |
| [Kitchen Saathi design contract](KITCHEN_SAATHI_DESIGN.md) | Implemented and locally verified Kitchen Saathi contract; remote publication pending. |

## Review decisions

1. Confirm access to a specific kitchen and choose the first daily actor. The mentor's default is a small independent/full-service kitchen; an institutional kitchen is a candidate, not a research finding.
2. Select the leading job after recent-incident discovery: guidance, prep/purchase planning or prepared-batch handling. They are separate jobs.
3. Validate guidance against the actual alternative: a nearby cook, call, WhatsApp, binder or wall instruction.
4. Before shared pilot use, establish server-enforced roles, named policy owners, reviewed real content, backup recovery and measurement.
5. Review proposed pilot targets after measuring the baseline. RICE inputs are scenario assumptions, not measured reach or forecasts.

## Document governance

This dated package refines earlier planning; it does not overwrite the submitted problem statement, interview canon or historical feature catalog. New findings should link to a real tape/observation before changing an evidence label. Product status is tracked in the [roadmap](ROADMAP.md); actual engineering results belong in the application's verification report. No customer data, audio or private interview content is sent to external services by this documentation work.

The roadmap intentionally has no invented launch dates or prices. Estimated effort is for comparing work, not a delivery promise. Human product ownership, content review and pilot decisions remain necessary even when Luna implements and Sol audits the code.
