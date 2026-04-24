# pepguideIQ frontend — agent brief

## Entry point

`src/main.jsx` — path-based routing:
- `/pricing` → `PricingPage`
- `/stack/{id}` → `AgeGate` + `PublicStackView`
- `/profile/{handle}` → `AgeGate` + `PublicMemberProfilePage`
- else → `AppErrorBoundary` + `App`

There is no router library. Add one only if a new multi-page requirement justifies it.

## Shell

`App.jsx` default export is `PepGuideIQ`. It renders:

```
<PepGuideIQ>
  ├── <AgeGate />                  (if !ageVerified)
  ├── <AuthScreen onAuth={setUser}/> (if !user)
  └── <ProfileProvider userId plan>
       └── <DoseToastProvider>
            └── <TutorialProvider>
                 └── <PepGuideIQApp user setUser>
                      └── <PepGuideIQMainTree>
                           ├── Header: <Logo/> <ProfileSwitcher/> <NotificationsBell/>
                           ├── Tab content (one of 8)
                           ├── <NavTooltips/>
                           └── <DoseLogFAB/>
```

`PepGuideIQApp` (line 386 in App.jsx) owns the giant state surface: tabs, library filters, stack, AI Guide, modals, mobile layout flags. Over 40 `useState` calls. Don't "simplify" this without understanding the cross-tab flows.

## Tabs (`PEPV_VALID_TABS`)

`library`, `guide`, `stackBuilder`, `stack`, `network`, `vialTracker`, `protocol`, `profile`. Default is `profile`. Persisted in `sessionStorage["pepv_last_tab"]`. Read with `readInitialActiveTab()`.

## Context providers

| Provider | Hook | Purpose |
|---|---|---|
| `ProfileContext` | `useActiveProfile()` | member_profiles list + active profile id. Throws if used outside provider. |
| `DoseToastContext` | `useShowDoseToast()` | Toast after dose log. No-op outside provider. |
| `TutorialContext` | `useTutorial()` / `useTutorialOptional()` | Onboarding tour state. Highlights via `data-tutorial-target` attrs + `tutorialHighlightProps()`. |

## Component prop signatures

```jsx
<ProtocolTab />                               // pulls from useActiveProfile + supabase directly
<BuildTab ... />
<VialTracker userId profileId peptideId catalogEntry canUse onUpgrade tutorialAnchorFirst />
<SettingsTab user setUser onOpenUpgrade onSignOut onBack />
<ProfileTab user setUser ...more />
<StackProtocolQuickLog userId profileId protocolRows canUse onUpgrade wakeTime />
<NetworkTab userId scrollToDosePostId onConsumedDosePostScrollTarget />
<DoseLogFAB onSessionPicked />
<NotificationsBell userId userGoals />
<UpgradePlanModal onClose user upgradeFocusTier setUser gateReason planKey />
<StackShareControls ... />
<ProfileSwitcher onOpenUpgrade onGoToProfileSettings navTooltipAnchorRef />
<PeopleSearch activeProfileId workerUrl accessToken onClose initialQuery />
<PublicStackView shareId />
<PublicMemberProfilePage handle onClose includeGlobalStyles />
<FastingTrackerSection userId activeProfileId setErr showSavedBriefly />
<BodyMetricStepper value min max step displayText onCommitValue fastRange locked />
<StackPhotoUpload ... />
<StackProfileShots userId canUse onUpgrade />
<AgeGate onConfirm onExit />
<AddToStackForm peptide onCancel onSave={({dose, frequency, notes}) => …} />
<SavedStackEntryRow item catColor catLabel onUpdate onRemove />
<Modal onClose children maxWidth={580} label="Dialog" variant="default" />
<PostDoseNetworkSheet open compoundName previewLine busy postError onPost onKeepPrivate />
<DoseToast message onDismiss />
<TutorialBar />  <TutorialHelpButton />
<MemberProfileSocialIconRow profile />
<LibraryMobileSearchIcon open onOpen />
<LibraryMobileSearchPanel initialSearch onDismiss setSearch />
<LibrarySearchInput onDebouncedChange initialValue className style placeholder />
<Logo size={19} style={{}} />
<AppErrorBoundary>{children}</AppErrorBoundary>
<LegalPage />  <LegalDisclaimer />
```

## State conventions

- `useState` grouped thematically at the top of the component function.
- No `useReducer` anywhere in the codebase.
- No Redux / Zustand / Jotai / MobX.
- Cross-tab data flows through `ProfileContext` or is lifted into `PepGuideIQApp`.
- Refs for imperative things: `useRef` is used liberally for focus/scroll/DOM measurement.

## Styling

- Inline `style={{...}}` objects.
- Global classes in `components/GlobalStyles.jsx`: `brand` (display font), `mono` (mono font), `btn-red`, `btn-teal`, `form-input`, `scard` (saved stack card), `pcard` (peptide card), `pill--category`, `search-input`.
- Category colors come from `CAT_COLORS` in `src/data/catalog.js`. Use `getCategoryCssVars(cat)` to set `--cc` and `--cc-rgb` CSS custom properties on a container for downstream `.pcard` / `.pill--category` to read.

## Storage keys (don't collide)

| Key | Storage | Shape / purpose |
|---|---|---|
| `pepv_age_verified_v2` | localStorage | `{t: timestamp, v: 1}` — age gate ack |
| `pepv_age_verified` | localStorage | legacy boolean, fallback only |
| `pepguide_ref` | localStorage | affiliate ref (whitelisted codes; see `affiliateRef.js`) |
| `pepv_last_tab` | sessionStorage | last active tab id |
| `pepguideiq.active_profile_id.{userId}` | localStorage | active member_profile id per user |

## Data access

Everything goes through `src/lib/supabase.js` (57 exports) or explicit `fetch()` to `${API_WORKER_URL}/…` with `Authorization: Bearer <supabase_access_token>`. Use `getSessionAccessToken()` from supabase.js for the token.

**Never** call `supabase.from('profiles').update({ plan: ... })` from the client — the trigger rejects it. Plan changes go through Stripe webhook → `update_user_plan` service-role RPC.

## `src/lib/` utility map

42 modules. Group by concern:

- **Config**: `config.js` (env vars + is*Configured helpers)
- **Auth / data layer**: `supabase.js` (57 exports — auth, body metrics, member profiles, stacks, vials, dose logs, feed, notifications)
- **Tiers / plans**: `tiers.js`, `upgradeGateCopy.js`
- **Stripe**: `checkout.js` (Payment Links), `stripeBrowser.js` (lazy `loadStripe` singleton — unused after Checkout redirect; kept for possible embedded flows), `stripeSubscription.js` (`/stripe/create-subscription` → Checkout or Portal `url`)
- **Affiliate**: `affiliateRef.js`
- **Age gate**: `ageVerification.js`
- **Peptide math**: `peptideMath.js` (blend dose), `vialDoseMath.js` (units ↔ mcg), `peptideBioavailability.js`
- **Protocol logic**: `doseRouteKind.js`, `protocolDoseRows.js`, `protocolGuardrails.js` (timing warnings), `protocolLogCooldown.js`, `protocolMessages.js` (session flavor text), `sessionSchedule.js` (wake time → session)
- **Time**: `localCalendarDay.js`, `streakUtils.js`
- **Catalog utilities**: `advisorCatalogPayload.js`, `catalogStability.js`, `catalogVendorSanitize.js`, `normalizeNewCatalogEntry.js`, `resolveStackCatalogPeptide.js`
- **Member profile**: `memberAvatarUrl.js`, `memberFasts.js`, `memberProfileHandle.js`, `publicMemberProfile.js`, `openPublicProfile.js`, `socialProfileLinks.js`
- **Stack sharing**: `stackShare.js`
- **Social graph**: `follows.js`
- **Dose display / celebration**: `protocolMessages.js`, `doseLogDisplay.js`, `doseNetworkFeed.js`
- **Upload**: `r2Upload.js`
- **Builder**: `buildRowsFromMyStack.js`
- **External links**: `finnrickUrl.js` (validates https finnrick.com only)

Before inventing a new util, grep this list.

## Saved stack row shape (JSONB in `user_stacks.stack`)

```js
{
  id: string,                    // canonical catalog peptide id
  name: string,
  category: string,              // primary category
  stackDose: string,             // user's dose; falls back to catalog startDose
  stackFrequency: string,        // "Daily", "2x/week", "Pre-sleep", etc.
  stackNotes: string,
  sessions: ("morning"|"afternoon"|"evening"|"night")[],  // default = all 4
  stackRowKey: string,           // stable uuid for list rendering
  addedDate: string,
  startDose?: string,            // catalog fallback
  stackPeptideId?: string        // only when differs from canonical id
}
```

Normalize defensively with `normalizeStackSessions(s)` from `components/SavedStackEntryRow.jsx`.

## AI Guide request contract

```
POST ${API_WORKER_URL}/v1/chat
Authorization: Bearer <supabase_access_token>
body: { messages: [{role, content}], system: string, catalog: [...] }
```

Response: `{ text: string, usage: { queries_today, queries_limit } }`.

Build the catalog payload with `buildAdvisorCatalogPayload(catalog, primaryCategoryFn)` from `src/lib/advisorCatalogPayload.js` (caps at 153 rows (AI advisor payload cap, not catalog size), strips mechanism to one ≤160-char sentence).

## Adding a compound

1. Pick a batch file in `src/data/compounds/` (or add `batchN.js` and register in `index.js`).
2. Follow the schema in the JSDoc at the top of `src/data/catalog.js`.
3. For stability, set `stabilityDays` explicitly or let `resolveStability()` infer from the known ID sets in `catalogStability.js`.
4. For popularity, set `popularityRank` explicitly or let `attachPopularityRanks()` auto-fill from the 51–143 pool.
5. If it has Finnrick verification, set `finnrickUrl` (https + `finnrick.com` host only).

## Watch-fors

- Some legacy rows still sit inline in `PEPTIDES_CORE` in `catalog.js`. When both `batchN.js` and `PEPTIDES_CORE` define the same `id`, the batch wins (see `compoundIds` merge at the bottom of `catalog.js`). Prefer editing the batch file.
- `VialTracker.jsx` has its own date helpers and doesn't always use `src/lib/localCalendarDay.js`. Match the style already in that file (`todayYmd`, `localYmdFromIso`, etc.).
- `ProfileTab.jsx` toggles an internal `subView` between `"profile"` and `"settings"` — it nests `<SettingsTab>` inside itself. Don't duplicate settings chrome.
- `useMemberAvatarSrc()` returns either a cache-busted https URL or an object URL from a Worker blob fetch; you can set it as `<img src>` directly.
