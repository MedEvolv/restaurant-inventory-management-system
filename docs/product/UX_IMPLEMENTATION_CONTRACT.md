# Kitchen calendar and usability revamp

Historical authorized build contract. Its bounded local scope is now implemented; see [CURRENT_RELEASE.md](CURRENT_RELEASE.md) for actual acceptance and outstanding pilot gates.

User decision, 28 September 2026: build a calendar, a portions dropdown (30–100 in steps of ten), breakfast/lunch/dinner sections and meal times; simplify the application around the kitchen user. This supersedes the earlier decision to defer the weekly planner. It does not create evidence of customer demand or validate the primary job.

## Interaction decisions

- The kitchen team starts at **Today**: date, breakfast/lunch/dinner, serving time, dish cards and portions. Open a dish to see its exact quantities and current approved instructions. Keep missing/stale guidance and language fallback visible. Put the local question form behind “Ask the manager” instead of permanently occupying the screen. Existing questions remain local records.
- The manager starts at **Meal planner**: a seven-day calendar and the selected day's three meal cards. Each meal shows its serving time, planned dishes and an “Add dish” action. Empty meals explain the next action. Multiple dishes may share one meal; do not add dish portions together and call that guest count.
- Preserve old plans in an explicit **Needs a meal** group. Do not silently classify them as lunch. Allow assignment through edit. Existing 120-portion and other legacy values remain exact.
- New plans use a native labelled dropdown containing exactly 30, 40, 50, 60, 70, 80, 90 and 100. Default 50. Editing a legacy count adds only that existing count as a labelled option. It does not offer arbitrary new numbers.
- Single date/meal serving time, edited with a labelled time input and explicit Save. Initial demonstration defaults: breakfast 08:00, lunch 13:00, dinner 20:00. These are editable scheduling defaults, not preparation or safety rules.
- Previous week, Next week and This week controls. Monday-based week computed from an ISO local date with UTC calendar arithmetic, never by mixing browser timezone with kitchen timezone. A visible date picker provides direct access. Selecting a day changes the selected date and data without navigating away.
- On desktop show all seven days; at phone widths use seven compact day buttons or a horizontally contained strip, with a clear selected date heading below. No whole-page horizontal overflow. Day buttons include accessible date, dish count and selected state; count means dish entries, not guests.
- Planner subviews: **Menu**, **Ingredients & buying**, **Dishes**. Menu is default. Calculations, buffers and purchase rounding settings appear only in Ingredients & buying. Expand an ingredient's calculation/settings on demand. Recipe maintenance appears only in Dishes, not beside the weekly menu.
- Purchases remain saved drafts with explicit quantities and actual receipt actions. No order transmission. Stock cards show ingredient total, date-review summary and a labelled expandable lot list. Retain all lot dates, quantities, unknown-date meanings and receipt costs.
- Keep management actions in the manager workspace. Use short consistent navigation: Today, Meal planner, Stock, Purchases, Guides, Records. Desktop uses a compact light sidebar; phone uses a compact wrapping navigation or three primary entries with a labelled More disclosure. Language selection remains immediately visible. No hidden actions reachable only by hover.
- Reset sample data moves into a closed Demo tools disclosure. It must not distract from routine kitchen work. Existing explicit reset phrase and scoping remain.

## Visual direction

Warm white surfaces, soft sage background, deep green primary action, dark legible text. Compact light sidebar, generous whitespace, one primary action per context. Base copy 15–16 px, controls at least 44 px high, captions at least 12 px. Clear heading hierarchy, consistent cards and buttons, icons only alongside readable labels. Avoid all-caps explanatory headings, nested bordered panels and giant blocks of arithmetic on the first screen. Preserve the real dish photo and its fictional caption. No synthetic operational metrics or fabricated tasks.

## Data contract

V9 adds `meal_plans.meal_slot` with default `UNASSIGNED`, plus date/meal service-time overrides. No existing plan quantities or dates are rewritten. Allowed slots: BREAKFAST, LUNCH, DINNER, UNASSIGNED. POST omission remains compatible as UNASSIGNED; PUT omission preserves the existing slot. Invalid values return 400. Backend portion range stays compatible with existing callers and data.

`GET /api/prep/calendar?start=YYYY-MM-DD`: exactly seven inclusive days, including empty days, `{start,end,days:[{date,plans,mealTimes:{BREAKFAST:'08:00',LUNCH:'13:00',DINNER:'20:00'}}]}`. Plan DTOs add `mealSlot` and `serveTime`; unscheduled serveTime is null. Today adds those fields and the same top-level `mealTimes` map, so even empty meals display their saved time. `PUT /api/prep/meal-times`: `{date,mealSlot,serveTime:'HH:mm'}`, strict 24-hour time, only the three named meals. Defaults derived on read; manager overrides persist. Recipe publication fingerprints ignore schedule metadata. Daily ingredient requirements still include every plan exactly once across every meal and unscheduled group.

## Verification and release gates

1. Sol accepts the current bounded bilingual packet; no concurrent layout ownership.
2. Luna backend calendar packet; Sol reads actual source and independently runs the full backend suite. Check V8-to-V9 preservation, invalid slots/times, seven days including empty days, time persistence, omitted-slot compatibility, legacy counts, identical arithmetic and unrelated data after reset.
3. Luna planner/shell/Today revamp; Sol independently checks tests, lint and build. Test date-switch response races, busy lock through reload, correct create/edit payloads, legacy portions, defaults/overrides, empty meals, language preference, fallback and dirty guidance draft preservation.
4. Luna remaining operations simplification/localization and browser checks. Update old test interaction paths and numeric arithmetic when the new dropdown requires it; retain original behavioral coverage. Full browser suite runs on an isolated database/server so the live demonstration is preserved.
5. Root visually reviews laptop and phone screenshots, checks a real save/reload and bilingual guidance, backs up the live database, integrates a SHA-guarded reviewed delta into the running checkout and reopens the demo. No new external services, dependency installs or LLM API.

This is an implemented local demo scope. Authentication, multi-user authorization, field research and protected pilot gates remain as documented in the PRD.

## Final design report amendment 29 September 2026

The user approved the persona aligned design direction, then requested brief comparator research and report finalisation. The completed report is in product-docs/2026-09-28/Kitchen MVP Usability Design Report.md. Its navigation supersedes the earlier six primary manager entries: **Plan meals, Guides, More**. More reveals **Ingredients & buying, Dishes, Stock, Purchases and Records**, with the original operations preserved. Menu planning opens directly to the week and selected day's meals. Do not replace the primary navigation with six permanent entries or stack all operational forms together. Staff has Today as its primary entry; serving times are read-only there and editable in manager planning. Existing dates, counts, quantities, drafts, histories and lot details stay exact and reachable. All data and regression contracts above continue to apply.

The report's meez, Apicbase and Paprika references inform interaction choices only; they do not add dependencies or expand the local implementation into multi-site cycles, automatic translation, automatic stock allocation or production food policies. Implement the complete authorised local scope, and prove every release gate against current code and runtime.
