# User personas and stakeholder model

## Release update 29 September 2026

The delivered Today and manager flows follow P01/P02 design assumptions. Their language, vocabulary, device access and upkeep needs still require observation; P04 remains conditional.

[Current release, checks and remaining scope](CURRENT_RELEASE.md).

Version 1.1, updated 29 September 2026. **All customer personas below are proto-personas.** No completed primary research exists in the supplied records. Roles describe provisional behavior and responsibilities; no ages, income, gender, invented quotes or stock-photo biography are used.

## Provisional ideal customer profile

One professional kitchen in Delhi–Gurgaon with a named knowledge owner and at least one staff member who sometimes performs a task without that person's immediate help. The mentor's default recruiting candidate is a small independent/full-service kitchen. A hostel/institutional kitchen may be compared if it offers real access and the same incident; the fictional app demo does not validate that segment.

Positive screening signals to investigate: repeated house-specific decisions; intended instructions vary from generic recipes; current answer requires interruption or retrieval; owner permits observation; someone can maintain reviewed instructions. Negative signals: answers already available reliably at the point of work; chef always immediately present; proprietary systems solve the job; no useful repeated incident; no content owner.

We do not claim a kitchen size, number of meals, annual revenue, market size or price fit without evidence. Independent, institutional and multi-site operations may have materially different approval and purchasing structures.

## P01 — Cook/prep assistant, provisional primary daily user

| Attribute | Working hypothesis | Validate through |
|---|---|---|
| Responsibility | Execute assigned dishes/prep correctly for the service | Observe actual assignment and task |
| Trigger | Unfamiliar method, house standard, quantity or substitution while senior unavailable | Most recent incident, not a generic preference question |
| Desired progress | Establish correct next action and finish the intended dish | Kitchen-reviewed result and time |
| Current alternative | Ask colleague/chef, check message/binder/wall note, rely on memory | Artifact and ordered behavior |
| Friction | Cannot find applicable answer quickly; unsure which version is current | Observe retrieval and interpretation |
| Trust requirement | This is our kitchen's approved instruction for the current recipe | Test owner/version/stale comprehension |
| Language | Hindi and/or English may help; actual reading vocabulary unknown | Ask and test the same real task in appropriate language |
| Modality | Text/photo/local audio are candidates; voice preference unknown | Compare correctness/time under actual conditions |

Design consequences: Today-first entry, dish/portion context, short approved steps, visible incomplete-language fallback, no draft exposure, and a clear responsible person when the answer is absent. Avoid assuming low literacy, private phone ownership or hands-free need.

Activation candidate: independently resolve one supported task correctly and recognize one unsupported case requiring escalation. Retention candidate: voluntary reuse in later comparable shifts. Those are desired future observations, not delivered outcomes.

## P02 — Head chef/kitchen manager, knowledge owner

| Attribute | Working hypothesis | Product consequence |
|---|---|---|
| Responsibility | Define preparation standard and handle exceptions | Named content owner and review boundary |
| Trigger | Repeated question, changed recipe, new staff or observed mistake | Draft reusable guidance; do not auto-publish queue responses |
| Desired progress | Standard remains usable while attention is elsewhere | Test interruptions avoided with correct outcomes |
| Current alternative | Explain verbally, send message/photo, write/update binder | Compare maintenance effort, not just staff retrieval |
| Friction | Version drift and repeated explanation may occur | Immutable publication and recipe staleness |
| Language role | May review Hindi, English or need another reviewer | Separate content availability; do not assume bilingual ability |
| Adoption burden | Enter/verify recipe, write instructions, take photos, update them | Measure setup and weekly review minutes |

Design consequences: essential fields first, language review explicit, optional sections expandable, save distinct from publish, visible dirty/pending state and archived context. A manager unable to maintain guidance may invalidate the business case even if staff like reading it.

## P03 — Owner/operator, provisional buyer/approver

Desired outcome hypothesis: maintain intended service quality and continuity with acceptable management overhead. May also care about rework, delays and attributable cost, but the degree is unknown. In a small kitchen P02 and P03 may be the same person; this must be recorded, not counted as independent evidence.

Questions that change investment: Which consequence matters? Who approves device use and guidance? What operating cost does the current workaround create? Who funds setup and ongoing review? Would they continue after a supported trial, and on what commercial terms? Do not set price from general enthusiasm or assume waste savings will fund the tool.

Design consequences: explain a narrow value proposition, show attributable outcomes with denominators, expose content upkeep and provide recoverable data. Billing/marketplaces do not belong in the first guidance release.

## P04 — Prepared-batch/stock responsible worker, conditional

This role becomes relevant if J3 is validated. Job: identify the actual eligible batch and remaining amount before use, with hold/review when conditions are missing. Needs physical label/identity, timestamps, storage observations, policy provenance and lineage. A cook's guidance persona alone cannot justify a full production ledger. Reject the assumption that a displayed date proves safe eligibility.

## Historical and excluded personas

Earlier **Renu**, market owner-cook, remains an explicitly hypothetical recruiting persona in the canon. It may overlap P02/P03, but there is no interview-derived Renu biography to quote. Home cook/pantry manager has a separate Guide B and is outside the current release. Multi-site operations and consumer nutrition/preferences need separate discovery.

## Roles and permission model

| Role | Intended protected-pilot permissions | Present local-demo limitation |
|---|---|---|
| Staff | Read approved current guidance, view assigned quantities, create local question | UI workspace selection is not authorization |
| Manager/content reviewer | Draft, review language(s), publish, resolve questions, maintain plans | Server-enforced role boundaries remain a pilot gate |
| Operator/admin | Manage access, recovery and kitchen settings | No authenticated multi-kitchen administration claimed |

Roles must be enforced on the server before shared pilot use; hiding a button is insufficient. Content reviewer may be a separate person from planning manager. Record authority, rather than assigning it to whoever edited last.

## Turning proto-personas into evidence-based personas

For each row retain/revise/delete the hypothesis after a real incident and observation; attach source locators and contradictory cases. Segment by circumstance, job and operating constraints before demographics. If the staff and manager jobs differ, preserve that distinction rather than averaging preferences. Refresh after the first pilot and before changing niche.

Course link: Session 2 physical pages 14–15 treats personas as research outputs. Until that evidence arrives, these are transparent design assumptions.
