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
