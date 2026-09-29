# Kitchen App Design Report

**Final design direction · 29 September 2026**

Persona aligned usability and app research for Group 1

## Executive summary

Organise the kitchen app around the cook's next preparation decision. P01 should open Today, find the assigned dish and read current, approved instructions for the displayed portions. P02 should plan meals and maintain those instructions in separate, focused views.

The brief comparator review supports three interaction choices: photos beside preparation steps, a calendar for orientation, and date plus meal grouping. These are recommendations for our MVP. Their effectiveness in a Delhi–Gurgaon kitchen still needs observation.

### Design decisions

Staff home: Today → meal → dish → exact quantities and approved guidance → Ask manager when needed.

Manager navigation: Plan meals | Guides | More. Open one task at a time; keep editing out of the staff flow.

More contains Ingredients and buying, stock lots, dish maintenance and records. Preserve these capabilities while reducing what appears first.

### Scope and evidence

This report finalises the persona aligned direction approved by the product owner and adds a desk review of three comparable products. Two serve professional kitchens; Paprika is an adjacent consumer interaction reference. We reviewed public product pages and guides, not authenticated product trials.

PERSONAS.md records zero completed field interviews. P01 and P02 remain proto-personas. Direct feedback that the app feels complicated establishes a design problem; it does not establish staff preferences, measured usability or demand. Competitor documentation describes patterns, not validated outcomes for our users.

## Key findings

P01 needs an applicable answer during a live task. P02 owns the kitchen standard and needs manageable review and upkeep. A single screen mixing menu planning, recipe editing, stock calculations and guide authoring asks both people to navigate work belonging to another moment. Separate their entry points.

### Kitchen constraints

The demo scope is Hindi and English, breakfast, lunch and dinner, manager controlled serving times, and a week calendar. New plans offer 30–100 portions in steps of ten. Preserve an existing value such as 120 when editing older plans. Language preference and reading vocabulary still require testing.

### Comparable app research

The matrix records documented interactions and our proposed adaptation. meez is the closest reference for preparation guidance, Apicbase for professional scheduling, and Paprika for a straightforward meal planning flow. None is evidence for our segment, approval rules or food policy.

| App | Documented interaction | Adaptation for this MVP |
|---|---|---|
| meez — Professional recipes | Photos and videos at individual prep steps; batch scaling; recipe version history. [1] | Short visual steps for P01; exact planned quantities; current publication detail. |
| Apicbase — Professional planning | Calendar for scheduled menus; separate list for recipes and quantities. [2] | Week calendar for P02; selected day meal cards; detailed calculations secondary. |
| Paprika — Consumer meal planner | Day, week and month views; add by date and meal; long press to edit. [3] | Visible meal groups and contextual Add dish; prefill date and meal; visible Edit. |

Design inference. Borrow the interaction pattern that supports the job. Avoid importing the surrounding feature catalogue into the first screen.

### Research limits

meez documents recipe translation, but our contract requires separately reviewed Hindi and English guidance. Apicbase uses menu cycles and dated instances; those concepts add unnecessary explanation to this local demo. Paprika uses long press for meal editing; our manager should have a visible Edit action.

The review does not establish comparative usability, kitchen adoption, waste savings or safe shelf life. Product claims and testimonials are excluded from our success estimates. Paprika's home pantry flow is not a substitute for the kitchen's reviewed batch and expiry policy.

## Recommendations

Use three primary views with clear, contextual actions. Planning, reading instructions and publishing a standard should each feel like a complete task. The following layout is the final design direction for the local demo, and is now implemented in the reviewed local release; effectiveness in actual kitchen work remains unvalidated.

Today for the cook. Show the service date and Hindi/English toggle, then breakfast, lunch and dinner with saved serving times. Each dish shows its name, portions and guidance status. Open exact quantities and short numbered steps; attach a captioned photo where it explains an action. Keep Ask manager visible when the answer is missing or inapplicable.

Plan meals for the manager. Show a seven day calendar with previous week, next week and This week controls. Selecting a date reveals three meal sections. Add dish opens a short form with date and meal prefilled, dish selection and the portions dropdown. Edit portions and serving time explicitly. On narrow screens keep the date selector compact and meal sections stacked.

Guides for the content owner. Start with the guide list and items needing attention. Open the editor only after New or Open. Put essential fields first, expand optional media and source detail, and keep language review explicit. Save draft and Publish are distinct actions. Unpublished changes never appear as approved staff instructions.

### Supporting workflows

Move detailed ingredient calculations, stock lots, buying drafts and records under More. Show their date and scope before any action. Expand calculations, lineage and source history when requested; keep errors, missing data and applicability warnings visible. Two dishes with 60 portions each must not be labelled as 120 diners.

The interface toggle selects labels and a reviewed guidance variant when available. If that variant is absent, name the actual content language and make the fallback explicit. Display Current, Missing or Needs review in words, with status colour as a secondary cue. Recipe changes must surface stale guidance before the cook follows it.

### Follow-on UI refinement (integrated 29 September 2026)

The bounded refinement is integrated: the shell uses a consistent navy, blue and white palette, selected navigation is clear, and Hindi/English controls remain readable. Plan meals and New Guide search Hindi and English recipe names, preserve the selected recipe and portions while typing, and show no-match feedback. The manager strip shows selected-date planned entries including unassigned dishes, non-exhausted lots whose recorded label dates precede the selected plan date, and non-exhausted lots with unknown dates; both lot counts link to More → Stock. Ingredient loading/refresh failures, including after a write, show unavailable rather than zero. Recorded dates prompt review and do not determine food safety. Questions behavior remains unchanged; no new question count/filter, table or chart was added. No API, schema, dependency or database change was required; the 32-recipe catalog and data remain intact. Sol accepted 39 frontend tests across 10 files, zero-warning lint and a 34-module production build; all eight isolated laptop/phone browser workflows passed in 1.6 minutes. Live read-only Playwright confirmed bilingual recipe search, retained selection/50 portions, no-match, Guides search, 390px Hindi without overflow and zero JavaScript errors. The existing 39 backend tests are reused from the prior release. No customer usability gain is claimed.

### Build order

The navigation, Today flow, week calendar, meal times, controlled portions and focused bilingual Guides editor were implemented in the prior local release. The visual/search/manager-strip refinement is now integrated. Prior release engineering acceptance:39 backend tests,33 frontend tests, clean lint/build and all8 current laptop/phone workflows (6 main cases plus2 affected guidance reruns). Fresh migration, preservation, actual restart and separate-database restore passed. Customer task comparison remains next.

Existing raw-lot dates remain available; prepared curries, sauces and chutneys still require a separate batch workflow. Preserve existing stock detail, but do not infer eligibility from a date alone. Voice lookup and additional automation follow task observation. The calendar does not establish stock reservation across days.

## Appendix

### Validation plan

Observe P01 performing a recent, supported preparation task using the current workaround and the proposed flow. Check whether the cook finds the right dish, understands the quantities and follows the kitchen's approved next action. Then test missing guidance, stale guidance and an unavailable language variant. Record errors, assistance and resolution time.

Ask P02 to plan one week, add a dish to each meal, change portions, edit a serving time and update a guide. Confirm that drafts remain private, publication is intentional, edits persist and an older 120 portion plan survives unchanged. Record setup and review minutes. Ask P03 whether the resulting upkeep is acceptable; investigate P04 separately if batch handling becomes a validated job.

Use correct kitchen reviewed resolution as the main usability criterion, with unsupported case recognition alongside it. Compare time and content upkeep with the current alternative. These are proposed tests; no completion rates, timing improvements or customer outcomes have been measured for this redesign.

### Sources

meez. Recipe based training for restaurant teams. Official product page. Reviewed 29 September 2026. [meez source](https://www.getmeez.com/training-leaders)

Apicbase. Introduction to Menu Planning. Official support guide. Reviewed 29 September 2026. [Apicbase source](https://support.apicbase.com/help/introduction-to-menu-planning)

Paprika. User Guide for Android. Official user guide, Meals and Settings. Reviewed 29 September 2026. [Paprika source](https://www.paprikaapp.com/help/android/)

Group 1. PERSONAS.md, PRD.md, USER_JOURNEY_AND_STORIES.md and the dated UX revamp contract. Persona definitions and authorised demo requirements. [Group 1 source](PERSONAS.md)

Report status. Design direction finalised on 29 September 2026. Application implementation is complete and GitHub-published at source commit4d0962f on MedEvolv/restaurant-inventory-management-system, branch codex/group1-prep-purchase. Customer validation and protected pilot remain open. See CURRENT_RELEASE.md for current delivery status. Core planning and reviewed guidance do not require an LLM API.
