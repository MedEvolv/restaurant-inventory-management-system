# रसोई मार्गदर्शिका — Group 1 local demo

Staff open Today, choose the service date and meal, then read the scheduled dish's exact quantities, current reviewed instructions and captioned photos. Managers use **Plan meals**, **Guides** and **More**. Hindi/English labels and separately reviewed guidance are supported; the toggle never translates a manager's saved text automatically.

This is a local Group 1 capstone MVP. All kitchen names, quantities, manager notes and outcomes are fictional. No waste reduction, savings or interview findings have been measured. **No LLM API, AI subscription, API key or external food-guidance service is needed.** Calculations use Java `BigDecimal`; guidance is written by the manager.

Adapted from [RestaurantIQ](https://github.com/Balakrishna-kini/restaurant-inventory-management-system), MIT, Copyright (c) 2026 Balakrishna Kini. The original [LICENSE](LICENSE) remains intact. See [ATTRIBUTION.md](ATTRIBUTION.md) for copied and new work.

## Repository and product documentation

[GitHub build branch](https://github.com/MedEvolv/restaurant-inventory-management-system/tree/codex/group1-prep-purchase) · [Product documentation](docs/product/README.md) · [Current release](docs/product/CURRENT_RELEASE.md). Source release commit: `4d0962f`.

## Local demo

Verified checkout: `C:\ArchLife-Systems\group1-prep-purchase`, branch `codex/group1-prep-purchase`. Open **http://127.0.0.1:3016** while the app is running. Backend: `127.0.0.1:8086`; isolated MySQL: `127.0.0.1:3316`. The source mirror is in the capstone project's `prototypes/prep-purchase-src` folder. This is a standalone local Git fork retaining upstream history; the reviewed source is published on the MedEvolv fork; no application deployment has occurred.

On the already prepared Windows machine:

```powershell
cd C:\ArchLife-Systems\group1-prep-purchase
.\scripts\start-local.ps1
.\scripts\reset-demo.ps1 -Mode explore
```

If the app is already running, open it; the launcher refuses occupied app ports. `stop-local.ps1` stops only app processes recorded by the launcher and leaves MySQL data in place. Use `reset-demo.ps1 -Mode walkthrough` for the 3–5 minute [DEMO_SCRIPT.md](DEMO_SCRIPT.md). **More** contains the sample reset, initially collapsed and requiring an explicit typed confirmation. Reset deliberately replaces registered fictional activity; it is unnecessary when opening the prepared demo.

## Fresh checkout setup

Prerequisites: Java 21 JDK (`JAVA_HOME`), Node 24+, npm, MySQL 8.4, PowerShell for the optional Windows helpers. Maven is provided by the committed wrapper. The frontend lockfile is committed; install with `npm ci`.

1. Start MySQL on local port 3316. With a working Docker engine, the optional configuration is:

   ```powershell
   docker compose up -d db
   ```

   The Compose configuration was validated. Docker runtime execution was unavailable on the build machine; the verified runtime uses official portable MySQL 8.4.11. For an existing MySQL server, execute `scripts/init-demo.sql` as its administrator. It creates **separate** `prep_demo` and `prep_test` databases and grants the fictional `prep` user access to only those databases. Use a disposable local server; the sample credentials are intentionally public demo placeholders.

2. In the repository, install and launch:

   ```powershell
   .\scripts\start-local.ps1 -InstallDependencies
   .\scripts\reset-demo.ps1 -Mode explore
   ```

   The prepared checkout includes ignored `.tools` runtimes. A fresh clone does not include JDK/MySQL binaries or database files; provide the prerequisites above.

Alternatively, run in two terminals:

```powershell
cd backend
# JAVA_HOME must point to Java 21; add its bin directory to this terminal's PATH.
.\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=local'
```

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Connection overrides: `PREP_DB_URL`, `PREP_DB_USER`, `PREP_DB_PASSWORD`. Tests use `PREP_TEST_DB_URL`. Defaults connect to the isolated local demo/test databases. Keep actual credentials out of Git. Dates and timestamps use kitchen time, Asia/Kolkata.

## Verification commands

With MySQL running:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd -DskipTests package
```

With the app running:

```powershell
cd frontend
npm ci
npm run test -- --run
npm run lint
npm run build
npm audit --audit-level=low
npx playwright install chromium
npx playwright test --config .runtime/ux-validation/playwright.config.mjs
```

Browser tests mutate fictional data and target a **disposable demo copy**. Each test refuses a base URL other than `http://127.0.0.1:3017`. The prepared UX validation instance uses ports 3017/8087 and MySQL 3317, separate from the live 3016/8086/3316 demo. Backend HTTP tests use the **test** database. Browser projects run sequentially so they share no simultaneous reset. Phone checks emulate a phone viewport and touch behavior in Chromium; physical phones and Safari have not been tested. Exact results and acceptance mappings are in [VERIFICATION.md](VERIFICATION.md).

The prepared validation configuration lives in the ignored `.runtime/ux-validation/` directory of the source mirror. When creating another disposable copy, run its frontend on 3017 with its API proxy on 8087 and a separate database, then save this configuration as `.runtime/ux-validation/playwright.config.mjs`:

```js
import base from '../../playwright.config.js'
export default {
  ...base,
  testDir: '../../e2e',
  outputDir: 'test-results',
  use: { ...base.use, baseURL: 'http://127.0.0.1:3017' },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
}
```

## Behavior

- Record ingredients and individual receipt lots in kg/g, L/ml or whole counts. Dates can be use-by, best-before, supplier-labelled or unknown. Unit cost is per **received** unit.
- Plan meals in a seven-day calendar, grouped into breakfast, lunch and dinner. Each meal has a date-specific serving time; defaults 08:00/13:00/20:00 are derived until explicitly saved. Staff see these times read-only. New plans offer 30–100 portions in steps of 10, default 50. An older value such as 120 stays exact and is available only while editing that existing plan. Unclassified older plans appear under Needs a meal. The calendar counts dish entries and shows each dish's portions; these do not represent unique diners.
- Create/edit recipes under More → Dishes; remove or edit a dated meal plan from Plan meals. Recipe edits affect every current plan using that recipe. The calendar does not reserve stock across future days.
- Review required, physical recorded, date-excluded and usable stock for each planned ingredient. Purchase suggestion is `max(0, requirement + buffer - usable)`, rounded **up** to the chosen purchase increment. Buffer defaults to zero and applies to the selected date; purchase increment is an ingredient setting. Unknown dates remain visible for manager review and are included in usable recorded stock. A label date **before** the meal date is excluded; a date equal to the meal date is not yet passed.
- Edit quantities and save an immutable purchase draft with its calculation snapshot. Changed plans or stock mark it stale. A stale estimate cannot create a new draft. Saving never sends an order or adds stock.
- Record an actual arrival, optionally against a draft line. Partial arrivals leave an outstanding quantity. Over-receipt against a line is blocked; additional arrivals can be recorded separately.
- Record selected-lot waste, ordinary usage or a decrease for count discrepancy. Positive removals cannot exceed that lot. Receipts and removals use idempotency keys and row locks; retries cannot apply the same change twice.
- Write and edit handling and manager-approved substitution notes for ingredients or dishes, with the last editor and timestamp. Notes do not alter recipe arithmetic.

## Persistence and compatibility

Nine versioned Flyway migrations create or recognize upstream tables, add the decimal lot ledger, recipes/plans, draft snapshots/receipt progress, guidance editing, the sample registry and meal scheduling. V9 adds meal slots and serving-time overrides; older plans migrate to UNASSIGNED without changing portions or previous columns. Schedule-only changes preserve existing purchase calculation fingerprints. Existing inventory, purchase orders and stock history stay intact. A positive legacy balance becomes a clearly labelled opening lot; its old ingredient date has unknown provenance. Run against a backup before adapting an actual legacy installation.

Decimal lots are authoritative. The upstream `Double` total is a compatibility mirror; the new estimator never calculates from it. Legacy read endpoints and original source pages remain available in source. Legacy HTTP writes return 409 so old stock/order routes cannot bypass the ledger. Legacy orders remain historical records; use the new draft and receipt flow for subsequent work. There is no destructive inventory-delete UI.

## Practical limits

This is a local single-kitchen demonstration with a fictional manager identity, **without server authentication or roles**. A hosted pilot needs authentication, deployment configuration and real kitchen validation. The current launcher binds the app to localhost; phone suitability is demonstrated through browser emulation. Lot dates prompt human review and cannot establish food safety. No density conversion, yield-loss model, automatic ordering, external supplier messaging, POS, billing or forecasting is included. Count corrections currently support decreases; a counted increase needs a future audited correction flow. UI history shows the latest 200 movements and 200 notes, and the latest 100 drafts; full records remain in MySQL. Flyway 9.22.3 emits a compatibility warning for MySQL 8.4; the migration and HTTP tests passed on 8.4.11, but that dependency should be updated and revalidated before a hosted pilot.

Sample reset replaces registered fictional kitchen activity and seeded recipes/notes while retaining ingredient identities and other records. It refuses a draft that mixes sample and non-sample ingredients. Use a fresh demo database if non-sample records conflict with the seed names. Review [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) for assumptions and next steps.

## Reviewed bilingual guidance and task-first layout

The app opens in Hindi Today. The Hindi/English preference persists across reload. Pick the work date, meal and planned dish to see current planned quantities, published instructions, accountable owner, version, applicability, task photos and next action. Current, Missing and Needs review are written statuses. No plan produces an explicit empty state; the fictional explore seed schedules tomorrow, available through the next-day action. Missing instructions lead to a local question. Recipe/ingredient changes or archival suppress old instructions/photos with review-needed metadata; changing portions, meal slot or serving time alone does not invalidate the method.

**Manager workspace** provides Plan meals, Guides and More. Guides starts with the document list; New/Open enters a focused editor. Essential instructions appear first and optional details are expandable. Save draft is separate from Publish. Review Hindi and English explicitly; only the checked, reviewed variants become available to staff. If the requested variant is absent, the actual published language and fallback are named. Draft edits preserve the prior publication; context changes require saving a reviewed draft and deliberate republishing. Unsaved language edits remain through interface-language and workspace navigation, and changing to another document requires saving or discarding. Legacy manager notes stay separate and are never silently treated as published instructions.

More contains Ingredients & buying, Dishes, Stock, Purchases and Records. Detailed arithmetic, settings, lot detail and sample reset are secondary disclosures. These are local navigation views, not authenticated roles.

Photos require caption, process/portion kind and explicit demo flag. JPEG/PNG: **5 MiB** maximum, six current draft photos, 6000 pixels per dimension and 20 million decoded pixels. Multipart parser caps are 6 MiB/file and 7 MiB/request; the effective image limit remains 5 MiB. Signature, MIME, dimensions and decode are checked. Bytes persist in MySQL; published membership is frozen. Removing a draft photo preserves the current published photo. Staff URLs reject draft-only/stale photos; manager preview APIs remain unauthenticated. Missing images have a text fallback. Assets are AI-generated fictional illustrations, not reviewed kitchen standards.

Questions are local records with reporter/date, retry keys, manager queue and resolution note. Unchanged uncertain retries keep their key; changed payload gets a new key. Concurrent duplicates return once or a recoverable conflict. **No notification or message is sent.** Urgent decisions require direct contact with the responsible kitchen lead.

Optional playback uses a browser-provided device-local voice matching the **actual guidance language**, with capability/error/stop handling. Without one, written guidance remains available. Changing content or language stops prior playback. No microphone, speech recognition, LLM or speech API is needed. This is an unvalidated access experiment, not evidence of value in a noisy kitchen.

### Prepared-machine offline verification fallback

Current release checks use already cached Maven. The generic wrapper/start-local paths above remain setup helpers; their actual verification status is separate in VERIFICATION.md.

```powershell
$env:JAVA_HOME='C:\ArchLife-Systems\group1-prep-purchase\.tools\jdk-21.0.12.1+1'
$env:PATH="$env:JAVA_HOME\bin;"+$env:PATH
cd backend
& 'C:\Users\ishaa\.m2\wrapper\dists\apache-maven-3.9.6-bin\3311e1d4\apache-maven-3.9.6\bin\mvn.cmd' -q -o '-Dmaven.repo.local=C:\Users\ishaa\.m2\repository' test
```

Backend tests use prep_test. Original browser regressions reset only registered fictional records; the new guidance workflow creates its own unique fixture and removes its own plan/archives its recipe. Registered sample reset cascades sample-recipe guidance/photos/questions while preserving unrelated records. See VERIFICATION.md for exact release results and actual screenshots.

### Shared-kitchen pilot gates

Server authentication and staff/manager permissions are **not implemented**. Shared real use needs tested auth/data-access/deployment controls, the deployment's backup/restore procedure and kitchen-owner content review. Technical fresh/upgrade/restart/restore checks do not establish real kitchen usability or safe independent production. Hindi/English and Delhi–Gurgaon are rollout choices; no interviews or kitchen pilot were conducted. Intermediate batches, chronological stock reservation, automated external ingestion and speech lookup remain conditional later branches. EatByDate is a reference, not an integrated expiry authority.
