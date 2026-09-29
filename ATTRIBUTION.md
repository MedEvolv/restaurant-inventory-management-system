# Attribution and implementation provenance

Primary base: [RestaurantIQ — Balakrishna-kini/restaurant-inventory-management-system](https://github.com/Balakrishna-kini/restaurant-inventory-management-system), pinned at `ed0a3a283dd0c01ad1492beb368257bd6b73b645`. License: MIT. Exact original copyright notice: **Copyright (c) 2026 Balakrishna Kini**. The full notice and grant are preserved verbatim in [LICENSE](LICENSE); they apply to the inherited source. Upstream history remains in the local Git repository.

Inherited: Java 21/Spring Boot application structure, MySQL inventory/category/supplier/order/history entities and read APIs, original React/Vite frontend source, Maven wrapper and frontend dependency structure. The baseline fixes a null reorder-level check and Windows Maven wrapper launch property/quoting. V1 preserves the observed upstream MySQL schema. Existing legacy quantities remain compatibility mirrors; original historical records are preserved.

New for Group 1: decimal dated-lot ledger, receipt idempotency and transaction locking, recipe and meal-plan schema/APIs, deterministic estimate and unit checks, explicit buffer/increment settings, immutable purchase draft snapshots and partial receipt progress, reason-coded waste/usage/count decreases, manager guidance, sample registry/reset, staff Today and focused manager screens and responsive styling, migrations, tests, run helpers and build documentation. These are functional adaptations, not claimed inventions of general kitchen inventory concepts.

Reference only: [Khdeval/RIMS](https://github.com/Khdeval/RIMS), inspected at `6f8e084c5c0a4cbf3dce9d4c31f1551a0ba43991`. No LICENSE or package license field was found in the inspected tree. **No RIMS code, schema file, asset or yield formula was copied.** Its separate Flutter/Node application is not part of this build. The recipe and reason-coded stock workflows here were written from the capstone requirements.

Dependency packages retain their own upstream licenses through Maven/npm. Java, MySQL and Playwright runtime downloads are ignored local tools, not source distributed by this repository. The frontend lockfile is committed; runtime credentials in documentation are public fictional local-only examples.

Presentation credit line: “Built by Group 1 as an adaptation of RestaurantIQ by Balakrishna Kini (MIT). New prep planning, dated-lot ledger, purchase drafts, waste and manager-guidance workflow. All displayed kitchen data are fictional.”

## Published guidance and calendar increment

Group1 also added versioned draft/publication guidance, persistent captioned demo photos, local questions, explicit reviewed Hindi/English variants, local matching-voice playback and V9 meal calendar/times with legacy-plan preservation. Original MIT notices remain unchanged. Authored product documentation is under docs/product; external course/source material and real interview records are not bundled.
