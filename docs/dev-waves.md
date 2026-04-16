# Development waves (code-only)

Excludes non-engineering work (e.g. liability insurance, FinCEN calendar). Each wave lists **actionable dev** items; unchecked = remaining.

## Wave A — Foundation & data integrity

| Status | Item | Notes |
|--------|------|--------|
| [x] | Handles: DB uniqueness + format | Covered by migrations (`member_profiles_handle_*`, `041` lookup). |
| [ ] | App-layer handle UX + conflict messages | Ensure 23505 / unique errors surface cleanly in Settings. |
| [ ] | Dose interval lock (roadmap “Active”) | Extend `protocolLogCooldown` / guardrails per compound if product spec is fixed. |

## Wave B — Active queue (UX)

| Status | Item | Notes |
|--------|------|--------|
| [ ] | Locale fields (city / state / country) | Schema + Settings/Profile UI. |
| [ ] | Shift schedule | Partially wired (`profile_shift_schedule` demo); finish product + persistence. |
| [ ] | Mobile layout, pills nowrap, search overlap, profile card tap | Targeted CSS/App fixes; file-per-issue. |
| [ ] | Followers / Following / Shared Stacks | Network surfaces + `follows` + UI. |
| [ ] | Dose interval lock | Same as Wave A if scoped as one feature. |

## Wave C — Pre-launch polish

| Status | Item | Notes |
|--------|------|--------|
| [x] | Tighten CSP `connect-src` (Pages) | `public/_headers` — see inline comment for allowed origins. |
| [ ] | 171 compound tile accuracy sessions | Content QA, not a single PR. |
| [ ] | Retatrutide 25µg dose check | Catalog/data fix. |
| [ ] | Card / padding polish (`#0e1520`, 44px touch) | GlobalStyles + incremental inline cleanup. |
| [ ] | Dose field pre-fill bug (stack add flow) | Repro + fix in AddToStackForm / Library. |
| [x] | Demo tour: BUILD tab flow | `DemoTourContext` flow `build` + `BuildTab` `data-demo-target`s. |
| [ ] | KLOW dose logs on calendar | Protocol/calendar integration. |

## Wave D — Post-launch & platform (defer)

Track in `ROADMAP.md` **Post-Launch**, **Platform — Stack Builder V2**, **V2**, **DevSecOps** — ship as separate epics after soft launch.

---

**How to use:** Pick a wave, open issues per row, link PRs. Update checkboxes when merged.
