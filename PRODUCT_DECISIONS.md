# Product decisions and evidence boundaries

## Prior planning scope

One hostel/institutional kitchen, one manager or head chef, one planning date. The original build served tomorrow's prep-to-purchase decision. The submitted capstone described timely, trusted food guidance; later working notes emphasized inventory and spoilage and also discussed an independent restaurant niche. This MVP follows the supplied hostel workflow and retains **manager-authored handling/substitution guidance** as the bridge. It does not claim the earlier research established inventory as the dominant pain. No real interview recordings or measured savings were available for this build.

## Preserved planning baseline

| Priority | User story | Acceptance |
|---|---|---|
| P0 | As the manager, I record what arrived by lot and unit. | Exact compatible-unit conversions, cost/date provenance, optional supplier, visible unknown dates. |
| P0 | I plan multiple dishes by portions for a date. | Per-serving recipe quantities; recipe/plan edits and plan removal recalculate the breakdown. |
| P0 | I can explain and adjust what I should buy. | Required, physical, excluded, usable, buffer, increment and arithmetic are visible; quantities can be overridden in a persistent draft. |
| P0 | I record actual arrivals and losses without corrupting stock. | Drafts never add stock; partial actual receipts are tracked; selected-lot removals are atomic and cannot overdraw; retries are applied once. |
| P1 | I keep kitchen-specific guidance beside the workflow. | Ingredient/dish notes, handling or approved substitution, author and timestamp; no external AI guidance. |
| P1 | I can reproduce the capstone demonstration. | Fictional sample data, explore/walkthrough reset, laptop and phone browser checks. |

## Calculation and record decisions

- `BigDecimal` base quantities in g, ml or whole count. Mass and volume do not convert into each other. Precision is limited to six decimals in the base unit and fourteen integer digits; quantities outside the ledger range are rejected.
- Required amount is the sum of per-serving ingredient quantity × planned portions across dishes for the selected date. No yield multiplier or RIMS yield convention is used.
- Entered label dates before the plan date are excluded from the estimate pending review. Dates equal to the meal date remain in the estimate. Unknown dates remain in usable recorded stock **with a visible review flag**. This is a transparent planning convention requiring validation, not a food-safety verdict.
- Buffer defaults to zero and is per ingredient/date. Purchase increment is an ingredient setting; zero keeps the exact suggestion. Ordering rounds upward. Overrides can include zero and may differ from the suggested increment because they are manager decisions.
- Drafts are immutable snapshots. Revise a decision by reviewing the current plan and saving a new draft. Stock/recipe/plan/settings changes mark old snapshots stale; stale input cannot save a new draft.
- Actual receipts may be unlinked or linked to a draft line. Linked receipts cannot exceed outstanding quantity. Extra physical arrivals can be entered separately. Idempotency keys persist through uncertain retries; different content under the same key is rejected.
- Waste reasons: expired, spoiled, damaged, prep loss, overproduction, other. Ordinary usage and count discrepancy have separate movement kinds and are never counted as waste automatically. Count discrepancy currently supports a decrease only.
- The authoritative ledger, compatibility total and both movement/history records change in one MySQL transaction. Selected ingredient/lot rows are locked. A failed history insert rolls everything back.
- The original inventory/orders/history remain, with positive legacy stock imported as an opening lot. Original stock mutations are blocked at HTTP so they cannot bypass the new ledger. No production database was accessed.

## Excluded from this release

POS, billing, multi-site access, supplier marketplaces/messaging, automatic forecasts/orders, LLM chat, automated food-safety advice, density/yield calculations, actual stock verification, production authentication, stocktake increases, notification delivery and measured impact claims. A complete schema/runtime second system in Node or Flutter is not introduced.

## Assumptions to validate in interviews

1. The target manager regularly decides quantities from tomorrow's menu and recorded stock; ask for the last concrete example.
2. Dishes and portions are known early enough to support this decision. Ask how changes are communicated.
3. Per-serving ingredient quantities are stable enough to be useful. Compare written quantities with observed prep and corrections.
4. Staff can maintain receipt lots and date provenance. Observe how labels, unknown dates and spoilage are handled today.
5. Managers want a reviewable draft and retain authority over quantity changes. Record actual override reasons.
6. A local single-manager workflow is enough for a pilot. Determine role, device, connectivity and reconciliation needs before hosting.

## Prior planning roadmap (retained context)

R1 is this functional local demo. A hosted pilot adds server authentication, environment hardening, supported migration dependencies, backups, explicit counted-increase adjustments and reconciliation, and tests on an actual kitchen phone. R2 follows evidence: waste cost reporting with price provenance, notifications or supplier export only if they solve observed work.

Start a small design-partner pilot with one hostel kitchen after validating the decision moment. Recruit the manager and receiving/prep staff together; observe a complete planning and receipt cycle. Measure current planning time and manual corrections, then compare the pilot. Do not promise waste or money savings from seeded arithmetic. The proposition is a clearer, reviewable purchase decision; pricing and adoption remain hypotheses.

## Focused Phase 2 decisions — 28 September 2026

Current lead: staff Today → scheduled dish → applicable published Hindi method/notes/task photos/current quantities → recorded next action or explicit escalation. The professional-kitchen job remains a hypothesis; Hindi and Delhi–Gurgaon are confirmed rollout choices. Implementation was authorized after the phased roadmap. No interview, observed kitchen task, adoption result or savings claim was fabricated.

- Separate guidance documents from legacy notes: mutable versioned drafts, immutable publications, explicit ownership/applicability/next action and demo labels; no automatic approval.
- Recipe-context fingerprint includes active status, recipe/ingredient names, IDs and per-serving units/quantities. Changed context suppresses old staff instructions/photos; date/covers changes only scale quantities. Managers preserve history and explicitly review/save/republish.
- Today quantities remain server BigDecimal arithmetic in original recipe units. No food-safety or expiry inference.
- Validated persistent JPEG/PNG task media has frozen publication membership and missing-image fallback. AI-generated fixtures remain fictional illustrations.
- Local unanswered questions have reporter/date, stable uncertain retry key and manager resolution. No message or notification delivery.
- Optional browser playback requires device-local Hindi voice; text always remains. No microphone/STT/LLM/speech API; its user value remains untested.
- Local staff/manager views are not permission enforcement. Real content review, auth/data access and deployment backup/recovery are pilot gates.
- Original lot/planning/draft/receipt/waste/usage/notes remain. A reproduced original PlanPanel reload race was corrected.

Engineering checks verify contracts, persistence and UI behavior, not correct independent food preparation. Research and one-kitchen pilot are outstanding. Intermediate-batch and chronological stock-reservation branches require actual recurring incidents, rather than automatic expansion.

## Approved calendar and usability increment — 29 September 2026

The user's direct request for an urgent demo, weekly calendar, breakfast/lunch/dinner, serving times and 30–100 portions authorizes this bounded local calendar now. The approved persona-aligned design report is the implementation target; this supersedes the earlier calendar deferral without creating customer-research evidence.

- P01 opens Today, reads exact assigned quantities and applicable published guidance, and asks the manager when needed. P02 uses Plan meals, Guides and More, with support operations secondary.
- New plans default to 50 and offer 30–100 by 10. Existing quantities outside that range stay exact as an option for that existing plan only; old plans migrate to UNASSIGNED without inferred meal classification.
- Serving times belong to date plus meal. Defaults 08:00/13:00/20:00 are derived until an explicit manager save; staff see them read-only. Strict HH:mm validation rejects 24:00.
- Counts describe dish entries and dish portions, not unique diners. The daily estimator includes all meals once. A weekly calendar does not reserve stock across dates.
- Scheduling is excluded from preparation context and from the original V8 purchase fingerprint projection. Genuine portion/recipe/stock/settings changes still affect purchase snapshots as appropriate.
- Hindi/English interface choice persists. Publication freezes only explicitly reviewed authored languages; fallback names the actual content language. No machine translation or LLM is introduced.
- Guide authoring starts with a list and focused New/Open editor. Save and Publish remain distinct. Unsaved bilingual work survives interface-language and workspace navigation; media/source detail is secondary.
- Existing receipts/cost, lot dates, overrides/partial arrivals, waste/usage/count decreases, notes and history remain reachable under More. Reset is initially collapsed and retains explicit confirmation.

Fresh/upgrade/restart/restore and browser checks are local engineering gates. Actual kitchen content approval, protected server roles and device observation remain pilot gates. Comparator patterns support layout choices, not measured improvements. Prepared batches and EatByDate automated ingestion are not implemented by this increment.

## Delivery status 29 September 2026

Approved guidance/bilingual/calendar scope is implemented, engineering-accepted and published on the MedEvolv fork.39backend/39frontend/8browser checks; existing data and purchase fingerprints preserved. Source release4d0962f. Prior planning exclusions are historical; the explicit calendar amendment is delivered. Customer research, semantic content review and protected pilot remain open. See docs/product/CURRENT_RELEASE.md.

## UI refinement decision — integrated 29 September 2026

Integrated bounded refinement: consistent RestaurantIQ-inspired navy/blue/white shell, selected navigation, readable bilingual controls, searchable Hindi/English recipe selectors in Plan meals and New Guide with selection preserved, and three selected-date manager counts. Count planned dish entries including unassigned; non-exhausted lots with a recorded label date before selected plan date; and non-exhausted lots without a label date. Lot counts link to More → Stock. Ingredient load/refresh failures, including after a write, show unavailable rather than zero. Recorded dates are review prompts only. Keep Questions as-is; no new question count/filter, charts, tables, API/schema/dependency/database change. Retain the existing 32-recipe catalog. Sol accepted 39 frontend tests across 10 files, zero-warning lint and a 34-module build; all eight isolated browser workflows passed in 1.6 minutes. The old 39 backend test result is reused because the increment made no backend changes. Read-only live Playwright confirmed bilingual planner search, preserved selected recipe/50 portions, no-match, Guides search, 390px Hindi without overflow, zero JS errors and unchanged stored data.

## Kitchen Saathi increment — locally verified

Institutional messes/commercial kitchens remain user-selected positioning, not field-validated. The accepted 2:1 Cook/Manager bento, emerald styling, four source-backed metric cards, 350/custom portions and exact read-only recipe preview are implemented and locally verified. Live checks covered all cards, weekday options/reset, preview +/- without Save, mobile navigation, no overflow/errors/POSTs, and exact preservation of seven API snapshots. `npm ci` completed with 348 packages. Remote publication remains pending. Preserve bilingual reviewed content, stale-guidance suppression, fallback and escalation. No unsupported finance, savings, supplier-performance or purchase-order claims. See docs/product/KITCHEN_SAATHI_DESIGN.md and VERIFICATION.md.
