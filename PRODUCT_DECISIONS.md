# Product decisions and evidence boundaries

## Scope

One hostel/institutional kitchen, one manager or head chef, one planning date. The build serves tomorrow's prep-to-purchase decision. The submitted capstone described timely, trusted food guidance; later working notes emphasized inventory and spoilage and also discussed an independent restaurant niche. This MVP follows the supplied hostel workflow and retains **manager-authored handling/substitution guidance** as the bridge. It does not claim the earlier research established inventory as the dominant pain. No real interview recordings or measured savings were available for this build.

## Prioritized release

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

## Next releases and pilot

R1 is this functional local demo. A hosted pilot adds server authentication, environment hardening, supported migration dependencies, backups, explicit counted-increase adjustments and reconciliation, and tests on an actual kitchen phone. R2 follows evidence: waste cost reporting with price provenance, notifications or supplier export only if they solve observed work.

Start a small design-partner pilot with one hostel kitchen after validating the decision moment. Recruit the manager and receiving/prep staff together; observe a complete planning and receipt cycle. Measure current planning time and manual corrections, then compare the pilot. Do not promise waste or money savings from seeded arithmetic. The proposition is a clearer, reviewable purchase decision; pricing and adoption remain hypotheses.
