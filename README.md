# Taylor Scout Bible v17 — Budget Commitments Sync

This build reads real approved/estimated Budget line amounts for the matching shared location and saves structured vendor commitments back to the shared Bible document for Budget to consume.

## v18 multi-Bible fix
- New Bibles are stored as separate records inside the shared Bible document.
- Each Bible receives a unique `bibleId` and remains listed under its episode.
- Creating a Bible switches directly to the new Bible instead of returning to the previously open one.
- Existing single-Bible data is migrated automatically into the new multi-Bible structure.


## v19
- Added editable Set, Basecamp, Crew Parking, and Catering logistics.
- Added persistent Calendar / Budget / Bible top navigation.
