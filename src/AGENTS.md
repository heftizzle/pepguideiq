# pepguideIQ — `src/` agent pointer

**Canonical brief (stack, env, CI, full file map):** read the repo root [`AGENTS.md`](../AGENTS.md). This file exists so the “Subdirectory briefs” line in root `AGENTS.md` resolves to a real path.

## Frontend-only reminders

- **Catalog size:** merged rows are `PEPTIDES` / `CATALOG_COUNT` in [`data/catalog.js`](data/catalog.js). **275** compounds after BATCH41 — for any count, use `PEPTIDES.length` (do not trust hardcoded numbers in docs). The AI Atfeh catalog payload ([`lib/atfehCatalogPayload.js`](lib/atfehCatalogPayload.js)) sends all compounds — no hardcoded cap.
- **UI, tabs, components, patterns:** [`CLAUDE.md`](CLAUDE.md) in this folder (frontend-focused; distinct from root `CLAUDE.md`).
