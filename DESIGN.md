# DESIGN.md — pepguideIQ

> Drop this file in the project root. All AI coding agents should read it before building or modifying any UI component.

---

## 1. Visual Theme & Atmosphere

**Product:** pepguideIQ — a peptide protocol tracker, AI advisor, and optimization social network.

**Audience:** Serious self-optimizers, biohackers, athletes, TRT/peptide users. These are data-driven, performance-focused people who respect signal over noise. The UI should reflect that.

**Mood:** Dark. Precise. Clinical confidence. Think: lab dashboard meets performance app. Not medical-sterile — this is for people who want the edge, not a doctor's office.

**Density:** Medium-high. Information should be accessible without being cluttered. Cards and surfaces breathe, but we don't waste screen real estate.

**Design philosophy:**
- Dark-first. Every surface is designed for dark mode. Light mode is not supported.
- Trust through precision. Accurate type, consistent spacing, no sloppy UI.
- Tier identity matters. The four subscription tiers each have a distinct color identity. Honor it in every component that references tier state.
- Performance > decoration. No gradients, no glow effects, no heavy shadows. If a visual element isn't communicating something, it shouldn't exist.

---

## 2. Color Palette & Roles

### Backgrounds (dark surfaces)

| Token | Hex | Role |
|-------|-----|------|
| `--color-bg-page` | `#0e1520` | Page / app background |
| `--color-bg-card` | `#0b0f17` | Card surfaces, compound detail panels |
| `--color-bg-elevated` | `#131b28` | Modals, dropdowns, elevated sheets |
| `--color-bg-input` | `#0a0e18` | Input fields, search bars |
| `--color-bg-hover` | `rgba(255,255,255,0.04)` | Hover state on interactive rows |
| `--color-bg-active` | `rgba(255,255,255,0.07)` | Pressed / active state |

### Text

| Token | Hex | Role |
|-------|-----|------|
| `--color-text-primary` | `#f0f4ff` | Headlines, primary labels |
| `--color-text-secondary` | `#8892a4` | Supporting labels, metadata |
| `--color-text-muted` | `#4a5568` | Placeholder text, disabled states |
| `--color-text-inverse` | `#0b0f17` | Text on light/accent backgrounds |

### Borders

| Token | Value | Role |
|-------|-------|------|
| `--color-border-default` | `rgba(255,255,255,0.07)` | Default card/input borders |
| `--color-border-emphasis` | `rgba(255,255,255,0.14)` | Hover/focus border state |
| `--color-border-strong` | `rgba(255,255,255,0.22)` | Active selection, modal edges |

### Brand Accent

| Token | Hex | Role |
|-------|-----|------|
| `--color-accent` | `#3b82f6` | Primary CTA, links, active pill indicator |
| `--color-accent-dim` | `rgba(59,130,246,0.15)` | Accent badge backgrounds, tinted surfaces |
| `--color-accent-hover` | `#2563eb` | Accent hover state |

> **⚠ Verify:** Confirm exact accent hex from `src/index.css` or component CSS. Replace above if different.

### Tier Identity Colors

These are core to the product. Every component touching subscription state must use these.

| Tier | Emoji | Token | Hex | Dim (bg) |
|------|-------|-------|-----|----------|
| Entry | 💸 | `--tier-entry` | `#94a3b8` | `rgba(148,163,184,0.12)` |
| Pro | 🔬 | `--tier-pro` | `#22d3ee` | `rgba(34,211,238,0.12)` |
| Elite | ⚡ | `--tier-elite` | `#a78bfa` | `rgba(167,139,250,0.12)` |
| GOAT | 🐐 | `--tier-goat` | `#f59e0b` | `rgba(245,158,11,0.12)` |

> **⚠ Verify:** Pull exact tier colors from `src/lib/tiers.js` or wherever tier badge styles are defined.

### Semantic Colors

| Role | Token | Hex |
|------|-------|-----|
| Success | `--color-success` | `#22c55e` |
| Warning | `--color-warning` | `#f59e0b` |
| Danger | `--color-danger` | `#ef4444` |
| Info | `--color-info` | `#3b82f6` |

---

## 3. Typography Rules

**Primary font:** Inter (or system-ui fallback)
**Mono font:** JetBrains Mono (dosing values, compound codes, timestamps)

> **⚠ Verify:** Check `src/index.css` `@import` or `index.html` for actual loaded fonts.

### Type Scale

| Role | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| Page title | 22px | 600 | `--color-text-primary` | Screen headers |
| Section heading | 18px | 600 | `--color-text-primary` | Card/section titles |
| Card title | 15px | 500 | `--color-text-primary` | Compound names, stack titles |
| Body | 14px | 400 | `--color-text-primary` | General content |
| Label / metadata | 13px | 400 | `--color-text-secondary` | Dose labels, timestamps, subtext |
| Caption | 12px | 400 | `--color-text-muted` | Fine print, helper text |
| Mono value | 14px | 500 | `--color-text-primary` | Dosing numbers, vial volumes |

**Line height:** 1.5 for body, 1.3 for headings, 1.0 for single-line labels.

**Rules:**
- Never go below 12px.
- Dosing numbers and compound codes always use mono font.
- Tier badges use 11px / weight 500 — only exception to the 12px floor.

---

## 4. Component Stylings

### Buttons

**Primary (CTA)**
```
background: var(--color-accent)
color: #ffffff
border: none
border-radius: 8px
padding: 10px 20px
font-size: 14px
font-weight: 500
min-height: 44px
min-width: 44px (touch target floor)
```

**Secondary**
```
background: transparent
color: var(--color-text-primary)
border: 1px solid var(--color-border-emphasis)
border-radius: 8px
padding: 10px 20px
font-size: 14px
min-height: 44px
```

**Ghost / Destructive**
```
background: transparent
color: var(--color-danger)
border: 1px solid rgba(239,68,68,0.3)
border-radius: 8px
min-height: 44px
```

**Hover rule:** All buttons lighten background by `rgba(255,255,255,0.05)` on hover. Scale `0.98` on active/press.

**Never:** Rounded pill buttons on primary actions. Buttons should feel precise, not playful.

### Cards

**Standard card**
```
background: var(--color-bg-card)
border: 1px solid var(--color-border-default)
border-radius: 12px
padding: 16px
```

**Hover state (interactive card)**
```
border-color: var(--color-border-emphasis)
background: var(--color-bg-hover applied over card)
transition: border-color 150ms ease
```

**Compound detail card** — same as standard but with a left-border accent:
```
border-left: 3px solid var(--color-accent)
padding-left: 14px
```

### Pill Selectors (tab/filter navigation)

This is a core component. Used in Build tab, Profile tabs, AI Advisor type selection.

```
Active pill:
  background: var(--color-accent-dim)
  color: var(--color-accent)
  border: 1px solid var(--color-accent)
  border-radius: 20px
  padding: 6px 14px
  font-size: 13px
  font-weight: 500

Inactive pill:
  background: transparent
  color: var(--color-text-secondary)
  border: 1px solid var(--color-border-default)
  border-radius: 20px
  padding: 6px 14px
  font-size: 13px
```

**Critical rule:** Pills MUST visually reflect active state at all times. Active pill border + background must be set together — never one without the other. See open bug: write-only UI pattern causing visual de-sync.

### Tier Badge

Used on profile headers, stack cards, AI quota displays.

```
Inline badge:
  background: var(--tier-{name}-dim)
  color: var(--tier-{name})
  border-radius: 4px
  padding: 2px 6px
  font-size: 11px
  font-weight: 500
  letter-spacing: 0.02em
```

Always include the tier emoji prefix: `💸 Entry`, `🔬 Pro`, `⚡ Elite`, `🐐 GOAT`.

### Inputs / Form Fields

```
background: var(--color-bg-input)
border: 1px solid var(--color-border-default)
border-radius: 8px
padding: 10px 14px
font-size: 14px
color: var(--color-text-primary)
min-height: 44px

Focus:
  border-color: var(--color-accent)
  outline: none
  box-shadow: 0 0 0 3px var(--color-accent-dim)
```

### FAB (Floating Action Button — DoseLogFAB)

```
background: var(--color-accent)
border-radius: 50%
width: 56px
height: 56px
position: fixed
bottom: 88px (above bottom nav)
right: 20px
box-shadow: none (flat — no shadows)
```

Snaps to edge on scroll. Should never overlap bottom nav.

### Bottom Navigation

```
background: var(--color-bg-elevated)
border-top: 1px solid var(--color-border-default)
height: 64px
padding-bottom: env(safe-area-inset-bottom)
```

Active tab: accent color icon + label. Inactive: `--color-text-muted`.

### Avatar / Profile Photo

```
border-radius: 50%
border: 2px solid var(--color-border-default)
width: 40px / 56px / 80px (sm / md / lg)
```

Fallback initials circle: `background: var(--color-accent-dim)`, text `var(--color-accent)`.

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

- Mobile-first. Max content width: `100vw` with `16px` horizontal padding.
- Desktop: centered content column, max-width `480px` for feed/list views, `720px` for dashboard/compound detail.
- Bottom nav is always present. Scroll content must account for `64px + safe-area` at bottom.

### Grid

Compound catalog: 2-column grid on mobile, 3-column on tablet+.
Stack builder: single column list.
Profile stats: 3-column equal-width stat grid.

### Whitespace philosophy

Breathe inside cards, be tight between cards. A feed of 10 stack cards should feel scannable, not airy. `gap: 8px` between cards in a feed list.

---

## 6. Depth & Elevation

pepguideIQ uses **no box-shadows**. Depth is communicated through background color contrast only.

| Level | Background | Role |
|-------|------------|------|
| 0 — Page | `#0e1520` | App shell background |
| 1 — Card | `#0b0f17` | Content cards |
| 2 — Elevated | `#131b28` | Modals, drawers, dropdowns |
| 3 — Overlay | `rgba(0,0,0,0.6)` | Modal backdrop scrim |

**Never add box-shadow to cards or buttons.** The dark background + border system provides sufficient hierarchy. Shadows create visual noise in dark UIs.

---

## 7. Do's and Don'ts

### DO
- Always set `min-height: 44px` on all interactive touch targets
- Use the tier color system consistently — tier identity is a core product signal
- Show loading skeletons (not spinners) for async card content
- Use `--color-text-secondary` for metadata — timestamps, dosing labels, subcategory tags
- Wrap pill selector state changes in smooth transitions: `transition: all 150ms ease`
- Honor safe area insets on mobile: `padding-bottom: env(safe-area-inset-bottom)`
- Keep compound names in their canonical capitalization (BPC-157, TB-500, GHK-Cu, etc.)
- Use mono font for all numeric dose values and vial volumes

### DON'T
- Don't use gradients anywhere — not on buttons, cards, backgrounds, or text
- Don't use box-shadows — use background contrast for depth
- Don't use light backgrounds — this is a dark-only app
- Don't use rounded pill shapes on primary action buttons
- Don't put critical UI state only in color — pair color with label/icon for accessibility
- Don't truncate compound names in catalog cards — wrap or abbreviate gracefully
- Don't use font-weight 700+ — 600 is the maximum, 500 for most UI
- Don't add decorative borders or dividers between every row — use spacing instead
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

## 9. Agent Prompt Guide

### Quick color reference for prompts

```
Page bg:        #0e1520
Card bg:        #0b0f17
Elevated:       #131b28
Primary text:   #f0f4ff
Secondary text: #8892a4
Accent:         #3b82f6
Success:        #22c55e
Warning:        #f59e0b
Danger:         #ef4444

Tiers:
  Entry (💸):  #94a3b8
  Pro (🔬):    #22d3ee
  Elite (⚡):  #a78bfa
  GOAT (🐐):   #f59e0b
```

### Ready-to-use agent prompts

**New component:**
> "Build this component using pepguideIQ's DESIGN.md. Dark background #0b0f17, accent #3b82f6, Inter font, 14px body, 44px touch targets, no shadows, no gradients."

**Tier-aware component:**
> "This component shows per-tier limits. Use the tier color system from DESIGN.md: Entry=#94a3b8, Pro=#22d3ee, Elite=#a78bfa, GOAT=#f59e0b with 0.12 opacity dim backgrounds for badges."

**Pill selector fix:**
> "Fix the pill selector so the active pill shows BOTH border AND background dim simultaneously. Active state: border 1px solid var(--color-accent), background var(--color-accent-dim), color var(--color-accent). Inactive: border 1px solid var(--color-border-default), background transparent, color var(--color-text-secondary)."

**Feed card:**
> "Build a stack card for the social feed. Card bg #0b0f17, 12px border-radius, 1px border rgba(255,255,255,0.07), 16px padding. Include: avatar (40px circle), handle (@username), tier badge, stack name, compound count, like button. 44px min-height on all interactive elements."

---

## Token Verification Checklist

Before finalizing this file, verify these values match the actual codebase:

- [ ] Confirm accent color from `src/index.css`
- [ ] Confirm exact tier colors from `src/lib/tiers.js`
- [ ] Confirm font family from `index.html` or CSS `@import`
- [ ] Confirm card bg tokens from component CSS (search `#0b0f17`)
- [ ] Confirm bottom nav height (currently assumed 64px)
- [ ] Confirm FAB bottom offset (currently assumed 88px)
