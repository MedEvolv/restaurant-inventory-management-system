# Current release and delivery status

Updated 29 September 2026. Local software release complete; customer validation and protected pilot pending.

[GitHub build branch](https://github.com/MedEvolv/restaurant-inventory-management-system/tree/codex/group1-prep-purchase) · [Product documentation](README.md) · [Engineering verification](../../VERIFICATION.md)

The prior application release was published at commit `4d0962fefb73036d3d7d011ca7dc7fd70406dd10`. Documentation updates follow that source commit; use the branch for the latest documents. Upstream RestaurantIQ history and MIT attribution remain intact. GitHub source publication is not application deployment.

## Delivered local functionality

| Area | Current behavior |
|---|---|
| Staff | Today → date/meal → dish → exact quantities and applicable published guidance/photo or explicit missing/review-needed state. |
| Manager | Plan meals, Guides, More; supporting buying, dishes, stock, purchases and records are secondary. |
| Calendar | Seven-day navigation, direct date selection, breakfast/lunch/dinner and explicitly saved date-specific serving times; defaults08:00/13:00/20:00. |
| Portions | New plans30–100 by10/default50. Existing legacy120 remains exact as an option only for that plan; old plans stay Needs a meal until explicitly assigned. Counts are dish portions, not unique diners. |
| Language | Persistent Hindi/English interface plus separately authored, explicitly reviewed guidance variants and named actual-language fallback. No machine translation. |
| Guides | List and focused New/Open editor, separate Save and Publish, dirty bilingual drafts retained across navigation, optional details collapsed. |
| Photos/questions | Validated persistent captioned JPEG/PNG with fictional provenance; local contextual questions, refreshed manager queue and recorded resolution. No external message. |
| Operations | Existing decimal lot ledger, cost/date provenance, daily estimates, override drafts, partial receipts, usage/waste/count decreases, notes/history retained. |
| Playback | Optional matching device-local voice with text fallback. No microphone, speech recognition or conversational voice agent. |

## Verified engineering results

Current UI acceptance: 39 frontend tests in 10 files, clean lint and production build, and all eight isolated laptop/phone browser workflows in one 1.6-minute run. The prior 39 backend tests and recovery checks are reused because the backend is unchanged.

Initial release historical evidence:39 backend tests;33 frontend tests in9files; zero-warning lint; successful production build. All8 initial Chromium laptop/phone workflows passed:6 kitchen/calendar cases in the main run plus2 corrected guidance cases in a final19.3-second run. The earlier main report retains its two failures; it is not relabelled as a single eight-pass report.

FreshV1–V9, actual restart and separate-database dump/import checks passed. Live migration preserved original plans, legacy quantities, guidance/photos/stock, saved drafts and V8 purchase fingerprints.18table checksums remain exact; only identified startup expiry-warning/zero-quantity history appends occurred. Final source integration verified36 accepted app/test/doc hashes before GitHub publication. Final live smoke canceled its form without resetting or reassigning the existing fixture. Detailed artifacts and historical tool limitations remain in VERIFICATION.md.

## Outstanding product and pilot work

Zero completed field interviews or observed kitchen task sessions in the supplied record. P01–P04 remain proto-personas; the proposed North Star is **weekly verified correct guidance-assisted decision resolutions per active kitchen**. No automatic North Star instrumentation, baseline, achieved target, savings or adoption result is claimed. MoSCoW scope and RICE scenario assumptions express decisions, not measured value.

Next: recent-incident discovery, an accessible kitchen and named reviewer, a baseline, comparative task testing, real-content/bilingual semantic approval, actual-device observation and sustainable content upkeep. Before shared real use: server-enforced identity/roles/data access, environment hardening and deployment-specific recovery. Local workspace buttons do not enforce permissions.

Later conditional scope: chronological stock reservation/delivery allocation, prepared curries/sauces/chutneys with actual production/yield/lineage and reviewed deadlines, automated source ingestion/EatByDate, offline/export enhancements and Hindi speech lookup. The current calendar does not allocate stock across days or establish batch eligibility. Recorded raw-lot dates are planning inputs, not food-safety verdicts. No LLM API is required or called.

## Documentation provenance

The dated product package is revised to1.1 while retaining original research assumptions and source attribution. Research proposals, original submissions, course/source extracts and historical audit artifacts remain historical inputs. Authored product docs are published under `docs/product`; raw course PDFs, interview/source extracts, databases, SQL dumps and runtime logs are not part of this documentation publication. The Word report's content/package checks are separate from visual pagination; renderer status is recorded in REVIEW_RECORD.md.

## Recipe data augmentation 29 September 2026

The live demo now has32 active recipes:2 retained plus30 vegetarian Hindi/English demo additions, with illustrative per-portion matrices.37 missing ingredient identities were added with zero stock; total44 ingredients. Existing stock/lots, plans, history, notes, drafts and selected purchase estimates remain unchanged. A repeat import created nothing. This adds recipe data, not published methods, nutrition/expiry policy or prepared-batch stock. See the repository's assets/DEMO_RECIPES.md for the reusable catalog/importer.

## Follow-on UI refinement — integrated 29 September 2026

The RestaurantIQ-inspired navy/blue/white shell, selected-navigation state and readable Hindi/English controls are integrated. Plan meals and New Guide search recipe names in both languages, preserve the selected recipe and portions while typing, and return a clear no-match state. The manager action strip shows selected-date planned entries including unassigned dishes; non-exhausted lots with a recorded label date before the selected plan date; and non-exhausted lots with unknown dates. Both lot counts link to More → Stock. Ingredient loading and refresh failures, including after a write, show unavailable rather than zero. Dates prompt review and make no food-safety determination. The existing Questions flow remains unchanged; no new question count/filter, tables or charts were added. Existing APIs, schema, dependencies and database were unchanged; the 32-recipe catalog and its data remain intact.

Sol accepted 39 frontend tests across 10 files, lint with zero warnings, and a production build of 34 modules. All eight isolated laptop/phone browser workflows passed in 1.6 minutes. Read-only live Playwright confirmed recipe search in both languages, selection/50 portions preserved during search, no-match behavior, Guides search, a 390px Hindi layout without overflow, and zero JavaScript errors. Root integrated 10 application files into the live checkout with SHA guards and backup `.runtime/reviewed-source-backup-20260929T091012Z`. Seven live before/after routes were equal: 32 recipes, 44 ingredients plus stock/lots, calendar, history, drafts, notes and the current-day estimate. The existing 39 backend test result is reused from the prior release because this UI increment changed no backend code. These are engineering results, not customer outcomes. See [the design reuse assessment](RESTAURANTIQ_DESIGN_REUSE.md).

## Kitchen Saathi increment — locally verified; remote publication pending

The accepted contract is [KITCHEN_SAATHI_DESIGN.md](KITCHEN_SAATHI_DESIGN.md). The 2:1 Cook/Manager bento, emerald styling, four source-backed manager cards, 350/custom servings and exact read-only recipe preview are integrated in the actual checkout. Positioning remains user-chosen, not field-validated; weekday-label correction was a requested behavior and is now covered by the corrected browser workflows. Hindi/English reviewed guidance, stale-state suppression and escalation remain in scope. No unsupported supplier, purchase-order, savings or finance-performance claims are made.

Sol verified 41 unique frontend tests across the initial 40-pass/one-obsolete-failure run and bounded corrections, including an isolated retry of one 5-second timeout; there was no single 41-pass full run. Lint and production build passed with zero warnings. All eight browser workflows were verified as six passes in the initial 1.8-minute run plus two corrected calendar workflows on laptop and phone in a separate 38-second rerun. `npm ci` completed with 348 packages, and live read-only verification passed on port 3016. All seven API snapshots were exactly preserved. Prior 39 backend checks are reused, not rerun; no backend/data changes or LLM API were added. Remote publication remains pending.
