import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { CATALOG_COUNT, GOALS, CAT_COLORS, getCategoryCssVars } from "./data/catalogMeta.js";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { HandleSetup } from "./components/HandleSetup.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import { Logo } from "./components/Logo.jsx";
import { Modal } from "./components/Modal.jsx";
import { CloseButton } from "./components/ui/CloseButton.jsx";
import { LibraryMobileSearchIcon, LibraryMobileSearchPanel } from "./components/LibraryMobileSearch.jsx";
import { SavedStackEntryRow, getStackRowListKey, normalizeStackSessions } from "./components/SavedStackEntryRow.jsx";
import { ProtocolTab } from "./components/ProtocolTab.jsx";
import { SavedStackNameInput } from "./components/SavedStackNameInput.jsx";
import { UpgradePlanModal } from "./components/UpgradePlanModal.jsx";
import { StackPhotoUpload } from "./components/StackPhotoUpload.jsx";
import { VialTracker } from "./components/VialTracker.jsx";
import { ArchivedVialsModal } from "./components/Vials/ArchivedVialsModal.jsx";
import { StackProfileShots } from "./components/StackProfileShots.jsx";
import { StackProtocolQuickLog } from "./components/StackProtocolQuickLog.jsx";
import { NetworkTab } from "./components/NetworkTab.jsx";
import { DoseLogFAB } from "./components/DoseLogFAB.jsx";
import { StackShareControls } from "./components/StackShareControls.jsx";
import { primaryCategory } from "./lib/catalogHelpers.js";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { PeopleSearch } from "./components/PeopleSearch.jsx";
import { PublicMemberProfilePage } from "./components/PublicMemberProfilePage.jsx";
import { NotificationsBell } from "./components/NotificationsBell.jsx";
import DeleteUndoToast from "./components/DeleteUndoToast.jsx";
import { NavTooltips } from "./components/NavTooltips.jsx";
import { HamburgerMenu } from "./components/HamburgerMenu.jsx";
import { GlossaryModal } from "./components/GlossaryModal.jsx";
import { FAQModal } from "./components/FAQModal.jsx";
import SupportModal from "./components/SupportModal.jsx";
import AppHelpModal from "./components/AppHelpModal.jsx";
import { LegalDisclaimer } from "./components/LegalDisclaimer.jsx";
import { LegalPage } from "./components/LegalPage.jsx";
import { AgeGate } from "./components/AgeGate.jsx";
import { ProfileProvider, useActiveProfile } from "./context/ProfileContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { DoseToastProvider, useShowDoseToast } from "./context/DoseToastContext.jsx";
import {
  TutorialProvider,
  TUTORIAL_TARGET,
  NETWORK_TAB_EMOJI,
  tutorialHighlightProps,
  useTutorial,
} from "./context/TutorialContext.jsx";
import { TutorialBar, TutorialHelpButton } from "./components/TutorialChrome.jsx";
import TutorialSpotlight from "./components/TutorialSpotlight.jsx";
import GuideSpotlight from "./components/GuideSpotlight.jsx";
import { useSpotlightMeasure } from "./lib/useSpotlightMeasure.js";
import { DeferredCoreTutorialLauncher } from "./components/DeferredCoreTutorialLauncher.jsx";
import { PostTutorialProfileModal } from "./components/PostTutorialProfileModal.jsx";
import { canAddStackRow, getNextTierId, getSavedStackRowLimit, TIER_ORDER } from "./lib/tiers.js";
import { getSuggestedUpgradeTier } from "./lib/upgradeGateCopy.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./lib/config.js";
import {
  getPostTutorialShown,
  getStackBuilderToastShown,
  isPostTutorialProfileComplete,
  POST_TUTORIAL_COMPLETE_EVENT,
  POST_TUTORIAL_TOAST_MESSAGE,
  setPostTutorialShown,
  setStackBuilderToastShown,
} from "./lib/postTutorialSession.js";
import { resolveStability } from "./lib/catalogStability.js";
import { hasInjectableRoute } from "./lib/doseRouteKind.js";
import { findCatalogPeptideForStackRow } from "./lib/resolveStackCatalogPeptide.js";
import {
  exchangeSupabaseAuthCodeFromUrlIfNeeded,
  fetchArchivedVialsForProfile,
  getCurrentUser,
  getCurrentUserFreshAfterCheckout,
  getSessionAccessToken,
  getUserStackRowId,
  loadStack,
  onAuthStateChange,
  saveStack,
  signOut,
  supabase,
} from "./lib/supabase.js";
import { normalizeHandleInput } from "./lib/memberProfileHandle.js";
import { readAgeVerifiedFromStorage } from "./lib/ageVerification.js";
import { buildAtfehCatalogPayload } from "./lib/atfehCatalogPayload.js";
import { buildRowsFromMyStack } from "./lib/buildRowsFromMyStack.js";
import AtfehThreadSidebar from "./components/AtfehThreadSidebar.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LibraryTab = React.lazy(() => import("./components/LibraryTab.jsx"));
const BuildTab = React.lazy(() => import("./components/BuildTab.jsx"));

const getCatColor = (cat) => CAT_COLORS[cat] ?? "var(--color-accent)";

/** Tutorial ghost vial: stable ID-only stub; resolveStability assigns peptide fridge rules without loading catalog in App. */
const TUTORIAL_GHOST_BPC157 = { id: "bpc-157", name: "BPC-157" };

/** Assistant message markdown (AI Atfeh); stable ref for react-markdown. */
const AI_GUIDE_MARKDOWN_COMPONENTS = {
  h2: ({ children }) => (
    <div className="brand" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-accent)", marginBottom: 6, marginTop: 12 }}>
      {children}
    </div>
  ),
  h3: ({ children }) => (
    <div className="brand" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4, marginTop: 10 }}>
      {children}
    </div>
  ),
  strong: ({ children }) => <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{children}</span>,
  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--color-border-tab)", margin: "10px 0" }} />,
  p: ({ children }) => <p style={{ marginBottom: 8, lineHeight: 1.6 }}>{children}</p>,
  li: ({ children }) => (
    <li style={{ marginBottom: 4, lineHeight: 1.6, marginLeft: 16 }}>{children}</li>
  ),
};
/** Top-right header: member profile avatar initial (no image). */
function profileHandleFromWindowPath() {
  if (typeof window === "undefined") return null;
  try {
    const path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
    const m = path.match(/^\/profile\/([^/]+)$/i);
    if (!m) return null;
    const h = normalizeHandleInput(decodeURIComponent(m[1] ?? ""));
    return h || null;
  } catch {
    return null;
  }
}

const PEPV_LAST_TAB_KEY = "pepv_last_tab";
/** localStorage key â€” user's sticky preference for which tab to land on after browser restart. */
const PEPV_PREFERRED_TAB_KEY = "pepguideiq.preferred_tab";
const PEPV_DEFAULT_TAB = "profile";

/** Bottom / main content tab ids (must match `setActiveTab` values). */
const PEPV_VALID_TABS = new Set([
  "library",
  "guide",
  "stackBuilder",
  "stack",
  "network",
  "vialTracker",
  "protocol",
  "profile",
]);

/**
 * True when the user's tab was resolved from a saved storage value on boot
 * (sessionStorage last-tab OR localStorage preferred tab). When true, the
 * post-profile-load default-tab effect must NOT override the user's choice.
 */
let bootHadStoredTab = false;

function TutorialSpotlightGate() {
  const { currentStep, highlightTarget, stepIndex, forced, goNext } = useTutorial();
  const { rect, bottomNavReserve, measureFailed } = useSpotlightMeasure(highlightTarget, stepIndex);

  useEffect(() => {
    if (!forced || !measureFailed) return;
    const t = window.setTimeout(() => goNext(), 300);
    return () => window.clearTimeout(t);
  }, [forced, measureFailed, stepIndex, goNext]);

  if (!currentStep || !highlightTarget) return null;
  return (
    <>
      <TutorialSpotlight rect={rect} bottomNavReserve={bottomNavReserve} />
      <GuideSpotlight rect={rect} bottomNavReserve={bottomNavReserve} />
    </>
  );
}

/** One line per compound for AI Atfeh thread message context (same strings as the previous inline `stackCtx` builder). */
function formatMyStackLinesForAi(items) {
  return items
    .map((p) => {
      const dose = p.stackDose || p.startDose || "";
      const freq = p.stackFrequency ? `, ${p.stackFrequency}` : "";
      const note = p.stackNotes ? `; notes: ${p.stackNotes}` : "";
      return `${p.name} (${dose}${freq})${note}`;
    })
    .join("; ");
}

/**
 * Resolve the initial active tab from storage with this priority:
 *   1. sessionStorage `pepv_last_tab` (the tab the user was on most recently in this browser session)
 *   2. localStorage `pepguideiq.preferred_tab` (the user's sticky preference across browser restarts)
 *   3. PEPV_DEFAULT_TAB ("profile")
 *
 * Sets the module-level `bootHadStoredTab` flag to true if either storage value resolved.
 * This flag is read by the post-profile-load default-tab effect to know whether to
 * override the resolved tab or respect the user's stored choice.
 */
function readInitialActiveTab() {
  // Priority 1: sessionStorage â€” last tab the user was on, survives reloads within session.
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(PEPV_LAST_TAB_KEY);
      const v = typeof raw === "string" ? raw.trim() : "";
      if (v && PEPV_VALID_TABS.has(v)) {
        bootHadStoredTab = true;
        return v;
      }
    } catch {
      /* ignore and fall through */
    }
  }
  // Priority 2: localStorage â€” sticky personal preference, survives full browser restart.
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(PEPV_PREFERRED_TAB_KEY);
      const v = typeof raw === "string" ? raw.trim() : "";
      if (v && PEPV_VALID_TABS.has(v)) {
        bootHadStoredTab = true;
        return v;
      }
    } catch {
      /* ignore and fall through */
    }
  }
  // Priority 3: default for fresh users.
  return PEPV_DEFAULT_TAB;
}

function PepGuideIQApp({ user, setUser }) {
  const {
    activeProfileId,
    activeProfile,
    memberProfilesVersion,
    refreshMemberProfiles,
    patchMemberProfileLocal,
  } = useActiveProfile();

  const needsHandleOnboarding =
    Boolean(activeProfileId) &&
    Boolean(activeProfile) &&
    (!activeProfile.handle ||
      (typeof activeProfile.handle === "string" && activeProfile.handle.trim() === ""));
  const [activeTab, setActiveTab] = useState(readInitialActiveTab);

  useEffect(() => {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(PEPV_LAST_TAB_KEY, activeTab);
      }
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const onboardedDefaultAppliedRef = useRef(false);
  useEffect(() => {
    if (onboardedDefaultAppliedRef.current) return;
    if (!activeProfile) return;
    onboardedDefaultAppliedRef.current = true;
    // Respect any stored tab choice (sessionStorage last-tab OR localStorage preferred-tab).
    // Only override for fresh users who have no storage history.
    if (bootHadStoredTab) return;
    const handleOk =
      typeof activeProfile.handle === "string" && activeProfile.handle.trim() !== "";
    const tutorialOk = activeProfile.tutorial_completed === true;
    // Onboarded users (handle set + tutorial done) land on Stack Builder by default;
    // fresh users land on PEPV_DEFAULT_TAB ("profile") so they see their own profile first.
    if (handleOk && tutorialOk) setActiveTab("stackBuilder");
  }, [activeProfile]);

  const [selCat, setSelCat]       = useState("All");
  const [routeFilter, setRouteFilter] = useState(null);
  const [sortMode, setSortMode]   = useState("popular");
  /** Library filter query â€” kept in PepGuideIQApp so it survives modal open/close and mobile search panel unmount. */
  const [search, setSearch] = useState("");
  const [selPeptide, setSelPeptide] = useState(null);
  const [myStack, setMyStack]     = useState([]);
  const [stackName, setStackName] = useState("");
  /** Stack Builder tab editor â€” lifted so it survives unmount (e.g. full-screen AI Atfeh). */
  const [buildRows, setBuildRows] = useState([]);
  const [buildLocalStackName, setBuildLocalStackName] = useState("");
  const [buildVialOverrides, setBuildVialOverrides] = useState(/** @type {Record<string, string>} */ ({}));
  const [buildCycleWeeks, setBuildCycleWeeks] = useState(8);
  const [stackShareId, setStackShareId] = useState(null);
  const [stackFeedVisible, setStackFeedVisible] = useState(false);
  const [stackRowId, setStackRowId] = useState(null);
  const [archivedModalOpen, setArchivedModalOpen] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [vialReloadKey, setVialReloadKey] = useState(0);
  const [showAdd, setShowAdd]     = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  /** False until `user_stacks` for `activeProfileId` has been loaded (avoids stale row counts + load races). */
  const [stackListReady, setStackListReady] = useState(false);
  const [aiMsgs, setAiMsgs]       = useState([]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  /** From Worker POST /v1/chat success: `usage.queries_today` / `queries_limit`. */
  const [aiQueryUsage, setAiQueryUsage] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [threadLocked, setThreadLocked] = useState(false);
  const [threadListVersion, setThreadListVersion] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cachedAccessToken, setCachedAccessToken] = useState(null);
  const [goals, setGoals]         = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  /** Which paid tier row to emphasize when the modal opens (next tier above current). */
  const [upgradeFocusTier, setUpgradeFocusTier] = useState(null);
  /** Why the upgrade sheet opened â€” drives friendly copy + checkout CTA (`upgradeGateCopy.js`). */
  const [upgradeGateReason, setUpgradeGateReason] = useState(/** @type {string | null} */ (null));
  /** Library `.pcard` variant-line: inline expand for variantNote (tap toggles; id â†’ open). */
  const [variantNoteExpandedById, setVariantNoteExpandedById] = useState({});
  /** Protocol session from Library pills, URL, or localStorage; persists across tabs until sign-out or URL handoff. */
  const [protocolDeepLink, setProtocolDeepLink] = useState(null);
  const [librarySearchOpen, setLibrarySearchOpen] = useState(false);
  /** Exit animation plays before unmount; keeps overlay mounted while activeTab is still "guide". */
  const [guideExiting, setGuideExiting] = useState(false);
  /** AI Atfeh: below 768px hides sidebar; goals live in a toggle + horizontal pill row. */
  const [guideLayoutMobile, setGuideLayoutMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
  );
  /** Mobile (max-width 768px): collapsible goals row above the message list. */
  const [goalsOpen, setGoalsOpen] = useState(false);
  const msgEnd = useRef(null);
  const stackHydrated = useRef(false);
  const prevTabRef = useRef(activeTab);
  const buildPrevTabRef = useRef(activeTab);
  /** After Stack Builder â†’ AI Atfeh, skip one hydrate from `myStack` when user returns to Stack Builder (guide closes via Library). */
  const preserveBuildEditorAfterGuideRef = useRef(false);

  const resetGuideAiState = useCallback(() => {
    setAiMsgs([]);
    setAiInput("");
    setGoals([]);
    setAiQueryUsage(null);
    setAiLoading(false);
    setGoalsOpen(false);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => {
      setGuideLayoutMobile(mq.matches);
      if (!mq.matches) setGoalsOpen(false);
    };
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!user?.id) { setCachedAccessToken(null); return; }
    getSessionAccessToken().then((t) => setCachedAccessToken(t ?? null));
  }, [user?.id]);

  const handleSelectThread = useCallback(async (threadId) => {
    if (!threadId) {
      setActiveThreadId(null);
      setThreadMessages([]);
      setThreadLocked(false);
      return;
    }
    setThreadLoading(true);
    setThreadError(null);
    try {
      const token = await getSessionAccessToken();
      const res = await fetch(`${API_WORKER_URL}/atfeh/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load thread (${res.status})`);
      const data = await res.json();
      setActiveThreadId(threadId);
      setThreadMessages(Array.isArray(data.messages) ? data.messages : []);
      setThreadLocked((data.thread?.message_count ?? 0) >= 10);
      setMobileSidebarOpen(false);
    } catch (err) {
      setThreadError(err.message || "Could not load thread");
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(null);
    setThreadMessages([]);
    setThreadLocked(false);
    setThreadError(null);
    setMobileSidebarOpen(false);
  }, []);

  const toggleGuideGoal = useCallback(
    (g) => {
      setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
      if (guideLayoutMobile) setGoalsOpen(false);
    },
    [guideLayoutMobile]
  );

  useEffect(() => {
    if (prevTabRef.current === "stackBuilder" && activeTab === "guide") {
      preserveBuildEditorAfterGuideRef.current = true;
    }
    if (prevTabRef.current === "guide" && activeTab !== "guide") {
      resetGuideAiState();
    }
    prevTabRef.current = activeTab;
  }, [activeTab, resetGuideAiState]);

  useEffect(() => {
    const prev = buildPrevTabRef.current;
    if (activeTab === "stackBuilder" && prev !== "stackBuilder") {
      if (preserveBuildEditorAfterGuideRef.current) {
        preserveBuildEditorAfterGuideRef.current = false;
      } else {
        setBuildLocalStackName(stackName);
        setBuildRows(buildRowsFromMyStack(myStack));
        setBuildVialOverrides({});
      }
    }
    buildPrevTabRef.current = activeTab;
  }, [activeTab, myStack, stackName]);

  useEffect(() => {
    if (activeTab !== "guide" && !guideExiting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeTab, guideExiting]);

  const beginCloseGuide = useCallback(() => {
    if (guideExiting || activeTab !== "guide") return;
    setGuideExiting(true);
  }, [guideExiting, activeTab]);

  const handleGuideTakeoverAnimationEnd = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return;
      if (!guideExiting) return;
      setActiveTab("library");
      setGuideExiting(false);
    },
    [guideExiting]
  );

  const onGuideTakeoverRootClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) beginCloseGuide();
    },
    [beginCloseGuide]
  );

  useEffect(() => {
    if (activeTab !== "guide" && !guideExiting) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      beginCloseGuide();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, guideExiting, beginCloseGuide]);

  useEffect(() => {
    if (activeTab !== "library") setLibrarySearchOpen(false);
  }, [activeTab]);

  const dismissLibrarySearch = useCallback(() => {
    setLibrarySearchOpen(false);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setStackShareId(null);
      setStackFeedVisible(false);
      setStackRowId(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("protocolSession");
      const fromLs =
        typeof localStorage !== "undefined" ? localStorage.getItem("protocolSession") : null;
      const raw = fromUrl || fromLs;
      const v =
        raw === "morning" || raw === "afternoon" || raw === "evening" || raw === "night" ? raw : null;
      if (v) {
        if (typeof localStorage !== "undefined") localStorage.removeItem("protocolSession");
        if (fromUrl) {
          params.delete("protocolSession");
          const qs = params.toString();
          const path = window.location.pathname || "/";
          const hash = window.location.hash || "";
          window.history.replaceState({}, "", `${path}${qs ? `?${qs}` : ""}${hash}`);
        }
        setProtocolDeepLink(v);
        setActiveTab("protocol");
      }
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  useEffect(() => {
    stackHydrated.current = false;
    setStackListReady(false);
    setMyStack([]);
    setShowAdd(false);
    setAddTarget(null);
    if (!user?.id || !activeProfileId) {
      return;
    }
    if (!isSupabaseConfigured()) {
      setStackRowId(null);
      stackHydrated.current = true;
      setStackListReady(true);
      return;
    }
    let ignore = false;
    setStackRowId(null);
    loadStack(user.id, activeProfileId)
      .then((s) => {
        if (ignore) return;
        const raw =
          s && typeof s === "object" && !Array.isArray(s) && Array.isArray(s.stack)
            ? s.stack
            : Array.isArray(s)
              ? s
              : [];
        const stack = raw.map((item) => ({
          ...item,
          sessions: normalizeStackSessions(item.sessions),
        }));
        setMyStack(stack);
        let storedName = "";
        try {
          if (typeof localStorage !== "undefined" && activeProfileId) {
            storedName =
              localStorage.getItem(`pepguideiq.stackDisplay.${user.id}.${activeProfileId}`) ?? "";
          }
        } catch {
          /* ignore */
        }
        setStackName(storedName);
        setBuildRows(buildRowsFromMyStack(stack));
        setBuildLocalStackName(storedName);
        setBuildVialOverrides({});
        preserveBuildEditorAfterGuideRef.current = false;
        setStackShareId(
          s && typeof s === "object" && !Array.isArray(s) && typeof s.shareId === "string" && s.shareId.trim()
            ? s.shareId.trim()
            : null
        );
        setStackFeedVisible(
          Boolean(s && typeof s === "object" && !Array.isArray(s) && s.feedVisible === true)
        );
        getUserStackRowId(user.id, activeProfileId).then(({ stackRowId: rid, error }) => {
          if (ignore) return;
          if (error) {
            console.warn("[getUserStackRowId]", error);
          }
          setStackRowId(typeof rid === "string" && rid.trim() ? rid.trim() : null);
        });
        stackHydrated.current = true;
        setStackListReady(true);
      })
      .catch(() => {
        if (ignore) return;
        setMyStack([]);
        setStackName("");
        setBuildRows([]);
        setBuildLocalStackName("");
        setBuildVialOverrides({});
        setStackShareId(null);
        setStackFeedVisible(false);
        setStackRowId(null);
        stackHydrated.current = true;
        setStackListReady(true);
      });
    return () => {
      ignore = true;
    };
  }, [user?.id, activeProfileId]);

  useEffect(() => {
    if (!user?.id || !activeProfileId || !isSupabaseConfigured() || !stackHydrated.current) return;
    const t = setTimeout(() => {
      void saveStack(user.id, activeProfileId, myStack);
      try {
        if (typeof localStorage !== "undefined" && user.id && activeProfileId) {
          localStorage.setItem(`pepguideiq.stackDisplay.${user.id}.${activeProfileId}`, stackName);
        }
      } catch {
        /* ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [myStack, stackName, user?.id, activeProfileId]);

  // FUTURE: Dual-tag filter mode
  // When implemented, each card can match on EITHER primary category OR secondaryCategory
  // UI pattern: primary filter row (current) + optional secondary filter row
  // State needed: activeCategory (string), activeSecondaryCategory (string | null)
  // Filter logic: p.category.includes(activeCategory) && (!activeSecondaryCategory || p.secondaryCategory?.includes(activeSecondaryCategory))
  // This enables stacking filters like "GH Peptides" + "Longevity" without a boolean OR mess

  const handleCategorySelect = (cat) => {
    setSelCat(cat);
    setSortMode("popular");
  };

  const planForStackLimits = useMemo(() => {
    const p = typeof user?.plan === "string" ? user.plan.trim().toLowerCase() : "";
    return TIER_ORDER.includes(p) ? p : "entry";
  }, [user?.plan]);
  const savedStackLimit = getSavedStackRowLimit(planForStackLimits);
  const canAddToStack = canAddStackRow(planForStackLimits, myStack.length);
  const canAI = Boolean(user?.id);
  const canUploadStackPhoto = Boolean(user?.id);
  const canVialTracker = Boolean(user?.id);

  const refreshArchivedCount = useCallback(async () => {
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) {
      setArchivedCount(0);
      return;
    }
    const { vials } = await fetchArchivedVialsForProfile(user.id, activeProfileId);
    setArchivedCount(Array.isArray(vials) ? vials.length : 0);
  }, [user?.id, activeProfileId]);

  useEffect(() => {
    void refreshArchivedCount();
  }, [refreshArchivedCount, vialReloadKey]);

  const protocolRows = useMemo(
    () => myStack.map((p) => ({ peptideId: p.id, name: p.name })),
    [myStack]
  );

  const protocolBaseRows = useMemo(
    () =>
      myStack.map((p) => ({
        peptideId: p.id,
        name: p.name,
        sessions: normalizeStackSessions(p.sessions),
      })),
    [myStack]
  );

  const openUpgradeModal = useCallback(
    (reason) => {
      const r = typeof reason === "string" && reason.trim() ? reason.trim() : null;
      setUpgradeGateReason(r);
      const suggested = r ? getSuggestedUpgradeTier(r, planForStackLimits) : null;
      setUpgradeFocusTier(suggested ?? getNextTierId(planForStackLimits));
      setShowUpgrade(true);
    },
    [planForStackLimits]
  );
  const closeUpgradeModal = useCallback(() => {
    setShowUpgrade(false);
    setUpgradeFocusTier(null);
    setUpgradeGateReason(null);
  }, []);

  const handleContinueThread = useCallback(async () => {
    if (!activeThreadId) return;
    setAiLoading(true);
    setThreadError(null);
    try {
      const token = await getSessionAccessToken();
      const res = await fetch(`${API_WORKER_URL}/atfeh/threads/${activeThreadId}/continue`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 402) {
        openUpgradeModal("thread_limit");
        return;
      }
      if (!res.ok) throw new Error(`Continue failed (${res.status})`);
      const data = await res.json();
      setActiveThreadId(data.thread?.id);
      setThreadMessages([]);
      setThreadLocked(false);
      setThreadListVersion((n) => n + 1);
    } catch (err) {
      setThreadError(err.message || "Could not continue thread");
    } finally {
      setAiLoading(false);
    }
  }, [activeThreadId, openUpgradeModal]);

  const openAdd = (p) => {
    if (!stackListReady) return;
    setAddTarget(p);
    setShowAdd(true);
  };
  const confirmAdd = ({ dose, frequency, notes }) => {
    if (!addTarget) return;
    if (!stackListReady) {
      setShowAdd(false);
      setAddTarget(null);
      return;
    }
    if (!canAddToStack) {
      openUpgradeModal("stack_full");
      setShowAdd(false);
      setAddTarget(null);
      return;
    }
    if (!myStack.find((s) => s.id === addTarget.id)) {
      const stackRowKey = crypto.randomUUID();
      setMyStack((prev) => [
        ...prev,
        {
          ...addTarget,
          stackRowKey,
          stackDose: dose,
          stackFrequency: frequency,
          stackNotes: notes,
          sessions: ["morning", "afternoon", "evening", "night"],
          addedDate: new Date().toLocaleDateString(),
        },
      ]);
    }
    setShowAdd(false);
    setAddTarget(null);
  };
  const updateStackItem = (rowKey, patch) => {
    setMyStack((prev) =>
      prev.map((s) => (getStackRowListKey(s) === rowKey ? { ...s, ...patch } : s))
    );
  };
  const removeFromStack = (rowKey) =>
    setMyStack((prev) => prev.filter((s) => getStackRowListKey(s) !== rowKey));

  const buildAtfehProfileContext = useCallback(async () => {
    const stackLines = myStack.length > 0 ? formatMyStackLinesForAi(myStack) : "";
    const stackCtx =
      myStack.length > 0
        ? `\n\nUser's current stack${stackName ? ` (\u201c${stackName}\u201d)` : ""}: ${stackLines}.`
        : "";
    const goalsCtx = goals.length > 0 ? `\n\nUser's goals: ${goals.join(", ")}.` : "";

    let scanCtx = "";
    let doseLogCtx = "";
    let profileCtx = "";

    if (supabase && activeProfileId) {
      const [{ data: latestScans }, { data: recentDoseLogs }, { data: bodyMetricsRows }] =
        await Promise.all([
          supabase
            .from("inbody_scan_history")
            .select("scan_date, inbody_score, weight_lbs, smm_lbs, pbf_pct, fat_mass_lbs")
            .eq("profile_id", activeProfileId)
            .order("scan_date", { ascending: false, nullsFirst: false })
            .limit(3),
          supabase
            .from("dose_logs")
            .select("peptide_id, dose_mcg, dose_count, dose_unit, dosed_at")
            .eq("profile_id", activeProfileId)
            .order("dosed_at", { ascending: false })
            .limit(20),
          supabase
            .from("body_metrics")
            .select("weight_lbs")
            .eq("user_id", user.id)
            .eq("profile_id", activeProfileId)
            .order("updated_at", { ascending: false })
            .limit(1),
        ]);

      const age = user?.date_of_birth
        ? Math.floor((Date.now() - Date.parse(user.date_of_birth)) / 31557600000)
        : null;
      const weightLbs = bodyMetricsRows?.[0]?.weight_lbs ?? null;

      const profileParts = [
        age ? `Age ${age}` : null,
        user?.biological_sex ? `Sex: ${user.biological_sex}` : null,
        weightLbs ? `Weight: ${weightLbs} lbs` : null,
        user?.training_experience ? `Training experience: ${user.training_experience}` : null,
      ].filter(Boolean);
      profileCtx = profileParts.length ? `\n\nUser profile: ${profileParts.join(", ")}.` : "";

      if (latestScans?.length) {
        const s = latestScans[0];
        scanCtx = `\n\nLatest InBody scan (${s.scan_date}): InBody Score ${s.inbody_score ?? "N/A"}, Weight ${s.weight_lbs ?? "N/A"} lbs, SMM ${s.smm_lbs ?? "N/A"} lbs, BF% ${s.pbf_pct ?? "N/A"}%, Fat Mass ${s.fat_mass_lbs ?? "N/A"} lbs.`;
      }

      if (recentDoseLogs?.length) {
        const { PEPTIDES: catalogPeptides } = await import("./data/catalog.js");
        const lines = recentDoseLogs.map((d) => {
          const name = catalogPeptides.find((p) => p.id === d.peptide_id)?.name ?? d.peptide_id;
          const doseStr =
            d.dose_mcg != null
              ? `${d.dose_mcg} mcg`
              : d.dose_count != null
              ? `${d.dose_count} ${d.dose_unit ?? ""}`.trim()
              : "logged";
          return `${name} ${doseStr} on ${d.dosed_at?.slice(0, 10) ?? "unknown"}`;
        });
        doseLogCtx = `\n\nRecent dose log (last 20): ${lines.join("; ")}.`;
      }
    }

    return { stackCtx, goalsCtx, scanCtx, doseLogCtx, profileCtx };
  }, [myStack, stackName, goals, activeProfileId, user]);

  const sendAtfehMessage = useCallback(async (content) => {
    if (!content || !content.trim()) return;
    if (threadLocked) return;
    if (!canAI) {
      openUpgradeModal("ai_guide");
      return;
    }
    if (!isApiWorkerConfigured()) {
      setThreadMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Configure VITE_API_WORKER_URL in .env.local (deploy workers/api-proxy.js and use POST /v1/chat). The Anthropic key must stay on the Worker only.",
        },
      ]);
      return;
    }
    setAiLoading(true);
    setThreadError(null);
    try {
      const token = await getSessionAccessToken();
      let threadId = activeThreadId;

      if (!threadId) {
        const createRes = await fetch(`${API_WORKER_URL}/atfeh/threads`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profile_id: activeProfileId }),
        });
        if (createRes.status === 402) {
          openUpgradeModal("thread_limit");
          setAiLoading(false);
          return;
        }
        if (!createRes.ok) throw new Error(`Could not start thread (${createRes.status})`);
        const created = await createRes.json();
        console.log("[Atfeh] thread created:", created);
        threadId = created.thread.id;
        setActiveThreadId(threadId);
        setThreadListVersion((n) => n + 1);
      }

      const userMsg = { role: "user", content, created_at: new Date().toISOString() };
      setThreadMessages((prev) => [...prev, userMsg]);

      const { stackCtx, goalsCtx, scanCtx, doseLogCtx, profileCtx } =
        await buildAtfehProfileContext();
      const { PEPTIDES: catalogData } = await import("./data/catalog.js");
      const catalog = buildAtfehCatalogPayload(catalogData, primaryCategory);

      const sendRes = await fetch(`${API_WORKER_URL}/atfeh/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content,
          history: threadMessages,
          catalog,
          profile: {
            system_context: `You are PepGuideIQ AI Atfeh â€” a precision biohacking intelligence layer. You have full context on this user. Answer specifically to their situation, never generically.${profileCtx}${stackCtx}${goalsCtx}${scanCtx}${doseLogCtx}`,
          },
        }),
      });

      if (sendRes.status === 429) {
        const errData = await sendRes.json().catch(() => ({}));
        if (errData.canContinue) {
          setThreadLocked(true);
          setThreadError("This thread is full. Continue it to keep going.");
        } else {
          const errText =
            typeof errData.error === "string" ? errData.error : "Daily Atfeh Chat limit reached.";
          setThreadError(errText);
          if (errData.limit_reached === true) {
            openUpgradeModal("ai_guide");
          }
        }
        setAiLoading(false);
        return;
      }
      if (!sendRes.ok) throw new Error(`Send failed (${sendRes.status})`);

      const data = await sendRes.json();
      if (data.content) {
        setThreadMessages((prev) => [...prev, { role: "assistant", content: data.content, created_at: new Date().toISOString() }]);
      }
      if (data.thread?.locked) setThreadLocked(true);
      if (data.usage && typeof data.usage.queries_today === "number") {
        setAiQueryUsage({
          today: data.usage.queries_today,
          limit: data.usage.queries_limit,
          plan: typeof data.usage.plan === "string" ? data.usage.plan : user?.plan,
        });
      }
      setThreadListVersion((n) => n + 1);
    } catch (err) {
      setThreadError(err.message || "Could not send message");
    } finally {
      setAiLoading(false);
    }
  }, [activeThreadId, activeProfileId, threadLocked, threadMessages, canAI, openUpgradeModal, buildAtfehProfileContext, user?.plan]);

  const sendAI = sendAtfehMessage;

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [threadMessages]);

  const handleSignOut = async () => {
    try {
      if (user?.id && typeof localStorage !== "undefined") {
        localStorage.removeItem(`pepguideiq.handlePromptDismissed.${user.id}`);
      }
    } catch {
      /* ignore */
    }
    await signOut();
    stackHydrated.current = false;
    setMyStack([]);
    setStackName("");
    setBuildRows([]);
    setBuildLocalStackName("");
    setBuildVialOverrides({});
    setBuildCycleWeeks(8);
    preserveBuildEditorAfterGuideRef.current = false;
    setAiQueryUsage(null);
    setProtocolDeepLink(null);
    setUser(null);
    setShowPeopleSearch(false);
  };

  const [showHandlePrompt, setShowHandlePrompt] = useState(false);
  const [glossaryModalOpen, setGlossaryModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [appHelpOpen, setAppHelpOpen] = useState(false);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [peopleSearchToken, setPeopleSearchToken] = useState(/** @type {string | null} */ (null));
  /** Prefill Find People (e.g. deep link or reopen). */
  const [peopleSearchInitialQuery, setPeopleSearchInitialQuery] = useState(/** @type {string | null} */ (null));
  /** Scroll Network â€œLive dosingâ€ card to this `network_feed.id`, then clear via callback. */
  const [networkScrollToDosePostId, setNetworkScrollToDosePostId] = useState(/** @type {string | null} */ (null));
  /** `/profile/:handle` in-app overlay (logged-in shell). */
  const [publicProfileOverlayHandle, setPublicProfileOverlayHandle] = useState(/** @type {string | null} */ (null));
  const [publicProfileAccessToken, setPublicProfileAccessToken] = useState(/** @type {string | null} */ (null));

  const closePublicProfileOverlay = useCallback(() => {
    setPublicProfileOverlayHandle(null);
    setPublicProfileAccessToken(null);
    try {
      const p = (window.location.pathname || "/").replace(/\/$/, "") || "/";
      if (/^\/profile\/[^/]+$/i.test(p)) {
        window.history.replaceState({}, "", "/");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!showPeopleSearch) {
      setPeopleSearchToken(null);
      return;
    }
    let cancelled = false;
    void getSessionAccessToken().then((t) => {
      if (!cancelled) setPeopleSearchToken(t ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [showPeopleSearch]);

  useEffect(() => {
    const onOpenPublicProfile = (/** @type {CustomEvent<{ handle?: string }>} */ e) => {
      const h = normalizeHandleInput(e.detail?.handle ?? "");
      if (!h) return;
      setPublicProfileOverlayHandle(h);
    };
    const syncPublicProfileFromUrl = () => {
      setPublicProfileOverlayHandle(profileHandleFromWindowPath());
    };
    const onOpenNetworkPost = (/** @type {CustomEvent<{ postId?: string }>} */ e) => {
      const pid = typeof e.detail?.postId === "string" ? e.detail.postId.trim() : "";
      if (!pid) return;
      setActiveTab("network");
      setNetworkScrollToDosePostId(pid);
    };
    const onOpenNetworkTabOnly = () => {
      setActiveTab("network");
    };
    const onOpenProfileTabSettings = () => {
      setActiveTab("profile");
      window.setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent("pepguide:open-settings"));
        } catch {
          /* ignore */
        }
      }, 50);
    };
    const onOpenPost = (
      /** @type {CustomEvent<{ handle?: string; postId?: string; commentId?: string | null }>} */ e
    ) => {
      const h = normalizeHandleInput(e.detail?.handle ?? "");
      const pid = typeof e.detail?.postId === "string" ? e.detail.postId.trim() : "";
      const cidRaw = e.detail?.commentId;
      const cid = typeof cidRaw === "string" ? cidRaw.trim() : "";
      if (!h || !pid) return;
      const qs = new URLSearchParams();
      qs.set("post", pid);
      if (cid) qs.set("comment", cid);
      try {
        window.history.pushState({}, "", `/profile/${encodeURIComponent(h)}?${qs.toString()}`);
      } catch {
        /* ignore */
      }
      setPublicProfileOverlayHandle(h);
    };
    window.addEventListener("pepguide:open-public-profile", onOpenPublicProfile);
    window.addEventListener("popstate", syncPublicProfileFromUrl);
    window.addEventListener("pepguide:open-network-post", onOpenNetworkPost);
    window.addEventListener("pepguide:open-network-tab", onOpenNetworkTabOnly);
    window.addEventListener("pepguide:open-post", onOpenPost);
    window.addEventListener("pepguide:open-profile-tab-settings", onOpenProfileTabSettings);
    return () => {
      window.removeEventListener("pepguide:open-public-profile", onOpenPublicProfile);
      window.removeEventListener("popstate", syncPublicProfileFromUrl);
      window.removeEventListener("pepguide:open-network-post", onOpenNetworkPost);
      window.removeEventListener("pepguide:open-network-tab", onOpenNetworkTabOnly);
      window.removeEventListener("pepguide:open-post", onOpenPost);
      window.removeEventListener("pepguide:open-profile-tab-settings", onOpenProfileTabSettings);
    };
  }, []);

  useEffect(() => {
    if (!publicProfileOverlayHandle) {
      setPublicProfileAccessToken(null);
      return;
    }
    let cancelled = false;
    void getSessionAccessToken().then((t) => {
      if (!cancelled) setPublicProfileAccessToken(t ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [publicProfileOverlayHandle]);

  useEffect(() => {
    if (!user?.id || !activeProfile) {
      setShowHandlePrompt(false);
      return;
    }
    let dismissed = false;
    try {
      dismissed = typeof localStorage !== "undefined" && localStorage.getItem(`pepguideiq.handlePromptDismissed.${user.id}`) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) {
      setShowHandlePrompt(false);
      return;
    }
    const hasHandle = typeof activeProfile.handle === "string" && activeProfile.handle.length > 0;
    setShowHandlePrompt(!hasHandle);
  }, [user?.id, activeProfile?.id, activeProfile?.handle]);

  const dismissHandlePrompt = useCallback(() => {
    setShowHandlePrompt(false);
    try {
      if (user?.id && typeof localStorage !== "undefined") {
        localStorage.setItem(`pepguideiq.handlePromptDismissed.${user.id}`, "1");
      }
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  const mainUiRef = useRef({});
  /** Bottom nav tab `<button>` elements for `NavTooltips` positioning. */
  const navTabButtonRefs = useRef(/** @type {Partial<Record<string, HTMLButtonElement | null>>} */ ({}));

  /** PepGuideIQMainTree destructures the same keys â€” keep this object and that destructure identical. */
  mainUiRef.current = {
    user,
    setUser,
    activeProfileId,
    activeProfile,
    memberProfilesVersion,
    activeTab,
    setActiveTab,
    selCat,
    routeFilter,
    sortMode,
    setSortMode,
    search,
    setSearch,
    selPeptide,
    setSelPeptide,
    myStack,
    setMyStack,
    stackName,
    setStackName,
    buildRows,
    setBuildRows,
    buildLocalStackName,
    setBuildLocalStackName,
    buildVialOverrides,
    setBuildVialOverrides,
    buildCycleWeeks,
    setBuildCycleWeeks,
    stackShareId,
    setStackShareId,
    stackFeedVisible,
    setStackFeedVisible,
    stackRowId,
    setStackRowId,
    archivedModalOpen,
    setArchivedModalOpen,
    archivedCount,
    vialReloadKey,
    setVialReloadKey,
    refreshArchivedCount,
    showAdd,
    setShowAdd,
    addTarget,
    setAddTarget,
    aiMsgs,
    aiInput,
    setAiInput,
    aiLoading,
    aiQueryUsage,
    goals,
    setGoals,
    showUpgrade,
    upgradeFocusTier,
    upgradeGateReason,
    variantNoteExpandedById,
    setVariantNoteExpandedById,
    protocolDeepLink,
    setProtocolDeepLink,
    guideExiting,
    guideLayoutMobile,
    goalsOpen,
    setGoalsOpen,
    toggleGuideGoal,
    msgEnd,
    beginCloseGuide,
    handleGuideTakeoverAnimationEnd,
    onGuideTakeoverRootClick,
    planForStackLimits,
    savedStackLimit,
    canAddToStack,
    stackListReady,
    canAI,
    canUploadStackPhoto,
    canVialTracker,
    protocolRows,
    protocolBaseRows,
    openUpgradeModal,
    closeUpgradeModal,
    openAdd,
    confirmAdd,
    updateStackItem,
    removeFromStack,
    sendAI,
    sendAtfehMessage,
    activeThreadId,
    setActiveThreadId,
    threadMessages,
    setThreadMessages,
    threadLoading,
    threadError,
    setThreadError,
    threadLocked,
    setThreadLocked,
    threadListVersion,
    setThreadListVersion,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    cachedAccessToken,
    handleSelectThread,
    handleNewThread,
    handleContinueThread,
    handleSignOut,
    showHandlePrompt,
    glossaryModalOpen,
    setGlossaryModalOpen,
    faqModalOpen,
    setFaqModalOpen,
    supportModalOpen,
    setSupportModalOpen,
    appHelpOpen,
    setAppHelpOpen,
    dismissHandlePrompt,
    setRouteFilter,
    librarySearchOpen,
    setLibrarySearchOpen,
    dismissLibrarySearch,
    setShowPeopleSearch,
    networkScrollToDosePostId,
    setNetworkScrollToDosePostId,
    navTabButtonRefs,
  };

  return (
    <TutorialProvider
      setActiveTab={setActiveTab}
      setProtocolDeepLink={setProtocolDeepLink}
      firstProtocolSessionId="morning"
    >
      <DeferredCoreTutorialLauncher
        needsHandleOnboarding={needsHandleOnboarding}
        activeProfileHandle={activeProfile?.handle}
        activeProfileId={activeProfile?.id}
        activeProfileTutorialCompleted={activeProfile?.tutorial_completed === true}
        activeProfileTutorialExplicitlyIncomplete={
          activeProfile != null && activeProfile.tutorial_completed === false
        }
      />
      {needsHandleOnboarding ? (
        <>
          <GlobalStyles />
          <HandleSetup
            activeProfileId={activeProfileId}
            patchMemberProfileLocal={patchMemberProfileLocal}
            onComplete={() => {
              void refreshMemberProfiles();
            }}
          />
        </>
      ) : (
        <DoseToastProvider>
          <PepGuideIQMainTree mainUiRef={mainUiRef} onCategorySelect={handleCategorySelect} />
          <NavTooltips tabButtonRefs={navTabButtonRefs} />
          <TutorialBar />
        {showPeopleSearch && activeProfileId && typeof document !== "undefined"
          ? createPortal(
              <PeopleSearch
                activeProfileId={activeProfileId}
                workerUrl={API_WORKER_URL}
                accessToken={peopleSearchToken}
                initialQuery={peopleSearchInitialQuery}
                onClose={() => {
                  try {
                    const p = (window.location.pathname || "/").replace(/\/$/, "") || "/";
                    if (/^\/profile\/[^/]+$/i.test(p)) {
                      window.history.replaceState({}, "", "/");
                    }
                  } catch {
                    /* ignore */
                  }
                  setShowPeopleSearch(false);
                  setPeopleSearchInitialQuery(null);
                }}
              />,
              document.body
            )
          : null}
        {publicProfileOverlayHandle && typeof document !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 100,
                  overflowY: "auto",
                  background: "var(--color-bg-page)",
                }}
              >
                <PublicMemberProfilePage
                  handle={publicProfileOverlayHandle}
                  onClose={closePublicProfileOverlay}
                  viewerActiveProfileId={activeProfileId}
                  viewerAccessToken={publicProfileAccessToken}
                  includeGlobalStyles={false}
                />
              </div>,
              document.body
            )
          : null}
          <TutorialSpotlightGate />
          <DeleteUndoToast />
        </DoseToastProvider>
      )}
    </TutorialProvider>
  );
}

function PepGuideIQMainTree({ mainUiRef, onCategorySelect }) {
  const topHeaderRef = useRef(null);
  const { isHighlighted, stripVisible, highlightTarget, flowKey, setHelpMenuOpen, forced } = useTutorial();
  const {
    user,
    setUser,
    activeProfileId,
    activeProfile,
    memberProfilesVersion,
    activeTab,
    setActiveTab,
    selCat,
    routeFilter,
    sortMode,
    setSortMode,
    search,
    setSearch,
    selPeptide,
    setSelPeptide,
    myStack,
    setMyStack,
    stackName,
    setStackName,
    buildRows,
    setBuildRows,
    buildLocalStackName,
    setBuildLocalStackName,
    buildVialOverrides,
    setBuildVialOverrides,
    buildCycleWeeks,
    setBuildCycleWeeks,
    stackShareId,
    setStackShareId,
    stackFeedVisible,
    setStackFeedVisible,
    stackRowId,
    setStackRowId,
    archivedModalOpen,
    setArchivedModalOpen,
    archivedCount,
    vialReloadKey,
    setVialReloadKey,
    refreshArchivedCount,
    showAdd,
    setShowAdd,
    addTarget,
    setAddTarget,
    aiMsgs,
    aiInput,
    setAiInput,
    aiLoading,
    aiQueryUsage,
    goals,
    setGoals,
    showUpgrade,
    upgradeFocusTier,
    upgradeGateReason,
    variantNoteExpandedById,
    setVariantNoteExpandedById,
    protocolDeepLink,
    setProtocolDeepLink,
    guideExiting,
    guideLayoutMobile,
    goalsOpen,
    setGoalsOpen,
    toggleGuideGoal,
    msgEnd,
    beginCloseGuide,
    handleGuideTakeoverAnimationEnd,
    onGuideTakeoverRootClick,
    planForStackLimits,
    savedStackLimit,
    canAddToStack,
    stackListReady,
    canAI,
    canUploadStackPhoto,
    canVialTracker,
    protocolRows,
    protocolBaseRows,
    openUpgradeModal,
    closeUpgradeModal,
    openAdd,
    confirmAdd,
    updateStackItem,
    removeFromStack,
    sendAI,
    sendAtfehMessage,
    activeThreadId,
    setActiveThreadId,
    threadMessages,
    setThreadMessages,
    threadLoading,
    threadError,
    setThreadError,
    threadLocked,
    setThreadLocked,
    threadListVersion,
    setThreadListVersion,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    cachedAccessToken,
    handleSelectThread,
    handleNewThread,
    handleContinueThread,
    handleSignOut,
    showHandlePrompt,
    glossaryModalOpen,
    setGlossaryModalOpen,
    faqModalOpen,
    setFaqModalOpen,
    supportModalOpen,
    setSupportModalOpen,
    appHelpOpen,
    setAppHelpOpen,
    dismissHandlePrompt,
    setRouteFilter,
    librarySearchOpen,
    setLibrarySearchOpen,
    dismissLibrarySearch,
    setShowPeopleSearch,
    networkScrollToDosePostId,
    setNetworkScrollToDosePostId,
    navTabButtonRefs,
  } = mainUiRef.current;

  const { patchMemberProfileLocal, refreshMemberProfiles } = useActiveProfile();
  const showDoseToast = useShowDoseToast();
  const [postTutorialModalOpen, setPostTutorialModalOpen] = useState(false);

  const finishPostTutorialFlow = useCallback(() => {
    setPostTutorialModalOpen(false);
    setPostTutorialShown();
    setActiveTab("stackBuilder");
    if (!getStackBuilderToastShown()) {
      showDoseToast(POST_TUTORIAL_TOAST_MESSAGE);
      setStackBuilderToastShown();
    }
  }, [showDoseToast, setActiveTab]);

  useEffect(() => {
    const onPostTutorial = () => {
      if (getPostTutorialShown()) {
        setActiveTab("stackBuilder");
        return;
      }
      if (isPostTutorialProfileComplete(activeProfile)) {
        setPostTutorialShown();
        setActiveTab("stackBuilder");
        if (!getStackBuilderToastShown()) {
          showDoseToast(POST_TUTORIAL_TOAST_MESSAGE);
          setStackBuilderToastShown();
        }
        return;
      }
      setPostTutorialModalOpen(true);
    };
    window.addEventListener(POST_TUTORIAL_COMPLETE_EVENT, onPostTutorial);
    return () => window.removeEventListener(POST_TUTORIAL_COMPLETE_EVENT, onPostTutorial);
  }, [activeProfile, setActiveTab, showDoseToast]);

  const libraryNavActive = activeTab === "library" || activeTab === "protocol";

  useEffect(() => {
    let cancelled = false;
    if (
      flowKey === "guide" &&
      highlightTarget === TUTORIAL_TARGET.atfeh_compound_cta &&
      activeTab === "library" &&
      !selPeptide
    ) {
      void import("./data/catalog.js").then((mod) => {
        if (cancelled) return;
        const first = mod.PEPTIDES[0];
        if (first) setSelPeptide(first);
      });
      return () => {
        cancelled = true;
      };
    }

    if (
      flowKey === "guide" &&
      highlightTarget != null &&
      highlightTarget !== TUTORIAL_TARGET.nav_library &&
      highlightTarget !== TUTORIAL_TARGET.atfeh_compound_cta &&
      selPeptide
    ) {
      setSelPeptide(null);
    }
    return undefined;
  }, [flowKey, highlightTarget, activeTab, selPeptide, setSelPeptide]);

  useLayoutEffect(() => {
    const el = topHeaderRef.current;
    if (!el || typeof document === "undefined") return;
    const root = document.documentElement;
    const writeHeight = () => {
      const h = Math.ceil(el.getBoundingClientRect().height || 0);
      if (h > 0) root.style.setProperty("--pepv-top-header-height", `${h}px`);
    };
    writeHeight();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", writeHeight);
      return () => window.removeEventListener("resize", writeHeight);
    }
    const ro = new ResizeObserver(writeHeight);
    ro.observe(el);
    window.addEventListener("resize", writeHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", writeHeight);
    };
  }, [activeTab, librarySearchOpen]);

  /**
   * Forced-tour fallback so the Vial Tracker tab always has a target for
   * `vial_add` / `vial_name` / `vial_mix_date` / `vial_mg` / `vial_reconstitute` /
   * `vial_desired_dose`, even when the reviewer has no injectable stack rows.
   * The ghost uses BPC-157 catalog metadata; saveVial is short-circuited inside
   * VialTracker via the `tutorialGhost` prop so no row is written to user_vials.
   */
  const tutorialGhostVialTracker =
    forced && user?.id && activeProfileId
      ? (() => {
          const stab = resolveStability(TUTORIAL_GHOST_BPC157);
          return (
            <VialTracker
              key="tutorial-ghost-vial"
              userId={user.id}
              profileId={activeProfileId}
              peptideId="bpc-157"
              catalogEntry={{
                ...TUTORIAL_GHOST_BPC157,
                name: "BPC-157",
                stabilityDays: typeof stab.stabilityDays === "number" ? stab.stabilityDays : 90,
                stabilityNote: stab.stabilityNote ?? null,
              }}
              canUse={canVialTracker}
              onUpgrade={openUpgradeModal}
              tutorialAnchorFirst
              tutorialGhost
            />
          );
        })()
      : null;

  return (
    <>
        <GlobalStyles />
        <div
          className="pepv-app-shell"
          style={{
            color: "var(--color-text-primary)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >

          <div
            ref={topHeaderRef}
            className="grid-bg"
            style={{
              borderBottom: "1px solid var(--color-border-hairline)",
              position: "relative",
              /* Stack above main scroll; keep in sync with NotificationsBell.jsx PEPV_TOP_HEADER_Z_INDEX */
              zIndex: 70,
            }}
          >
            <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingTop: "max(12px, env(safe-area-inset-top, 0px))",
                  flexWrap: "wrap",
                  gap: 8,
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <Logo />
                {activeTab === "library" && (
                  <LibraryMobileSearchIcon
                    open={librarySearchOpen}
                    onOpen={() => setLibrarySearchOpen(true)}
                  />
                )}
                <div style={{ flex: 1, minWidth: 8 }} aria-hidden />
                <div id="nav-account-anchor" className="pepv-nav-account-pill-row">
                  <TutorialHelpButton />
                  <button
                    type="button"
                    className="pepv-header-action-btn"
                    data-tutorial-target={TUTORIAL_TARGET.nav_guide}
                    data-active={activeTab === "guide" ? "true" : undefined}
                    {...tutorialHighlightProps(isHighlighted(TUTORIAL_TARGET.nav_guide))}
                    onClick={() => setActiveTab("guide")}
                  >
                    <span aria-hidden className="pepv-emoji" style={{ fontSize: 15, lineHeight: 1 }}>
                      🧙
                    </span>
                    {" "}AI Atfeh
                  </button>
                  <NotificationsBell userId={user.id} userGoals={activeProfile?.goals} />
                  <HamburgerMenu
                    user={user}
                    onOpenProfile={() => setActiveTab("profile")}
                    onOpenSettings={() => {
                      setActiveTab("profile");
                      window.setTimeout(() => {
                        try {
                          window.dispatchEvent(new CustomEvent("pepguide:open-settings"));
                        } catch {
                          /* ignore */
                        }
                      }, 0);
                    }}
                    onOpenFindPeople={() => setShowPeopleSearch(true)}
                    onOpenUpgrade={(reason) => openUpgradeModal(reason)}
                    onOpenGlossary={() => setGlossaryModalOpen(true)}
                    onOpenFAQ={() => setFaqModalOpen(true)}
                    onOpenAppHelp={() => setAppHelpOpen(true)}
                    onOpenTutorials={() => setHelpMenuOpen(true)}
                    onOpenSupport={() => setSupportModalOpen(true)}
                    onOpenLegal={() => {
                      try {
                        window.location.assign("/legal");
                      } catch {
                        /* ignore */
                      }
                    }}
                    onSignOut={handleSignOut}
                    navTabButtonRef={(el) => {
                      navTabButtonRefs.current.profile = el;
                    }}
                  />
                </div>
              {activeTab === "library" && librarySearchOpen && (
                <LibraryMobileSearchPanel
                  initialSearch={search}
                  onDismiss={dismissLibrarySearch}
                  setSearch={setSearch}
                  onPickCompound={(p) => setSelPeptide(p)}
                />
              )}
            </div>
          </div>
        </div>

        <div
          className="pepv-main-scroll"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "20px 16px 88px",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >

          {(activeTab === "library" || selPeptide != null || showAdd) && (
            <React.Suspense
              fallback={
                <div className="mono" style={{ padding: 24, color: "var(--color-text-placeholder)" }}>
                  Loading library…
                </div>
              }
            >
              <LibraryTab
                showLibraryGrid={activeTab === "library"}
                selCat={selCat}
                onCategorySelect={onCategorySelect}
                routeFilter={routeFilter}
                setRouteFilter={setRouteFilter}
                sortMode={sortMode}
                setSortMode={setSortMode}
                search={search}
                selPeptide={selPeptide}
                setSelPeptide={setSelPeptide}
                showAdd={showAdd}
                setShowAdd={setShowAdd}
                addTarget={addTarget}
                setAddTarget={setAddTarget}
                openAdd={openAdd}
                confirmAdd={confirmAdd}
                myStack={myStack}
                stackListReady={stackListReady}
                openUpgradeModal={openUpgradeModal}
                canAI={canAI}
                setActiveTab={setActiveTab}
                setAiInput={setAiInput}
                variantNoteExpandedById={variantNoteExpandedById}
                setVariantNoteExpandedById={setVariantNoteExpandedById}
                isHighlighted={isHighlighted}
              />
            </React.Suspense>
          )}

          {activeTab === "stack" && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div
                      className="brand"
                      style={{ fontSize:17,fontWeight:700 }}
                      title="A Saved Stack is a named peptide protocol you can build, save, and revisit."
                    >
                      SAVED STACKS
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 13,color:"var(--color-text-placeholder)",marginTop:2,maxWidth:520 }}
                      title="A Saved Stack is a named peptide protocol you can build, save, and revisit."
                    >
                      {myStack.length} peptide{myStack.length !== 1 ? "s" : ""} saved
                      {Number.isFinite(savedStackLimit)
                        ? ` Â· ${Math.max(0, savedStackLimit - myStack.length)} of ${savedStackLimit} Saved Stacks remaining`
                        : " Â· Unlimited Saved Stacks"}
                    </div>
                  </div>
                  <button type="button" className="btn-teal" onClick={() => setActiveTab("library")}>+ Browse Library</button>
                </div>
                <div style={{ marginTop: 14 }}>
                  <StackPhotoUpload
                    stackPhotoUrl={user?.stackPhotoUrl ?? null}
                    stackPhotoKey={user?.stackPhotoKey ?? null}
                    canUpload={canUploadStackPhoto}
                    workerConfigured={isApiWorkerConfigured()}
                    onUpgrade={openUpgradeModal}
                    onUploaded={async () => {
                      const u = await getCurrentUser();
                      if (u) setUser(u);
                    }}
                  />
                </div>
                {user?.id && (
                  <StackProfileShots userId={user.id} canUse={canVialTracker} onUpgrade={openUpgradeModal} />
                )}
              </div>
              {myStack.length === 0 ? (
                <div style={{ border:"1px dashed var(--color-border-default)",borderRadius:10,padding:"80px 0",textAlign:"center" }}>
                  <div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>â¬¡</div>
                  <div className="mono" style={{ color:"var(--color-text-placeholder)",fontSize: 13 }}>No Saved Stacks yet. Add compounds from the Library.</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <div style={{ marginBottom:4,display:"flex",flexWrap:"wrap",alignItems:"flex-end",gap:14 }}>
                    <div style={{ flex:"1 1 220px",minWidth:0 }}>
                      <div className="mono" style={{ fontSize: 13,color:"var(--color-accent)",marginBottom:6,letterSpacing:".12em" }}>STACK NAME</div>
                      <SavedStackNameInput initialName={stackName} onCommit={setStackName} />
                    </div>
                    {user?.id && activeProfileId && (
                      <StackShareControls
                        userId={user.id}
                        profileId={activeProfileId}
                        stackId={stackRowId}
                        stackName={stackName}
                        initialShareId={stackShareId}
                        onShareIdChange={setStackShareId}
                        feedVisible={stackFeedVisible}
                        onFeedVisibleChange={setStackFeedVisible}
                        disabled={!isSupabaseConfigured() || !stackRowId}
                      />
                    )}
                  </div>
                  {user?.id && activeProfileId && (
                    <StackProtocolQuickLog
                      userId={user.id}
                      profileId={activeProfileId}
                      protocolRows={protocolRows}
                      canUse={canVialTracker}
                      onUpgrade={openUpgradeModal}
                      userPlan={planForStackLimits}
                      wakeTime={activeProfile?.wake_time ?? null}
                      shiftSchedule={activeProfile?.shift_schedule ?? null}
                    />
                  )}
                  {myStack.map((p) => (
                    <div key={getStackRowListKey(p)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      <SavedStackEntryRow
                        item={p}
                        catColor={getCatColor(primaryCategory(p))}
                        catLabel={primaryCategory(p)}
                        onUpdate={updateStackItem}
                        onRemove={removeFromStack}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop:12,background:"var(--color-bg-sunken)",border:"1px solid var(--color-border-default)",borderRadius:8,padding:14 }}>
                    <div className="mono" style={{ fontSize: 13,color:"var(--color-accent)",letterSpacing:".15em",marginBottom:10 }}>SAVED STACK BREAKDOWN</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {[...new Set(myStack.map((p) => primaryCategory(p)))].map((cat) => {
                        const n = myStack.filter((p) => primaryCategory(p) === cat).length;
                        return (
                          <span
                            key={cat}
                            className="pill pill--category"
                            style={{ ...getCategoryCssVars(cat), fontSize: 13, padding: "4px 10px" }}
                          >
                            {cat}: {n}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="btn-teal"
                      style={{
                        fontSize: 13,
                        color: "var(--color-accent)",
                        background: "var(--color-accent-subtle-10)",
                        border: "1px solid var(--color-accent)",
                      }}
                      onClick={() => {
                        const summary = myStack
                          .map((p) => {
                            const dose = p.stackDose || p.startDose || "";
                            const freq = p.stackFrequency ? ` ${p.stackFrequency}` : "";
                            const note = p.stackNotes ? ` â€” ${p.stackNotes}` : "";
                            return `${p.name} (${dose}${freq})${note}`;
                          })
                          .join("; ");
                        const title = stackName ? `â€œ${stackName}â€: ` : "";
                        setAiInput(`Analyze my current stack and give me optimization recommendations, timing protocols, and safety considerations: ${title}${summary}`);
                        setActiveTab("guide");
                      }}>
                      Analyze with AI â†’
                    </button>
                    <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-text-secondary)" }}>
                      <span style={{ color: "var(--color-warning)" }}>âš  </span>Review injection schedules for timing conflicts. Consult your physician.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "stackBuilder" && (
            <React.Suspense
              fallback={
                <div className="mono" style={{ padding: 24, color: "var(--color-text-placeholder)" }}>
                  Loading stack builder…
                </div>
              }
            >
              <BuildTab
                activeTab={activeTab}
                myStack={myStack}
              stackName={stackName}
              setStackName={setStackName}
              setMyStack={setMyStack}
              rows={buildRows}
              setRows={setBuildRows}
              localName={buildLocalStackName}
              setLocalName={setBuildLocalStackName}
              vialOverrides={buildVialOverrides}
              setVialOverrides={setBuildVialOverrides}
              cycleWeeks={buildCycleWeeks}
              setCycleWeeks={setBuildCycleWeeks}
              savedStackLimit={savedStackLimit}
              stackListReady={stackListReady}
              onUpgrade={() => openUpgradeModal("stack_full")}
              primaryCategory={primaryCategory}
              user={user}
              plan={planForStackLimits}
            />
            </React.Suspense>
          )}

          {activeTab === "vialTracker" && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <div className="brand" style={{ fontSize: 17, fontWeight: 700 }}>
                  VIAL INVENTORY
                </div>
                <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginTop: 4, maxWidth: 520, lineHeight: 1.45 }}>
                  Physical vials only (injectables). Log doses from Protocol or Stacks. Oral / nasal / topical compounds do not appear here.
                </div>
              </div>
              {myStack.length === 0 ? (
                tutorialGhostVialTracker ?? (
                  <div style={{ border: "1px dashed var(--color-border-default)", borderRadius: 10, padding: "60px 0", textAlign: "center" }}>
                    <div className="mono" style={{ color: "var(--color-text-placeholder)", fontSize: 13 }}>
                      Save injectable compounds to your stack first, then manage them in Vial Tracker.
                    </div>
                  </div>
                )
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(() => {
                    const injectableRows = myStack.filter((p) => {
                      const catalogPeptide = findCatalogPeptideForStackRow(p, []);
                      const stab = resolveStability(catalogPeptide ?? p);
                      return hasInjectableRoute(catalogPeptide ?? p) && stab.stabilityDays != null;
                    });
                    if (injectableRows.length === 0) {
                      return (
                        tutorialGhostVialTracker ?? (
                          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                            No injectable compounds with vial tracking in your stack â€” add one from the Library or open Stacks to build your protocol.
                          </div>
                        )
                      );
                    }
                    if (!user?.id || !activeProfileId) return null;
                    return (
                      <>
                        {injectableRows.map((p, vialIdx) => {
                          const catalogPeptide = findCatalogPeptideForStackRow(p, []);
                          const stab = resolveStability(catalogPeptide ?? p);
                          return (
                            <VialTracker
                              key={`${getStackRowListKey(p)}-${vialReloadKey}`}
                              userId={user.id}
                              profileId={activeProfileId}
                              peptideId={p.id}
                              catalogEntry={
                                catalogPeptide
                                  ? {
                                      ...catalogPeptide,
                                      stabilityDays: stab.stabilityDays,
                                      stabilityNote: stab.stabilityNote,
                                    }
                                  : {
                                      name: p.name,
                                      stabilityDays: stab.stabilityDays,
                                      stabilityNote: stab.stabilityNote,
                                    }
                              }
                              canUse={canVialTracker}
                              onUpgrade={openUpgradeModal}
                              tutorialAnchorFirst={vialIdx === 0}
                            />
                          );
                        })}
                        <button
                          type="button"
                          className="btn-teal"
                          disabled={archivedCount === 0}
                          onClick={() => setArchivedModalOpen(true)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 13,
                            minHeight: 44,
                            alignSelf: "flex-start",
                          }}
                        >
                          Archived Vials ({archivedCount})
                          {archivedCount === 0 ? " â€” none yet" : ""}
                        </button>
                        <ArchivedVialsModal
                          isOpen={archivedModalOpen}
                          onClose={() => setArchivedModalOpen(false)}
                          userId={user.id}
                          profileId={activeProfileId}
                          onChanged={() => {
                            setVialReloadKey((k) => k + 1);
                            void refreshArchivedCount();
                          }}
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === "network" && (
            <NetworkTab
              userId={user?.id}
              scrollToDosePostId={networkScrollToDosePostId}
              onConsumedDosePostScrollTarget={() => setNetworkScrollToDosePostId(null)}
            />
          )}

          {activeTab === "protocol" && user?.id && activeProfileId && protocolDeepLink && (
            <ProtocolTab
              key={protocolDeepLink}
              userId={user.id}
              profileId={activeProfileId}
              protocolBaseRows={protocolBaseRows}
              canUse={canVialTracker}
              onUpgrade={openUpgradeModal}
              initialSession={protocolDeepLink}
              wakeTime={activeProfile?.wake_time ?? null}
              shiftSchedule={activeProfile?.shift_schedule ?? null}
              onDeepLinkConsumed={() => {}}
              onLoggedNavigateLibrary={() => setActiveTab("library")}
              userPlan={planForStackLimits}
              tutorialGhost={forced && protocolRows.length === 0}
            />
          )}

          {activeTab === "profile" && user?.id && (
            <div className="pepv-profile-route">
              <ProfileTab
                user={user}
                setUser={setUser}
                onOpenUpgrade={openUpgradeModal}
                onSignOut={handleSignOut}
                canUseProgressPhotos={canVialTracker}
                savedStackPeptides={myStack.map((p) => ({
                  id: p.id,
                  name: p.name,
                  stackDose: typeof p.stackDose === "string" ? p.stackDose : "",
                  stackFrequency: typeof p.stackFrequency === "string" ? p.stackFrequency : "",
                }))}
                onGuideDeepAnalysisToGuide={(prompt) => {
                  const t = typeof prompt === "string" ? prompt : "";
                  setActiveTab("guide");
                  if (t) setAiInput(t);
                }}
              />
              <div
                style={{
                  maxWidth: 640,
                  margin: "0 auto",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "28px 0 40px",
                  borderTop: "1px solid var(--color-surface-hover)",
                }}
              >
                <button
                  type="button"
                  className="mono"
                  onClick={() => void handleSignOut()}
                  aria-label="Sign out of your account"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: 280,
                    margin: "0 auto",
                    padding: "10px 14px",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    color: "var(--color-text-secondary)",
                    background: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {(activeTab === "guide" || guideExiting) && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="AI Atfeh"
            className={`guide-takeover-root${guideExiting ? " guide-takeover-root--exit" : ""}`}
            style={{ zIndex: 72 }}
            onClick={onGuideTakeoverRootClick}
            onAnimationEnd={handleGuideTakeoverAnimationEnd}
          >
            <CloseButton
              className="guide-takeover-close"
              ariaLabel="Close AI Atfeh"
              style={{ zIndex: 72 }}
              stopPropagationOnClick
              onClose={beginCloseGuide}
            />
            <div className="guide-takeover-panel-wrap" onClick={(e) => e.stopPropagation()}>
              <AtfehThreadSidebar
                workerUrl={API_WORKER_URL}
                accessToken={cachedAccessToken}
                profileId={activeProfileId}
                plan={planForStackLimits}
                activeThreadId={activeThreadId}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                onUpgrade={openUpgradeModal}
                refreshKey={threadListVersion}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
              />

              <div
                className="guide-takeover-chat-panel"
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--color-bg-page)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 10,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border-hairline)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    flexShrink: 0,
                  }}
                >
                  {guideLayoutMobile && (
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        color: "var(--color-accent)",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: "pointer",
                        minHeight: 32,
                        flexShrink: 0,
                      }}
                      aria-label="Open threads sidebar"
                    >
                      â˜°
                    </button>
                  )}
                  <div
                    className={aiLoading ? "pulse" : ""}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: aiLoading ? "var(--color-warning)" : "var(--color-accent)",
                      flexShrink: 0,
                    }}
                  />
                  <div className="brand" style={{ fontSize: 15, color: "var(--color-text-secondary)", letterSpacing: ".1em", fontWeight: 700 }}>
                    <span style={{ color: "var(--color-accent)" }}>Pep</span>Guide<span style={{ color: "var(--color-accent)" }}>IQ</span>
                    <span style={{ color: "var(--color-text-placeholder)", fontWeight: 400, fontSize: 12, letterSpacing: ".15em", marginLeft: 8 }}>INTELLIGENCE</span>
                  </div>
                  {goals.length > 0 && (
                    <span className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)" }}>
                      {goals.length} goal{goals.length > 1 ? "s" : ""} active
                    </span>
                  )}
                  {!canAI && (
                    <span
                      className="pill"
                      style={{
                        background: "#f59e0b15",
                        color: "var(--color-warning)",
                        border: "1px solid #f59e0b30",
                        fontSize: 13,
                        marginLeft: "auto",
                      }}
                    >
                      Upgrade to unlock AI
                    </span>
                  )}
                </div>

                <div className="guide-mobile-goals-dropdown">
                    <button
                      type="button"
                      className="guide-mobile-goals-toggle"
                      aria-expanded={goalsOpen}
                      aria-controls="guide-mobile-goals-panel"
                      id="guide-mobile-goals-toggle"
                      onClick={() => setGoalsOpen((o) => !o)}
                    >
                      <span className="pepv-emoji" aria-hidden>
                        ðŸŽ¯{" "}
                      </span>
                      Goals
                      {goals.length > 0 ? (
                        <span className="mono" style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>
                          {" "}
                          ({goals.length})
                        </span>
                      ) : null}
                      <span className="mono" style={{ marginLeft: "auto", color: "var(--color-text-secondary)", fontSize: 11 }}>
                        {goalsOpen ? "â–²" : "â–¼"}
                      </span>
                    </button>
                    {goalsOpen && (
                      <div className="guide-mobile-goals-panel" id="guide-mobile-goals-panel" role="region" aria-labelledby="guide-mobile-goals-toggle">
                        <div className="guide-mobile-goals-row">
                          {GOALS.map((g) => (
                            <button
                              type="button"
                              key={g}
                              className={`goal-chip guide-mobile-goal-pill ${goals.includes(g) ? "on" : ""}`}
                              onClick={() => toggleGuideGoal(g)}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        {myStack.length > 0 && (
                          <div style={{ padding: "0 10px 8px", borderTop: "1px solid var(--color-border-default)" }}>
                            <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", letterSpacing: ".12em", margin: "6px 0 4px" }}>
                              SAVED STACK
                            </div>
                            {myStack.map((p) => (
                              <div key={getStackRowListKey(p)} className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "2px 0" }}>
                                â†’ {p.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                <div
                  className="guide-takeover-msgs"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 14,
                    "--color-text-primary": "var(--color-text-primary)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {threadMessages.length === 0 && !threadLoading && (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <img
                        src="/app-icon.png"
                        alt=""
                        aria-hidden="true"
                        style={{
                          width: 64,
                          height: 64,
                          marginBottom: 12,
                          opacity: 0.75,
                          filter: "drop-shadow(0 0 12px color-mix(in srgb, var(--color-accent) 40%, transparent))",
                          borderRadius: 16,
                        }}
                      />
                      <div className="mono" style={{ color: "var(--color-text-placeholder)", fontSize: 13, marginBottom: 18 }}>
                        Optional: open ðŸŽ¯ Goals, then ask anything.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, maxWidth: 360, margin: "0 auto" }}>
                        {[
                          "Build me a longevity stack from scratch",
                          "Best sleep peptide protocol and timing?",
                          "How do I stack Semax and Selank safely?",
                          "Explain SS-31's mechanism of action",
                          "What's the mitochondrial trinity protocol?",
                        ].map((s) => (
                          <button
                            type="button"
                            key={s}
                            className="sugg-btn"
                            onClick={() => (canAI ? sendAtfehMessage(s) : openUpgradeModal("ai_guide"))}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {threadLoading && threadMessages.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <div className="mono pulse" style={{ fontSize: 13, color: "var(--color-accent)" }}>
                        Loading threadâ€¦
                      </div>
                    </div>
                  )}
                  {threadMessages.map((msg, i) => (
                    <div key={i} className={`ai-msg ${msg.role === "user" ? "ai-user" : "ai-bot"}`}>
                      {msg.role === "assistant" && (
                        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".15em" }}>
                          <span style={{ color: "var(--color-accent)" }}>Pep</span>GuideIQ
                        </div>
                      )}
                      {msg.role === "user" ? (
                        <div style={{ whiteSpace: "pre-wrap", color: "var(--color-text-primary)" }}>{msg.content}</div>
                      ) : (
                        <div style={{ color: "var(--color-text-secondary)" }}>
                          <ReactMarkdown components={AI_GUIDE_MARKDOWN_COMPONENTS}>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                      {msg.role === "assistant" && msg.limitReached && (
                        <button
                          type="button"
                          className="btn-teal"
                          onClick={() => openUpgradeModal("ai_guide")}
                          style={{ marginTop: 10, fontSize: 13, padding: "6px 12px" }}
                        >
                          Upgrade for more queries
                        </button>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-msg ai-bot">
                      <div className="mono pulse" style={{ fontSize: 13, color: "var(--color-accent)" }}>
                        Analyzing protocol dataâ€¦
                      </div>
                    </div>
                  )}
                  <div ref={msgEnd} />
                </div>

                <div className="guide-takeover-input-bar">
                  {threadError && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-danger, #ef4444)",
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "rgba(239,68,68,0.08)",
                        marginBottom: 6,
                      }}
                    >
                      {threadError}
                    </div>
                  )}
                  {threadLocked ? (
                    <div
                      style={{
                        background: "var(--color-bg-card, #0e1520)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 8,
                        padding: 14,
                        textAlign: "center",
                      }}
                    >
                      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                        This thread is full (10 messages).
                      </div>
                      <button
                        type="button"
                        className="btn-teal"
                        onClick={handleContinueThread}
                        disabled={aiLoading}
                        style={{ fontSize: 13, padding: "8px 16px" }}
                      >
                        {aiLoading ? "Creatingâ€¦" : "Continue Thread â†’"}
                      </button>
                      <div style={{ fontSize: 11, color: "var(--color-text-placeholder)", marginTop: 6 }}>
                        A new thread will be started with a summary of this one.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <textarea
                        className="ai-input"
                        rows={2}
                        placeholder="Ask about dosing, protocols, stacking, mechanisms, cyclingâ€¦"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendAtfehMessage(aiInput);
                            setAiInput("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-teal"
                        onClick={() => { sendAtfehMessage(aiInput); setAiInput(""); }}
                        disabled={aiLoading || !aiInput.trim()}
                        style={{ padding: "0 18px", alignSelf: "stretch", fontSize: 16 }}
                      >
                        {aiLoading ? "â€¦" : "â†’"}
                      </button>
                    </div>
                  )}
                  {canAI && aiQueryUsage != null && (
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right", marginTop: 4 }}>
                      {aiQueryUsage.today} of {aiQueryUsage.limit} queries used today
                      {aiQueryUsage.today >= aiQueryUsage.limit && (
                        <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "var(--color-warning)", fontWeight: 700 }}>Â· Limit reached</span>
                          <button
                            type="button"
                            onClick={() => openUpgradeModal("ai_guide")}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: "var(--color-accent)",
                              fontWeight: 600,
                              fontSize: "inherit",
                              textDecoration: "underline",
                              lineHeight: "inherit",
                            }}
                          >
                            Upgrade for more
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showUpgrade && (
          <UpgradePlanModal
            onClose={closeUpgradeModal}
            user={user}
            upgradeFocusTier={upgradeFocusTier}
            setUser={setUser}
            gateReason={upgradeGateReason}
            planKey={planForStackLimits}
          />
        )}

        {glossaryModalOpen ? <GlossaryModal onClose={() => setGlossaryModalOpen(false)} /> : null}
        {faqModalOpen ? <FAQModal onClose={() => setFaqModalOpen(false)} /> : null}
        <SupportModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
        <AppHelpModal isOpen={appHelpOpen} onClose={() => setAppHelpOpen(false)} />

        {user?.id && activeProfileId && activeTab !== "guide" && !guideExiting && (
          <DoseLogFAB
            onSessionPicked={(sid) => {
              setProtocolDeepLink(sid);
              setActiveTab("protocol");
            }}
          />
        )}

        <nav
          aria-label="Main"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--color-bg-page)",
            borderTop: "1px solid var(--color-border-hairline)",
            padding: "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -8px 24px color-mix(in srgb, var(--color-accent) 6%, transparent)",
          }}
        >
          <div
            className="pepv-bottom-nav-tabs"
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <button
              type="button"
              aria-label={`Library, ${CATALOG_COUNT} compounds`}
              data-tutorial-target={TUTORIAL_TARGET.nav_library}
              {...tutorialHighlightProps(isHighlighted(TUTORIAL_TARGET.nav_library))}
              ref={(el) => {
                navTabButtonRefs.current.library = el;
              }}
              onClick={() => setActiveTab("library")}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                minHeight: 44,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "6px 4px",
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                border: libraryNavActive ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-tab)",
                background: libraryNavActive ? "var(--color-accent-nav-fill)" : "var(--color-nav-tab-inactive-bg)",
                boxShadow: libraryNavActive ? "0 0 0 1px var(--color-accent-nav-ring)" : "none",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  lineHeight: 1,
                  letterSpacing: "0.03em",
                  color: libraryNavActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontWeight: 500,
                }}
                aria-hidden
              >
                {CATALOG_COUNT}
              </span>
              <span
                className="pepv-emoji"
                style={{ fontSize: 18, lineHeight: 1, opacity: libraryNavActive ? 1 : 0.72 }}
                aria-hidden
              >
                ðŸ§¬
              </span>
              <span
                className="pepv-bottom-nav-label"
                style={{
                  fontSize: 13,
                  lineHeight: 1.15,
                  letterSpacing: "0.06em",
                  color: libraryNavActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                LIBRARY
              </span>
            </button>
            {[
              {
                tabId: "vialTracker",
                emoji: "ðŸ§ª",
                labelTop: "VIAL",
                label: "TRACKER",
                ariaLabel: "Vial Tracker",
                tutorialTarget: TUTORIAL_TARGET.nav_vials,
                isActive: activeTab === "vialTracker",
                onClick: () => setActiveTab("vialTracker"),
              },
              {
                tabId: "stackBuilder",
                emoji: "ðŸ—ï¸",
                labelTop: "STACK",
                label: "BUILDER",
                ariaLabel: "Stack Builder",
                tutorialTarget: TUTORIAL_TARGET.nav_build,
                isActive: activeTab === "stackBuilder",
                onClick: () => setActiveTab("stackBuilder"),
              },
              {
                tabId: "stacks",
                emoji: "ðŸ“‹",
                labelTop: "SAVED",
                label: "STACKS",
                ariaLabel: "Stacks",
                tutorialTarget: TUTORIAL_TARGET.nav_stacks,
                isActive: activeTab === "stack",
                onClick: () => setActiveTab("stack"),
              },
              {
                tabId: "network",
                emoji: NETWORK_TAB_EMOJI,
                labelTop: "PEPGUIDE",
                label: "NETWORK",
                ariaLabel: "Network",
                tutorialTarget: TUTORIAL_TARGET.nav_network,
                isActive: activeTab === "network",
                onClick: () => setActiveTab("network"),
              },
            ].map((item) => (
              <button
                key={item.tabId}
                type="button"
                aria-label={item.ariaLabel}
                data-tutorial-target={item.tutorialTarget}
                {...tutorialHighlightProps(isHighlighted(item.tutorialTarget))}
                ref={(el) => {
                  navTabButtonRefs.current[item.tabId] = el;
                }}
                onClick={item.onClick}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  minHeight: 44,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  padding: "6px 4px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  border: item.isActive ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-tab)",
                  background: item.isActive ? "var(--color-accent-nav-fill)" : "var(--color-nav-tab-inactive-bg)",
                  boxShadow: item.isActive ? "0 0 0 1px var(--color-accent-nav-ring)" : "none",
                }}
              >
                {item.labelTop ? (
                  <span
                    className="mono pepv-bottom-nav-label"
                    style={{
                      fontSize: 10,
                      lineHeight: 1,
                      letterSpacing: "0.03em",
                      fontWeight: 500,
                      margin: 0,
                      padding: 0,
                      color: item.isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                    aria-hidden
                  >
                    {item.labelTop}
                  </span>
                ) : null}
                <span
                  className="pepv-emoji"
                  style={{ fontSize: 18, lineHeight: 1, opacity: item.isActive ? 1 : 0.72 }}
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <span
                  className="pepv-bottom-nav-label"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.15,
                    letterSpacing: "0.06em",
                    color: item.isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {showHandlePrompt && (
          <Modal onClose={dismissHandlePrompt} maxWidth={440} label="Set your public handle">
            <div style={{ color: "var(--color-text-primary)", fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>
              Choose a unique public handle (shown as <span className="mono">@username</span>). It helps identify your profile
              across the app.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 14, flex: "1 1 140px" }}
                onClick={() => {
                  dismissHandlePrompt();
                  setActiveTab("profile");
                }}
              >
                Open Profile
              </button>
              <button
                type="button"
                className="form-input"
                style={{
                  fontSize: 14,
                  cursor: "pointer",
                  flex: "1 1 140px",
                  border: "1px solid var(--color-border-emphasis)",
                  background: "var(--color-bg-hover)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={dismissHandlePrompt}
              >
                Later
              </button>
            </div>
          </Modal>
        )}

        <div style={{ paddingBottom: stripVisible ? 168 : 72 }}>
          <LegalDisclaimer />
        </div>

      </div>

      {postTutorialModalOpen && activeProfileId ? (
        <PostTutorialProfileModal
          open={postTutorialModalOpen}
          onSkip={finishPostTutorialFlow}
          onComplete={finishPostTutorialFlow}
          activeProfile={activeProfile}
          activeProfileId={activeProfileId}
          patchMemberProfileLocal={patchMemberProfileLocal}
          refreshMemberProfiles={refreshMemberProfiles}
        />
      ) : null}
    </>
  );
}

function getNormalizedPathname() {
  if (typeof window === "undefined") return "/";
  return (window.location.pathname || "/").replace(/\/$/, "") || "/";
}

export default function PepGuideIQ() {
  const [legalRoute, setLegalRoute] = useState(() => getNormalizedPathname() === "/legal");
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [user, setUser] = useState(null);
  const [ageVerified, setAgeVerified] = useState(readAgeVerifiedFromStorage);
  /** Ensures Rewardful checkout conversion fires at most once per successful `?checkout=success` return. */
  const rewardfulCheckoutConvertRef = useRef(false);

  const confirmAgeVerified = useCallback(() => {
    setAgeVerified(true);
  }, []);

  const exitUnderAge = useCallback(() => {
    window.location.href = "https://www.google.com";
  }, []);

  useEffect(() => {
    const onPop = () => setLegalRoute(getNormalizedPathname() === "/legal");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!ageVerified && !legalRoute) {
      setAuthReady(!isSupabaseConfigured());
      return;
    }
    if (!isSupabaseConfigured()) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ex = await exchangeSupabaseAuthCodeFromUrlIfNeeded();
        if (ex.error && import.meta.env.DEV) {
          console.warn("[auth] exchangeCodeForSession:", ex.error.message);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[auth] exchangeCodeForSession threw", e);
      }
      if (cancelled) return;
      let checkoutSuccess = false;
      try {
        const params = new URLSearchParams(window.location.search);
        checkoutSuccess = params.get("checkout") === "success";
      } catch {
        /* ignore */
      }
      const u = checkoutSuccess
        ? await getCurrentUserFreshAfterCheckout()
        : await getCurrentUser();
      if (!cancelled && u) setUser(u);
      if (
        !cancelled &&
        checkoutSuccess &&
        u?.email &&
        typeof window !== "undefined" &&
        typeof window.rewardful === "function" &&
        !rewardfulCheckoutConvertRef.current
      ) {
        rewardfulCheckoutConvertRef.current = true;
        window.rewardful("convert", { email: u.email });
      }
      if (!cancelled) setAuthReady(true);
      if (!cancelled && checkoutSuccess) {
        try {
          const params = new URLSearchParams(window.location.search);
          params.delete("checkout");
          const qs = params.toString();
          const path = window.location.pathname || "/";
          const hash = window.location.hash || "";
          window.history.replaceState({}, "", `${path}${qs ? `?${qs}` : ""}${hash}`);
        } catch {
          /* ignore */
        }
      }
    })();
    const {
      data: { subscription },
    } = onAuthStateChange(async () => {
      const u = await getCurrentUser();
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [ageVerified, legalRoute]);

  const tree =
    legalRoute ? (
      <>
        <GlobalStyles />
        <LegalPage />
      </>
    ) : !ageVerified ? (
      <>
        <GlobalStyles />
        <AgeGate onConfirm={confirmAgeVerified} onExit={exitUnderAge} />
      </>
    ) : !authReady ? (
      <>
        <GlobalStyles />
        <div
          className="mono"
          style={{
            minHeight: "100vh",
            background: "var(--color-bg-page)",
            color: "var(--color-text-placeholder)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          Loading sessionâ€¦
        </div>
      </>
    ) : !user ? (
      <>
        <GlobalStyles />
        <AuthScreen onAuth={setUser} />
      </>
    ) : (
      <ProfileProvider userId={user.id} plan={user.plan ?? "entry"}>
        <PepGuideIQApp user={user} setUser={setUser} />
      </ProfileProvider>
    );

  return <ThemeProvider user={user}>{tree}</ThemeProvider>;
}
