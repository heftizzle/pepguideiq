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
import { POST_TUTORIAL_COMPLETE_EVENT } from "../lib/postTutorialSession.js";
import { patchMemberProfileViaWorker, updateMemberProfile } from "../lib/supabase.js";
import { SLOW_MOUNT_TARGETS } from "../lib/spotlightUtils.js";
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
  /** Header ? help — core tour final step */
  nav_help: "nav_help",
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
  /** Profile Measurement hub — opens Body Scan subview */
  body_scan_section: "body_scan_section",
  /** Body Scan screen — Upload scan (Pro+ gate) */
  inbody_upload: "inbody_upload",
  /** Library compound tile — Ask AI Atlas CTA */
  atlas_compound_cta: "atlas_compound_cta",
  /** BUILD tab — AI Atlas advisor panel */
  atlas_build_panel: "atlas_build_panel",
  /** Reserved: Body Scan upload (OCR); reuse `inbody_upload` on DOM for guide step */
  atlas_scan_upload: "atlas_scan_upload",
  /** Body Scan Trends — AI interpretation (POST /inbody-scan/interpret) */
  atlas_scan_interpret: "atlas_scan_interpret",
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
      text: "Set your default session",
      tooltip: "Pick Morning, Afternoon, Evening or Night — this sets when your daily protocol runs.",
    },
    {
      target: TUTORIAL_TARGET.protocol_log_dose,
      tab: "protocol",
      protocolSession: sid,
      text: "Log your first dose — this is your daily workflow",
      tooltip: "You did it. Library → Vial → Log Dose. That's the loop, every single day.",
    },
    {
      target: TUTORIAL_TARGET.nav_help,
      tab: null,
      text: "Tap ? anytime to replay the tutorial",
      tooltip: "If you need the reps, make that mental muscle grow!",
    },
  ];
}

/** @type {Record<Exclude<TutorialFlowKey, 'core'>, TutorialStep[]>} */
const STATIC_FLOWS = {
  profile: [
    {
      target: TUTORIAL_TARGET.nav_profile,
      tab: "profile",
      text: "Open your Profile",
      tooltip: "Your profile is your identity on pepguideIQ. Let's get you set up.",
    },
    {
      target: TUTORIAL_TARGET.profile_avatar,
      tab: "profile",
      text: "Upload a photo and set your display name",
      tooltip: "Add a photo and a name the community will recognize you by.",
    },
    {
      target: TUTORIAL_TARGET.profile_handle,
      tab: "profile",
      text: "Choose your public @handle",
      tooltip: "This is your username on the Network feed. Pick something you'll own.",
    },
  ],

  body: [
    {
      target: TUTORIAL_TARGET.nav_profile,
      tab: "profile",
      text: "Open your Profile",
      tooltip: "Your body metrics and scan history live here. This is where your transformation gets tracked.",
    },
    {
      target: TUTORIAL_TARGET.profile_body_metrics,
      tab: "profile",
      text: "Set your goal, body stats, DOB, gender, and training experience",
      tooltip:
        "The more you fill in, the smarter your AI recommendations get. Pick your goal first — Build, Cut, Recomp, or Maintain. Add DOB, gender, and training experience so AI Atlas knows who it's talking to. If you have an InBody scan, use those numbers as your baseline.",
    },
    {
      target: TUTORIAL_TARGET.body_scan_section,
      tab: "profile",
      text: "Open Body Scan — your transformation tracker",
      tooltip:
        "Body Scan uploads let you track Weight, Skeletal Muscle Mass, and Body Fat % over time. Every scan is a receipt. Your progress is the proof.",
    },
    {
      target: TUTORIAL_TARGET.inbody_upload,
      tab: "profile",
      text: "Upload your InBody scan — Pro+ feature",
      tooltip:
        "This is a Pro+ feature. Upload your InBody scan image and we extract your stats automatically. Your baseline. Your progress. All in one place. Upgrade to unlock.",
    },
  ],

  schedule: [
    {
      target: TUTORIAL_TARGET.nav_profile,
      tab: "profile",
      text: "Open your Profile",
      tooltip: "Your schedule settings control when your protocol sessions appear.",
    },
    {
      target: TUTORIAL_TARGET.profile_default_session,
      tab: "profile",
      text: "Pick your default session",
      tooltip:
        "Morning, Afternoon, Evening, or Night — this sets which session loads first when you open the Protocol tab. Pick the one that matches when you do most of your dosing.",
    },
    {
      target: TUTORIAL_TARGET.profile_shift_schedule,
      tab: "profile",
      text: "Set your shift schedule and wake time",
      tooltip:
        "Work nights? Rotating shifts? Set your schedule here so your protocol sessions line up with your actual day — not a 9-to-5 you don't work.",
    },
  ],

  stack: [
    {
      target: TUTORIAL_TARGET.nav_library,
      tab: "library",
      text: "Browse the compound library",
      tooltip: "171 compounds with stability data, dosing info, and Finnrick vendor links. This is your research hub.",
    },
    {
      target: TUTORIAL_TARGET.library_add_stack,
      tab: "library",
      text: "Add compounds to your saved stack",
      tooltip: "Tap ADD on any compound to save it. Your stack is the list of everything you're running.",
    },
    {
      target: TUTORIAL_TARGET.nav_stacks,
      tab: "stack",
      text: "Review and name your stack",
      tooltip:
        "Name your stack something meaningful — 'Summer Cut', 'Healing Protocol', whatever fits. You can share it with the community from here.",
    },
  ],

  share: [
    {
      target: TUTORIAL_TARGET.nav_stacks,
      tab: "stack",
      text: "Open your Stacks",
      tooltip: "Your saved stacks live here. Build one worth sharing first.",
    },
    {
      target: TUTORIAL_TARGET.stack_share,
      tab: "stack",
      text: "Share your stack with the community",
      tooltip:
        "Sharing your stack puts it on the Network feed. Other users can see what you're running and follow your results. This is how the community grows.",
    },
  ],

  guide: [
    {
      target: TUTORIAL_TARGET.nav_library,
      tab: "library",
      text: "Start in the Library",
      tooltip:
        "Every compound card has an 'Ask AI Atlas →' button at the bottom. AI Atlas knows the full 171-compound catalog — ask it anything about any compound.",
    },
    {
      target: TUTORIAL_TARGET.atlas_compound_cta,
      tab: "library",
      text: "Tap 'Ask AI Atlas →' on any compound",
      tooltip:
        "Opens AI Atlas pre-loaded with that compound's context. Dosing, interactions, stacking, cycling — it knows the research. This uses your daily AI Atlas quota.",
    },
    {
      target: TUTORIAL_TARGET.nav_build,
      tab: "stackBuilder",
      text: "Open the BUILD tab",
      tooltip: "AI Atlas lives here too — in advisor mode. Build your stack and it analyzes it in real time.",
    },
    {
      target: TUTORIAL_TARGET.atlas_build_panel,
      tab: "stackBuilder",
      text: "AI Atlas analyzes your stack",
      tooltip:
        "Must Have, Nice to Have, Consider Adding — AI Atlas reviews your full stack and tells you exactly what to add, what's redundant, and what gaps you have. The more your profile is filled in, the sharper the recommendations.",
    },
    {
      target: TUTORIAL_TARGET.inbody_upload,
      tab: "profile",
      text: "Body Scan — AI Atlas reads your InBody results",
      tooltip:
        "Upload your InBody scan image and AI Atlas extracts every metric automatically — weight, skeletal muscle mass, body fat %, visceral fat, and more. Pro+ feature. Does NOT use your daily AI Atlas quota.",
    },
    {
      target: TUTORIAL_TARGET.atlas_scan_interpret,
      tab: "profile",
      text: "AI Atlas interprets your scan results",
      tooltip:
        "After extraction, AI Atlas writes a full interpretation of your scan — what the numbers mean, what's trending, and what to focus on next. Pro+ feature. Does NOT use your daily AI Atlas quota.",
    },
    {
      target: TUTORIAL_TARGET.nav_guide,
      tab: null,
      text: "Open AI Atlas from the header anytime",
      tooltip:
        "The 🧙 button is always in the header. Open AI Atlas as a full chat — ask anything about protocols, dosing math, interactions, timing, or research. Your 24/7 peptide research partner.",
    },
  ],

  score: [
    {
      target: TUTORIAL_TARGET.nav_profile,
      tab: "profile",
      text: "Open your Profile",
      tooltip: "Your pepguideIQ Score lives here. It goes up as you use the app.",
    },
    {
      target: TUTORIAL_TARGET.profile_score,
      tab: "profile",
      text: "Review your pepguideIQ Score card",
      tooltip:
        "Your score is based on profile completion, dose logging consistency, vial tracking, and community engagement. The higher the score, the more the app works for you. Think of it as your engagement XP.",
    },
    {
      target: TUTORIAL_TARGET.inbody_upload,
      tab: "profile",
      text: "Unlock more with Pro+",
      tooltip:
        "Body Scan uploads, advanced AI guidance, and more are unlocked at Pro+ and above. Your score reflects everything you're doing — upgrading adds more ways to earn it.",
    },
  ],

  build: [
    {
      target: TUTORIAL_TARGET.nav_build,
      tab: "stackBuilder",
      text: "Open the BUILD tab",
      tooltip: "The BUILD tab is your stack designer. Search, add, and arrange compounds before saving to your protocol.",
    },
    {
      target: TUTORIAL_TARGET.build_catalog_search,
      tab: "stackBuilder",
      text: "Search the catalog and add compounds",
      tooltip: "Type any compound name or goal — BPC-157, healing, GLP — and add what fits. You're building your protocol here.",
    },
    {
      target: TUTORIAL_TARGET.build_save_stack,
      tab: "stackBuilder",
      text: "Save your stack",
      tooltip: "Hit Save to push your build into your active protocol. This is what shows up when you log doses every day.",
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
  { key: /** @type {TutorialFlowKey} */ ("core"), label: "Replay Tutorial — walk through the 12-step core setup" },
  { key: "profile", label: "Set Up Your Profile — photo, name, handle" },
  { key: "body", label: "Body Metrics & Scans — InBody upload, DOB, gender, training experience" },
  { key: "schedule", label: "Schedule & Settings — sessions, wake time, shift schedule" },
  { key: "build", label: "BUILD Tab — design your stack, save to protocol" },
  { key: "score", label: "Your pepguideIQ Score — XP system, tiers, and what Pro+ unlocks" },
  { key: "guide", label: "AI Atlas — every place it lives and what it does there" },
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
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(POST_TUTORIAL_COMPLETE_EVENT));
          }
        } catch {
          /* ignore */
        }
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
    const scrollDelay = SLOW_MOUNT_TARGETS.has(highlightTarget) ? 350 : 120;
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
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, scrollDelay);
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
