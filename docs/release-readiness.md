# Release Readiness

Last updated: April 17, 2026

## April 17 hardening batch

This batch closes the highest-risk issues found during a production-readiness review. The goal is to harden launch behavior without expanding scope into new features.

### Fixed in this batch

- Hard-gated the app, public stack pages, and public member profile pages behind age verification so protected content does not mount or fetch before acknowledgment.
- Changed auth Turnstile enforcement to fail closed when the challenge does not load or cannot be verified.
- Removed production browser logging of full `profiles` rows from `getCurrentUser()`.
- Hardened Stripe billing portal return URLs so the Worker only sends users back to the configured app origin.
- Improved Stripe subscription selection so billing status, upgrades, and scheduled downgrades choose the most relevant subscription instead of trusting the first Stripe list row.
- Made social follow helpers throw on non-OK API responses so optimistic UI does not get stuck in the wrong state.
- Surfaced Network feed load failures in the UI instead of silently rendering an empty community.

### Verification targets

- `npm run build`
- Auth login and signup with Turnstile enabled
- `/stack/:shareId` and `/profile/:handle` before and after age acknowledgment
- Stripe portal open from Settings
- Upgrade, downgrade scheduling, and subscription status for users with current and legacy Stripe records
- Follow and unfollow from public member profiles
- Network tab behavior during normal load and simulated backend failure

### Residual follow-up

- Restore a working lint gate in the repo so release verification does not depend on build-only checks.
