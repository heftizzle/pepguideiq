# pepguideIQ Roadmap

> Built in 11 days. 153-compound catalog. Live at [pepguideiq.com](https://pepguideiq.com)  
> Last updated: April 6, 2026

---

## 🔴 Launch Gates
> Must be complete before public beta

- [ ] EIN received (~April 7)
- [ ] Novo business bank account activated
- [ ] Stripe connected and payment flow verified
- [ ] hello@ and dan@ email addresses live
- [ ] Supabase Pro upgrade + PgBouncer connection pooling
- [ ] Carissa cold-start UX test passed
- [ ] Account deletion flow verified end-to-end

---

## 🟡 Active — Cursor Queue
> In progress or queued for immediate execution

- [ ] Profile / Settings split (gear icon → dedicated Settings view)
- [ ] Nav restructure — 4 session pills collapsed into PROTOCOL sub-tab
- [ ] Blend concentration display fix (showing 26,667 → should show per-component breakdown)
- [ ] Legal links repositioned above Account Management section
- [ ] Support button added to `?` dropdown
- [ ] Tesofensine/Ipamorelin blend tile (#150) confirmed and added
- [ ] Triple GH blend tile (#151) confirmed and added
- [ ] Finnrick lab result link embedded in relevant compound tiles

---

## 🟠 Polish — Pre-Launch
> Quality pass before beta users onboard

- [ ] 151 compound tile accuracy review (not started — ~15-20 tiles/session)
- [ ] Retatrutide 25mcg dose calculation check
- [ ] Card background lift `#0b0f17` → `#0e1520`, 44px min button height, padding pass
- [ ] Dose field pre-fill bug — start dose text bleeding into stack add flow
- [ ] Demo tour steps wired for BUILD tab
- [ ] KLOW protocol dose logs appearing on calendar view

---

## 🟢 Post-Launch
> Shipping after beta is stable

- [ ] Reconstitution calculator — clean UI, vial size + BAC water input, concentration output, saveable with timestamp
- [ ] Push notifications / dose reminders
- [ ] Dose history calendar redesign
- [ ] Never Miss a Dose — missed dose visual tracking
- [ ] PDF export of dose history
- [ ] Inventory tracking — remaining volume per vial
- [ ] Progress photo weekly prompt
- [ ] Side-by-side compound compare — radar charts
- [ ] Smart protocols — multi-phase cycling support

---

## 🔵 V2
> Planned features post-1.0

- [ ] Profile health data hub — progress photos (public/private), DEXA/InBody scans, labs with consent + waiver flow
- [ ] Network tab — follower system, handles social graph, receipted feed
- [ ] Coach tier — $50/mo, handle-based client roster, permission-based visibility
- [ ] Daily movie quote — in-app dose-logging reward
- [ ] Oasis purity data integration
- [ ] Finnrick deep integration / data partnership
- [ ] Language packs — Spanish first
- [ ] Vitamins & supplements wing — magnesium flagship (glycinate / malate / threonate)
- [ ] Offline PWA support — catalog, vials, calculator offline; AI Guide requires connectivity
- [ ] BOI report filed with FinCEN (due July 1, 2026)

---

## 🟣 Platform — Stack Builder V2
> BUILD tab shipped ✅ — expanding the platform layer

- [x] Dedicated BUILD tab
- [ ] Coach mode — build and assign stacks to clients
- [ ] Stack templates — save and reuse protocol frameworks
- [ ] Vials optionally linked to stack compounds

---

## ✅ Shipped
> Core features live at launch

- [x] 151-compound catalog with stability, BAC water, and storage data
- [x] Vial lifecycle tracker with expiry countdown
- [x] Reconstitution calculator
- [x] Dose history calendar with backfill
- [x] Per-compound LOG DOSE (oral + injectable)
- [x] Saved stacks with R2 photo upload
- [x] AI Guide
- [x] 4-tier pricing — 🌱 Free / 🔬 Pro $8.99 / ⚡ Elite $16.99 / 🐐 GOAT $22.99
- [x] Streak system + protocol guardrails
- [x] 4-session nav pills (🌞🌅🌙🌑)
- [x] Share stack + public stack page
- [x] Multi-profile architecture (Free/Pro=1, Elite=2, GOAT=4)
- [x] pepguideIQ Score (🌱→🐐) with progress photos and InBody/DEXA OCR
- [x] Popular sort
- [x] GitHub Actions CI/CD (5/5 green) + Wrangler deploy
- [x] 5 domains → pepguideiq.com via Cloudflare Bulk Redirect