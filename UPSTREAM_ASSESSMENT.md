# Upstream baseline and adaptation

RestaurantIQ source: https://github.com/Balakrishna-kini/restaurant-inventory-management-system
Pinned upstream commit: ed0a3a283dd0c01ad1492beb368257bd6b73b645.
License: MIT, Copyright (c) 2026 Balakrishna Kini. LICENSE is preserved.

Baseline verified locally on 28 September 2026:

- React/Vite installation and production build passed. Its dependency audit reported 11 inherited vulnerabilities; these will be reviewed before the final build check.
- Java 21 portable runtime checksum verified. Windows Maven wrapper required its missing multiModuleProjectDirectory property and a trailing-path quoting fix.
- Inherited backend suite initially failed 1 of 3 tests: stock increase unboxed a null reorder level. Added a null guard. All 3 inherited tests then passed and the backend packaged.
- Docker Desktop's UI was running but no engine was reachable. Official portable MySQL 8.4.11 was downloaded, checksum checked, and started on 127.0.0.1:3316. No system MySQL installation was changed.
- The Spring backend ran at 127.0.0.1:8086 against real MySQL. Frontend ran at 127.0.0.1:3016, HTTP 200.
- Through the real API, fictional tomato stock began at 7 kg. Saving an 11 kg PENDING order kept stock at 7 kg. Receiving it produced 18 kg. Stock history remained queryable.
- Captured the live upstream table schema for V1 of the additive migration sequence.

Source issues requiring adaptation: ingredient-level expiry; Double quantity fields; no visible repeated-receipt guard; direct stock mutation endpoints; cascade deletion of inventory history; no frontend tests or committed lockfile; browser-only demo login. The new decimal lot ledger will be authoritative. Legacy stock totals will be compatibility mirrors, and legacy writes will be rejected to prevent bypassing that ledger.

RIMS reference: https://github.com/Khdeval/RIMS at 6f8e084c5c0a4cbf3dce9d4c31f1551a0ba43991. No LICENSE or package license field was found. No RIMS code is copied. Recipe links, stock-in, and reason-coded removal are reimplemented from functional requirements. Its yield factor convention is excluded.

This baseline is a working starting point, not the completed capstone. See VERIFICATION.md for subsequent evidence when available.
