# Kitchen Saathi design contract

## Accepted product direction

Kitchen Saathi is the product name for the next local-demo increment. The user has chosen institutional messes and commercial kitchens as the intended positioning. This is a product choice, not field-validated segment fit; the supplied record still contains zero completed kitchen interviews or observed task sessions.

## Visual and information architecture

Use a compact **2:1 bento layout** with distinct **Cook** and **Manager** workspaces and a role selector. Keep a clear header, native weekday dropdown with all seven full names, a selected-week strip and a **This week** reset. Use emerald accents. Maintain all navigation options on mobile. The manager workspace uses four existing-data cards, defined below.

The serving selector keeps the existing 30–100 presets and adds **350 portions** as a prominent option plus a custom whole-number field. This supersedes the old 30–100-only UI restriction. The current backend accepts integer portions from 1 through 100,000; retain exact legacy values and validate custom entry against that range. Do not imply that the demo contains real coverage for 350 diners.

Provide a visible, standalone 350-portion recipe preview that shows exact decimal ingredient arithmetic without a Save action or plan mutation. Custom whole-number portions from 1 through 100,000 use the same exact preview. The existing calendar remains the only plan-saving path; retain the selected date and legacy portions.

## Four existing-data manager stats

1. **Recorded stock value:** converted remaining lot quantity multiplied by its unit cost. Mark the value incomplete when any included lot lacks a usable quantity or cost; do not imply a financial valuation audit.
2. **Low-stock alerts:** count ingredient lines in the estimate for the selected date whose suggested quantity is greater than zero.
3. **Active suppliers:** unique named suppliers represented by lots with positive remaining quantity.
4. **Pending purchase drafts:** drafts with outstanding quantity greater than zero among the latest 100 drafts. A draft is not a formal purchase order.

Label date scope, source and incomplete values. Do not add revenue, savings, supplier performance, purchase-order status or other unsupported claims.

## Interaction and data rules

- Preserve separately authored and reviewed Hindi and English guidance. Do not auto-translate or change publication state.
- Keep stale-guidance suppression, visible missing-language fallback, and manager escalation intact.
- Treat recorded lot dates as review cues, not food-safety verdicts; show unknown dates explicitly.
- Maintain existing questions, stock, purchase-draft, history and data-preservation behavior unless a separate approved change specifies otherwise.
- Keep all calculations deterministic and exact. No supplier integration, purchase-order workflow, automated ordering or safety recommendation is introduced by this design contract; the recorded-stock-value card is the only finance-adjacent summary.

Manager-only bilingual recipe search preserves the selected date, refetches when the manager returns, guards pending notification actions, and shows an unavailable state on failure. Notification list entries use the latest 200 records and include their captions. Weekday selection uses native dropdown options with all seven weekday names plus This week reset. Live port 3016 confirmed all four cards, weekday options/reset, 350 preview increment/decrement with no Save action, Cook/Manager phone navigation, no overflow, no JavaScript errors and no POSTs. Seven API snapshots were exactly preserved.

## Implementation status

The implementation is integrated into the actual checkout. Sol verified 41 unique frontend tests across the initial 40-pass/one-obsolete-failure run and bounded corrections, including an isolated retry of one 5-second timeout; this was not a single 41-pass full run. Lint and production build passed cleanly with zero warnings. Eight browser workflows were verified across two runs: six passed in the initial 1.8-minute run, then the two corrected calendar workflows passed on laptop and phone in a separate 38-second rerun. Do not describe them as one eight-pass run. `npm ci` completed with 348 packages, and live read-only verification passed. Remote publication remains pending. The prior 39 backend checks are reused from the earlier release, not rerun. No backend or data changes and no LLM API were added.
