# DESIGN.md — pepguideIQ

> Drop this file in the project root. All AI coding agents should read it before building or modifying any UI component.

**Reality check:** Most chrome still lives in `src/components/GlobalStyles.jsx` (injected `<style>` + `@import` fonts) and **inline styles** in React (especially `src/App.jsx`). **Dual-theme CSS variables** (`--color-*`, tier tokens) are defined in **`src/styles/themes.css`** under `[data-theme="dark"]` and `[data-theme="light"]`, loaded via **`src/index.css`** → **`src/main.jsx`**. `<html>` carries `data-theme` (default **`dark`** in `index.html`); the app keeps it in sync with **`localStorage`** key **`pgi-theme`** and optional **`user_metadata.theme_preference`** when signed in. Prefer `var(--color-*)` in **new** shared UI so both themes work; legacy screens may still use hardcoded dark hex until migrated.

---

## 1. Visual Theme & Atmosphere

**Product:** pepguideIQ — a peptide protocol tracker, AI advisor, and optimization social network.

**Audience:** Serious self-optimizers, biohackers, athletes, TRT/peptide users. These are data-driven, performance-focused people who respect signal over noise. The UI should reflect that.

**Mood:** Dark. Precise. Clinical confidence. Think: lab dashboard meets performance app. Not medical-sterile — this is for people who want the edge, not a doctor's office.

**Density:** Medium-high. Information should be accessible without being cluttered. Cards and surfaces breathe, but we don't waste screen real estate.

**Design philosophy:**
- Two themes are supported: **dark** (default) and **light** (Ivory-Cream / Royal Blue). Both are first-class. Theme is persisted via **`localStorage`** key **`pgi-theme`** (`dark` | `light`) and can sync to auth metadata when logged in.
- Trust through precision. Accurate type, consistent spacing, no sloppy UI.
- Tier identity matters. The four subscription tiers each have a distinct color identity in the **header tier pill** styles — honor those classnames / hexes when touching tier UI.
- Performance > decoration. Prefer borders and surface contrast over heavy chrome. (The live app still uses some shadows and one category-pill gradient — match surrounding components rather than inventing new effects.)

---

## 2. Color Palette & Roles

### Implemented CSS variables (`GlobalStyles.jsx`)

| Variable | Value | Role |
|----------|-------|------|
| `--bg-primary` | `#07090e` | `html`, `body`, `#root`, app shell, main scroll background |
| `--pepv-top-header-height` | `104px` | Scroll / header offset helper |
| `--cc` | defaults to `#00d4aa` | Compound accent on catalog cards (overridable per-card via inline `--cc`) |
| `--cc-rgb` | `0,212,170` | RGB components for category pill gradient / borders |

In **`themes.css`**, `--color-accent` and the full **`--color-*` / `--tier-*`** set exist **per `data-theme`** on `<html>`. Until a screen is migrated, the **live dark look** may still match literals below (teal `#00d4aa`) rather than variables.

### Surfaces & borders (literals in common use)

| Role | Typical hex | Notes |
|------|-------------|--------|
| Page / shell | `#07090e` | Matches `--bg-primary` |
| Card / panel | `#0e1520` | `.pcard`, `.scard`, many modals |
| Deeper strip / sticky footer (AI Atlas mobile input bar) | `#0b0f17` | e.g. `.guide-takeover-input-bar` |
| Bottom navigation bar | `#07090e` | Inline in `App.jsx` `<nav>` (not `#131b28`) |
| Dividers / borders | `#14202e`, `#1a2d40`, `#1e2a38`, `#0e1822` | Mix used for hierarchy |
| Muted grid (library) | `rgba(0,212,170,.025)` | `.grid-bg` lines |

### Text (literals in common use)

| Role | Typical hex | Notes |
|------|-------------|--------|
| Primary body / emphasis | `#dde4ef` | Headings, main copy in modals |
| Secondary / labels | `#b0bec5` | `.mono`, inactive nav labels, tier Entry tone |
| Placeholder (desktop) | `#a0a0b0` | `.search-input::placeholder` |
| On accent CTA | `#07090e` | e.g. `.btn-upgrade-cta` text |

### Brand accent (teal)

| Concept | Hex / value | Role |
|---------|-------------|------|
| Accent | `#00d4aa` | Active tabs, links, `.btn-teal`, focus rings (`#00d4aa50`), scrollbar thumb tint |
| Accent hover (upgrade CTA) | `#00e6b8` | `.btn-upgrade-cta:hover` |
| Accent soft bg | `rgba(0, 212, 170, 0.14)` | Active bottom-nav cells, header pills when active |

### Tier identity — header pills (`GlobalStyles.jsx` classes)

`src/lib/tiers.js` defines **limits and labels only** — **no hex colors**. Tier chrome is in CSS:

| Tier | Emoji | Class suffix | Text / accent hex | Dim background / border (examples) |
|------|-------|--------------|-------------------|-------------------------------------|
| Entry | 💸 | `pepv-header-tier--entry` | `#b0bec5` | Minimal (inherits neutral header surface) |
| Pro | 🔬 | `pepv-header-tier--pro` | `#00d4aa` | `#00d4aa20` bg, `#00d4aa30` border |
| Elite | ⚡ | `pepv-header-tier--elite` | `#f59e0b` | `#f59e0b20` / `#f59e0b30` |
| GOAT | 🐐 | `pepv-header-tier--goat` | `#a855f7` | `#a855f720` / `#a855f730` (active text can lighten to `#d8b4fe`) |

### Semantic colors (from global classes)

| Role | Hex |
|------|-----|
| Success / saved pulse | `#22c55e`, `#4ade80`, `#86efac` |
| Positive button (`.btn-green`) | `#10b981` |
| Danger (`.btn-red`) | `#ef4444` |

### Light theme overrides (`src/styles/themes.css`)

Values below mirror **`[data-theme="light"]`** — Ivory-Cream surfaces, Royal Blue accent. Use these tokens (or the same hex via `var(--…)`) when building or reviewing light-mode UI.

**Backgrounds**

| Token | Hex / value |
|-------|-------------|
| `--color-bg-page` | `#faf8f3` |
| `--color-bg-card` | `#ffffff` |
| `--color-bg-elevated` | `#f5f1ea` |
| `--color-bg-input` | `#f8f6f2` |
| `--color-bg-hover` | `rgba(26, 26, 46, 0.04)` |
| `--color-bg-active` | `rgba(26, 26, 46, 0.07)` |

**Text**

| Token | Hex |
|-------|-----|
| `--color-text-primary` | `#1a1a2e` |
| `--color-text-secondary` | `#5a5a7a` |
| `--color-text-muted` | `#9a95a8` |
| `--color-text-inverse` | `#ffffff` |

**Borders**

| Token | Hex |
|-------|-----|
| `--color-border-default` | `#ede8dd` |
| `--color-border-emphasis` | `#d8d2c4` |
| `--color-border-strong` | `#b8b0a0` |
| `--color-border-focus` | `#2b4eaf` |

**Brand accent**

| Token | Hex / value |
|-------|-------------|
| `--color-accent` | `#2b4eaf` |
| `--color-accent-dim` | `rgba(43, 78, 175, 0.1)` |
| `--color-accent-hover` | `#1e3d9a` |

**Semantic**

| Token | Hex |
|-------|-----|
| `--color-success` | `#16a34a` |
| `--color-warning` | `#d97706` |
| `--color-danger` | `#dc2626` |
| `--color-info` | `#2b4eaf` |

**Overlay**

| Token | Value |
|-------|--------|
| `--color-overlay` | `rgba(26, 26, 46, 0.45)` |

**Tiers (light — legibility on cream/white)**

| Token | Hex |
|-------|-----|
| `--tier-entry` | `#475569` |
| `--tier-entry-dim` | `#f1f5f9` |
| `--tier-pro` | `#0891b2` |
| `--tier-pro-dim` | `#ecfeff` |
| `--tier-elite` | `#7c3aed` |
| `--tier-elite-dim` | `#f5f3ff` |
| `--tier-goat` | `#d97706` |
| `--tier-goat-dim` | `#fffbeb` |

**Tier borders (light)**

| Token | Hex |
|-------|-----|
| `--tier-entry-border` | `#cbd5e1` |
| `--tier-pro-border` | `#a5f3fc` |
| `--tier-elite-border` | `#ddd6fe` |
| `--tier-goat-border` | `#fde68a` |

---

## 3. Typography Rules

**Loaded fonts:** Google Fonts `@import` inside `GlobalStyles.jsx`:

`Oxanium` (weights 400, 600, 800), `JetBrains Mono` (400, 600), `Outfit` (300–600).

**Usage:**
- **UI / body:** `'Outfit', sans-serif` (+ emoji fallbacks where noted)
- **Mono / codes / doses:** `'JetBrains Mono', monospace`
- **Brand wordmark:** `.brand` → `'Oxanium', sans-serif`

There is **no** Inter family in the bundle.

### Type Scale

| Role | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| Page title | 22px | 600 | `#dde4ef` / primary | Screen headers |
| Section heading | 18px | 600 | primary | Card/section titles |
| Card title | 15px | 500 | primary | Compound names, stack titles |
| Body | 14px | 400 | primary | General content |
| Label / metadata | 13px | 400 | `#b0bec5` | Dose labels, timestamps, subtext |
| Caption | 12px | 400 | muted | Fine print, helper text |
| Mono value | 14px | 500 | primary | Dosing numbers, vial volumes |

**Line height:** 1.5 for body, 1.3 for headings, 1.0 for single-line labels.

**Rules:**
- Never go below 12px.
- Dosing numbers and compound codes always use mono font.
- Tier badges use 11px / weight 500 — only exception to the 12px floor.

---

## 4. Component Stylings

### Buttons

**Primary (CTA) — `.btn-teal` pattern**

```
background: #00d4aa14
color: #00d4aa
border: 1px solid #00d4aa
border-radius: 7px
padding: 10px 20px
font-size: 13px
font-weight: 500
min-height: 44px
font-family: 'Outfit', sans-serif
```

**Solid CTA (upgrade)** uses filled `#00d4aa` with `#07090e` text — see `.btn-upgrade-cta`.

**Secondary / ghost** often use transparent + `#243040` / `#14202e` borders.

**Destructive:** `.btn-red` — `#ef4444` border and text.

**Never:** Rounded pill shapes on **filled** primary actions if it clashes with existing square-ish CTAs — follow adjacent buttons.

### Cards

**Standard card (`.pcard`)** uses `#0e1520`, mixed borders, **border-radius 10px**, and **box-shadow** for hover lift — copy this pattern for new cards unless explicitly simplifying.

**Compound accent top edge:** `::before` line using `var(--cc,#00d4aa)`.

### Pill Selectors (tab/filter navigation)

Active states in global CSS often mirror **teal border + soft teal background** (see `.cat-btn.active`, `.goal-chip.on`).

**Critical rule:** Pills MUST visually reflect active state at all times. Active pill border + background must be set together — never one without the other. See open bug: write-only UI pattern causing visual de-sync.

### Tier Badge

Use the **header tier** classes above for subscription-aware chrome. Always include the tier emoji prefix: `💸 Entry`, `🔬 Pro`, `⚡ Elite`, `🐐 GOAT` (matches `src/lib/tiers.js`).

**Border (required, both themes):** Tier dim fills sit on card surfaces — especially in **light** mode they need a definition edge. Every subscription tier badge must include:

```
border: 1px solid var(--tier-entry-border);   /* Entry — swap name: entry | pro | elite | goat */
```

Use **`--tier-{name}-border`** from `themes.css` for the matching tier (`entry`, `pro`, `elite`, `goat`). Same rule in **dark** mode: the border reads as a subtle accent ring and improves separation from `#0e1520`-style cards.

### Inputs / Form Fields

`.form-input` / `.search-input` / `.ai-input`: themed backgrounds and borders via **`var(--color-bg-page)`** / **`var(--color-bg-card)`**, **`var(--color-border-default)`**, **`var(--color-text-primary)`**. **Focus** (same in all themes — do not hardcode per-theme overrides; let tokens cascade):

```
border-color: var(--color-accent);
box-shadow: 0 0 0 3px var(--color-accent-dim);
outline: none;
```

In light mode, **`--color-accent-dim`** is `rgba(43, 78, 175, 0.1)` (subtle royal-blue glow on cream). In dark mode it is the teal-tinted dim from **`themes.css`**. **Do not** use legacy blue **`rgba(59, 130, 246, …)`** for focus rings.

### FAB (Floating Action Button — `DoseLogFAB.jsx`)

Implemented values (not the older “flat blue” spec):

- **Size:** 56px wide main control; total vertical footprint uses `FAB_BODY_MIN_HEIGHT` 72px for hit area.
- **Position:** `position: fixed`; **bottom** `calc(80px + env(safe-area-inset-bottom, 0px))` — clears an **~80px** bottom nav band (see `NAV_BAR_HEIGHT` / `FAB_BOTTOM_CSS`).
- **Horizontal inset:** `28px` from the nearest edge (`MARGIN_X`), draggable between edges.
- **Chrome:** `border: 1px solid rgba(0, 212, 170, 0.55)`; `background: rgba(0, 212, 170, 0.18)`; **box-shadow** present on the main button.
- **Label:** `#ffffff`, `JetBrains Mono`, small caps styling.

### Bottom Navigation (`App.jsx`)

Inline `<nav>` (no separate `BottomNav.jsx`):

- **Background:** `#07090e`
- **Top border:** `1px solid #0e1822`
- **Padding:** `8px 10px` + `env(safe-area-inset-bottom)`
- **Tab cells:** min height **44px**; inactive `rgba(255,255,255,0.03)` fill + `#1e2a38` border; active teal border / `rgba(0, 212, 170, 0.14)` fill + `#00d4aa` labels (pattern matches library filter pills per comment in `App.jsx`).
- **Main content** uses `padding: 20px 16px 88px` on `.pepv-main-scroll` so lists clear the nav + FAB.

### Avatar / Profile Photo

```
border-radius: 50%
border: 2px solid #14202e   /* or #243040 to match adjacent chrome */
width: 40px / 56px / 80px (sm / md / lg)
```

Fallback initials: use the same soft teal tint pattern as other accent badges (`rgba(0, 212, 170, 0.14)` fill, `#00d4aa` text) unless the surrounding screen already defines a different treatment.

---

## 5. Layout Principles

### Spacing Scale

```
4px   — micro gaps (icon-to-label, tight pairs)
8px   — component internal padding
12px  — between related elements
16px  — card padding, section gaps
24px  — between sections
32px  — between major layout blocks
```

### Page Layout

- Mobile-first. Max content width: `100vw` with `16px` horizontal padding on the main column (`App.jsx`).
- Desktop: content wrapped with `maxWidth: 1200` on header, nav, and main scroll.
- Bottom nav is fixed to the viewport bottom; reserve **~88px** bottom padding on the main scroll column for content + FAB clearance (see `App.jsx`).

### Grid

Compound catalog: 2-column grid on mobile, 3-column on tablet+.
Stack builder: single column list.
Profile stats: 3-column equal-width stat grid.

### Whitespace philosophy

Breathe inside cards, be tight between cards. A feed of 10 stack cards should feel scannable, not airy. `gap: 8px` between cards in a feed list.

---

## 6. Depth & Elevation

The product **prefers** dark surfaces + borders for hierarchy, but **box-shadows and small motion lifts are already in use** (e.g. `.pcard:hover`, dose FAB, modal close, some protocol session pill glow). New work should **match the immediate parent surface** — do not introduce heavier shadows than sibling cards.

| Level | Typical background | Role |
|-------|-------------------|------|
| 0 — Page | `#07090e` | App shell |
| 1 — Card | `#0e1520` | Primary cards |
| 2 — Strip / inset | `#0b0f17` | Sticky bars, some inset panels |
| 3 — Overlay | `rgba(5,10,18,0.92)` / `#07090e` | Full-screen takeovers |

---

## 7. Do's and Don'ts

### DO
- Always set `min-height: 44px` on all interactive touch targets
- Use the **tier header** color system (`pepv-header-tier--*`) for subscription chrome
- Show loading skeletons (not spinners) for async card content where the app already does
- Use `#b0bec5` for metadata when matching existing components
- Wrap pill selector state changes in smooth transitions: `transition: all 150ms ease`
- Honor safe area insets on mobile: `padding-bottom: env(safe-area-inset-bottom)`
- Keep compound names in their canonical capitalization (BPC-157, TB-500, GHK-Cu, etc.)
- Use mono font for all numeric dose values and vial volumes

### DON'T
- Don't assume every screen uses `themes.css` tokens yet — grep before relying on `var(--color-*)` in legacy JSX
- Don't hardcode **only** dark-theme hex in new shared surfaces — prefer theme variables so light mode stays coherent
- Don't put critical UI state only in color — pair color with label/icon for accessibility
- Don't truncate compound names in catalog cards — wrap or abbreviate gracefully
- Don't render AI quota numbers without their tier context (e.g. "5/5" needs "Entry" label)

---

## 8. Responsive Behavior

### Breakpoints

```
Mobile:   < 480px   (primary design target)
Tablet:   480–768px
Desktop:  > 768px
```

### Touch Targets

**44px minimum** for all interactive elements. Non-negotiable for mobile-first app.

### Collapsing Strategy

- Bottom nav: always visible, never hidden
- Pill selectors: horizontal scroll on overflow — never wrap to 2 rows, never truncate labels
- Cards in a feed: always full width on mobile
- Compound catalog grid: 2-col → 1-col at `< 360px`

### Modals / Sheets

Use bottom sheet pattern on mobile (slides up from bottom). Modal pattern on desktop. Always include a visible close button with `min-width/height: 44px`.

---

## 9. Theming (`data-theme` / `<html>`)

- **`data-theme`** on **`<html>`** is **`dark`** (default in `index.html`) or **`light`**, toggled by **`useTheme`** / **`ThemeProvider`** (`src/hooks/useTheme.js`, `src/context/ThemeContext.jsx`) and **`ThemeToggle`** in Settings.
- **Persistence:** `localStorage` key **`pgi-theme`**. Signed-in users can also sync **`user_metadata.theme_preference`** via Supabase `auth.updateUser`.
- **Token source:** `src/styles/themes.css` (imported from `src/index.css`). No `:root` token fallback — both themes are explicit under `[data-theme="…"]`.
- **Legacy UI:** Much of the app still uses **hardcoded dark hex** in `GlobalStyles.jsx` and inline styles; migrating surfaces to **`var(--color-*)`** is ongoing.

---

## 10. Agent Prompt Guide

### Quick color reference for prompts (dark)

```
Page / shell:   #07090e
Card surface:   #0e1520
Deep strip:     #0b0f17
Primary text:   #dde4ef
Secondary text: #b0bec5
Accent (teal):  #00d4aa
Success:        #22c55e
Warning / Elite amber: #f59e0b
Danger:         #ef4444
GOAT purple:    #a855f7
```

### Quick color reference for prompts (light)

```
Page bg:        #FAF8F3
Card bg:        #FFFFFF
Elevated:       #F5F1EA
Primary text:   #1A1A2E
Secondary text: #5A5A7A
Accent:         #2B4EAF
Success:        #16A34A
Warning:        #D97706
Danger:         #DC2626
```

### Ready-to-use agent prompts

**New component:**
> "Build this using pepguideIQ DESIGN.md: shell `#07090e`, cards `#0e1520`, borders `#14202e`, accent teal `#00d4aa`, body font Outfit, mono JetBrains Mono, 44px touch targets. Match `GlobalStyles.jsx` patterns."

**New component (light theme):**
> "Build this component for pepguideIQ's light theme. Background `#FAF8F3` page / `#FFFFFF` cards, accent `#2B4EAF` royal blue, text `#1A1A2E`, borders `#EDE8DD`. Same component rules as dark mode (44px touch targets, no shadows, no gradients, Inter font, 14px body). All colors via CSS variables."

Use **Outfit** in place of Inter unless Inter is added to the bundle — see §3.

**Tier-aware component:**
> "Show per-tier limits. Header tier colors: Entry `#b0bec5`, Pro `#00d4aa`, Elite `#f59e0b`, GOAT `#a855f7` — use the same rgba alpha recipe as `.pepv-header-tier--*` in GlobalStyles.jsx."

**Pill selector fix:**
> "Fix the pill selector so the active pill shows BOTH border AND background dim simultaneously — follow `.cat-btn` / bottom-nav active pattern: teal `#00d4aa` border, `rgba(0,212,170,0.14)` background, `#00d4aa` text."

**Feed card:**
> "Build a stack card for the social feed: `#0e1520` background, 10–12px border-radius, 1px border `#14202e`, 16–20px padding, optional subtle shadow if siblings use `.pcard`. Include avatar, handle, tier badge, stack name, compound count. 44px min-height on interactive controls."

---

## Token Verification Checklist (filled from repo)

- [x] **Dark accent:** Teal `#00d4aa` in legacy chrome; **`--color-accent`** in `themes.css` per `data-theme`.
- [x] **Theme files:** `src/styles/themes.css` via `src/index.css` + `src/main.jsx`; **`pgi-theme`** in `localStorage`.
- [x] **Tier hexes (header pills):** **`GlobalStyles.jsx`** (`.pepv-header-tier--*`), **not** `src/lib/tiers.js`; light tier tokens differ in **`themes.css`**.
- [x] **Fonts:** `@import` in `GlobalStyles.jsx` — **Outfit, JetBrains Mono, Oxanium** (agent light prompt may say Inter — prefer **Outfit** to match the bundle unless Inter is added).
- [x] **`data-theme`:** Set on **`<html>`**; default **`dark`** in `index.html`.
- [x] **Bottom nav:** Background `#07090e`; FAB / code assume **~80px** nav band; main scroll **88px** bottom padding.
- [x] **FAB:** Bottom `calc(80px + env(safe-area-inset-bottom))`, horizontal inset **28px**, teal rgba fill + **box-shadow**.
