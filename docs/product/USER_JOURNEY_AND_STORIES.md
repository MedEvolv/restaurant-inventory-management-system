# User journeys and user stories

## Release update 29 September 2026

US01–14 andUS18 software contracts are implemented within the local-demo limits. US13 voice availability/usefulness and actual content comprehension still require device/kitchen testing. US15–17 remain conditional.

[Current release, checks and remaining scope](CURRENT_RELEASE.md).

Version 1.1, updated 29 September 2026. Journeys are **hypothesized scenarios**, not observed interview narratives. They expose assumptions and exceptions to test. Story acceptance defines software behavior; satisfying a story does not establish customer demand.

## Current journey: unavailable answer during service

| Stage | Proposed action and touchpoint | Uncertainty / possible friction | Evidence needed |
|---|---|---|---|
| Task begins | Cook receives dish/prep assignment | What constitutes a portion or completed task? | Observe real handoff and portion unit |
| Decision arises | Unfamiliar method, missing ingredient or house standard | Is this actually a recurring stuck moment? | Specific recent incident |
| Seek authority | Ask chef/colleague or find message/binder/wall note | Person absent; old or ambiguous material possible | Ordered actual workaround and artifact |
| Decide | Follow answer, wait, change dish or guess | Applicability and confidence may be unclear | Decision basis and time |
| Execute | Prep/serve, rework or take dish off | Consequence may be negligible or material | Reviewer confirms result and cause |
| Next shift | Knowledge stays with person/message or is formalized | Repeat question/version drift may occur | Follow a later shift, not hypothetical frequency |

Possible emotional states such as uncertainty or relief are hypotheses to elicit, not quotes. A chef already available may make the journey efficient; include that counterexample.

## Proposed staff journey: correct next action

| Stage | Product touchpoint and user action | Expected benefit | Exception and recovery | Measurement |
|---|---|---|---|---|
| Enter | Open Today; confirm service date | Correct plan context | Empty plan: select date or ask manager; API failure: retry | Entry-to-dish time, errors |
| Choose | Select dish; confirm portions/quantities | Apply intended recipe to current amount | Archived/missing recipe: do not proceed silently | Wrong context attempts |
| Understand | Read selected reviewed language, photo; optional hear | Obtain applicable instruction | Translation absent: labelled available-language fallback; matching voice absent: text | Comprehension/correctness by language |
| Verify applicability | Check published owner/version and current recipe | Avoid using outdated method | Stale: method/photo suppressed, manager review route | Correct stale recognition |
| Act or escalate | Follow correct next action or submit contextual question | Resolve uncertainty without unsupported answer | Pending/retry preserves captured question; queue alone is unresolved | Correct resolution and total elapsed time |
| Continue | Resume preparation; later return if needed | Repeat useful behavior | Manager response requires applicability; no automatic public policy | Independent reuse, task result |

Minimal critical path: Today → dish → approved answer. “App looks finished” includes readable mobile controls, error/empty states, image fallbacks and reliable recovery, not merely attractive photos.

## Manager journey: maintain a trusted answer

| Stage | Action | Failure mode to prevent | Definition of done |
|---|---|---|---|
| Set up | Select active recipe and named owner | Wrong recipe/quantity/unit or owner | Current recipe verified |
| Draft | Write essential method, optional handling/substitutions/portion/source/next action; language variants | Form overload, mistranslation, accidental loss | Draft stored, languages clearly distinguishable |
| Review | Compare Hindi/English to intended standard; add process/portion photo | Decorative image or unreviewed translation treated as authoritative | Available language(s) explicitly reviewed |
| Publish | Explicitly publish reviewed snapshot | Save mistaken for publish; pending edits overwrite published content | Staff sees exact approved version |
| Respond | Resolve local question, decide whether reusable guide needs revision | Queue marked resolved without an actionable answer | Response/context recorded; publication separate |
| Update | Recipe/content changes prompt review | Old guidance remains apparently current | Staff stale state until new review |
| Recover | Backup/restore or reopen after restart | Missing photo/question or lost history | Data and approval boundaries retained |

The content owner is part of the service design. Staff retrieval time saved must be considered alongside manager upkeep. Shared pilot identity/roles come before claims that only an authorized manager can publish.

## Conditional future journeys

Weekly planning: manager defines service slots and portions → demand computed chronologically → stock eligible at each service allocated once → shortages explained → manager reviews draft purchase → actual receipt entered separately. Changing a plan must show downstream consequences and stale draft status.

Prepared batches: worker identifies labelled input lots → records actual production/yield → inputs consumed atomically and output batch created → reviewed deadline/conditions assigned → eligible batch allocated by service time → actual usage recorded once → hold/disposal/lineage retained. Curries/sauces/chutneys are examples, not default expiry categories.

## Stories and acceptance tests

### US01 — Reach the right service

As a cook starting a service, I want today's planned dishes with an explicit date, so I can find the correct task. **Given** a plan exists, **when** I open Today, **then** its dishes and portions appear. Given no plan, show an honest empty state and useful date navigation. Given a fetch failure, show retry without disguising it as empty. Maps: J1/J2, R01, F01. Verify: component state tests and phone/laptop browser flow.

### US02 — Use exact quantities

As a cook, I want current ingredient amounts for the selected dish/portions, so I do not use a quantity for another service. Given 0.0125 kg per portion and 30 portions, show the canonical 0.375 kg result. Changing portions refreshes quantities and retains current approved method unless the recipe itself changed. Maps: R01/R06, F06. Verify: backend arithmetic, stale request/reload regression and browser quantity assertion.

### US03 — Trust the approved answer

As a cook, I want the kitchen's published method and owner, so I can distinguish it from an unfinished draft. Given published v2 and saved draft v3, staff continues to see v2. Draft-only material/photos must not leak through staff endpoints. Maps: J1, R02, F02–05. Verify: API snapshot tests and staff/manager browser flow.

### US04 — Know when an answer is absent

As a cook facing a missing instruction, I want an explicit unanswered state and responsible manager route, so I do not treat a generic answer as house policy. No invented method appears; task context remains visible. Maps: R02/R07, F23. Verify: missing/error states and unsupported pilot tasks.

### US05 — Save without publishing

As a manager, I want to edit and save a draft separately from publishing, so review remains deliberate. Unsaved text remains dirty; failed save/publish is visible; conflicting operations/navigation are blocked or require explicit discard; archived recipes are read-only. Maps: R03, F03. Verify: deferred response/dirty-state tests and API version conflict.

### US06 — Reject obsolete guidance

As a cook, I want changed recipes to require review, so I do not apply a method approved for different ingredients/units. A method-relevant edit suppresses published method/photos in all languages; date/portions alone does not. Maps: R04, F03. Verify: fingerprint tests and actual recipe-edit browser regression.

### US07 — Interpret a useful photo

As a cook, I want a reviewed process/portion image beside the method, so I can resolve visual ambiguity. Valid approved image loads after reload/restart; missing image leaves readable method; manager draft deletion does not remove current published image. Demo provenance remains explicit. Maps: R05, F02. Verify: validation/media API tests, image load browser assertion and visual review.

### US08 — Retry an unanswered question safely

As a cook, I want to submit one contextual question and safely retry a failed response, so the manager receives the intended request once. Same captured payload reuses its idempotency key; changed payload gets a new key; pending controls prevent overwriting intent. No external message sent. Maps: R07, F23. Verify: concurrent API duplicate and frontend retry tests.

### US09 — Resolve and reuse learning

As a manager, I want a question queue and explicit resolution, so the staff member gets the appropriate next action and recurring issues can inform reviewed guidance. Resolution and publication are separate; a queue status cannot imply a policy was approved. Maps: R07, F23. Verify: response/status persistence; pilot reviewer confirms resolution before metric count.

### US10 — Choose Hindi or English

As a staff member or manager, I want a persistent हिन्दी / English choice, so interface labels suit my preferred language. Toggle updates labels and page language; reload retains choice; default is Hindi; saved names, questions, quantities and drafts are unchanged. Maps: R08, F40. Verify: preference persistence, editing continuity and laptop/phone browser checks.

### US11 — Review bilingual instructions

As a manager/content reviewer, I want separate Hindi/English fields for the same recipe revision and an explicit publication boundary, so both languages convey our intended policy. Saving translated draft does not alter staff's current snapshot; publishing exposes only reviewed available language(s); old Hindi-only documents remain usable. Maps: R09, F41. Verify: round-trip/migration, publication isolation, review flags and reviewer semantic comparison. **Implemented in the local release; real reviewer semantic approval remains a pilot gate.**

### US12 — Understand incomplete translation

As a cook choosing English with only Hindi approved, I want a clear fallback notice, so I know which language I am reading and can ask for help. Never auto-translate or label Hindi as English; switching back restores intended presentation; stale suppression still applies. Maps: R10, F41. Verify: both fallback directions, missing guide and stale cases.

### US13 — Hear the displayed answer when available

As a cook, I want optional playback in the actual content language, so I can hear reviewed instructions. Matching local voice only; stop/replay; language/dish change cancels prior speech; no matching voice shows text fallback. Microphone/cloud speech absent from this story. Maps: R11, F08. Verify: speech mock capability/cancellation tests and actual-device experiment.

### US14 — Keep operational records intact

As a manager, I want plans/receipts/usage/waste/purchase drafts to retain their meaning, so guidance features do not corrupt stock. Draft orders do not add stock; actual receipts do; previous history survives migration/restart/restore. Maps: R12, baseline/F10. Verify: existing regressions, upgrade checksums and backup recovery.

### US15 — Review seven days of feasible prep (conditional)

As a planning manager, I want meal slots and portions projected in order, so I can see shortages before the affected service. Allocate each available quantity once; do not count future arrival before receipt; plan edit invalidates affected drafts. Maps: J2, F12–14. Verify later: cross-day depletion, delivery timing, expired/unknown lot, buffers/units and stale edits.

### US16 — Choose an eligible prepared batch (conditional)

As the worker handling prepared products, I want identity, remaining amount and reviewed condition/deadline for each batch, so I can use eligible stock earlier or hold it. Production atomically consumes inputs/creates actual yield; no double deduction; missing conditions block automatic eligibility; no silent expiry renewal. Maps: J3, F15–19. Verify later: lineage, cycle rejection, yields, timestamp boundaries, service eligibility and hold/review.

### US17 — Use reviewed source guidance (conditional)

As the policy owner, I want a source passage, edition, applicability and review attached to a checklist, so staff know which instructions apply locally. PDF extraction or EatByDate reference alone does not publish policy; source conflicts and missing conditions require review. Maps: F20/F30–31. Verify later: provenance, conflict and no unreviewed rule activation.

### US18 — Plan meals on a calendar (authorized local demo)

As a planning manager, I want to select a date, add dishes to breakfast/lunch/dinner, choose 30–100 portions in steps of ten and set the meal's serving time, so staff can see the same service plan. Save/reload retains slot, portions and time; older unscheduled plans and legacy counts remain exact and visible. Daily arithmetic counts each dish once. Menu editing, ingredient buying and recipe maintenance have separate views. Maps: R13–16, J2, bounded F06/F09/F12. Verify now: real API persistence, date-switch response order, busy action lock, legacy data, empty meal and phone/desktop/bilingual browser flows. Chronological cross-day stock depletion is US15 later scope.

## Story mapping and release slice

First guidance slice: US01–09 and US14; optional local Hindi playback supports US13. Delivered bilingual increment: US10–13; bounded calendar: US18. Protected pilot adds real role enforcement, reviewed content and measurement, then tests the complete journey. US15–17 remain conditional roadmap stories. These are connected vertical slices, not a plan to build every database/table before anyone can complete a task.

Journey review questions: Can the cook get the correct answer faster than the current workaround? Can they recognize a missing/stale/translated answer? Can the manager maintain both languages? Which step causes abandonment? Observe these rather than equating completion of a UI test with usability.
