# Kitchen guide and weekly meals demo — fictional, 29 September 2026

Open http://127.0.0.1:3016. Switch to English for the button names below; Hindi is also available and the choice persists. The prepared presentation data need not be reset.

The retained 29 September fixture has two older 120-portion dishes under **Needs a meal**. Open Paneer curry there to show its published guidance/photo. In Plan meals, explicitly edit and assign a meal if presenting populated breakfast/lunch/dinner cards; migration deliberately did not guess those assignments or alter portions.

1. **Today:** choose the service date and open a dish under breakfast/lunch/dinner. Show read-only serving times, exact portions/quantities, Current/Missing/Needs review status, published instructions and captioned photos.
2. **Manager workspace → Plan meals:** navigate the seven-day calendar, including empty dates. Add dish from its meal, choose a recipe and 50 portions. New options are 30, 40, 50, 60, 70, 80, 90, 100. Edit an older 120-portion plan to show its exact value is retained only for that existing plan. Change a time and explicitly Save time; another date remains independent.
3. **Guides:** start at the list, then New/Open. Save draft and Publish are separate. Hindi and English are authored and reviewed explicitly; an absent variant names the actual published fallback language. Unsaved edits remain through interface-language and workspace navigation.
4. **Staff view:** open the dish again. Ask manager opens a short local question form; recording it sends no message. Show the local manager resolution. Optional playback requires a matching local voice; text remains usable without it.
5. **More:** briefly show Ingredients & buying, Dishes, Stock, Purchases and Records. Expand calculations or lot detail only when needed. A calendar does not reserve stock across dates.

For a disposable stock walkthrough, reset the registered fictional samples in walkthrough mode and choose the returned sample date. Receive Tomatoes 7 kg with a future label and 3 kg with a past label. Add 100 portions of Vegetable pulao to Lunch and 100 of Paneer curry to Dinner. Tomatoes require 15 kg; physical 10/excluded 3/usable 7 produces suggestion 8. Override to 9, receive 8 against the draft and show 1 outstanding. Usable stock becomes 15 and suggestion 0. Remove 3 spoiled from the original 7 kg usable lot: usable 12, suggestion 3. Show edited notes and movement history under Records. The older 120-portion fixture below remains a compatibility case; new controls do not offer 120.

Use only explicitly fictional guidance, for example Hindi `काल्पनिक उदाहरण: वास्तविक तैयारी विधि की रसोई प्रमुख से पुष्टि करें।` and English `Fictional example: confirm the real preparation method with the kitchen lead.` Sample photos are illustrations, not kitchen standards. Save a different unpublished draft and show staff retain the prior publication. A recipe composition change instead suppresses old instructions/photos until reviewed republication.

No LLM API is needed. Real kitchen observation/content approval, server permissions, physical-device trials and measured impact remain pilot gates. Prepared batches, chronological reservation and automated external ingestion are later work.

## Historical Hindi release walkthrough — 28 September 2026

The retained steps below document the previous navigation and 120-portion arithmetic. Use the current tour above for the revised interface.

Opening: “When staff face an unfamiliar preparation decision, they can find the published instruction for the scheduled dish or recognize that the responsible person is needed.” This is a local fictional demonstration, not a kitchen task study or safe-production claim.

1. Open Today, select the work date and scheduled dish. The explore seed plans tomorrow; use **कल की योजना देखें**. Show portions and exact ingredient quantities.
2. Manager workspace → Guidance manager: choose the dish and create an explicitly fictional Hindi draft with owner, method, applicability and next action. Harmless example: “काल्पनिक उदाहरण: रसोई प्रमुख से विधि की पुष्टि करें।” Saving remains a draft; do not turn unreviewed demo text into kitchen policy.
3. Add a captioned process/portion photo with demo flag. assets/demo-paneer-photo.png and demo-rice-photo.png are AI-generated illustrations, not standards; see assets/DEMO_PHOTOS.md. Review then deliberately publish. Staff view shows owner/version/text/photo/next action. Missing Hindi voice or image leaves text usable.
4. Record a question with reporter. It goes into the local manager list and sends no message. Show local resolution; urgent decisions need direct contact with the kitchen lead.
5. Save a revised draft and show staff retain the previous publication until explicit publish. A recipe composition change instead produces review-needed state, suppressing old instructions/photos until reviewed saving and republishing.

Close: the functional flow and technical persistence are checked; no interviews, supervised task study or repeated-service pilot were completed. Staff/manager navigation is not authenticated access. Real content review, permissions, devices/connectivity and the pilot remain gates.

## Preserved Prep & Purchase walkthrough

Enter **Manager workspace** first; planning date remains tomorrow. The earlier walkthrough below preserves exact arithmetic/provenance.
# 3–5 minute fictional kitchen demo

Opening sentence: “A hostel kitchen manager can turn tomorrow's planned meals and recorded stock into a purchase draft they can check and adjust.” All data below are seeded examples, not observed kitchen outcomes.

Before presenting: start the app, run `scripts/reset-demo.ps1 -Mode walkthrough`, and open http://127.0.0.1:3016. Tomorrow's date is preselected in kitchen time. Rice, onions, paneer, two recipes and manager notes are ready. Tomatoes have no receipt yet. The **explore** seed is an alternate starting point with lots and 120 portions per dish already entered.

| Time | Manager action | Show / say |
|---|---|---|
| 0:00–0:40 | Stock & dates → Receive stock → Tomatoes. Receive 7 kg, ₹30/kg, optional fictional supplier, received today, best-before four days from today. Repeat for 3 kg with a label date yesterday. | Two lots remain separate. Physical recorded stock is 10 kg. Entered dates prompt review; they do not establish safety or automatically create waste. |
| 0:40–1:20 | Tomorrow's plan → Plan a dish → Vegetable pulao, 120 portions. Add Paneer curry, 120 portions. | Tomatoes: `120 × 0.10 + 120 × 0.05 = 18 kg`. Both dishes have their own ingredient breakdown. |
| 1:20–2:00 | Read the tomatoes row and arithmetic. | Physical 10 kg, date-excluded 3 kg, usable 7 kg, zero buffer. `max(0,18 + 0 − 7) = 11 kg`. Unknown onion dates remain visible for review. Paneer is intentionally low stock. Buffer and purchase increments are explicit, editable choices. |
| 2:00–2:35 | Change Draft quantity Tomatoes from 11 to 12 and save purchase draft. Open its saved calculation. | Your override is retained alongside the original suggestion. It is a draft: no order sent and stock unchanged. |
| 2:35–3:15 | Purchase drafts → Receive Tomatoes from draft. Enter an actual arrival of 11 kg, ₹30/kg, received today, future label date. | Partial arrival leaves 1 kg outstanding. Back on the plan: physical 21 kg, excluded 3 kg, usable 18 kg, suggestion zero. |
| 3:15–3:50 | Waste & notes → Tomatoes → select the original **7 kg future-date lot** → remove 3 kg → Waste / Spoiled, optional note. Record. | The selected lot now has 4 kg. Physical stock is 18 kg; 3 kg is still date-excluded; usable is 15 kg. Requirement is 18 kg, so the new suggestion is **3 kg**. History records the reason and time. |
| 3:50–4:20 | Manager notes → Tomatoes handling note. Optionally show the dish substitution note. | Guidance is authored by the manager, with author and timestamp. It does not change recipe quantities automatically. No LLM API is involved. |

The separate fixture “7 kg usable, then 3 kg spoiled, suggests 14 kg” applies **before any new receipt**: `18 − (7 − 3) = 14`. Do not describe 14 kg as the result after the 11 kg receipt above.

Close by naming what remains unvalidated: whether lot entry is practical in the kitchen, whether portions and recipe quantities reflect actual prep, how often managers override the draft, and whether this reduces planning effort. No savings claim is supported by this demonstration.

For a small usability test, record start/end time for the plan-to-draft decision, number and reasons for manual quantity corrections, date-review mistakes, and recovery from an invalid removal. Ask the manager to walk through their last over-order, stockout or discarded lot using their existing records; compare the decision process before discussing adoption or payment.

## Published demo source

[Build branch](https://github.com/MedEvolv/restaurant-inventory-management-system/tree/codex/group1-prep-purchase); source release4d0962f. Use the current tour above, not historical navigation. Product roadmap and evidence are in [docs/product](docs/product/README.md). GitHub publishing does not host the local application.
