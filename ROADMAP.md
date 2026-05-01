Roadmap · MD
Copy

# pepguideIQ Roadmap
 
> Built in **37 days to the hour**. 264-compound catalog across 36 batches.
> 89 Supabase migrations. Live at [pepguideiq.com](https://pepguideiq.com)
> Last updated: May 1, 2026
> **Launch date: May 8, 2026** · 1K-user goal: August 1, 2026
 
---
 
## 🔴 Launch Gates
> Must be complete before public launch
 
- [x] EIN received
- [x] Novo business bank account activated
- [x] Stripe connected and payment flow verified
- [x] ToS + Privacy Policy + Research Use Waiver live at `/legal`
- [x] Over-18 age gate live (`pepv_age_verified_v2` localStorage)
- [x] Carissa cold-start UX test passed
- [x] Supabase Pro upgrade + PgBouncer (connection pooling, size 15)
- [x] Supabase Auth URL config — Site URL + Redirect URLs wildcard
- [x] `dan@pepguideiq.com` live
- [x] `hello@pepguideiq.com` live (Google Workspace alias, zero cost)
- [x] Resend SMTP — transactional emails from `noreply@pepguideiq.com`
- [x] DMARC + SPF + DKIM — full email auth stack on `pepguideiq.com`
- [x] Rewardful affiliate tracking — 12 codes whitelisted, case-insensitive; referral ID capture + webhook UUID resolution
- [x] Account deletion flow — Stripe cancel → R2 cleanup → auth delete; verified end-to-end
- [x] Signup trigger — `handle_new_user` atomically creates `profiles` + `member_profiles` + `user_stacks`
- [x] Liability insurance — Next Insurance active (E&O `NXTXV9VH97-00-PL` + GL `NXTJ4DDV4H-00-GL`, $73.14/mo, $2M E&O + $2M GL + $100K cyber)
- [x] Cancel / reactivate subscription flow — Worker + "Awww... but we like money. 🥺" modal
- [x] Settings accessible from hamburger menu (below Switch Profile, CustomEvent pattern)
---
 
## 🟡 Active — Cursor Queue
> In progress or queued for immediate execution
 
1. Locale fields (city / state / country)
2. Shift schedule
3. Handles unique constraint
4. Mobile layout
5. Pills nowrap
6. Search bar overlap
7. Profile card tap nav
8. Followers / Following / Shared Stacks
9. Dose interval lock
10. Settings hamburger fix — `onOpenSettings` prop missing from `<HamburgerMenu>` in `App.jsx` (`ReferenceError: onOpenSettings is not defined`)
---
 
## 🟠 Polish — Pre-Launch
> Quality pass before beta users onboard
 
- [ ] Compound tile accuracy review (264 tiles — ~15–20/session)
- [ ] Retatrutide 25mcg dose calculation check
- [ ] Card background lift `#0b0f17` → `#0e1520`, 44px min button height, padding pass
- [ ] Dose field pre-fill bug — start dose text bleeding into stack add flow
- [ ] Demo tour steps wired for BUILD tab
- [ ] KLOW protocol dose logs appearing on calendar view
- [ ] Tighten CSP `connect-src` to exact Worker + Supabase origins (currently permissive)
---
 
## 🟢 Post-Launch V1.1
> Shipping after beta is stable
 
- [ ] **pepguideiq.ai** — DNS flip post-launch (domain secured, $160/2yr)
- [x] Likes + comments + notifications on feed posts *(shipped pre-launch)*
- [ ] Language packs — Spanish first (559M speakers), then PT-BR, FR, DE, TR, JA, ZH
- [ ] Reconstitution calculator — vial size + BAC water input, concentration output, saveable
- [ ] Anabolics / HRT support (dose reminders, no stacking guides)
- [ ] Personal product upload
- [ ] Stack planner reorder
- [ ] Dosing guide per compound
- [ ] Push notifications / dose reminders
- [ ] Biometric / Google / Apple OAuth login
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
- [ ] BATCH37+ compound additions (catalog frozen at 264 pre-launch)
---
 
## 🧠 V2 — AI Atlas Memory Layer (RAG + Custom Agent)
> The moat. Johnny Hughes is the architect on this.
 
Instead of AI Atlas working from general training data, it works from the user's
**actual logged protocol** — their stack, doses, cycle history, InBody trends, notes.
 
**Architecture path:**
 
1. **pgvector in Supabase** — enable extension, embeddings schema around user
   protocol data (dose logs, InBody entries, stack events, compound interactions)
2. **Embedding pipeline** — every log entry becomes a vector; Johnny has prior
   experience with this pipeline pattern
3. **RAG retrieval** — Atlas pulls the user's own data as context before every response;
   compound catalog also embedded for reference
4. **Memory synthesis** — Atlas makes personalized calls based on actual history:
   *"Your retatrutide titration started at 1mg 6 weeks ago, your last InBody showed
   +2.1 lbs lean, your current dose is 3mg — here's what the data suggests."*
5. **Custom AI Agent** — full personalized profile management, not just Q&A;
   proactive protocol suggestions driven by logged trends
**Why this is the moat:**
- The user's data is the context. Nobody else has it.
- Every log entry makes Atlas smarter for that specific user.
- Social feed flywheel: log to share → log to track → log to teach Atlas.
  **Three reasons to log. One action.**
- Coach Tier ($50/mo) becomes clinical-grade for TRT clinics and functional
  medicine practices — a legitimate B2B SaaS wedge.
**Domain:** pepguideiq.ai (secured) becomes the primary URL when this ships.
It's not just branding. It describes the architecture.
 
---
 
## 🔵 V2 Platform
> Planned features post-1.0
 
- [ ] App Store + Google Play via Capacitor (~2 weeks post-launch)
- [ ] **Coach Tier — $50/mo** — handle-based client roster, permission-based stack
  visibility, assign protocols to clients, RAG-powered coaching context
- [ ] Network tab full — follower system, @DihexaDan in top nav, receipted feed
- [ ] **REEL DOSES** — receipted photo/video tied to dose log entries; injection content
  Instagram cannot host. V2 kill shot for influencer growth.
- [ ] PWA offline — catalog, vials, calculator offline; AI Atlas requires connectivity
- [ ] Compound PDF library — 2–3 page PDFs per compound, feeds RAG pipeline;
  v3 = personalized GOAT-tier stack report PDF
- [ ] Daily movie quote — in-app dose-logging reward
- [ ] Oasis purity data integration
- [ ] Finnrick deep integration / data partnership
- [ ] Vitamins + supplements wing — magnesium flagship (glycinate / malate / threonate)
- [ ] Coinbase Commerce — BTC/ETH/USDC/USDT/SOL; annual prepay 10–15% discount,
  bypasses Apple IAP 30% cut
- [ ] Community vendor rating system (customer-submitted only)
- [ ] Reddit feed integration (r/Peptides, r/PeptideSciences, r/Nootropics, compound-filtered)
- [ ] BOI report filed with FinCEN (due July 1, 2026)
---
 
## 🟣 Platform — Stack Builder V2
 
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
- [ ] PITR (Point-in-Time Recovery) — add post-500 users ($100/mo Supabase add-on)
- [ ] Tighten CSP `connect-src` to exact origins (currently `https: wss:`)
---
 
## 🌐 Domain Portfolio
> Full brand moat secured — ~$400 total investment
 
| Domain | Purpose |
|---|---|
| pepguideiq.com | Primary — live now |
| pepguideiq.ai | Future primary — flip when RAG/Atlas ships ($160/2yr) |
| pepguideiq.app | Post App Store launch |
| pepguideiq.io | Developer / technical credibility |
| pepguideiq.co | Defensive |
| pepguideiq.biz | Defensive |
| pepguideiq.net | Defensive |
 
---
 
## 👥 Affiliate Codes — Active
 
| Code | Affiliate |
|---|---|
| LAKE15 | Mike Lake |
| CHAD15 | Chad |
| PALMER15 | Palmer |
| RYBA15 | Jake Ryba |
| EDON15 | Nic / Edon |
| HEAVYDUTY15 | Nic / Edon (gym rebrand) |
| TSOURCE15 | Kirby Anderson |
| FIRE15 | Hefta |
| PETE15 | Peter Belcastro |
| KwElite15 | Jeff Cohn |
| Primo15 | Jose Cardenas |
| Vitality15 | Dr. Tracy (Live In Vitality) |
 
---
 
## 📣 GTM — Influencer & Affiliate Pipeline
 
| Name | Platform | Reach | Status |
|---|---|---|---|
| Rachel Porter | MPA (Instagram) | ~17K | 🟢 Warm — Week 1 priority |
| Kevin Jordan | TBD | ~75K | 🟢 Warm — Week 1 priority |
| Finnrick | TBD | TBD | 📅 Week 1 post-launch |
| Josh Holyfield | TBD | ~93K | 🔵 Prospect |
| Dee (@deemariedi) | Instagram | ~393K | 🔵 Near-term target |
| Dave Palumbo / RX Muscle | YouTube | ~335K | 🔵 Future |
| Jacob Nachinson | Overtime Tampa | ~157K | 🤝 Partnership tier |
| Overtime partner | TBD | ~293K | 🤝 Partnership tier |
| Jay Cutler | TBD | TBD | 🔵 Future |
 
**Combined addressable reach: ~885K+**
 
> Rachel Porter note: MPA carries earned credibility that no paid post can replicate.
> Matt Porter's legacy gives it weight that money can't buy. Warm outreach only.
 
---
 
## ✅ Shipped
> Built in 37 days to the hour
 
- [x] 264-compound catalog across 36 batches (BATCH37 queued post-launch)
- [x] 89 Supabase migrations
- [x] Vial lifecycle tracker with expiry countdown + photo uploads
- [x] Dose history calendar with backfill
- [x] Per-compound LOG DOSE (oral + injectable + nasal + topical)
- [x] Saved stacks with R2 photo upload
- [x] AI Atlas 🧙 (Haiku for Entry/Pro, Sonnet for Elite/GOAT) — daily limits: 2/4/8/16
- [x] AI Stack Advisor — daily limits: 3/10/20/30
- [x] 4-tier pricing — 💸 Entry free / 🔬 Pro $8.99 / ⚡ Elite $16.99 / 🐐 GOAT $23.99
- [x] Stack limits: Entry 2 / Pro 10 / Elite 25 / GOAT 50
- [x] Multi-profile: Entry/Pro 1 / Elite 2 / GOAT 4
- [x] Streak system + protocol guardrails (timing warnings per compound)
- [x] 4-session nav pills (🌞🌅🌙🌑)
- [x] Share stack + public stack page (`/stack/{id}`)
- [x] Public member profile page (`/profile/{handle}`)
- [x] InBody trends with sparklines (migrations 055-058)
- [x] Dual theme — dark (default) + light (Ivory-Cream / Royal Blue)
- [x] pepguideIQ Score with progress photos and InBody/DEXA OCR
- [x] Popular sort (explicit ranks 1–50, auto-fill, sink 999)
- [x] Likes + comments + notifications on feed posts
- [x] Network feed + member follows
- [x] Fasting tracker (6 fast types, public toggle)
- [x] Demo tour (6-step, session-count gated)
- [x] Cancel / reactivate subscription (Worker + modal copy)
- [x] Settings accessible from hamburger menu (below Switch Profile)
- [x] Account deletion — Stripe cancel + R2 cleanup + auth delete
- [x] GitHub Actions CI/CD — build + audit + deploy Worker + deploy Pages
- [x] Cloudflare Pages + 5 domain bulk redirect → pepguideiq.com
- [x] Cloudflare Worker (single `api-proxy.js`, all routes)
- [x] Cloudflare R2 (`STACK_PHOTOS` bucket)
- [x] Turnstile bot check on auth
- [x] IP rate limiting (r2_write / r2_read / auth / api / signup / password_reset)
- [x] Server-authoritative plan enforcement (`update_user_plan` RPC)
- [x] Rewardful affiliate integration — 12 active codes, whitelist mode
- [x] DMARC + SPF + DKIM email auth stack
- [x] Liability insurance — E&O + GL + Cyber (Next Insurance, active May 1, 2026)