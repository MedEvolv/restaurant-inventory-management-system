# Group1 kitchen guidance and planning backend

Java21 / Spring Boot3 / MySQL8.4 local API for the reviewed Group1 capstone. The Group1 app is not deployed to the upstream author's Railway service. Default local backend: http://127.0.0.1:8086, API prefix `/api/prep`.

## Behavior

Decimal dated-lot stock with transaction locks/idempotency; recipes/plans/current quantities; daily purchase estimates and immutable drafts; actual partial receipts; usage/waste/count decreases; notes/history. Versioned guidance drafts and immutable publications support explicit reviewed Hindi/English variants, recipe-context staleness, persistent JPEG/PNG photos and local contextual questions/resolutions. V9 adds the seven-day calendar, meal slots and strict date-specific serving times. All nine migrations are additive; legacy plans remain UNASSIGNED with exact quantities.

No LLM API, machine translation, automatic expiry authority, supplier messaging or server-enforced staff/manager roles. A week calendar does not reserve stock across dates. Prepared-product production/yield/lineage is later scope.

## Setup and verification

Use the [root setup and prepared-machine offline Maven commands](../README.md). Local database `prep_demo` on3316, separate test database `prep_test`; overrides are PREP_DB_URL/PREP_DB_USER/PREP_DB_PASSWORD and PREP_TEST_DB_URL. Keep real credentials out of source. Migrations V1–V9 run through Flyway. Do not reset a real or presentation database to run browser fixtures.

Current accepted backend suite:39tests, zero failures/errors on actual MySQL. Fresh schema, V8→V9 preservation, actual restart and separate-database hex-BLOB dump/import passed. See [verification](../VERIFICATION.md) for exact evidence, historical helper status and Flyway/MySQL compatibility limits; this is engineering acceptance, not safe-food or hosted security certification.

## Provenance

Adapted from RestaurantIQ by Balakrishna Kini under MIT. Original entities/read APIs/history and copyright remain. Group1's decimal lot ledger is authoritative; legacy Double totals are compatibility mirrors and old write routes cannot bypass it. See [attribution](../ATTRIBUTION.md) and [current release](../docs/product/CURRENT_RELEASE.md).
