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
| [ ] | Handle UX + conflict recovery in Settings | Surface `23505` / unique failures cleanly, preserve optimistic editing state, and add explicit retry copy in [src/components/SettingsTab.jsx](src/components/SettingsTab.jsx) and handle update paths in [src/lib/supabase.js](src/lib/supabase.js). Independent PR. |
| [ ] | Dose interval lock product spec | Define per-compound lock semantics before implementation: lock window source of truth, override rules, blend behavior, and interaction with same-day logging. Main code hotspot is [src/lib/protocolGuardrails.js](src/lib/protocolGuardrails.js) plus protocol quick-log flows in [src/App.jsx](src/App.jsx). Blocks the implementation row below. |
| [ ] | Dose interval lock: rules map + latest-dose query | Replace the generic cooldown lookup with a rule-driven config and a reliable “latest dose for compound” query across Protocol and Stack quick-log flows. Main touchpoints: [src/lib/protocolGuardrails.js](src/lib/protocolGuardrails.js), [src/lib/supabase.js](src/lib/supabase.js). Depends on the spec row. |
| [ ] | Dose interval lock: Protocol tab enforcement | Apply lock state, unlock-time messaging, and disabled-button behavior in [src/components/ProtocolTab.jsx](src/components/ProtocolTab.jsx). Depends on the rules/query row. |
| [ ] | Dose interval lock: Stack quick-log enforcement | Mirror the Protocol behavior in [src/components/StackProtocolQuickLog.jsx](src/components/StackProtocolQuickLog.jsx). Depends on the rules/query row. |
| [ ] | Dose interval lock: saved-stack / builder affordance audit | Decide whether stack editing/building surfaces need lock visibility or only the active log surfaces do. If needed, touch [src/App.jsx](src/App.jsx) and [src/components/BuildTab.jsx](src/components/BuildTab.jsx). Depends on the spec row. |
| [ ] | Dose interval lock: QA matrix + regression notes | Cover weekly GLP rows, same-day duplicates, cross-midnight behavior, blend ids, and local-time display edge cases. Depends on both enforcement rows. |

## Wave B - Active queue (profile and UX)

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [ ] | Locale fields: persistence hardening | Locale columns, Worker validation, and Settings scaffolding already exist. Verify read/write persistence across reloads and profile switching, then clean up any stale naming/data-shape assumptions in [src/lib/supabase.js](src/lib/supabase.js), [src/components/SettingsTab.jsx](src/components/SettingsTab.jsx), and [workers/api-proxy.js](workers/api-proxy.js). Can run in parallel with mobile and network work. |
| [ ] | Locale fields: display rules + validation | Normalize blank vs partial locale values, decide whether profile pages show city only vs city/state vs country, and add validation/error copy. Follow-on to the persistence-hardening row above; same file cluster plus public/profile surfaces. |
| [ ] | Shift schedule product spec | Finalize real schedule model for `profile_shift_schedule`: supported presets, custom input shape, and where it affects UI behavior. Existing hint/demo references live in [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx). Blocks persistence/UI implementation. |
| [ ] | Shift schedule persistence + profile UI | Store the finalized schedule format, add edit/display UI, and ensure public/private visibility rules are explicit. Likely touchpoints: migration(s), [src/lib/supabase.js](src/lib/supabase.js), [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx), [src/components/SettingsTab.jsx](src/components/SettingsTab.jsx). Depends on the spec row. |
| [ ] | Mobile shell spacing + safe-area audit | Fix narrow-screen spacing collisions across fixed header, bottom nav, scroll containers, and tab chrome before chasing local one-off CSS fixes. Likely files: [src/App.jsx](src/App.jsx) and [src/components/GlobalStyles.jsx](src/components/GlobalStyles.jsx). |
| [ ] | Pills nowrap + overflow pass | Clean up account/session/filter pill wrapping and horizontal overflow without hiding actions on small widths. Likely files: [src/App.jsx](src/App.jsx), [src/components/GlobalStyles.jsx](src/components/GlobalStyles.jsx), [src/components/BuildTab.jsx](src/components/BuildTab.jsx), and [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx). Depends on the shell spacing audit. |
| [ ] | Search overlap + mobile search strip fix | Fix library search/header collisions and replace hard-coded mobile overlay spacing with shared layout measurements in [src/components/LibraryMobileSearch.jsx](src/components/LibraryMobileSearch.jsx) and [src/components/PeopleSearch.jsx](src/components/PeopleSearch.jsx). Depends on the shell spacing audit. |
| [ ] | Mobile profile card tap/navigation fix | Fix tap targets and navigation affordance on mobile profile/member cards in network/profile search flows. Likely files: [src/components/NetworkTab.jsx](src/components/NetworkTab.jsx), [src/components/PeopleSearch.jsx](src/components/PeopleSearch.jsx), [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx). Depends on the shell spacing audit. |
| [ ] | Followers / Following / Shared Stacks surface audit | Inventory what is already live versus missing, then align the UI surfaces: counts, list entry points, empty states, and profile/network routing. Existing code is spread across [src/components/NetworkTab.jsx](src/components/NetworkTab.jsx), [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx), [src/components/StackShareControls.jsx](src/components/StackShareControls.jsx), and follow/feed helpers in [src/lib/supabase.js](src/lib/supabase.js). |
| [ ] | Followers / Following / Shared Stacks UI completion | Implement the missing list/detail screens or modal flows identified in the audit row above, including follow entry points and shared-stack affordances. Depends on the audit row, but can run in parallel with locale/mobile work. |

## Wave C - Pre-launch polish

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [x] | Tighten CSP `connect-src` (Pages) | `public/_headers` — see inline comment for allowed origins. |
| [ ] | 171-tile review batch 1: compounds 1-45 | Content QA only. Review title, aliases, mechanism, dose, warnings, stacks, sourcing notes, and Finnrick links; patch the relevant `src/data/compounds/batch*.js` files only. Independent of code fixes. |
| [ ] | 171-tile review batch 2: compounds 46-90 | Same review checklist; separate ticket to keep PR size tractable. |
| [ ] | 171-tile review batch 3: compounds 91-135 | Same review checklist; separate ticket. |
| [ ] | 171-tile review batch 4: compounds 136-171 | Same review checklist; separate ticket plus final consistency sweep across shared labels/tags/categories. |
| [ ] | Retatrutide 25mcg check: catalog audit | Verify whether the roadmap issue is a real catalog bug versus a unit-display misunderstanding. Current hotspots: Retatrutide entries in [src/data/catalog.js](src/data/catalog.js), blend definitions in [src/data/compounds/batch1.js](src/data/compounds/batch1.js), and stability notes in [src/lib/catalogStability.js](src/lib/catalogStability.js). Independent PR if a data correction is needed. |
| [ ] | Dose field pre-fill bug: reproduce and isolate | Reproduce the “start dose bleeds into stack add flow” issue and pin down whether it is stale modal state, a target identity problem, or expected `startDose` hydration. Main hotspots: [src/components/AddToStackForm.jsx](src/components/AddToStackForm.jsx), add-modal wiring in [src/App.jsx](src/App.jsx), and saved row editing in [src/components/SavedStackEntryRow.jsx](src/components/SavedStackEntryRow.jsx). |
| [ ] | Dose field pre-fill bug: fix + regression coverage | Implement the actual state/reset fix after the repro ticket, then verify library modal open/close, switching compounds, and saved-stack edit flows. Depends on the repro row. |
| [ ] | KLOW calendar logs: query parity audit | Confirm calendar dose history correctly resolves blend-related peptide IDs for KLOW and other blends before changing UI. Main code path is [src/components/VialTracker.jsx](src/components/VialTracker.jsx) using helpers in [src/lib/supabase.js](src/lib/supabase.js). |
| [ ] | KLOW calendar logs: calendar integration fix | Wire the missing blend/calendar behavior so KLOW dose logs appear in the tracker calendar and day detail consistently. Expected files: [src/components/VialTracker.jsx](src/components/VialTracker.jsx), [src/lib/supabase.js](src/lib/supabase.js), potentially [src/lib/doseLogDisplay.js](src/lib/doseLogDisplay.js). Depends on the parity audit row. |
| [ ] | `#0b0f17` to `#0e1520` pass everywhere: shared primitives | Replace the remaining legacy card/panel background usages in shared styles first so downstream components inherit the new lift consistently. Main hotspot: [src/components/GlobalStyles.jsx](src/components/GlobalStyles.jsx). Independent PR. |
| [ ] | `#0b0f17` to `#0e1520` pass everywhere: component sweep | Update remaining inline panels/modals/cards still hardcoding `#0b0f17`. Current obvious files from repo grep: [src/components/SettingsTab.jsx](src/components/SettingsTab.jsx), [src/components/ProfileTab.jsx](src/components/ProfileTab.jsx), [src/components/AuthScreen.jsx](src/components/AuthScreen.jsx), [src/components/PublicStackView.jsx](src/components/PublicStackView.jsx), [src/components/NotificationsBell.jsx](src/components/NotificationsBell.jsx), [src/components/Modal.jsx](src/components/Modal.jsx), [src/App.jsx](src/App.jsx), and others from the grep list. Can run after or alongside the shared-primitives row if touchpoints do not overlap. |
| [ ] | 44px touch targets + padding pass | Combine the color lift with a targeted tap-target and spacing audit for mobile-heavy controls. Main hotspot is [src/components/GlobalStyles.jsx](src/components/GlobalStyles.jsx) plus button-heavy component screens. Best done after the shared primitive row so spacing is not restyled twice. |
| [x] | Tutorial: BUILD tab flow | `TutorialContext` flow `build` + `BuildTab` `data-tutorial-target`s. |

## Wave D - Post-launch and platform epics (defer)

Keep these as unchecked epic rows in this doc and split into child tickets later. Do not merge them into the pre-launch queue.

| Status | Effort | Scope / likely files / dependencies |
|--------|--------|-------------------------------------|
| [ ] | I18n foundation: copy inventory + translation key strategy | Introduce the translation architecture before adding language packs. Inventory hardcoded UI copy across [src/App.jsx](src/App.jsx) and the large tab components, define key naming, and pick runtime loading strategy. |
| [ ] | I18n foundation: locale precedence + formatting utilities | Define how browser locale, saved profile language, and future app-level overrides interact. Add shared date/number/plural formatting helpers before text translation lands. Depends on the copy/key strategy row. |
| [ ] | Language pack: Spanish | First translation pack once the foundation rows are stable. Include compact mobile-surface QA and legal-copy review. |
| [ ] | Language packs: follow-on locales | Portuguese, French, German, Japanese, Mandarin once Spanish is proven. Depends on the Spanish row. |
| [ ] | Feed engagement: likes data model + endpoints | Schema, RLS, Worker routes, and optimistic client helpers for likes on feed posts. |
| [ ] | Feed engagement: comments data model + UI | Comment storage, threading limits, composer UI, and feed/profile rendering. Depends on the likes/endpoints row if notifications share the same nav model. |
| [ ] | Feed engagement: notification fan-out + unread UX | Notification creation, badges, unread state, and nav targets for likes/comments. Depends on likes/comments rows. |
| [ ] | Feed engagement: moderation/report controls | Basic reporting, delete rules, and abuse boundaries before opening comments broadly. |
| [ ] | Product upload: storage model + metadata form | Personal product upload schema, storage pathing, validation, and the first upload/edit UI. |
| [ ] | Product upload: stack/profile integration surfaces | Where uploaded products appear and how they connect to stacks, vials, or profile context. Depends on the storage/model row. |
| [ ] | Dosing intelligence: per-compound guide data model | Decide whether structured dosing-guide content lives in catalog rows, sidecar files, or DB-backed content. |
| [ ] | Dosing intelligence: titration builder UX | Build the titration schedule creator once dosing-guide structure exists. Depends on the guide data-model row. |
| [ ] | Dosing intelligence: smart protocol planner | Multi-phase cycling, planner reorder, and schedule-aware helpers. Depends on titration builder semantics. |
| [ ] | Dosing intelligence: reminder rules + delivery model | Define how protocol intelligence feeds reminders without duplicating mobile/offline notification work. Depends on the planner row and notification-platform direction. |
| [ ] | History/export: dose history calendar redesign | Improve the calendar/day-detail UX in [src/components/VialTracker.jsx](src/components/VialTracker.jsx) before layering exports and analytics on top. |
| [ ] | History/export: missed-dose and continuity views | “Never miss a dose” visual tracking and continuity indicators. Depends on the calendar redesign row. |
| [ ] | History/export: PDF/export pipeline | Export generation, branding, and privacy-safe content selection. Depends on the redesigned history surfaces. |
| [ ] | History/export: remaining volume / inventory extensions | Expand vial remaining-volume tracking and inventory summaries. Can run alongside export work if the shared tracker model stays stable. |
| [ ] | Identity/auth: Google provider rollout | Provider config, callback handling, account-linking, and auth-screen UX. |
| [ ] | Identity/auth: Apple provider rollout | Apple auth plus platform-specific callback/testing needs. Depends on the shared OAuth account-linking decisions from the Google row. |
| [ ] | Identity/auth: biometric re-entry UX | Device-level unlock/re-entry for mobile/PWA shells after the auth-provider work is settled. |
| [ ] | Stack Builder V2: stack templates | Save/reuse protocol frameworks in [src/components/BuildTab.jsx](src/components/BuildTab.jsx). |
| [ ] | Stack Builder V2: planner reorder | Reordering and editing flow improvements once templates exist. |
| [ ] | Stack Builder V2: vial linkage | Optional vial-to-stack associations and any necessary tracker/build data wiring. Depends on template/reorder semantics. |
| [ ] | Stack Builder V2: coach mode | Client roster, assignment flows, visibility rules, and pricing implications. Depends on the core V2 rows. |
| [ ] | Mobile/offline: Capacitor shell spike | App shell packaging, nav behavior, auth callback handling, and native-bridge feasibility. |
| [ ] | Mobile/offline: offline cache boundaries | Decide what is safe to cache offline for catalog, stacks, vials, and calculators. Depends on the shell spike. |
| [ ] | Mobile/offline: sync + conflict model | Reconnect behavior, stale writes, and background refresh strategy. Depends on the cache-boundary row. |
| [ ] | AI Guide RAG: corpus prep + embedding pipeline | Catalog/dose-history corpus prep, embedding job, and update triggers. |
| [ ] | AI Guide RAG: vector schema + retrieval layer | pgvector schema, retrieval queries, and ranking logic. Depends on corpus prep. |
| [ ] | AI Guide RAG: prompt integration + plan controls | Inject retrieval into guide prompts, add plan-aware guardrails, and validate privacy boundaries. Depends on the retrieval layer. |
| [ ] | Profile health hub: progress photo gallery + privacy model | Public/private visibility and photo-set UX. |
| [ ] | Profile health hub: scans/labs schema + upload flow | DEXA/InBody/lab ingestion, storage, and metadata model. Depends on the privacy model row. |
| [ ] | Profile health hub: consent/waiver UX | Explicit consent boundaries before exposing richer health records. Depends on the schema/privacy rows. |
| [ ] | Ecosystem integrations: purity/vendor data partner review | Oasis and Finnrick depth need partner/API diligence before implementation. |
| [ ] | Ecosystem integrations: Reddit ingestion spike | Feed source quality, rate limits, moderation boundaries, and filtering rules before coding. |
| [ ] | Ecosystem integrations: alternate commerce rails | Coinbase Commerce and related payment/billing implications. Keep separate from content/data partner work. |
| [ ] | Catalog expansion: vitamins/supplements taxonomy | Structure, UX boundaries, and flagship compounds before data entry starts. |
| [ ] | Catalog expansion: HRT/anabolics compliance review | Decide compliance/product boundaries before adding catalog rows or guidance. Depends on policy clarity, not just UI work. |
| [ ] | Community systems: leaderboard + percentile model | Ranking logic, fairness rules, and anti-gaming assumptions before UI implementation. |
| [ ] | Community systems: vendor ratings | Submission rules, moderation, and legal/compliance review before public launch. |
| [ ] | Community systems: richer network identity layers | Expanded public identity, badges, or profile graph features once follow/feed surfaces are stable. |
| [ ] | DevSecOps: dependency pinning + automated updates | Dependency policy, Renovate/Dependabot, and review workflow. |
| [ ] | DevSecOps: CI scanning + SBOM generation | Add security scanning and release SBOMs after dependency policy is set. Depends on the pinning row. |
| [ ] | DevSecOps: container/base-image hardening | Containerization and pinned base digests after the current Pages/Worker flow is stable. |
| [ ] | DevSecOps: PITR decision + rollout checkpoint | Operational decision point once user volume justifies the spend. |

---

**How to use:** Open one issue per row. If a row still feels too large for a single PR, split it into sub-issues at ticket creation time but keep this doc at the work-effort level.
