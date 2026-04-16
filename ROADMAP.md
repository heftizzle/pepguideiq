# pepguideIQ Roadmap

> Built in 22 days. 171-compound catalog. 51 Supabase migrations. Live at [pepguideiq.com](https://pepguideiq.com)
> Last updated: April 16, 2026
> Soft launch target: **May 1, 2026**. 1K-user goal: August 1, 2026.

---

## 🔴 Launch Gates
> Must be complete before public beta

- [x] EIN received
- [x] Novo business bank account activated
- [x] Stripe connected and payment flow verified
- [x] ToS + Privacy Policy + Research Use Waiver live at `/legal`
- [x] Over-18 age gate live (AgeGate + `pepv_age_verified_v2` localStorage)
- [x] Carissa cold-start UX test passed
- [x] Supabase Pro upgrade
- [x] Supabase Auth URL config — Site URL `https://pepguideiq.com` + Redirect URLs wildcard
- [x] `dan@pepguideiq.com` live
- [x] Resend SMTP — transactional emails from `noreply@pepguideiq.com`
- [ ] PgBouncer connection pooling (separate from Pro — still needs wiring)
- [ ] Account deletion flow verified end-to-end
- [ ] `hello@pepguideiq.com` live
- [ ] Liability insurance for the LLC
- [ ] Rewardful affiliate tracking — only `EDON15` and `TSource15` whitelisted in `src/lib/affiliateRef.js` today; add `Primo15`, `Pete15`, `ironresolve15`, `KwElite15`, `OTMax15` before marketing

---

## 🟡 Active — Cursor Queue
> In progress or queued for immediate execution

1. Find People `X` button broken — full-screen trap, no nav, `onClick` dead; needs `history.back()` fallback
2. AI Guide `X` button
3. Locale fields (city / state / country)
4. Shift schedule
5. Handles unique constraint
6. PgBouncer wiring
7. Mobile layout
8. Pills nowrap
9. Search bar overlap
10. Profile card tap nav
11. Followers / Following / Shared Stacks
12. Dose interval lock
13. Rewardful + Stripe referral ID
14. Account deletion flow

---

## 🟠 Polish — Pre-Launch
> Quality pass before beta users onboard

- [ ] 171 compound tile accuracy review (not started — ~15–20 tiles/session)
- [ ] Retatrutide 25mcg dose calculation check
- [ ] Card background lift `#0b0f17` → `#0e1520`, 44px min button height, padding pass
- [ ] Dose field pre-fill bug — start dose text bleeding into stack add flow
- [ ] Demo tour steps wired for BUILD tab
- [ ] KLOW protocol dose logs appearing on calendar view
- [ ] Tighten CSP `connect-src` (currently permissive `https: wss:`) to exact Worker + Supabase origins

---

## 🟢 Post-Launch
> Shipping after beta is stable

- [ ] Likes + comments + notifications on feed posts
- [ ] Language packs — Spanish first (559M speakers), then Portuguese, French, German, Japanese, Mandarin
- [ ] Reconstitution calculator — clean UI, vial size + BAC water input, concentration output, saveable with timestamp
- [ ] Anabolics / HRT support (dose reminders, no stacking guides)
- [ ] Personal product upload
- [ ] Stack planner reorder
- [ ] Dosing guide per compound
- [ ] Push notifications / dose reminders
- [ ] Biometric / Google / Apple login
- [ ] Titration schedule builder
- [ ] Daily check-in feel score
- [ ] PDF export of dose history
- [ ] Leaderboard + percentile
- [ ] Dose history calendar redesign
- [ ] Never Miss a Dose — missed dose visual tracking
- [ ] Inventory tracking — remaining volume per vial
- [ ] Progress photo weekly prompt
- [ ] Side-by-side compound compare — radar charts
- [ ] Smart protocols — multi-phase cycling support

---

## 🔵 V2
> Planned features post-1.0

- [ ] App Store + Google Play via Capacitor (~2 weeks post-launch)
- [ ] Coach Tier — $50/mo, handle-based client roster, permission-based visibility
- [ ] Network tab full — follower system, handles as universal IDs, @DihexaDan in top nav, receipted feed
- [ ] PWA offline — catalog, vials, calculator offline; AI Guide requires connectivity
- [ ] RAG for AI Guide — pgvector in Supabase, embed catalog + dose history, top-k retrieval
- [ ] Profile health data hub — progress photos (public/private), DEXA/InBody scans, labs with consent + waiver flow
- [ ] Daily movie quote — in-app dose-logging reward
- [ ] Oasis purity data integration
- [ ] Finnrick deep integration / data partnership
- [ ] Vitamins & supplements wing — magnesium flagship (glycinate / malate / threonate)
- [ ] Coinbase Commerce — BTC / ETH / USDC / USDT / SOL; annual prepay 10–15% discount, bypasses Apple IAP 30% cut
- [ ] Community vendor rating system (customer-submitted, not vendor-submitted)
- [ ] Reddit feed integration (r/Peptides, r/PeptideSciences, r/Nootropics, compound-filtered)
- [ ] BOI report filed with FinCEN (due July 1, 2026)

---

## 🟣 Platform — Stack Builder V2
> BUILD tab shipped ✅ — expanding the platform layer

- [x] Dedicated BUILD tab
- [ ] Coach mode — build and assign stacks to clients
- [ ] Stack templates — save and reuse protocol frameworks
- [ ] Vials optionally linked to stack compounds

---

## 🛡️ DevSecOps Hardening
> Post-launch infrastructure tightening

- [ ] Containerize with pinned Dockerfile base image digests
- [ ] Pin all dependency versions (no floating)
- [ ] Trivy or Snyk security scanning in CI
- [ ] Dependabot / Renovate for automated dep PRs
- [ ] SBOM generation on every release

---

## ✅ Shipped
> Core features live at launch

- [x] 171-compound catalog with stability, BAC water, and storage data
- [x] Vial lifecycle tracker with expiry countdown + photo uploads
- [x] Reconstitution calculator
- [x] Dose history calendar with backfill
- [x] Per-compound LOG DOSE (oral + injectable + nasal + topical)
- [x] Saved stacks with R2 photo upload
- [x] AI Guide (Haiku for Entry/Pro, Sonnet for Elite/GOAT)
- [x] AI Stack Advisor
- [x] 4-tier pricing — 💸 Free / 🔬 Pro $8.99 / ⚡ Elite $16.99 / 🐐 GOAT $22.99
- [x] Streak system + protocol guardrails (timing warnings per compound)
- [x] 4-session nav pills (🌞🌅🌙🌑)
- [x] Share stack + public stack page (`/stack/{id}`)
- [x] Public member profile page (`/profile/{handle}`)
- [x] Multi-profile architecture (Entry/Pro = 1, Elite = 2, GOAT = 4)
- [x] pepguideIQ Score (💸 → 🐐) with progress photos and InBody/DEXA OCR
- [x] Popular sort (explicit ranks 1–50, auto-fill 51–143, sink 999)
- [x] GitHub Actions CI/CD (build + audit + deploy Worker + deploy Pages) — green
- [x] Cloudflare Pages hosting + 5 domain bulk redirect → pepguideiq.com
- [x] Turnstile bot check on auth
- [x] IP rate limiting (r2_write / r2_read / auth / api tiers) in Worker
- [x] Server-authoritative plan enforcement (trigger + `update_user_plan` RPC, migration 008)
- [x] 51 Supabase migrations through `050_profiles_age_training.sql`
- [x] Network feed + member follows + notifications
- [x] Fasting tracker (6 fast types, member_fasts table, public toggle)
- [x] Demo tour (6-step core walkthrough, session-count gated)
- [x] Age gate (`pepv_age_verified_v2` localStorage, v=1)
- [x] ToS + Privacy Policy + Research Use Waiver at `/legal`
