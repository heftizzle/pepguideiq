# Development waves (code-only)

Excludes non-engineering work (e.g. liability insurance, FinCEN calendar). Each row is an unchecked, ticket-ready work effort. Keep rows unchecked here until the corresponding ticket/PR lands.

## Critical path

1. Product spec decisions first: dose interval lock and shift schedule still need final behavior defined before app changes should ship.
2. Schema/persistence next: locale + shift schedule are the main profile data additions and should land before broader profile/settings polish.
3. In parallel: mobile/search/pills/tap fixes, followers UI, dose pre-fill bug, Retatrutide audit, KLOW calendar wiring, and the `#0b0f17` to `#0e1520` pass can run as separate PRs.
4. Content QA is its own track: the 171-tile review should stay split into review batches instead of blocking code fixes.

## Wave A - Foundation and data integrity

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [x] | Handles: DB uniqueness + format | Covered by migrations (`member_profiles_handle_*`, `041` lookup). |
| [ ] | Handle UX + conflict recovery in Settings | Surface `23505` / unique failures cleanly, preserve optimistic editing state, and add explicit retry copy in [src/components/SettingsTab.jsx](/Users/johnny/repos/pepguideiq/src/components/SettingsTab.jsx) and handle update paths in [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js). Independent PR. |
| [ ] | Dose interval lock product spec | Define per-compound lock semantics before implementation: lock window source of truth, override rules, blend behavior, and interaction with same-day logging. Main code hotspot is [src/lib/protocolGuardrails.js](/Users/johnny/repos/pepguideiq/src/lib/protocolGuardrails.js) plus protocol quick-log flows in [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx). Blocks the implementation row below. |
| [ ] | Dose interval lock implementation | Add productized lock metadata and enforcement to protocol logging, quick-log entry points, and saved stack flows; update user-facing copy and tests/manual QA cases. Expected touchpoints: [src/lib/protocolGuardrails.js](/Users/johnny/repos/pepguideiq/src/lib/protocolGuardrails.js), [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx), [src/components/BuildTab.jsx](/Users/johnny/repos/pepguideiq/src/components/BuildTab.jsx), [src/components/VialTracker.jsx](/Users/johnny/repos/pepguideiq/src/components/VialTracker.jsx), [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js). Depends on the spec row. |

## Wave B - Active queue (profile and UX)

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [ ] | Locale fields: persistence hardening | Locale columns, Worker validation, and Settings scaffolding already exist. Verify read/write persistence across reloads and profile switching, then clean up any stale naming/data-shape assumptions in [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js), [src/components/SettingsTab.jsx](/Users/johnny/repos/pepguideiq/src/components/SettingsTab.jsx), and [workers/api-proxy.js](/Users/johnny/repos/pepguideiq/workers/api-proxy.js). Can run in parallel with mobile and network work. |
| [ ] | Locale fields: display rules + validation | Normalize blank vs partial locale values, decide whether profile pages show city only vs city/state vs country, and add validation/error copy. Follow-on to the persistence-hardening row above; same file cluster plus public/profile surfaces. |
| [ ] | Shift schedule product spec | Finalize real schedule model for `profile_shift_schedule`: supported presets, custom input shape, and where it affects UI behavior. Existing hint/demo references live in [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx). Blocks persistence/UI implementation. |
| [ ] | Shift schedule persistence + profile UI | Store the finalized schedule format, add edit/display UI, and ensure public/private visibility rules are explicit. Likely touchpoints: migration(s), [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js), [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx), [src/components/SettingsTab.jsx](/Users/johnny/repos/pepguideiq/src/components/SettingsTab.jsx). Depends on the spec row. |
| [ ] | Mobile shell spacing + safe-area audit | Fix narrow-screen spacing collisions across fixed header, bottom nav, scroll containers, and tab chrome before chasing local one-off CSS fixes. Likely files: [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx) and [src/components/GlobalStyles.jsx](/Users/johnny/repos/pepguideiq/src/components/GlobalStyles.jsx). |
| [ ] | Pills nowrap + overflow pass | Clean up account/session/filter pill wrapping and horizontal overflow without hiding actions on small widths. Likely files: [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx), [src/components/GlobalStyles.jsx](/Users/johnny/repos/pepguideiq/src/components/GlobalStyles.jsx), [src/components/BuildTab.jsx](/Users/johnny/repos/pepguideiq/src/components/BuildTab.jsx), and [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx). Depends on the shell spacing audit. |
| [ ] | Search overlap + mobile search strip fix | Fix library search/header collisions and replace hard-coded mobile overlay spacing with shared layout measurements in [src/components/LibraryMobileSearch.jsx](/Users/johnny/repos/pepguideiq/src/components/LibraryMobileSearch.jsx) and [src/components/PeopleSearch.jsx](/Users/johnny/repos/pepguideiq/src/components/PeopleSearch.jsx). Depends on the shell spacing audit. |
| [ ] | Mobile profile card tap/navigation fix | Fix tap targets and navigation affordance on mobile profile/member cards in network/profile search flows. Likely files: [src/components/NetworkTab.jsx](/Users/johnny/repos/pepguideiq/src/components/NetworkTab.jsx), [src/components/PeopleSearch.jsx](/Users/johnny/repos/pepguideiq/src/components/PeopleSearch.jsx), [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx). Depends on the shell spacing audit. |
| [ ] | Followers / Following / Shared Stacks surface audit | Inventory what is already live versus missing, then align the UI surfaces: counts, list entry points, empty states, and profile/network routing. Existing code is spread across [src/components/NetworkTab.jsx](/Users/johnny/repos/pepguideiq/src/components/NetworkTab.jsx), [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx), [src/components/StackShareControls.jsx](/Users/johnny/repos/pepguideiq/src/components/StackShareControls.jsx), and follow/feed helpers in [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js). |
| [ ] | Followers / Following / Shared Stacks UI completion | Implement the missing list/detail screens or modal flows identified in the audit row above, including follow entry points and shared-stack affordances. Depends on the audit row, but can run in parallel with locale/mobile work. |

## Wave C - Pre-launch polish

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [x] | Tighten CSP `connect-src` (Pages) | `public/_headers` — see inline comment for allowed origins. |
| [ ] | 171-tile review batch 1: compounds 1-45 | Content QA only. Review title, aliases, mechanism, dose, warnings, stacks, sourcing notes, and Finnrick links; patch the relevant `src/data/compounds/batch*.js` files only. Independent of code fixes. |
| [ ] | 171-tile review batch 2: compounds 46-90 | Same review checklist; separate ticket to keep PR size tractable. |
| [ ] | 171-tile review batch 3: compounds 91-135 | Same review checklist; separate ticket. |
| [ ] | 171-tile review batch 4: compounds 136-171 | Same review checklist; separate ticket plus final consistency sweep across shared labels/tags/categories. |
| [ ] | Retatrutide 25mcg check: catalog audit | Verify whether the roadmap issue is a real catalog bug versus a unit-display misunderstanding. Current hotspots: Retatrutide entries in [src/data/catalog.js](/Users/johnny/repos/pepguideiq/src/data/catalog.js), blend definitions in [src/data/compounds/batch1.js](/Users/johnny/repos/pepguideiq/src/data/compounds/batch1.js), and stability notes in [src/lib/catalogStability.js](/Users/johnny/repos/pepguideiq/src/lib/catalogStability.js). Independent PR if a data correction is needed. |
| [ ] | Dose field pre-fill bug: reproduce and isolate | Reproduce the “start dose bleeds into stack add flow” issue and pin down whether it is stale modal state, a target identity problem, or expected `startDose` hydration. Main hotspots: [src/components/AddToStackForm.jsx](/Users/johnny/repos/pepguideiq/src/components/AddToStackForm.jsx), add-modal wiring in [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx), and saved row editing in [src/components/SavedStackEntryRow.jsx](/Users/johnny/repos/pepguideiq/src/components/SavedStackEntryRow.jsx). |
| [ ] | Dose field pre-fill bug: fix + regression coverage | Implement the actual state/reset fix after the repro ticket, then verify library modal open/close, switching compounds, and saved-stack edit flows. Depends on the repro row. |
| [ ] | KLOW calendar logs: query parity audit | Confirm calendar dose history correctly resolves blend-related peptide IDs for KLOW and other blends before changing UI. Main code path is [src/components/VialTracker.jsx](/Users/johnny/repos/pepguideiq/src/components/VialTracker.jsx) using helpers in [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js). |
| [ ] | KLOW calendar logs: calendar integration fix | Wire the missing blend/calendar behavior so KLOW dose logs appear in the tracker calendar and day detail consistently. Expected files: [src/components/VialTracker.jsx](/Users/johnny/repos/pepguideiq/src/components/VialTracker.jsx), [src/lib/supabase.js](/Users/johnny/repos/pepguideiq/src/lib/supabase.js), potentially [src/lib/doseLogDisplay.js](/Users/johnny/repos/pepguideiq/src/lib/doseLogDisplay.js). Depends on the parity audit row. |
| [ ] | `#0b0f17` to `#0e1520` pass everywhere: shared primitives | Replace the remaining legacy card/panel background usages in shared styles first so downstream components inherit the new lift consistently. Main hotspot: [src/components/GlobalStyles.jsx](/Users/johnny/repos/pepguideiq/src/components/GlobalStyles.jsx). Independent PR. |
| [ ] | `#0b0f17` to `#0e1520` pass everywhere: component sweep | Update remaining inline panels/modals/cards still hardcoding `#0b0f17`. Current obvious files from repo grep: [src/components/SettingsTab.jsx](/Users/johnny/repos/pepguideiq/src/components/SettingsTab.jsx), [src/components/ProfileTab.jsx](/Users/johnny/repos/pepguideiq/src/components/ProfileTab.jsx), [src/components/AuthScreen.jsx](/Users/johnny/repos/pepguideiq/src/components/AuthScreen.jsx), [src/components/PublicStackView.jsx](/Users/johnny/repos/pepguideiq/src/components/PublicStackView.jsx), [src/components/NotificationsBell.jsx](/Users/johnny/repos/pepguideiq/src/components/NotificationsBell.jsx), [src/components/Modal.jsx](/Users/johnny/repos/pepguideiq/src/components/Modal.jsx), [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx), and others from the grep list. Can run after or alongside the shared-primitives row if touchpoints do not overlap. |
| [ ] | 44px touch targets + padding pass | Combine the color lift with a targeted tap-target and spacing audit for mobile-heavy controls. Main hotspot is [src/components/GlobalStyles.jsx](/Users/johnny/repos/pepguideiq/src/components/GlobalStyles.jsx) plus button-heavy component screens. Best done after the shared primitive row so spacing is not restyled twice. |
| [x] | Demo tour: BUILD tab flow | `DemoTourContext` flow `build` + `BuildTab` `data-demo-target`s. |

## Wave D - Post-launch and platform epics (defer)

Keep these as unchecked epic rows in this doc and split into child tickets later. Do not merge them into the pre-launch queue.

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [ ] | Language packs / i18n foundation | Introduce a translation architecture before adding Spanish-first locale packs. This is a cross-app effort touching copy embedded throughout [src/App.jsx](/Users/johnny/repos/pepguideiq/src/App.jsx) and large component files. |
| [ ] | Feed engagement epic | Likes, comments, and notifications on feed posts; likely spans Worker routes, Supabase schema, feed queries, and network/profile UI surfaces. |
| [ ] | Product upload epic | Personal product upload flows, storage, validation, and profile/stack integration. |
| [ ] | Dosing intelligence epic | Dosing guide per compound, titration schedule builder, smart protocols, and dose reminders. Shared product area; ticket together later to avoid fragmented scheduling logic. |
| [ ] | History and export epic | PDF export, dose history calendar redesign, never-miss visual tracking, and inventory/remaining volume extensions. Strong overlap with [src/components/VialTracker.jsx](/Users/johnny/repos/pepguideiq/src/components/VialTracker.jsx). |
| [ ] | Identity and auth expansion epic | Biometric / Google / Apple login plus associated auth UX and account-linking work. |
| [ ] | Stack Builder V2 epic | Coach mode, templates, and optional vial linkage. Main feature area: [src/components/BuildTab.jsx](/Users/johnny/repos/pepguideiq/src/components/BuildTab.jsx). |
| [ ] | Mobile app / offline epic | Capacitor packaging and PWA offline support. This is platform work, not a pre-launch patch set. |
| [ ] | AI Guide RAG epic | Pgvector, embeddings, retrieval orchestration, and guide prompt changes. Requires design and schema work before implementation. |
| [ ] | Profile health hub epic | Progress photos, scans, labs, consent/waiver flows, and profile visibility rules. |
| [ ] | Ecosystem integrations epic | Oasis purity data, Finnrick partnership depth, Coinbase Commerce, Reddit feed integration. Each needs partner/API due diligence before coding. |
| [ ] | Catalog expansion epic | Vitamins/supplements wing plus anabolics/HRT support, including explicit compliance and UX boundaries. |
| [ ] | Community systems epic | Leaderboard, percentile, vendor ratings, and richer network identity layers. |
| [ ] | DevSecOps hardening epic | Container base-image pinning, dependency pinning, scanner in CI, Dependabot/Renovate, SBOM generation, and PITR decision point. Should become its own milestone after beta stabilizes. |

---

**How to use:** Open one issue per row. If a row still feels too large for a single PR, split it into sub-issues at ticket creation time but keep this doc at the work-effort level.
