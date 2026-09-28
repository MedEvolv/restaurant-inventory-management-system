# Tomorrow's Prep & Purchase

A hostel kitchen manager can turn tomorrow's planned meals and recorded stock into a purchase draft they can check and adjust.

This is a local Group 1 capstone MVP. All kitchen names, quantities, manager notes and outcomes are fictional. No waste reduction, savings or interview findings have been measured. **No LLM API, AI subscription, API key or external food-guidance service is needed.** Calculations use Java `BigDecimal`; guidance is written by the manager.

Adapted from [RestaurantIQ](https://github.com/Balakrishna-kini/restaurant-inventory-management-system), MIT, Copyright (c) 2026 Balakrishna Kini. The original [LICENSE](LICENSE) remains intact. See [ATTRIBUTION.md](ATTRIBUTION.md) for copied and new work.

## Local demo

Verified checkout: `C:\ArchLife-Systems\group1-prep-purchase`, branch `codex/group1-prep-purchase`. Open **http://127.0.0.1:3016** while the app is running. Backend: `127.0.0.1:8086`; isolated MySQL: `127.0.0.1:3316`. The source mirror is in the capstone project's `prototypes/prep-purchase-src` folder. This is a standalone local Git fork retaining upstream history; nothing has been pushed or deployed.

On the already prepared Windows machine:

```powershell
cd C:\ArchLife-Systems\group1-prep-purchase
.\scripts\start-local.ps1
.\scripts\reset-demo.ps1 -Mode explore
```

If the app is already running, open it; the launcher refuses occupied app ports. `stop-local.ps1` stops only app processes recorded by the launcher and leaves MySQL data in place. Use `reset-demo.ps1 -Mode walkthrough` for the 3–5 minute [DEMO_SCRIPT.md](DEMO_SCRIPT.md). The interface also exposes **Reset fictional kitchen**, with an explicit typed confirmation.

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
npm run test:e2e
```

Browser tests use the **demo** database and reset only registered fictional kitchen records. Backend HTTP tests use the **test** database. Browser projects run sequentially so they share no simultaneous reset. Phone checks emulate a phone viewport and touch behavior in Chromium; physical phones and Safari have not been tested. Exact results and acceptance mappings are in [VERIFICATION.md](VERIFICATION.md).

## Behavior

- Record ingredients and individual receipt lots in kg/g, L/ml or whole counts. Dates can be use-by, best-before, supplier-labelled or unknown. Unit cost is per **received** unit.
- Create and edit recipes, plan multiple dishes for a date, edit portions, and remove a plan. Recipe edits affect every current plan using that recipe.
- Review required, physical recorded, date-excluded and usable stock for each planned ingredient. Purchase suggestion is `max(0, requirement + buffer - usable)`, rounded **up** to the chosen purchase increment. Buffer defaults to zero and applies to the selected date; purchase increment is an ingredient setting. Unknown dates remain visible for manager review and are included in usable recorded stock. A label date **before** the meal date is excluded; a date equal to the meal date is not yet passed.
- Edit quantities and save an immutable purchase draft with its calculation snapshot. Changed plans or stock mark it stale. A stale estimate cannot create a new draft. Saving never sends an order or adds stock.
- Record an actual arrival, optionally against a draft line. Partial arrivals leave an outstanding quantity. Over-receipt against a line is blocked; additional arrivals can be recorded separately.
- Record selected-lot waste, ordinary usage or a decrease for count discrepancy. Positive removals cannot exceed that lot. Receipts and removals use idempotency keys and row locks; retries cannot apply the same change twice.
- Write and edit handling and manager-approved substitution notes for ingredients or dishes, with the last editor and timestamp. Notes do not alter recipe arithmetic.

## Persistence and compatibility

Six versioned Flyway migrations create or recognize upstream tables, add the decimal lot ledger, recipes/plans, draft snapshots/receipt progress, guidance editing and the sample registry. Existing inventory, purchase orders and stock history stay intact. A positive legacy balance becomes a clearly labelled opening lot; its old ingredient date has unknown provenance. Run against a backup before adapting an actual legacy installation.

Decimal lots are authoritative. The upstream `Double` total is a compatibility mirror; the new estimator never calculates from it. Legacy read endpoints and original source pages remain available in source. Legacy HTTP writes return 409 so old stock/order routes cannot bypass the ledger. Legacy orders remain historical records; use the new draft and receipt flow for subsequent work. There is no destructive inventory-delete UI.

## Practical limits

This is a local single-kitchen demonstration with a fictional manager identity, **without server authentication or roles**. A hosted pilot needs authentication, deployment configuration and real kitchen validation. The current launcher binds the app to localhost; phone suitability is demonstrated through browser emulation. Lot dates prompt human review and cannot establish food safety. No density conversion, yield-loss model, automatic ordering, external supplier messaging, POS, billing or forecasting is included. Count corrections currently support decreases; a counted increase needs a future audited correction flow. UI history shows the latest 200 movements and 200 notes, and the latest 100 drafts; full records remain in MySQL. Flyway 9.22.3 emits a compatibility warning for MySQL 8.4; the migration and HTTP tests passed on 8.4.11, but that dependency should be updated and revalidated before a hosted pilot.

Sample reset replaces registered fictional kitchen activity and seeded recipes/notes while retaining ingredient identities and other records. It refuses a draft that mixes sample and non-sample ingredients. Use a fresh demo database if non-sample records conflict with the seed names. Review [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) for assumptions and next steps.
