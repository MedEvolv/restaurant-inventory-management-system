# Verification — 28 September 2026

Local repository: `C:\ArchLife-Systems\group1-prep-purchase`; branch `codex/group1-prep-purchase`. Upstream history retained, working baseline commit `0f5d3c0`. Use `git rev-parse HEAD` for the completed adaptation commit. No remote push or deployment occurred.

Runtime verified: Java 21.0.12.1, Node 24.11.0, Maven wrapper/Maven 3.9.6, MySQL 8.4.11, Vite 8.3.1. MySQL runs in an isolated portable data directory on port 3316. No production database or other project's runtime was changed. **No LLM API is required or called.**

## Checks

| Check | Result / evidence |
|---|---|
| Backend tests, `mvnw.cmd -q test` | **19 passed**, zero failures/errors: 5 stock HTTP tests, 4 planning HTTP tests, 4 workflow HTTP tests, 1 reset HTTP test, 2 exact-unit tests, 3 inherited service tests. HTTP tests run against actual `prep_test` MySQL, not H2. Surefire XML is under `backend/target/surefire-reports/`. |
| Frontend tests, `npm run test -- --run` | **3 passed**: receipt payload/form behavior, transient gateway read retry, no automatic write retry. |
| Browser tests, `npm run test:e2e` | **4 passed**, zero failures. Two behaviors are exercised in laptop Chromium and phone/touch Chromium emulation: full demo including edited-note persistence, and recipe/portion/settings editing with plan removal. Both checks verified no page overflow; the full demo also asserted zero browser page errors. |
| Lint, `npm run lint` | Passed. New screens, app entry and original App are checked. |
| Production frontend, `npm run build` | Passed. Final assets compile successfully. |
| Dependency audit, `npm audit --audit-level=low` | **0 vulnerabilities** in the npm audit. This is an npm dependency check, not a full security audit of the backend or deployment. |
| Backend package | Passed after tests. Packaged JAR started successfully in the local profile. |
| Empty-schema migrations | **Six migrations passed** from an empty `prep_clean_v6_validation` MySQL schema; inventory served as empty. With reset disabled, `POST /api/prep/demo/reset` returned **403**. |
| Existing-schema preservation | Imported baseline ingredient ID 1 retained 18 kg; its received 11 kg order ID 1 remained RECEIVED; both original audit rows remained; opening lot retained 18,000 g. Migrations V1–V6 applied additively. |
| App restart persistence | Parsed JSON for ingredients/lots, saved draft and snapshot, edited notes and movement history matched before/after an app stop/start. MySQL was retained. |
| Run/reset helpers | `start-local.ps1`, `stop-local.ps1` and `reset-demo.ps1` exercised on the prepared checkout. |
| Optional Docker path | `docker compose config --quiet` passed. Docker engine execution was unavailable; portable MySQL is the runtime that was actually exercised. |

## Acceptance mapping

All quantities below are fictional. Routes share the prefix `/api/prep`.

The six plan gates are complete: upstream baseline; dated stock ledger; recipes/estimates; draft/actual receipt separation; waste and editable guidance; full demo/setup/verification. All seven supplied acceptance criteria are satisfied within the local MVP scope. Production hosting, actual-device checks and real kitchen evidence remain outside this release, as stated below.

| Criterion | Screen / API | Behavior and verification |
|---|---|---|
| 1. Ingredient and receipt | Stock & dates; GET/POST `/ingredients`, GET `/ingredients/{id}`, POST `/receipts` | Create/select ingredient, compatible units, separate lots, cost per received unit, optional supplier, received/date provenance and visible unknown date. StockApiTest plus browser receipt/reload checks. |
| 2. Recipe and meal plan | Tomorrow's plan; GET/POST/PUT/DELETE `/recipes`, `/plans` | Ingredient quantity per serving; multiple dishes/date and portions; editing recipes/plans and removing plans recalculates. PlanningApiTest plus browser CRUD path. Recipe DELETE archives and rejects dishes still used by plans. |
| 3. Order suggestion | Tomorrow's plan; GET `/estimate?date=…`, PUT `/planning-settings/{ingredientId}` | Required, physical, excluded, usable, zero/editable buffer, upward increment rounding and dish arithmetic. Exact unit normalization; incompatible dimensions and ledger precision/range are rejected. PlanningApiTest, UnitsTest and browser assertions. |
| 4. Manager review | Plan draft form and Purchase drafts; POST/GET `/drafts`, GET `/drafts/{id}`, POST `/receipts` with optional draftLineId | Editable override, immutable snapshot, stale flag and stale-save rejection; saving never mutates stock/sends an order; partial actual arrival and outstanding balance. WorkflowApiTest and full browser demo. |
| 5. Waste/discrepancy | Waste & notes; POST `/removals`, GET `/history` | Six waste reasons and optional note; selected lot decremented once with author/time/history. Ordinary usage and count discrepancy are separate kinds. Repeated/concurrent requests and overdraw checked by WorkflowApiTest; audit-failure rollback by StockApiTest; browser spoilage path. |
| 6. Trusted guidance | Waste & notes → Manager notes; GET/POST `/notes`, PUT `/notes/{id}` | Ingredient/dish handling and approved substitution notes; write/edit, last editor and edit time. Local authored text only. WorkflowApiTest verifies editing, same ID, preserved creation time and blank-text rejection; browser persistence check included. |
| 7. Usable demo | Reset fictional kitchen UI; POST `/demo/reset`; `scripts/reset-demo.ps1` | Fictional rice/tomatoes/onions/paneer, two dishes, dated lots, unknown dates, low stock; explore and walkthrough modes. Repeatable reset preserves unregistered stock and refuses mixed sample/non-sample drafts. DemoApiTest and browser sequence. |

## Arithmetic checked in the live browser

| Stage | Tomatoes physical / excluded / usable | Requirement / suggested |
|---|---|---|
| Two receipts: 7 kg future-date + 3 kg date-passed | 10 / 3 / 7 kg | 120 portions of each dish: 18 / 11 kg |
| Override 12 kg and save draft | 10 / 3 / 7 kg | Stock unchanged; saved quantity 12, original suggestion 11 |
| Actual arrival 11 kg against draft | 21 / 3 / 18 kg | 18 / 0 kg; 1 kg draft balance outstanding |
| Spoiled removal 3 kg from original usable lot | 18 / 3 / 15 kg | 18 / 3 kg |

API tests also cover 100 g/0.05 kg mixed-unit aggregation, fractional count rejection, incompatible volume/mass, negative quantity, invalid portions, equality of a label date and meal date, unknown date inclusion with review, recipe editing, buffer 0.1 kg, upward increment rounding, duplicate receipt/removal keys, conflicting retries, competing stock removals, and rollback after forced audit failure.

## Screenshots

Captured from the actual browser workflow after each asserted state. Laptop: 1365 × 900 viewport. Phone: Chromium emulation of iPhone 13 dimensions; these are browser checks, not a physical iPhone/Safari certification.

- [Laptop stock and separate lots](screenshots/laptop-05-stock.png)
- [Laptop plan and arithmetic](screenshots/laptop-01-plan.png)
- [Laptop purchase draft](screenshots/laptop-04-draft.png)
- [Laptop manager guidance](screenshots/laptop-02-guidance.png)
- [Laptop movement history](screenshots/laptop-03-history.png)
- [Phone stock and separate lots](screenshots/phone-05-stock.png)
- [Phone plan and arithmetic](screenshots/phone-01-plan.png)
- [Phone purchase draft](screenshots/phone-04-draft.png)
- [Phone manager guidance](screenshots/phone-02-guidance.png)
- [Phone movement history](screenshots/phone-03-history.png)

## Limits

Local fictional single-manager demo; no server authentication/roles, production hosting, physical-device/Safari verification or real kitchen research/impact measurement. Date review is a planning convention, not a safety conclusion. Original `Double` fields serve only as compatibility mirrors; decimal lots drive the new workflow. Original legacy writes return 409 and their old orders are historical. Count adjustments support decreases only. UI shows recent 200 movements/notes and 100 drafts; the database retains full history. Flyway 9.22.3 warns that MySQL 8.4 is newer than its tested compatibility range; all stated migration/HTTP checks passed on 8.4.11. Update and revalidate that dependency before a hosted pilot.

Attribution: RestaurantIQ, MIT, **Copyright (c) 2026 Balakrishna Kini**. Full original LICENSE retained. RIMS was inspected only as reference; no RIMS source or yield formula is copied. See ATTRIBUTION.md and PRODUCT_DECISIONS.md.
