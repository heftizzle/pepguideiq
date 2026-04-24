import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isApiWorkerConfigured } from "../lib/config.js";
import { patchMemberProfileViaWorker, updateMemberProfile } from "../lib/supabase.js";
import { useActiveProfile } from "./ProfileContext.jsx";

/** @typedef {'core'|'profile'|'body'|'schedule'|'stack'|'share'|'guide'|'score'|'build'} TutorialFlowKey */

/** Bottom nav NETWORK tab emoji — keep in sync with App.jsx + NetworkTab.jsx empty state. */
export const NETWORK_TAB_EMOJI = "🌐";

export const TUTORIAL_TARGET = {
  nav_library: "nav_library",
  nav_stacks: "nav_stacks",
  nav_network: "nav_network",
  nav_build: "nav_build",
  nav_vials: "nav_vials",
  nav_profile: "nav_profile",
  nav_guide: "nav_guide",
  library_add_stack: "library_add_stack",
  vial_add: "vial_add",
  vial_name: "vial_name",
  vial_mix_date: "vial_mix_date",
  vial_mg: "vial_mg",
  vial_reconstitute: "vial_reconstitute",
  vial_desired_dose: "vial_desired_dose",
  settings_wake: "settings_wake",
  profile_avatar: "profile_avatar",
  profile_handle: "profile_handle",
  profile_body_metrics: "profile_body_metrics",
  profile_default_session: "profile_default_session",
  profile_shift_schedule: "profile_shift_schedule",
  profile_score: "profile_score",
  protocol_log_dose: "protocol_log_dose",
  stack_share: "stack_share",
  /** BUILD tab (`stackBuilder`): compound search + save */
  build_catalog_search: "build_catalog_search",
  build_save_stack: "build_save_stack",
};

/** @param {string} session */
export function tutorialNavProtocolTarget(session) {
  return `nav_protocol_${session}`;
}

/**
 * @typedef {{ target: string, tab: string | null, protocolSession?: string, text: string, tooltip?: string }} TutorialStep
 */

/** @param {string} firstProtocolSessionId */
function coreSteps(firstProtocolSessionId) {
  const sid =
    typeof firstProtocolSessionId === "string" && firstProtocolSessionId.trim()
      ? firstProtocolSessionId.trim()
      : "morning";
  return [
    {
      target: TUTORIAL_TARGET.nav_library,
      tab: "library",
      text: "Start here — browse the compound library",
      tooltip: "The Library is the foundation. Every compound you track starts here.",
    },
    {
      target: TUTORIAL_TARGET.library_add_stack,
      tab: "library",
      text: "Tap ADD on a compound to put it in your stack",
      tooltip: "No compound in your stack = nothing to track. Add one now.",
    },
    {
      target: TUTORIAL_TARGET.nav_vials,
      tab: "vialTracker",
      text: "Open the Vial Tracker",
      tooltip: "Your vials live here. You draw doses from a vial — so you need one first.",
    },
    {
      target: TUTORIAL_TARGET.vial_add,
      tab: "vialTracker",
      text: "Tap + to create a new vial",
      tooltip: "Create a vial for the compound you just added.",
    },
    {
      target: TUTORIAL_TARGET.vial_name,
      tab: "vialTracker",
      text: "Give your vial a name",
      tooltip: "Call it whatever you want — Shred Juice, Sexy Bod, whatever motivates you.",
    },
    {
      target: TUTORIAL_TARGET.vial_mix_date,
      tab: "vialTracker",
      text: "What day did you mix this?",
      tooltip: "Enter the date you reconstituted this vial. Helps track freshness.",
    },
    {
      target: TUTORIAL_TARGET.vial_mg,
      tab: "vialTracker",
      text: "How many MG are in this vial?",
      tooltip: "Enter the total MG in the vial. This is what came in the bottle.",
    },
    {
      target: TUTORIAL_TARGET.vial_reconstitute,
      tab: "vialTracker",
      text: "Enter your BAC water volume",
      tooltip: "This is the math that makes everything work. BAC water volume sets your dose amounts.",
    },
    {
      target: TUTORIAL_TARGET.vial_desired_dose,
      tab: "vialTracker",
      text: "Set your desired dose",
      tooltip: "Start low — too high and you might get sick. You can always increase later.",
    },
    {
      target: TUTORIAL_TARGET.settings_wake,
      tab: "profile",
      text: "Set your wake time in Settings",
      tooltip: "Your morning / afternoon / evening sessions are based on when you wake up.",
    },
    {
      target: TUTORIAL_TARGET.protocol_log_dose,
      tab: "protocol",
      protocolSession: sid,
      text: "Log your first dose — this is your daily workflow",
      tooltip: "You did it. Library → Vial → Log Dose. That's the loop, every single day.",
    },
  ];
}

/** @type {Record<Exclude<TutorialFlowKey, 'core'>, TutorialStep[]>} */
const STATIC_FLOWS = {
  profile: [
    { target: TUTORIAL_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    { target: TUTORIAL_TARGET.profile_avatar, tab: "profile", text: "Upload a photo and set your display name" },
    { target: TUTORIAL_TARGET.profile_handle, tab: "profile", text: "Choose a public @handle" },
  ],
  body: [
    { target: TUTORIAL_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: TUTORIAL_TARGET.profile_body_metrics,
      tab: "profile",
      text: "Use the goal selector and set weight, height, and body fat",
    },
  ],
  schedule: [
    { target: TUTORIAL_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: TUTORIAL_TARGET.profile_default_session,
      tab: "profile",
      text: "Pick your default session for the protocol view",
    },
    {
      target: TUTORIAL_TARGET.profile_shift_schedule,
      tab: "profile",
      text: "Set shift schedule and wake time",
    },
  ],
  stack: [
    { target: TUTORIAL_TARGET.nav_library, tab: "library", text: "Browse compounds in the library" },
    { target: TUTORIAL_TARGET.library_add_stack, tab: "library", text: "Add compounds to your saved stack" },
    { target: TUTORIAL_TARGET.nav_stacks, tab: "stack", text: "Review and name your stack" },
  ],
  share: [
    { target: TUTORIAL_TARGET.nav_stacks, tab: "stack", text: "Open Stacks" },
    { target: TUTORIAL_TARGET.stack_share, tab: "stack", text: "Share your stack" },
  ],
  guide: [{ target: TUTORIAL_TARGET.nav_guide, tab: null, text: "Open the AI Guide from the header" }],
  score: [
    { target: TUTORIAL_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: TUTORIAL_TARGET.profile_score,
      tab: "profile",
      text: "Review the score card to see how your pepguideIQ Score is explained",
    },
  ],
  build: [
    { target: TUTORIAL_TARGET.nav_build, tab: "stackBuilder", text: "Open the BUILD tab" },
    {
      target: TUTORIAL_TARGET.build_catalog_search,
      tab: "stackBuilder",
      text: "Search the catalog and add compounds to your builder",
    },
    {
      target: TUTORIAL_TARGET.build_save_stack,
      tab: "stackBuilder",
      text: "Save your stack to update your saved protocol",
    },
  ],
};

/**
 * @param {TutorialFlowKey} key
 * @param {string} firstProtocolSessionId
 * @returns {TutorialStep[]}
 */
export function getTutorialFlowSteps(key, firstProtocolSessionId) {
  if (key === "core") return coreSteps(firstProtocolSessionId);
  return STATIC_FLOWS[key] ?? [];
}

export const HELP_SECTIONS = [
  { key: /** @type {TutorialFlowKey} */ ("core"), label: "Your First Protocol — 11-step core walkthrough" },
  { key: "profile", label: "Set Up Your Profile — avatar, display name, handle" },
  { key: "body", label: "Body Metrics & Goal — goal selector, weight, height, body fat" },
  { key: "schedule", label: "Schedule & Settings — default session, wake time, shift schedule" },
  { key: "build", label: "BUILD tab — search catalog, build protocol, save stack" },
  { key: "score", label: "Your pepguideIQ Score — score card explanation" },
  { key: "guide", label: "AI Guide — how to use the AI Guide" },
];

const TutorialCtx = createContext(null);

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   setActiveTab: (t: string) => void;
 *   setProtocolDeepLink: (s: string | null) => void;
 *   firstProtocolSessionId: string;
 * }} props
 */
export function TutorialProvider({ children, setActiveTab, setProtocolDeepLink, firstProtocolSessionId }) {
  const { activeProfile, ready, patchMemberProfileLocal } = useActiveProfile();
  /** True once `demo_sessions_shown` is present on the row from API (avoid treating missing field as 0 before load). */
  const demoSessionsHydrated =
    ready &&
    activeProfile != null &&
    Object.prototype.hasOwnProperty.call(activeProfile, "demo_sessions_shown");
  const sessionCount = demoSessionsHydrated ? Number(activeProfile.demo_sessions_shown) || 0 : null;

  const [barDismissed, setBarDismissed] = useState(false);
  const [barExpanded, setBarExpanded] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [helpStripActive, setHelpStripActive] = useState(false);

  const [flowKey, setFlowKey] = useState(/** @type {TutorialFlowKey | null} */ (null));
  const [stepIndex, setStepIndex] = useState(0);
  const [forced, setForced] = useState(false);

  const steps = useMemo(
    () => (flowKey ? getTutorialFlowSteps(flowKey, firstProtocolSessionId) : []),
    [flowKey, firstProtocolSessionId]
  );
  const currentStep = steps.length && stepIndex < steps.length ? steps[stepIndex] : null;
  const highlightTarget = currentStep?.target ?? null;

  const applyStepNav = useCallback(
    (step) => {
      if (!step) return;
      if (step.tab) setActiveTab(step.tab);
      if (step.protocolSession) setProtocolDeepLink(step.protocolSession);
    },
    [setActiveTab, setProtocolDeepLink]
  );

  const clearFlowInternal = useCallback(() => {
    setFlowKey(null);
    setStepIndex(0);
    setHelpStripActive(false);
    setForced(false);
  }, []);

  const clearFlow = useCallback(() => {
    if (forced) return;
    clearFlowInternal();
  }, [forced, clearFlowInternal]);

  const startFlow = useCallback(
    (key, options) => {
      const opts = options != null && typeof options === "object" ? options : {};
      const next = getTutorialFlowSteps(key, firstProtocolSessionId);
      if (!next.length) return;
      setForced(Boolean(opts.forced));
      setFlowKey(key);
      setStepIndex(0);
      applyStepNav(next[0]);
      setHelpStripActive(true);
      setBarExpanded(true);
      setHelpMenuOpen(false);
    },
    [applyStepNav, firstProtocolSessionId]
  );

  const goNext = useCallback(() => {
    if (!flowKey) return;
    const list = getTutorialFlowSteps(flowKey, firstProtocolSessionId);
    if (!list.length) return;
    if (stepIndex < list.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      applyStepNav(list[next]);
    } else {
      const wasForcedCore = forced && flowKey === "core";
      const profileId =
        activeProfile && typeof activeProfile.id === "string" ? activeProfile.id.trim() : "";
      clearFlowInternal();
      if (wasForcedCore && profileId) {
        patchMemberProfileLocal(profileId, { tutorial_completed: true });
        void (async () => {
          const res = isApiWorkerConfigured()
            ? await patchMemberProfileViaWorker(profileId, { tutorial_completed: true })
            : await updateMemberProfile(profileId, { tutorial_completed: true });
          if (res.error) {
            patchMemberProfileLocal(profileId, { tutorial_completed: false });
          }
        })();
      }
    }
  }, [
    flowKey,
    stepIndex,
    forced,
    activeProfile,
    applyStepNav,
    clearFlowInternal,
    firstProtocolSessionId,
    patchMemberProfileLocal,
  ]);

  const goPrev = useCallback(() => {
    if (forced) return;
    if (!flowKey) return;
    const list = getTutorialFlowSteps(flowKey, firstProtocolSessionId);
    if (!list.length || stepIndex <= 0) return;
    const prev = stepIndex - 1;
    setStepIndex(prev);
    applyStepNav(list[prev]);
  }, [forced, flowKey, stepIndex, applyStepNav, firstProtocolSessionId]);

  const dismissBar = useCallback(() => {
    if (forced) return;
    setBarDismissed(true);
    clearFlowInternal();
  }, [forced, clearFlowInternal]);

  const expandFromCollapsed = useCallback(() => {
    setBarExpanded(true);
    startFlow("core");
  }, [startFlow]);

  const inlineBarEligible =
    demoSessionsHydrated && sessionCount != null && sessionCount >= 1 && sessionCount <= 10 && !barDismissed;
  const stripVisible = inlineBarEligible || helpStripActive;

  const showCollapsedTeaser =
    inlineBarEligible &&
    sessionCount != null &&
    sessionCount >= 6 &&
    sessionCount <= 10 &&
    !barExpanded &&
    !helpStripActive;

  const showFullPanel =
    helpStripActive ||
    (inlineBarEligible && sessionCount != null && sessionCount >= 1 && sessionCount <= 5) ||
    (inlineBarEligible && sessionCount != null && sessionCount >= 6 && sessionCount <= 10 && barExpanded);

  useEffect(() => {
    if (!demoSessionsHydrated || sessionCount == null) return;
    if (sessionCount >= 1 && sessionCount <= 5) setBarExpanded(true);
    else if (sessionCount >= 6 && sessionCount <= 10) setBarExpanded(false);
  }, [demoSessionsHydrated, sessionCount, activeProfile?.id]);

  useEffect(() => {
    setBarDismissed(false);
    clearFlowInternal();
  }, [activeProfile?.id, clearFlowInternal]);

  useEffect(() => {
    if (!highlightTarget || typeof document === "undefined") return;
    const t = window.setTimeout(() => {
      const ae = document.activeElement;
      if (
        ae instanceof HTMLInputElement ||
        ae instanceof HTMLTextAreaElement ||
        (ae instanceof HTMLElement && ae.isContentEditable)
      ) {
        return;
      }
      const el = document.querySelector(`[data-tutorial-target="${highlightTarget}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [highlightTarget, stepIndex, flowKey]);

  const isHighlighted = useCallback((id) => highlightTarget === id, [highlightTarget]);

  const value = useMemo(
    () => ({
      sessionCount,
      demoSessionsHydrated,
      highlightTarget,
      isHighlighted,
      flowKey,
      stepIndex,
      currentStep,
      steps,
      forced,
      startFlow,
      goNext,
      goPrev,
      clearFlow,
      barDismissed,
      barExpanded,
      setBarExpanded,
      dismissBar,
      expandFromCollapsed,
      stripVisible,
      showCollapsedTeaser,
      showFullPanel,
      helpMenuOpen,
      setHelpMenuOpen,
      HELP_SECTIONS,
      firstProtocolSessionId,
    }),
    [
      sessionCount,
      demoSessionsHydrated,
      highlightTarget,
      isHighlighted,
      flowKey,
      stepIndex,
      currentStep,
      steps,
      forced,
      startFlow,
      goNext,
      goPrev,
      clearFlow,
      barDismissed,
      barExpanded,
      dismissBar,
      expandFromCollapsed,
      stripVisible,
      showCollapsedTeaser,
      showFullPanel,
      helpMenuOpen,
      firstProtocolSessionId,
    ]
  );

  return <TutorialCtx.Provider value={value}>{children}</TutorialCtx.Provider>;
}

export function useTutorial() {
  const v = useContext(TutorialCtx);
  if (!v) throw new Error("useTutorial must be used within TutorialProvider");
  return v;
}

export function useTutorialOptional() {
  return useContext(TutorialCtx);
}

export function tutorialHighlightProps(isOn) {
  return isOn ? { "data-tutorial-highlight": "1" } : {};
}
