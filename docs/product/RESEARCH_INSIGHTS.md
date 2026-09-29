# Key insights from primary research: evidence status and discovery plan

## Release update 29 September 2026

No new primary research was conducted during implementation. Engineering failures and fixes are software findings, not customer interview insights.

[Current release, checks and remaining scope](CURRENT_RELEASE.md).

Version 1.1, updated 29 September 2026.

## What primary research currently supports

**No completed customer field interviews, observations or usability sessions were found in the supplied project records.** `current-status.md` says zero sits; `interviews/tapes/` contains its README, with no real tapes. The core pasted research brief explicitly identifies assumptions and questions to investigate. We therefore cannot report customer quotes, interview counts, recurring themes, demographic statistics, validated willingness to pay or measured waste savings.

This is the current primary-research conclusion: **the evidence needed to select and validate the leading job is missing**. The functional prototype makes a future task test possible; it does not close that gap. The attached educational PDFs, synthetic transcripts and developer tests do not supply missing customer evidence.

## Decisions and constraints we can state

|Item|Evidence label|Source|Product implication|
|-|-|-|-|
|Delhi–Gurgaon is the MVP geography|User decision|Conversation|Recruit locally and test Hindi/English vocabulary on actual staff. Geography does not establish literacy or voice preference.|
|Hindi/English UI and separately reviewed guidance are requested|User decision|Latest conversation|Support explicit language availability and fallback; no silent translation.|
|One niche, limited features, functional product with roadmap/stories/release/GTM|Historical project instruction|24 September mentorship record|Explain a small feature set and value; avoid all-kitchens market claims.|
|Professional kitchen is the working scope; home cook is separate|Current project direction|Current status and canon|Do not merge domestic pantry problems into kitchen findings.|
|Guidance, planning and batch handling are different jobs|Analytical framing|JTBD critique|Choose a primary problem by incident evidence; do not bundle them to manufacture urgency.|
|Published guidance, photos, portions and questions can be implemented locally|Engineering verified, bounded by test record|Actual source and verification|Feasibility is promising; usability, adoption and benefit remain unknown.|

## Hypothesis-led insight candidates

These are **research propositions**, not primary findings. Each includes a way to reject it.

|ID|Hypothesized pattern|Why it matters if true|Evidence to collect|Disconfirming result|
|-|-|-|-|-|
|H01|The trusted answer is concentrated in one senior person|Manager-approved guidance could reduce dependence during absence|Reconstruct last busy service: dish, exact decision, senior availability, actions, result|No recurring unavailable-answer moment; chef is always present when needed|
|H02|Generic recipes do not resolve house-specific decisions|Ownership, revision and applicability matter more than generic search|Compare the intended answer to internet recipe/binder/WhatsApp instruction actually used|Existing generic material consistently suffices|
|H03|Finding the current answer takes longer than acting on it|Today/dish entry could outperform a message search or process tour|Time from uncertainty to correct action, including finding device and retry|Nearby cook/wall sheet wins on time and correctness|
|H04|Short text, process photos or Hindi audio help different tasks|Support modalities only where they reduce ambiguity|Same task with existing workaround and one reviewed modality; observe interpretation|Photo is decorative; audio too noisy/slow; users prefer paper|
|H05|Unknown/substituted material requires explicit escalation|A confident wrong answer is worse than a clear unanswered state|Actual uncertain substitution and how authority was established|Staff already know and apply a reliable house rule|
|H06|Current servings and approved method must be seen together|Context may prevent applying a correct recipe to wrong quantity|Trace actual portion definition, yield and ingredient calculation|Cook works by a different valid unit and app context adds confusion|
|H07|Prepared products are a distinct source of deadline confusion|Curries/sauces/chutneys need actual batch identity and condition data|Identify actual batch, prepared-at, storage, policy, remaining quantity and disposal cause|Current labels/logs already resolve the decision reliably|
|H08|Weekly menus create repeated allocation/purchase problems|Chronological projection may be worth its high effort|Reconstruct menu edits, demand, repeated stock allocation and actual shortage|Shortages are caused by deliveries or execution rather than planning visibility|
|H09|Kitchen owners can maintain reviewed bilingual content|Language support needs a sustainable content process|Observe authoring/review, semantic agreement, time and incentives|No reviewer/time; translations drift or become unused|
|H10|Waste reduction could result from a solved decision|Only a causally linked benefit should support expansion or pricing|Separate overproduction, spoilage, leftovers, trim, failed dish and uncertainty|Waste mainly has unrelated causes|

## Critical JTBD application

**J1 provisional statement:** when I face an unfamiliar preparation decision during service and the experienced person cannot help, I want to establish the kitchen's intended next action so I can finish the task correctly without guessing.

The actor, circumstance and progress are the job. “Use voice,” “search recipes” and “manage inventory” are possible solutions. “Reduce waste” is not the job unless a specific incident connects uncertainty to disposal. A cook, head chef and owner describe different responsibilities; they need not hire the same product for the same outcome.

|JTBD lens|What to investigate|Implication|
|-|-|-|
|Push from current situation|A recent delay, wrong preparation or repeated interruption|Need a real trigger, not general agreement that information is useful|
|Pull of a proposed alternative|Faster correct answer available where/when needed|Compare actual task performance; feature appeal is insufficient|
|Anxiety about change|Wrong rule, old recipe, misunderstood translation or unreliable device|Approval, staleness, fallback and content review are central|
|Habit keeping current approach|Chef nearby, wall note, trusted colleague, familiar WhatsApp thread|Product must beat that habit, including setup and maintenance|
|Functional/emotional/social outcome|Correct action, confidence, maintaining house standard|Ask about actual outcome; do not write imagined quotes|

If J2 or J3 dominates observed incidents, the roadmap's leading branch can change. Do not argue that inventory solves guidance merely because both involve food. A complete prepared-batch feature is much more than an expiry label.

## Primary research plan

Research goal: determine whether one identifiable professional-kitchen role repeatedly encounters an unavailable trusted answer, what the consequence is, and whether a maintained guidance surface improves the actual decision.

**Stage A — incident discovery, before showing the product.** Start with an accessible manager/head chef after a recent busy service. Follow with the cook involved and owner/buyer in the same kitchen. Treat these as three perspectives on one kitchen, not three independent replications. Begin with one kitchen; seek additional comparable and contrasting houses before generalizing. A proposed initial recruitment target is three kitchens, conditional on access, not a completed sample or a claim of saturation.

Interview team roles: interviewer, observer/recorder and note-taker where available. Obtain consent before recording. Use the active canon guide. Open with recent behavior:

1. Walk through the last busy service when someone needed an answer. Which dish and exact decision?
2. What happened in order? Who knew, where was that person, and what did the cook actually do?
3. Show the instruction/message/label used, if comfortable. How did you decide it applied?
4. What happened to the dish? Delay, change, rework or no consequence?
5. When else did this happen? Establish frequency only after an incident.
6. What already works well enough that you would keep it?
7. If food was discarded, why, in your terms? Do not suggest missing guidance as the cause.

Do not open with an app demo, ask “would you use AI?” or offer an all-in-one feature list. Keep home-cook Guide B separate. Do not contact participants or send messages without user authorization.

**Stage B — observe and baseline the selected job.** With access and consent, shadow the relevant task/shift. Record starting uncertainty, available alternatives, actual answer, correctness verifier and time to correct next action. Distinguish observed actions from remembered estimates. Capture phone access, language, interruptions and manager involvement without assuming gloves/noise/low literacy.

**Stage C — focused solution comparison after discovery.** Select real incidents that can be safely replayed with a kitchen reviewer. Compare the current workaround with a small approved text/photo/audio/app variant. Vary task order to reduce learning effects; use equivalent tasks rather than asking someone to repeat the same known answer. Include supported, missing, stale and untranslated cases. A proposed first round of 20 decision episodes across at least three shifts is directional learning only, not a statistically representative trial. Never deliberately test uncertain safety instructions during live service.

**Stage D — protected pilot.** Only after access controls, reviewed content and recovery readiness. Observe independent reuse, answer quality and maintenance over a proposed two-week learning window. A prompted demo session does not count as retained behavior.

## Research capture and synthesis

|Field|Required recording|
|-|-|
|Session provenance|Date, kitchen pseudonym, role, method, consent and tape/observation locator|
|Incident|Service context, dish, exact decision and who experienced it|
|Behavior|Ordered actions and actual artifact/workaround; observed vs self-reported|
|Consequence|Delay/rework/change/discard/none; direct evidence or estimate|
|Recurrence|Examples and recall horizon; avoid converting vague “often” to a frequency|
|Language/modality|Actual terminology/readout interpretation and task result|
|Contradiction|What weakens the hypothesis or favors the current workaround|
|Synthesis|Observation → interpretation → proposed product decision, separately labelled|

Insight template, to populate only after real sessions: **In \[circumstance], \[actor] does \[observed behavior] because \[supported interpretation], which produces \[observed consequence]. This suggests \[decision], subject to \[contradiction/unknown].** Attach the locator. Do not manufacture an interview quote to fill the template.

## Decision rules after research

Proceed with J1 only if repeated, consequential incidents are documented and a feasible approved surface beats the current method on correctness/time without excessive maintenance. Refine if a narrower moment/modality is valuable. Stop or change the lead if uncertainty is rare, the current workaround wins or no policy owner can maintain the content. Promote planning/batches only on their own incident and data evidence. Re-score priorities with real reach and effort after the pilot.

References: S01–S11 in the [source register](SOURCES_AND_COURSE_ALIGNMENT.md); course Session 2 physical pages 5, 7, 15, 18–22 and 27 underpin the distinction between hypotheses, observed behavior and synthesized insights.

