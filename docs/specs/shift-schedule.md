# Shift Schedule Spec (V1)

Last updated: April 16, 2026

## Goal

Define what `shift_schedule` means today so the existing settings UI is not just decorative.

V1 keeps the feature narrow:

- persist a named schedule preset
- persist a wake time
- use wake time for session inference
- use shift schedule for display, personalization copy, and future notification segmentation

## Allowed values

- `days`
- `swings`
- `mids`
- `nights`
- `rotating`

These are already the accepted Worker values and remain unchanged.

## User-facing behavior

### Wake time

Wake time is the active behavior input.

- Protocol session inference is anchored off wake time.
- If wake time is unset, the app falls back to wall-clock session inference.

### Shift schedule

Shift schedule is descriptive in V1.

- it labels the user’s work pattern
- it is shown back in settings/profile surfaces
- it is available for future reminders/analytics segmentation
- it does not currently remap session windows beyond the wake-time anchor

This prevents two competing scheduling systems.

## Visibility

V1 visibility:

- editable in Settings
- shown to the signed-in owner in app surfaces where relevant
- not shown on public profile by default

Reasoning:

- wake/sleep patterns are more personal than handles/goals
- public-profile exposure should be an explicit later product decision

## Tier gating

Current gate stands:

- Elite and GOAT can edit shift schedule + wake time
- lower tiers see locked-state messaging and upgrade CTA

## Validation

- `shift_schedule` must be one of the five presets above
- `wake_time` must be a valid `HH:MM` / `HH:MM:SS` time
- empty wake time clears the value

## Follow-up

Future work can add:

- reminder windows keyed off schedule preset
- schedule-aware copy in Protocol/Guide
- optional public sharing
- rotating-shift helper flows
