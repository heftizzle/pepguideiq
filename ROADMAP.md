## pepguideIQ Roadmap

### Just Shipped (April 2026 Sprint)
- 140-compound catalog — clean, tile noise removed
- Vial tracker with expiry countdown
- Reconstitution calculator
- Dose history calendar with backfill
- Saved stacks with R2 photo upload
- AI Guide (live)
- Streak system — wired into ProtocolTab + StackProtocolQuickLog
- Protocol guardrails — soft block, inline, dismissible
- Nav emoji pills — 🌅 ☀️ 🌙 session deep links
- Session rename: evening → night app-wide
- Font sweep — minimum 11px enforced
- 4 tiers: Free / Pro $8.99 / Elite $16.99 / GOAT $22.99
- 8 Supabase migrations live (005 user_vials, 008 plan enforcement + R2)
- LLC filed April 2, 2026 (ref: 100471015701)

### Cursor Queue — In Progress
- [ ] Evening → night rename (running)
- [ ] Multiple vials per stack compound in Protocol tab
- [ ] BUILD / STACKS nav split (🏗️ BUILD + 📋 STACKS)

### Pre-Launch Ops — Blocked / Pending
- [ ] Wrangler secrets (STRIPE_WEBHOOK_SECRET, ALLOWED_ORIGIN, ENVIRONMENT=production)
- [ ] Stripe webhook endpoint configured
- [ ] GitHub Actions secrets wired
- [ ] EIN — blocked until LLC arrives (~April 7)
- [ ] Novo bank account — blocked until EIN
- [ ] Supabase Pro upgrade (PITR/HA/DR)
- [ ] BOI report to FinCEN — due July 1, 2026 (90 days from filing)
- [ ] Carissa mobile UX test

### Next Up
- Dose History calendar redesign (clunky grid → proper calendar)
- Stack planner with reorder timing
- Dosing guides per compound
- Push notifications / dose reminders
- Streak display persistent on Protocol tab home (not just post-log)
- Daily check-in — how do you feel today (1–5) tied to dose history

### Medium Term
- Save calculations — export dosing history, PDF reports
- Compare side-by-side — up to 4 peptides, radar charts
- Smart protocols — multi-phase cycling, automated scheduling
- Inventory tracking — remaining volume per vial
- Never Miss a Dose — missed dose visual tracking on calendar
- Progress photo weekly prompt

### Long Term
- Offline support (PWA) — sync when reconnected
  Note: AI Guide requires connectivity, offline = read-only
- 3rd wing — vitamins/supplements (magnesium as flagship)
- Oasis purity integration
- Finnrick deep integration
- Language packs — Spanish first, then Portuguese, French, German, Japanese, Mandarin
- NMN and NR entries (oral NAD+ precursors)

### Infrastructure
- Supabase Pro upgrade (PITR/HA/DR) ← pre-launch gate
- Code splitting / chunk size fix
- Architecture review / API key verification (pre-charge gate)
- LLC → EIN → Novo → Stripe ← in progress