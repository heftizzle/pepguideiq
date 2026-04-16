import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useActiveProfile } from "./ProfileContext.jsx";

/** @typedef {'core'|'profile'|'body'|'schedule'|'stack'|'share'|'guide'|'score'|'build'} DemoFlowKey */

/** Bottom nav NETWORK tab emoji — keep in sync with App.jsx + NetworkTab.jsx empty state. */
export const NETWORK_TAB_EMOJI = "🌐";

export const DEMO_TARGET = {
  nav_library: "nav_library",
  nav_stacks: "nav_stacks",
  nav_network: "nav_network",
  nav_build: "nav_build",
  nav_vials: "nav_vials",
  nav_profile: "nav_profile",
  nav_guide: "nav_guide",
  library_add_stack: "library_add_stack",
  vial_add: "vial_add",
  vial_reconstitute: "vial_reconstitute",
  profile_wake: "profile_wake",
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
export function demoNavProtocolTarget(session) {
  return `nav_protocol_${session}`;
}

/**
 * @typedef {{ target: string, tab: string | null, protocolSession?: string, text: string }} DemoStep
 */

/** @param {string} firstProtocolSessionId */
function coreSteps(firstProtocolSessionId) {
  const sid =
    typeof firstProtocolSessionId === "string" && firstProtocolSessionId.trim()
      ? firstProtocolSessionId.trim()
      : "morning";
  return [
    { target: DEMO_TARGET.nav_library, tab: "library", text: "Browse the compound library" },
    { target: DEMO_TARGET.library_add_stack, tab: "library", text: "Add a compound to your stack" },
    { target: DEMO_TARGET.nav_vials, tab: "vialTracker", text: "Create a vial" },
    { target: DEMO_TARGET.vial_reconstitute, tab: "vialTracker", text: "Reconstitute your vial" },
    { target: DEMO_TARGET.profile_wake, tab: "profile", text: "Set your time of day" },
    { target: DEMO_TARGET.protocol_log_dose, tab: "protocol", protocolSession: sid, text: "Log your dose" },
  ];
}

/** @type {Record<Exclude<DemoFlowKey, 'core'>, DemoStep[]>} */
const STATIC_FLOWS = {
  profile: [
    { target: DEMO_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    { target: DEMO_TARGET.profile_avatar, tab: "profile", text: "Upload a photo and set your display name" },
    { target: DEMO_TARGET.profile_handle, tab: "profile", text: "Choose a public @handle" },
  ],
  body: [
    { target: DEMO_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: DEMO_TARGET.profile_body_metrics,
      tab: "profile",
      text: "Use the goal selector and set weight, height, and body fat",
    },
  ],
  schedule: [
    { target: DEMO_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: DEMO_TARGET.profile_default_session,
      tab: "profile",
      text: "Pick your default session for the protocol view",
    },
    {
      target: DEMO_TARGET.profile_shift_schedule,
      tab: "profile",
      text: "Set shift schedule and wake time",
    },
  ],
  stack: [
    { target: DEMO_TARGET.nav_library, tab: "library", text: "Browse compounds in the library" },
    { target: DEMO_TARGET.library_add_stack, tab: "library", text: "Add compounds to your saved stack" },
    { target: DEMO_TARGET.nav_stacks, tab: "stack", text: "Review and name your stack" },
  ],
  share: [
    { target: DEMO_TARGET.nav_stacks, tab: "stack", text: "Open Stacks" },
    { target: DEMO_TARGET.stack_share, tab: "stack", text: "Share your stack" },
  ],
  guide: [{ target: DEMO_TARGET.nav_guide, tab: null, text: "Open the AI Guide from the header" }],
  score: [
    { target: DEMO_TARGET.nav_profile, tab: "profile", text: "Open Profile" },
    {
      target: DEMO_TARGET.profile_score,
      tab: "profile",
      text: "Review the score card to see how your pepguideIQ Score is explained",
    },
  ],
  build: [
    { target: DEMO_TARGET.nav_build, tab: "stackBuilder", text: "Open the BUILD tab" },
    {
      target: DEMO_TARGET.build_catalog_search,
      tab: "stackBuilder",
      text: "Search the catalog and add compounds to your builder",
    },
    {
      target: DEMO_TARGET.build_save_stack,
      tab: "stackBuilder",
      text: "Save your stack to update your saved protocol",
    },
  ],
};

/**
 * @param {DemoFlowKey} key
 * @param {string} firstProtocolSessionId
 * @returns {DemoStep[]}
 */
export function getDemoFlowSteps(key, firstProtocolSessionId) {
  if (key === "core") return coreSteps(firstProtocolSessionId);
  return STATIC_FLOWS[key] ?? [];
}

export const HELP_SECTIONS = [
  { key: /** @type {DemoFlowKey} */ ("core"), label: "Your First Protocol — 6-step core walkthrough" },
  { key: "profile", label: "Set Up Your Profile — avatar, display name, handle" },
  { key: "body", label: "Body Metrics & Goal — goal selector, weight, height, body fat" },
  { key: "schedule", label: "Schedule & Settings — default session, wake time, shift schedule" },
  { key: "build", label: "BUILD tab — search catalog, build protocol, save stack" },
  { key: "score", label: "Your pepguideIQ Score — score card explanation" },
  { key: "guide", label: "AI Guide — how to use the AI Guide" },
];

const DemoCtx = createContext(null);

/**
 * @param {{
 *   children: import("react").ReactNode;
 *   setActiveTab: (t: string) => void;
 *   setProtocolDeepLink: (s: string | null) => void;
 *   firstProtocolSessionId: string;
 * }} props
 */
export function DemoTourProvider({ children, setActiveTab, setProtocolDeepLink, firstProtocolSessionId }) {
  const { activeProfile, ready } = useActiveProfile();
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

  const [flowKey, setFlowKey] = useState(/** @type {DemoFlowKey | null} */ (null));
  const [stepIndex, setStepIndex] = useState(0);

  const autoStartedRef = useRef(false);

  const steps = useMemo(
    () => (flowKey ? getDemoFlowSteps(flowKey, firstProtocolSessionId) : []),
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

  const clearFlow = useCallback(() => {
    setFlowKey(null);
    setStepIndex(0);
    setHelpStripActive(false);
  }, []);

  const startFlow = useCallback(
    (key) => {
      const next = getDemoFlowSteps(key, firstProtocolSessionId);
      if (!next.length) return;
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
    const list = getDemoFlowSteps(flowKey, firstProtocolSessionId);
    if (!list.length) return;
    if (stepIndex < list.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      applyStepNav(list[next]);
    } else {
      clearFlow();
    }
  }, [flowKey, stepIndex, applyStepNav, clearFlow, firstProtocolSessionId]);

  const goPrev = useCallback(() => {
    if (!flowKey) return;
    const list = getDemoFlowSteps(flowKey, firstProtocolSessionId);
    if (!list.length || stepIndex <= 0) return;
    const prev = stepIndex - 1;
    setStepIndex(prev);
    applyStepNav(list[prev]);
  }, [flowKey, stepIndex, applyStepNav, firstProtocolSessionId]);

  const dismissBar = useCallback(() => {
    setBarDismissed(true);
    clearFlow();
  }, [clearFlow]);

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
    autoStartedRef.current = false;
    setBarDismissed(false);
    clearFlow();
  }, [activeProfile?.id, clearFlow]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!demoSessionsHydrated || sessionCount == null) return;
    if (sessionCount >= 1 && sessionCount <= 5 && !barDismissed) {
      autoStartedRef.current = true;
      startFlow("core");
    }
  }, [demoSessionsHydrated, sessionCount, barDismissed, startFlow]);

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
      const el = document.querySelector(`[data-demo-target="${highlightTarget}"]`);
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

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemoTour() {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemoTour must be used within DemoTourProvider");
  return v;
}

export function useDemoTourOptional() {
  return useContext(DemoCtx);
}

export function demoHighlightProps(isOn) {
  return isOn ? { "data-demo-highlight": "1" } : {};
}
