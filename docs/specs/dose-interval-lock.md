# Dose Interval Lock Spec (V1)

Last updated: April 16, 2026

## Goal

Replace the current generic same-day cooldown with a rule-driven lock system for compounds that should not be logged again until a minimum interval has elapsed.

V1 is intentionally narrow:

- hard-lock only compounds with clear minimum-interval expectations
- keep timing warnings separate from interval locks
- do not block historical/admin editing flows in this pass

## Scope

Applies to:

- Protocol tab log buttons
- Stack quick-log buttons

Does not apply to:

- editing existing dose logs
- manual backfill/import flows
- vial creation or saved-stack editing

## Rule model

Each lockable compound can define:

- `minIntervalHours`
- `message`

Example:

- `retatrutide`: `168` hours
- `semaglutide`: `168` hours
- `tirzepatide`: `168` hours

V1 rule source lives in app code, not the database. That keeps rollout reversible and avoids a migration before behavior is validated.

## Enforcement behavior

When the user logs a dose for a compound with an interval rule:

1. The app reads the latest `dosed_at` for that compound for the active member profile.
2. If `now < latest + minIntervalHours`, the button is locked.
3. The UI shows the unlock time in local time and a short reason.
4. No override is offered in V1.

Compounds without a rule continue using the existing short cooldown behavior for duplicate same-session taps.

## Blend behavior

V1 uses the logged `peptide_id` only.

- If the user logs a blend row such as `glp3-rc`, the lock applies to that blend id.
- Component-level locks are not inferred from blend ingredients in V1.
- KLOW/GLOW-style regenerative blends do not get an interval lock unless they have an explicit blend rule.

This avoids hidden coupling and keeps the first rollout explainable.

## Time semantics

- Lock intervals are computed from the latest saved `dosed_at` timestamp, not local calendar day boundaries.
- Display uses the browser local timezone.
- The lock is exact to the minute; no “unlock at next session” rounding.

## Initial V1 compounds

- `retatrutide` — 168h
- `semaglutide` — 168h
- `tirzepatide` — 168h

Reasoning:

- these are common weekly GLP rows with clear interval expectations
- they are high-risk for accidental duplicate logging
- they avoid ambiguity present in more flexible GH/healing stacks

## Non-goals for V1

- per-route interval rules
- blend ingredient propagation
- warning-only intervals
- user-overridable bypass
- admin tooling
- automatic schedule recommendations from interval rules

## Follow-up

If V1 behaves well, the next iteration can add:

- a dedicated config map with more compounds
- blend/component propagation rules
- optional override with explicit confirmation
- historical-entry exception handling
