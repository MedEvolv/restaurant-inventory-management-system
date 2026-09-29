# RestaurantIQ design reuse assessment

Reviewed 29 September 2026. Recommendation only; no application or database changes.

## Evidence and boundary

Reviewed the actual upstream RestaurantIQ live dashboard and Inventory screen in Edge, upstream origin/main frontend styling, navigation and table hook, the current local meal planner, and PERSONAS.md. The live reference returned zero inventory records; populated rows, real operational performance and usability outcomes were not verified. P01/P02 remain proto-personas with zero completed field interviews. Other similarly named commercial products are not the reference.

Reference: https://restaurant-inventory-management-sys-six.vercel.app/dashboard

Source: https://github.com/Balakrishna-kini/restaurant-inventory-management-system

## Priority recommendations

| Priority | Pattern | Adaptation for our app | Expected value / effort |
|---|---|---|---|
| 1 | Shared visual tokens, clear primary/secondary buttons, white cards on a quiet background | Centralise colour, spacing, borders, typography and focus states. RestaurantIQ uses navy navigation and blue actions; adopting that palette is a product choice, while consistent hierarchy is essential. Keep Hindi readable and controls comfortably sized. | High / low–medium |
| 1 | Active sidebar item with icon and label | Keep our Today staff entry and three manager destinations: Plan meals, Guides, More. Strengthen selected state; use compact mobile navigation. Do not reproduce seven top-level sections. | High / low–medium |
| 1 | Search/filter toolbar | Search English/Hindi dish names in the 32-recipe selector and Guides; add meal filters where metadata exists. Accessible selection with a native fallback. Do not imply meal metadata is already persisted. | High / medium |
| 1 | Text-labelled status badges | Separate reviewed guidance state from stock state and lot date review. Colour must supplement text. No generic green badge implying food is safe. | High / low–medium |
| 2 | Alert panel with View All | Manager-only lot review and unresolved questions with direct task links; show lot identity/date/remaining amount. Unknown dates need an explicit state. Dates cannot establish safety. | High / medium |
| 2 | Small summary cards | At most three actionable manager counts, such as planned dishes for selected day, unanswered questions, lots needing review. Specify scope and denominator; cook home continues to show assigned meals. | Medium / medium |
| 2 | Sortable tables and pagination | For buying/history only; show essential columns, expand details. On phones use stacked records. Use existing available APIs; do not hide required history behind an unexplained limit. | Medium / medium |
| Later | Inventory charts, category valuation, trend panels | Add only if an owner/manager decision and reliable data justify them. No chart-first staff home. | Low current value / medium–high |

These are qualitative design judgments, not measured RICE estimates or customer outcomes.

## What to leave out

- Decorative repeated background, gradient/glowing accents and hover movement: little task value.
- Live clock, empty notification bell and “System Healthy”: visual distraction or unsupported assurance.
- Thirteen-column inventory table and small uppercase labels: too dense for this daily kitchen flow.
- Item-level “Fresh” categorisation copied directly into lot workflows: mismatched data and safety semantics.
- Generic financial dashboard as the home screen: does not serve the cook's next preparation decision.

## Practical sequence and checks

1. Visual consistency pass on the existing shell, calendar and cards; keep data/contracts intact. Review laptop and narrow phone layouts, keyboard focus, Hindi wrapping and contrast.
2. Searchable recipes and focused filters; verify both languages, no matches, preserved selected value and saved portions.
3. Manager action overview using existing records, with scoped counts and direct links; verify empty, unknown-date and pending states without asserting safety.

Prefer existing components/styles and APIs. Do not copy upstream JSX wholesale: routing, language handling and data semantics differ. Existing MIT attribution must remain. No new dependency, LLM API or backend rewrite is necessary for the first visual pass; later aggregate work depends on available endpoints.

## Implementation status 29 September 2026

The bounded shell, active-navigation, bilingual readability, searchable recipe selection and manager action-strip adaptations are integrated. The three manager counts are selected-date plan entries (including unassigned), non-exhausted lots dated before the selected date, and non-exhausted lots with unknown dates. The lot counts open More → Stock. Loading/refresh failures display as unavailable; date labels remain review cues, not safety judgments. Existing Questions behavior remains unchanged. No API, schema, dependency or database changes were made. The 32-recipe demo data remained unchanged. Engineering checks passed as recorded in CURRENT_RELEASE.md; field usability and customer outcomes remain unvalidated.
