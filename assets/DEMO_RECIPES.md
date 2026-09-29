# Demo recipe catalog

This catalog contains 30 fictional vegetarian Delhi–Gurgaon demo dishes: 10 breakfasts/snacks, 14 mains, and 6 sides, raitas, chutney, or desserts. It is a reusable demo dataset, not a kitchen-approved recipe book.

Each recipe name includes English and Hindi plus `(demo)`. Ingredient quantities are illustrative raw inputs per portion, expressed as decimal strings in kg or litres (`l`). Existing identities such as Rice, Tomatoes, Onions, and Paneer are reused with their current spellings. Quantities and ingredient identities require review by the kitchen before use; adjust portions, local naming, preparation yields, and allergens with the kitchen lead.

Import is add-only and idempotent by recipe name; back up the demo database before import. This catalog defines no prepared-batch ledger and must not be interpreted as inventory receipts, stock movement, food-safety or expiry guidance, or nutrition information.

## Import and current demo

The local presentation database now has32 active recipes (30 added,2 existing) and44 ingredient records (37 added,7 existing). The importer creates ingredient identities with zero stock; it never invents receipts, lots, dates or prices. Suggested meal categories are catalog metadata, not automatically saved plans. Guidance remains missing until deliberately authored/reviewed/published.

Preview with Python3 (standard library only):

```sh
python scripts/augment-demo-recipes.py
```

Back up the named local demo database, then apply:

```sh
python scripts/augment-demo-recipes.py --apply
```

On this prepared Windows machine Python is bundled at `C:\Users\ishaa\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`; use that executable if Python is not on PATH. Default target is local8086; isolated8087 is also allowed. External hosts are rejected. Existing recipes are skipped by name and never overwritten, including manager edits. An uncertain request is not retried automatically; rerunning reconciles existing names before adding missing records. Do not run multiple imports concurrently.

Verification: all30 newly saved ingredient matrices round-tripped exactly; second apply added zero recipes/ingredients. Original recipes/ingredients/stock, week plans, notes, drafts, history and current/tomorrow purchase estimates stayed identical. The live Add dish selector showed all32 choices; its form was canceled. Backup and result artifacts remain local under `.runtime/recipe-augmentation`, excluded from GitHub. No application server rebuild was needed.