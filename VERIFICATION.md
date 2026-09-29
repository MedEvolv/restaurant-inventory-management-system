# Verification — reviewed local release, 29 September 2026

The approved persona-aligned calendar and bilingual guidance redesign is implemented in the local demo at http://127.0.0.1:3016. GPT-6 Luna implemented the packets, GPT-6 Sol independently reviewed source and checks, and root verified browser workflows, migration/recovery and integration. This record replaces the earlier V6/V8 release counts; those checks were historical increments.

No LLM API is required or called. No interview, actual kitchen observation, physical-device trial or measured savings/adoption result has been recorded. This is a fictional local demonstration, not a hosted pilot.

## Current UI acceptance

Current UI acceptance: 39 frontend tests in 10 files, clean lint and production build, and all eight isolated laptop/phone browser workflows in one 1.6-minute run. The prior 39 backend tests and recovery checks are reused because the backend is unchanged.

## Initial release acceptance (historical)

| Check | Actual result and practical coverage |
|---|---|
| Backend | **39 tests, zero failures/errors**, independently run by Sol using cached Maven and actual MySQL `prep_test`. Covers the existing stock/planning/draft/receipt/waste operations, guidance publication/media/questions, bilingual reviewed-language contracts, V9 calendar and strict meal times. |
| Frontend | **33 tests in 9 files, all passed**, independent Sol run after the two browser-discovered corrections. Includes date/language races, dirty guidance preservation, new and legacy portions, meal grouping, focused editor, purchase-save unmount cleanup, and refreshed Questions entry. |
| Lint and production build | Passed independently with **zero lint errors/warnings** and a successful production build on the final application source. |
| Laptop and phone browsers | **All 8 current cases passed on isolated localhost:3017**. Four kitchen cases and two calendar cases passed in the main run. The two guidance cases passed in a separate final run after fixing stale question-list refresh: 19.3 seconds, expected 2, unexpected/skipped/flaky 0. This is an aggregate acceptance, not a claim that the earlier main HTML report contains eight green results. |
| Fresh schema | Actual packaged backend started on a separate empty database; **V1–V9**, seven empty calendar days, default meal times and reset-disabled **403** passed. |
| Actual restart and dump restore | Exact snapshot survived an app stop/start and import into a different database followed by restart. Includes bilingual publications/fallbacks, distinct unpublished draft, assigned meals and UNASSIGNED 120 portions, saved times, local question, quantities/estimates and original photo bytes. |
| V8→V9 preserved data | Both isolated and live checks passed: original plan columns and legacy quantities; guidance documents/publications/photos; stock; saved purchase drafts and original V8 estimate fingerprints. Eighteen table checksums are unchanged. Two existing expiry-history tables preserve every old row and append only the identified startup warning plus a zero-quantity history event. |
| Live activation | Reviewed application/test delta copied into the original checkout with original/source SHA guards and backup. Offline packaging succeeded; backend/frontend restarted; MySQL data directory retained. Frontend HTTP 200, seven-day calendar and Today defaults passed on live3016/8086/3316. |
| Live UI smoke | Root used the actual in-app browser on3016: English labels, preference after reload, seven-day manager calendar, three meal times and Add Lunch native portions options 30–100 by10/default50. The form was canceled. No live fixture was reset, assigned or otherwise edited during this final smoke. |
| Visual review | Root inspected final laptop and phone guidance screenshots and the live calendar. Browser workflows assert no horizontal page overflow; the full kitchen/guidance cases also check browser errors. These are Chromium emulations, not physical iPhone/Safari certification. |

The browser checks exercise real Save/reload operations on the isolated database, including explicit native meal-time changes, a new 100-portion plan and API-seeded legacy120→80→120→50 editing. Other retained operations include recipe CRUD/archive, overrides, immutable purchase snapshots, partial actual arrivals, selected-lot waste, notes and history.

Two meaningful faults were found by actual browser workflows and fixed before acceptance: saving a purchase draft could leave navigation busy after its panel unmounted; a preserved Guides panel could show an old question queue after a staff submission. Both corrections have regression coverage. Test-selector/fixture adaptations did not replace those fixes or use a reload workaround.

## Contracts verified

| User requirement | Delivered behavior |
|---|---|
| Simple staff entry | Today → scheduled dish → exact current quantities, reviewed instructions/photo or explicit Missing/Needs review, with local escalation. |
| Manager navigation | Plan meals, Guides, More; More exposes Ingredients & buying, Dishes, Stock, Purchases, Records. Secondary calculations, lot details, source/history and reset are initially closed. |
| Weekly calendar | Seven days, previous/next/current week and direct date selection, empty dates, selected-date plan. This does not reserve stock across dates. |
| Portions and meals | New plans default50 with30–100 by10. Out-of-range legacy quantities appear only for that existing plan. Old plans remain Needs a meal/UNASSIGNED until explicitly edited. Breakfast/Lunch/Dinner have date-specific times, default08:00/13:00/20:00. |
| Bilingual content | Hindi/English interface preference persists. Manager-authored variants require explicit review; publication exposes only reviewed languages. Missing variant names the actual fallback language. No automatic translation. |
| Focused guides | List → New/Open, short essential fields, optional detail disclosures, separate Save and Publish. Unsaved bilingual edits survive language/workspace navigation with Resume. |
| Trust and staleness | Published text/photo membership immutable; unpublished drafts stay private to the manager view. Recipe-context changes suppress old staff method/photos until deliberate reviewed republication. Serving count/schedule changes do not invalidate the method. |
| Photos and questions | Validated JPEG/PNG bytes persist, caption/kind/demo provenance displayed, unavailable image has text fallback. Local questions retain identity and retry keys; manager queue refreshes on entry and records resolution. No external message is sent. |
| Optional playback | Device-local voice must match the actual guidance language. Tested capability/delayed-voice/stop/replay/cancellation behavior; readable fallback remains. Actual voice availability and usefulness in a noisy kitchen are unverified. |
| Existing purchasing/stock | Decimal compatible-unit calculations, separate receipt lots/cost/date provenance, overrides, stale snapshots, partial arrivals, atomic selected-lot usage/waste/count decreases, editable notes and movement history remain. |

The retained live29September fixture intentionally has two120-portion dishes under Needs a meal. Their portions and stock arithmetic were preserved. A presenter can explicitly assign meals through Edit; the migration did not guess them. See DEMO_SCRIPT.md for the current tour and100-portion purchasing example.

## Source, runtime and evidence

Actual checkout: `C:\ArchLife-Systems\group1-prep-purchase`, branch `codex/group1-prep-purchase`. Source mirror: `C:\Users\ishaa\edocsil-cas\01_Projects\PM Group 1 Capstone Project\prototypes\prep-purchase-src`. Management/audits/scripts: sibling `guidance-phase2-management-20260928`.

The accepted application/test candidate has **32 files** (10 new,22 changed), recorded in `reviewed-ux-code-candidate-20260929.json`. Four release documents are reviewed/copied separately. Runtime/build/dependency directories are excluded from source integration. The verified source was committed and pushed to [the MedEvolv build branch](https://github.com/MedEvolv/restaurant-inventory-management-system/tree/codex/group1-prep-purchase) as `4d0962f`; no production deployment was performed. Documentation updates follow the source release. The36-file SHA record is the pre-publication integration snapshot, not a hash manifest for later documentation edits.

Live: frontend3016/backend8086/MySQL3316, database `prep_demo`. Isolated browser validation:3017/8087/3317, database `prep_ui_revamp_20260928`. The three current browser files refuse any base URL other than3017. Use the prepared isolated Playwright configuration in README; do not run reset fixtures against the live presentation database.

The current release used Java21.0.12.1, Node24.11.0, cached Maven3.9.6 and portable MySQL8.4.11. Backend tests/package used offline Maven `-q -o` with `-Dmaven.repo.local=C:\Users\ishaa\.m2\repository`; see the prepared-machine command in README. The SHA-guarded activation helper actually packaged/restarted this release. Generic `start-local.ps1`, `stop-local.ps1`, `reset-demo.ps1` were exercised for the earlier V6 release, **not newly rerun for V9**. Optional Docker configuration was validated historically; Docker engine execution was unavailable.

Evidence paths below are relative to the mirror unless the management directory is named:

- `.runtime/ux-validation/preservation-after-live.json` and `whole-upgrade-live.json`: final live comparison before any intentional fixture edits.
- `.runtime/ux-validation/latest-live-preintegration-backup.json`: latest pre-integration backup, captured2026-09-29T02:51:43UTC; all163 original source baseline hashes verified; dump15,091,119 bytes, SHA256 `683b1bb00df7f00bb8c48061cc7e5f851bce3a4680d0d2ba1023ebe05ee02a5a`.
- `.runtime/ux-validation/latest-recovery-evidence.json`: fresh/restart/restore proof for frozen backend JAR SHA256 `d868eada8ebdd0225b1665ae1cf31421812c27fbe3a32fa0acd957018dfa1f93`. Recovery dump20,120,515 bytes, SHA256 `16b61ecc6d2b002dee26fafefdbfa4e6b43426c5de2c8f6beb69b1d24456baab`.
- `.runtime/reviewed-source-backup-20260929T033610Z`: original application source backup for integration.
- `frontend/.runtime/ux-validation/playwright-report/`: main run; six passed and the two question-queue failures subsequently corrected.
- `frontend/.runtime/ux-validation/guidance-final-results.json`: final two guidance passes on the corrected source,19.3 seconds.
- `frontend/.runtime/ux-validation/test-results/`: main-run kitchen screenshots/traces; retained unchanged rather than relabelled as a single eight-pass report.

Actual final guidance images from the accepted isolated workflow:

- [Laptop guidance](<C:/Users/ishaa/edocsil-cas/01_Projects/PM Group 1 Capstone Project/prototypes/prep-purchase-src/frontend/.runtime/ux-validation/guidance-final-results/guidance-staff-and-manager-b2d14-lished-guidance-review-loop-laptop/laptop-published-guidance.png>)
- [Phone guidance](<C:/Users/ishaa/edocsil-cas/01_Projects/PM Group 1 Capstone Project/prototypes/prep-purchase-src/frontend/.runtime/ux-validation/guidance-final-results/guidance-staff-and-manager-b2d14-lished-guidance-review-loop-phone/phone-published-guidance.png>)

Backend/recovery proofs were reused after frontend work because the accepted backend source stayed frozen. Frontend tests/lint/build ran after the actual corrections. Only the affected guidance browser cases were repeated; document-only copying requires no application rebuild or test rerun.

## Practical limits

Staff/manager navigation is not authenticated access. Shared real use needs server permissions, deployment/data controls, kitchen-owner review of real instructions, physical-device observation and the protected pilot. AI sample photos are fictional illustrations. Label-date handling is a transparent planning convention, not a food-safety determination; unknown dates remain usable recorded stock with a review flag.

Prepared curries/sauces/chutneys and their policy-dependent shorter expiries, chronological reservation, automated EatByDate ingestion, microphone/STT and a conversational LLM remain later work. EatByDate is a reference, not an integrated expiry authority. Scheduling counts dish entries and dish portions, not unique diners.

Existing limitations: count adjustment supports decreases only; UI lists recent200 movements/notes and100 drafts while the database retains full history. Legacy Double fields are compatibility mirrors; decimal lots drive the workflow. Flyway9.22.3 warns MySQL8.4 is newer than its tested range; stated migration/API checks passed on8.4.11, with dependency revalidation required before hosting. No new vulnerability audit or hosted security certification is claimed.

Attribution: RestaurantIQ, MIT, Copyright (c)2026 Balakrishna Kini. Original LICENSE and upstream history retained; see ATTRIBUTION.md and PRODUCT_DECISIONS.md.

## UI refinement verification — 29 September 2026

Sol accepted 39 frontend tests across 10 files, lint with zero warnings and a production build of 34 modules. All eight isolated laptop/phone browser workflows passed in 1.6 minutes. Read-only live Playwright confirmed Hindi/English planner recipe search, preserved selected recipe and 50 portions while searching, no-match feedback, Guides search, 390px Hindi layout without overflow, and zero JavaScript errors. Root integrated 10 application files into the live checkout with SHA guards and a backup at `.runtime/reviewed-source-backup-20260929T091012Z`.

The UI increment changes no backend code, APIs, schema, dependencies or database. The prior 39 backend tests are reused from the accepted release; they were not rerun. Root's seven before/after live data comparisons remained equal, including 32 recipes, 44 ingredients and stock/lots, calendar, history, drafts, notes and estimate. Customer usability and food safety are not established by these engineering checks.