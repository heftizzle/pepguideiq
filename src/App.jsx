import { useState, useEffect, useMemo, useRef } from "react";
import { PEPTIDES, CATEGORIES, GOALS, CAT_COLORS } from "./data/catalog.js";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import { Logo } from "./components/Logo.jsx";
import { Modal } from "./components/Modal.jsx";
import { AddToStackForm } from "./components/AddToStackForm.jsx";
import { SavedStackEntryRow, getStackRowListKey, normalizeStackSessions } from "./components/SavedStackEntryRow.jsx";
import { ProtocolTab } from "./components/ProtocolTab.jsx";
import { SavedStackNameInput } from "./components/SavedStackNameInput.jsx";
import { UpgradePlanModal } from "./components/UpgradePlanModal.jsx";
import { StackPhotoUpload } from "./components/StackPhotoUpload.jsx";
import { VialTracker } from "./components/VialTracker.jsx";
import { StackProtocolQuickLog } from "./components/StackProtocolQuickLog.jsx";
import { StackShareControls } from "./components/StackShareControls.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { ProfileSwitcher } from "./components/ProfileSwitcher.jsx";
import { LegalDisclaimer } from "./components/LegalDisclaimer.jsx";
import { ProfileProvider, useActiveProfile } from "./context/ProfileContext.jsx";
import { getNextTierId, getTier, hasAccess } from "./lib/tiers.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./lib/config.js";
import { resolveStability } from "./lib/catalogStability.js";
import {
  getCurrentUser,
  getSessionAccessToken,
  loadStack,
  onAuthStateChange,
  saveStack,
  signOut,
} from "./lib/supabase.js";
import { useMemberAvatarSrc } from "./hooks/useMemberAvatarSrc.js";

const getCatColor = (cat) => CAT_COLORS[cat] || "#00d4aa";

/** Parent row for a variant (`variantOf` id), if present in the catalog. */
function getVariantParent(peptide) {
  if (!peptide?.variantOf) return null;
  return PEPTIDES.find((q) => q.id === peptide.variantOf) ?? null;
}

/** All catalog categories for a row (multi-label imports use `categories[]`; core rows use string `category`). */
function peptideCategories(p) {
  if (Array.isArray(p.categories) && p.categories.length) return p.categories;
  if (Array.isArray(p.category)) return p.category;
  if (typeof p.category === "string" && p.category) return [p.category];
  return [];
}

function primaryCategory(p) {
  return peptideCategories(p)[0] ?? "";
}

/** Route-of-administration filter keys; one active at a time, stacks with category + search. */
const ROUTE_FILTERS = [
  { id: "injectable", label: "💉 Injectable" },
  { id: "intranasal", label: "👃 Intranasal" },
  { id: "oral", label: "💊 Oral" },
  { id: "topical", label: "🧴 Topical" },
];

function peptideMatchesRouteFilter(p, routeKey) {
  if (!routeKey) return true;
  const parts = Array.isArray(p.route) ? p.route.map((x) => String(x).toLowerCase()) : [];
  const s = parts.join(" | ");
  switch (routeKey) {
    case "injectable":
      return (
        /subq|subcutaneous|intramuscular|injection|injectable|iv infusion|intravenous/.test(s) ||
        /\biv\b/.test(s) ||
        /(^|[\s,/])im([\s,/]|$)/.test(s)
      );
    case "intranasal":
      return /intranasal|nasal|nasal spray/.test(s);
    case "oral":
      return /\boral\b|tablet|capsule/.test(s);
    case "topical":
      return /topical|cream|serum|transdermal/.test(s);
    default:
      return true;
  }
}

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "category", label: "Category" },
];

/** Library filter pills — chrome matches bottom nav buttons (App.jsx nav: inactive / active). */
const LIBRARY_FILTER_PILL_BASE = {
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  borderRadius: 12,
  border: "1px solid #1e2a38",
  background: "rgba(255, 255, 255, 0.03)",
  boxShadow: "none",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
  letterSpacing: "0.06em",
  lineHeight: 1.15,
  color: "#ffffff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
};

const LIBRARY_FILTER_PILL_ACTIVE = {
  border: "1px solid rgba(0, 212, 170, 0.55)",
  background: "rgba(0, 212, 170, 0.14)",
  boxShadow: "0 0 0 1px rgba(0, 212, 170, 0.12)",
  color: "#00d4aa",
};

/** Top-right header: member profile avatar initial (no image). */
function headerMemberAvatarInitial(displayName) {
  const s = String(displayName || "").trim();
  return s ? s[0].toUpperCase() : "?";
}

const HEADER_ACCOUNT_PILL_BASE = {
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid #1e2a38",
  background: "rgba(255, 255, 255, 0.03)",
  boxShadow: "none",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
  letterSpacing: "0.06em",
  lineHeight: 1.15,
  flexShrink: 0,
  boxSizing: "border-box",
};

function tierHeaderPill(plan) {
  switch (plan) {
    case "goat":
      return {
        emoji: "🐐",
        label: "GOAT",
        background: "#a855f720",
        color: "#a855f7",
        border: "1px solid #a855f730",
      };
    case "elite":
      return {
        emoji: "⚡",
        label: "ELITE",
        background: "#f59e0b20",
        color: "#f59e0b",
        border: "1px solid #f59e0b30",
      };
    case "pro":
      return {
        emoji: "🔬",
        label: "PRO",
        background: "#00d4aa20",
        color: "#00d4aa",
        border: "1px solid #00d4aa30",
      };
    default:
      return {
        emoji: "💸",
        label: "FREE",
        background: "#14202e",
        color: "#4a6080",
        border: "1px solid #243040",
      };
  }
}

function PepGuideIQApp({ user, setUser }) {
  const { activeProfileId, activeProfile, memberProfilesVersion } = useActiveProfile();
  const [activeTab, setActiveTab] = useState("library");
  const [selCat, setSelCat]       = useState("All");
  const [routeFilter, setRouteFilter] = useState(null);
  const [sortMode, setSortMode]   = useState("default");
  const [search, setSearch]       = useState("");
  const [selPeptide, setSelPeptide] = useState(null);
  const [myStack, setMyStack]     = useState([]);
  const [stackName, setStackName] = useState("");
  const [stackShareId, setStackShareId] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const [aiMsgs, setAiMsgs]       = useState([]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  /** From Worker POST /v1/chat success: `usage.queries_today` / `queries_limit`. */
  const [aiQueryUsage, setAiQueryUsage] = useState(null);
  const [goals, setGoals]         = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  /** Which paid tier row to emphasize when the modal opens (next tier above current). */
  const [upgradeFocusTier, setUpgradeFocusTier] = useState(null);
  /** Library `.pcard` variant-line: inline expand for variantNote (tap toggles; id → open). */
  const [variantNoteExpandedById, setVariantNoteExpandedById] = useState({});
  /** Protocol session from nav pills, URL, or localStorage; cleared when leaving Protocol tab. */
  const [protocolDeepLink, setProtocolDeepLink] = useState(null);
  const [narrowHeader, setNarrowHeader] = useState(false);
  const msgEnd = useRef(null);
  const stackHydrated = useRef(false);
  const workerOkHeader = isApiWorkerConfigured();
  const rawHeaderMemberAvatar =
    activeProfile && typeof activeProfile.avatar_url === "string" ? activeProfile.avatar_url.trim() : "";
  const resolvedHeaderMemberAvatar = useMemberAvatarSrc(
    user?.id,
    rawHeaderMemberAvatar,
    memberProfilesVersion,
    workerOkHeader
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 560px)");
    const sync = () => setNarrowHeader(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (activeTab !== "protocol") setProtocolDeepLink(null);
  }, [activeTab]);

  useEffect(() => {
    if (!user?.id) setStackShareId(null);
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
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) {
      return;
    }
    let ignore = false;
    loadStack(user.id, activeProfileId).then((s) => {
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
      setStackShareId(
        s && typeof s === "object" && !Array.isArray(s) && typeof s.shareId === "string" && s.shareId.trim()
          ? s.shareId.trim()
          : null
      );
      stackHydrated.current = true;
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

  const filtered = useMemo(
    () =>
      PEPTIDES.filter((p) => {
        const mc = selCat === "All" || peptideCategories(p).includes(selCat);
        const mr = peptideMatchesRouteFilter(p, routeFilter);
        const ms =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
        return mc && mr && ms;
      }),
    [selCat, routeFilter, search]
  );

  const sortedPeptides = useMemo(() => {
    const base = [...filtered];
    switch (sortMode) {
      case "az":
        return base.sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return base.sort((a, b) => b.name.localeCompare(a.name));
      case "category":
        return base.sort((a, b) => {
          const catA = primaryCategory(a) || "";
          const catB = primaryCategory(b) || "";
          return catA.localeCompare(catB) || a.name.localeCompare(b.name);
        });
      default:
        return base;
    }
  }, [filtered, sortMode]);

  const handleCategorySelect = (cat) => {
    setSelCat(cat);
    setSortMode("default");
  };

  const savedStackLimit = getTier(user?.plan ?? "entry").stackLimit;
  const canAddToStack = myStack.length < savedStackLimit;
  const canAI = hasAccess(user?.plan, "pro");
  const canUploadStackPhoto = hasAccess(user?.plan ?? "entry", "pro");
  const canVialTracker = hasAccess(user?.plan ?? "entry", "pro");

  const protocolRows = useMemo(
    () =>
      myStack.flatMap((p) => {
        const catalogPeptide = PEPTIDES.find((c) => c.id === p.id);
        const stab = resolveStability(catalogPeptide ?? p);
        return stab.stabilityDays != null ? [{ peptideId: p.id, name: p.name }] : [];
      }),
    [myStack]
  );

  const protocolBaseRows = useMemo(
    () =>
      myStack.flatMap((p) => {
        const catalogPeptide = PEPTIDES.find((c) => c.id === p.id);
        const stab = resolveStability(catalogPeptide ?? p);
        if (stab.stabilityDays == null) return [];
        return [
          {
            peptideId: p.id,
            name: p.name,
            sessions: normalizeStackSessions(p.sessions),
          },
        ];
      }),
    [myStack]
  );

  const openUpgradeModal = () => {
    setUpgradeFocusTier(getNextTierId(user?.plan));
    setShowUpgrade(true);
  };
  const closeUpgradeModal = () => {
    setShowUpgrade(false);
    setUpgradeFocusTier(null);
  };

  const openAdd = (p) => { setAddTarget(p); setShowAdd(true); };
  const confirmAdd = ({ dose, frequency, notes }) => {
    if (!addTarget) return;
    if (!canAddToStack) { openUpgradeModal(); setShowAdd(false); setAddTarget(null); return; }
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

  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    if (!canAI) { openUpgradeModal(); return; }
    const userMsg = { role:"user", content:aiInput };
    const msgs = [...aiMsgs, userMsg];
    setAiMsgs(msgs); setAiInput(""); setAiLoading(true);
    const stackCtx =
      myStack.length > 0
        ? `\n\nUser's current stack${stackName ? ` (“${stackName}”)` : ""}: ${myStack
            .map((p) => {
              const dose = p.stackDose || p.startDose || "";
              const freq = p.stackFrequency ? `, ${p.stackFrequency}` : "";
              const note = p.stackNotes ? `; notes: ${p.stackNotes}` : "";
              return `${p.name} (${dose}${freq})${note}`;
            })
            .join("; ")}.`
        : "";
    const goalsCtx = goals.length > 0 ? `\n\nUser's goals: ${goals.join(", ")}.` : "";
    const system = `You are an expert peptide research advisor with deep knowledge of peptide pharmacology, biohacking protocols, dosing strategies, and interactions. Be direct, technical, and practical. Always include safety notes — these are research chemicals requiring physician oversight. The user is an advanced biohacker.${stackCtx}${goalsCtx}`;
    if (!isApiWorkerConfigured()) {
      setAiMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Configure VITE_API_WORKER_URL in .env.local (deploy workers/api-proxy.js and use POST /v1/chat). The Anthropic key must stay on the Worker only.",
        },
      ]);
      setAiLoading(false);
      return;
    }
    try {
      const token = await getSessionAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_WORKER_URL}/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: msgs, system }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errText =
          typeof data.error === "string" ? data.error : data.error?.message || `Worker ${res.status}`;
        if (res.status === 429) {
          setAiMsgs((prev) => [
            ...prev,
            {
              role: "assistant",
              content: errText,
              limitReached: data.limit_reached === true,
            },
          ]);
          setAiLoading(false);
          return;
        }
        throw new Error(errText);
      }
      const { text, usage } = data;
      const outText = typeof text === "string" ? text : "";
      if (
        usage &&
        typeof usage.queries_today === "number" &&
        typeof usage.queries_limit === "number"
      ) {
        setAiQueryUsage({
          today: usage.queries_today,
          limit: usage.queries_limit,
          plan: typeof usage.plan === "string" ? usage.plan : user.plan,
        });
      }
      setAiMsgs((prev) => [...prev, { role: "assistant", content: outText || "No response." }]);
    } catch (e) {
      setAiMsgs((prev) => [
        ...prev,
        { role: "assistant", content: e instanceof Error ? e.message : "API error — check Worker and network." },
      ]);
    }
    setAiLoading(false);
  };

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [aiMsgs]);

  const handleSignOut = async () => {
    await signOut();
    stackHydrated.current = false;
    setMyStack([]);
    setStackName("");
    setAiQueryUsage(null);
    setUser(null);
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",background:"#07090e",color:"#dde4ef",fontFamily:"'Outfit',sans-serif" }}>

        <div className="grid-bg" style={{ borderBottom:"1px solid #0e1822" }}>
          <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 16px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0",flexWrap:"wrap",gap:8 }}>
              <Logo />
              <div
                id="nav-account-anchor"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflowX: "auto",
                  marginLeft: "auto",
                  flexWrap: "wrap",
                }}
              >
                {(() => {
                  const guideOn = activeTab === "guide";
                  const tier = tierHeaderPill(user.plan);
                  const memberDisplayRaw = String(activeProfile?.display_name ?? "").trim() || "—";
                  const memberNameShown = narrowHeader
                    ? (memberDisplayRaw.split(/\s+/)[0] || memberDisplayRaw).trim() || "—"
                    : memberDisplayRaw;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveTab("guide")}
                        style={{
                          ...HEADER_ACCOUNT_PILL_BASE,
                          cursor: "pointer",
                          border: guideOn ? "1px solid rgba(0, 212, 170, 0.55)" : HEADER_ACCOUNT_PILL_BASE.border,
                          background: guideOn ? "rgba(0, 212, 170, 0.14)" : HEADER_ACCOUNT_PILL_BASE.background,
                          boxShadow: guideOn ? "0 0 0 1px rgba(0, 212, 170, 0.12)" : "none",
                          color: guideOn ? "#00d4aa" : "#5c6d82",
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
                          🧙
                        </span>
                        AI GUIDE
                      </button>
                      <span
                        className="mono"
                        style={{
                          ...HEADER_ACCOUNT_PILL_BASE,
                          background: tier.background,
                          color: tier.color,
                          border: tier.border,
                        }}
                        aria-label={`Plan: ${tier.label}`}
                      >
                        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
                          {tier.emoji}
                        </span>
                        {tier.label}
                      </span>
                      {user.plan !== "goat" && (
                        <button
                          type="button"
                          onClick={openUpgradeModal}
                          style={{
                            ...HEADER_ACCOUNT_PILL_BASE,
                            cursor: "pointer",
                            border: "1px solid rgba(0, 212, 170, 0.45)",
                            background: "rgba(0, 212, 170, 0.14)",
                            boxShadow: "0 0 0 1px rgba(0, 212, 170, 0.08)",
                            color: "#00d4aa",
                          }}
                        >
                          Upgrade
                        </button>
                      )}
                      <span
                        className="mono"
                        style={{
                          ...HEADER_ACCOUNT_PILL_BASE,
                          color: "#8fa5bf",
                          maxWidth: narrowHeader ? 180 : 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={memberDisplayRaw !== "—" ? memberDisplayRaw : undefined}
                        aria-label={
                          memberDisplayRaw !== "—"
                            ? `Active profile: ${memberDisplayRaw}`
                            : "Active profile"
                        }
                      >
                        {resolvedHeaderMemberAvatar ? (
                          <img
                            src={resolvedHeaderMemberAvatar}
                            alt=""
                            draggable={false}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: "1px solid #243040",
                            }}
                          />
                        ) : (
                          <span
                            aria-hidden
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: "#14202e",
                              border: "1px solid #243040",
                              color: "#00d4aa",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                              lineHeight: 1,
                            }}
                          >
                            {headerMemberAvatarInitial(memberDisplayRaw)}
                          </span>
                        )}
                        {memberNameShown}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        aria-label="Sign out"
                        title="Sign out"
                        style={{
                          ...HEADER_ACCOUNT_PILL_BASE,
                          cursor: "pointer",
                          color: "#8fa5bf",
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
                          🚪
                        </span>
                        EXIT
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1200,margin:"0 auto",padding:"20px 16px 88px" }}>

          {activeTab === "library" && (
            <div>
              <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
                <input className="search-input" style={{ maxWidth:280,flex:"1 1 200px" }} placeholder="Search by name, alias, tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div style={{ display:"flex",gap:6,flex:1,flexWrap:"wrap",alignItems:"center",overflowX:"auto",paddingBottom:2,minWidth:0 }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        ...LIBRARY_FILTER_PILL_BASE,
                        ...(selCat === cat ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexWrap:"wrap" }}>
                    <span style={{ color:"#ffffff",fontSize: 13,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,letterSpacing:"0.06em" }}>Sort</span>
                    <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSortMode(opt.value)}
                          style={{
                            ...LIBRARY_FILTER_PILL_BASE,
                            ...(sortMode === opt.value ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {ROUTE_FILTERS.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRouteFilter((prev) => (prev === r.id ? null : r.id))}
                      style={{
                        ...LIBRARY_FILTER_PILL_BASE,
                        ...(routeFilter === r.id ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14 }}>
                {sortedPeptides.map((p) => {
                  const cat0 = primaryCategory(p);
                  const cc = getCatColor(cat0);
                  const inStack = myStack.some((s) => s.id === p.id);
                  return (
                    <div key={p.id} className="pcard" style={{ "--cc":cc }} onClick={() => setSelPeptide(p)} onKeyDown={(e) => e.key === "Enter" && setSelPeptide(p)} role="button" tabIndex={0}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                        <div>
                          <div className="brand" style={{ fontWeight:700,fontSize:14,color:"#dde4ef" }}>{p.name}</div>
                          {p.variantOf && (
                            <div>
                              <div
                                className="mono"
                                title={typeof p.variantNote === "string" && p.variantNote.trim() ? p.variantNote : undefined}
                                onClick={
                                  typeof p.variantNote === "string" && p.variantNote.trim()
                                    ? (e) => {
                                        e.stopPropagation();
                                        setVariantNoteExpandedById((prev) => ({
                                          ...prev,
                                          [p.id]: !prev[p.id],
                                        }));
                                      }
                                    : undefined
                                }
                                style={{
                                  fontSize: 13,
                                  opacity: 0.65,
                                  color: "#8fa5bf",
                                  marginTop: 3,
                                  lineHeight: 1.35,
                                  fontWeight: 400,
                                  WebkitTapHighlightColor: "transparent",
                                  ...(typeof p.variantNote === "string" && p.variantNote.trim()
                                    ? { cursor: "pointer" }
                                    : {}),
                                }}
                              >
                                Variant of: {getVariantParent(p)?.name ?? p.variantOf}
                              </div>
                              {variantNoteExpandedById[p.id] &&
                                typeof p.variantNote === "string" &&
                                p.variantNote.trim() && (
                                  <div
                                    className="mono"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      fontSize: 13,
                                      opacity: 0.8,
                                      color: "#8fa5bf",
                                      marginTop: 4,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {p.variantNote}
                                  </div>
                                )}
                            </div>
                          )}
                          {p.aliases[0] && <div className="mono" style={{ fontSize: 13,color:"#a0a0b0",marginTop:1 }}>{p.aliases[0]}</div>}
                        </div>
                        <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35`,fontSize: 13 }}>{cat0}</span>
                      </div>
                      <div style={{ fontSize: 13,color:"#7891af",marginBottom:12,lineHeight:1.55 }}>
                        {p.mechanism.length > 90 ? p.mechanism.slice(0,90)+"…" : p.mechanism}
                      </div>
                      {typeof p.bioavailabilityNote === "string" && p.bioavailabilityNote.trim() !== "" && (
                        <div
                          className="mono"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 13, color: "#f59e0b", marginBottom: 10, lineHeight: 1.45 }}
                        >
                          ⚠ {p.bioavailabilityNote}
                        </div>
                      )}
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <div className="mono" style={{ fontSize: 13,color:"#a0a0b0" }}><span style={{ color:cc+"80" }}>t½</span> {p.halfLife}</div>
                        <button type="button" className={inStack?"btn-green":"btn-teal"} style={{ padding:"5px 10px",fontSize: 13 }}
                          onClick={(e) => { e.stopPropagation(); if (!inStack) openAdd(p); }}>
                          {inStack ? "✓ Saved" : "+ Saved Stack"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {sortedPeptides.length === 0 && <div className="mono" style={{ color:"#a0a0b0",fontSize: 13,padding:"40px 0",gridColumn:"1/-1" }}>// No results</div>}
              </div>
            </div>
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
                      style={{ fontSize: 13,color:"#a0a0b0",marginTop:2,maxWidth:520 }}
                      title="A Saved Stack is a named peptide protocol you can build, save, and revisit."
                    >
                      {myStack.length} peptide{myStack.length!==1?"s":""} saved
                      {` · ${Math.max(0, savedStackLimit - myStack.length)} of ${savedStackLimit} Saved Stacks remaining`}
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
              </div>
              {myStack.length === 0 ? (
                <div style={{ border:"1px dashed #14202e",borderRadius:10,padding:"80px 0",textAlign:"center" }}>
                  <div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>⬡</div>
                  <div className="mono" style={{ color:"#a0a0b0",fontSize: 13 }}>// No Saved Stacks yet. Add compounds from the Library.</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <div style={{ marginBottom:4,display:"flex",flexWrap:"wrap",alignItems:"flex-end",gap:14 }}>
                    <div style={{ flex:"1 1 220px",minWidth:0 }}>
                      <div className="mono" style={{ fontSize: 13,color:"#00d4aa",marginBottom:6,letterSpacing:".12em" }}>STACK NAME</div>
                      <SavedStackNameInput initialName={stackName} onCommit={setStackName} />
                    </div>
                    {user?.id && activeProfileId && (
                      <StackShareControls
                        userId={user.id}
                        profileId={activeProfileId}
                        stackName={stackName}
                        initialShareId={stackShareId}
                        onShareIdChange={setStackShareId}
                        disabled={!isSupabaseConfigured()}
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
                      userPlan={user?.plan ?? "entry"}
                    />
                  )}
                  {myStack.map((p) => {
                    const catalogPeptide = PEPTIDES.find((c) => c.id === p.id);
                    const stab = resolveStability(catalogPeptide ?? p);
                    return (
                      <div key={getStackRowListKey(p)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        <SavedStackEntryRow
                          item={p}
                          catColor={getCatColor(primaryCategory(p))}
                          catLabel={primaryCategory(p)}
                          onUpdate={updateStackItem}
                          onRemove={removeFromStack}
                        />
                        {stab.stabilityDays != null && user?.id && activeProfileId && (
                          <VialTracker
                            userId={user.id}
                            profileId={activeProfileId}
                            peptideId={p.id}
                            catalogEntry={{
                              name: p.name,
                              stabilityDays: stab.stabilityDays,
                              stabilityNote: stab.stabilityNote,
                            }}
                            canUse={canVialTracker}
                            onUpgrade={openUpgradeModal}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div style={{ marginTop:12,background:"#0b0f17",border:"1px solid #14202e",borderRadius:8,padding:14 }}>
                    <div className="mono" style={{ fontSize: 13,color:"#00d4aa",letterSpacing:".15em",marginBottom:10 }}>// SAVED STACK BREAKDOWN</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {[...new Set(myStack.map((p) => primaryCategory(p)))].map((cat) => {
                        const cc = getCatColor(cat); const n = myStack.filter((p) => primaryCategory(p) === cat).length;
                        return <span key={cat} className="pill" style={{ background:cc+"15",color:cc,border:`1px solid ${cc}30`,fontSize: 13,padding:"4px 10px" }}>{cat}: {n}</span>;
                      })}
                    </div>
                    <button type="button" className="btn-teal" style={{ fontSize: 13 }}
                      onClick={() => {
                        const summary = myStack
                          .map((p) => {
                            const dose = p.stackDose || p.startDose || "";
                            const freq = p.stackFrequency ? ` ${p.stackFrequency}` : "";
                            const note = p.stackNotes ? ` — ${p.stackNotes}` : "";
                            return `${p.name} (${dose}${freq})${note}`;
                          })
                          .join("; ");
                        const title = stackName ? `“${stackName}”: ` : "";
                        setAiInput(`Analyze my current stack and give me optimization recommendations, timing protocols, and safety considerations: ${title}${summary}`);
                        setActiveTab("guide");
                      }}>
                      Analyze with AI →
                    </button>
                    <div style={{ marginTop: 10, fontSize: 13, color: "#cbd5e1" }}>
                      <span style={{ color: "#fbbf24" }}>⚠ </span>Review injection schedules for timing conflicts. Consult your physician.
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              onDeepLinkConsumed={() => {}}
              onLoggedNavigateLibrary={() => setActiveTab("library")}
              userPlan={user?.plan ?? "entry"}
            />
          )}

          {activeTab === "guide" && (
            <div style={{ display:"flex",gap:16,height:"calc(100vh - 170px)",flexDirection:"row" }}>
              <div style={{ width:190,flexShrink:0,overflowY:"auto",display:"flex",flexDirection:"column",gap:5 }} className="guide-sidebar">
                <div className="mono" style={{ fontSize: 13,color:"#00d4aa",letterSpacing:".15em",marginBottom:6 }}>// GOALS <span style={{ color:"#a0a0b0" }}>(optional)</span></div>
                {GOALS.map((g) => (
                  <button type="button" key={g} className={`goal-chip ${goals.includes(g)?"on":""}`}
                    onClick={() => setGoals((prev) => prev.includes(g) ? prev.filter((x)=>x!==g) : [...prev,g])}>
                    {g}
                  </button>
                ))}
                {myStack.length > 0 && (
                  <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid #0e1822" }}>
                    <div className="mono" style={{ fontSize: 13,color:"#00d4aa",letterSpacing:".15em",marginBottom:6 }}>// SAVED STACK LOADED</div>
                    {myStack.map((p) => <div key={getStackRowListKey(p)} className="mono" style={{ fontSize: 13,color:"#2e4055",padding:"2px 0" }}>→ {p.name}</div>)}
                  </div>
                )}
              </div>

              <div style={{ flex:1,display:"flex",flexDirection:"column",background:"#0b0f17",border:"1px solid #14202e",borderRadius:10,overflow:"hidden",minWidth:0 }}>
                <div style={{ padding:"12px 16px",borderBottom:"1px solid #0e1822",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <div className={aiLoading?"pulse":""} style={{ width:7,height:7,borderRadius:"50%",background:aiLoading?"#f59e0b":"#00d4aa",flexShrink:0 }} />
                  <div className="brand" style={{ fontSize: 13,color:"#a0a0b0",letterSpacing:".06em" }}>
                    <span style={{ color:"#00d4aa" }}>Pep</span>GuideIQ INTELLIGENCE
                  </div>
                  {goals.length > 0 && <span className="mono" style={{ fontSize: 13,color:"#a0a0b0" }}>{goals.length} goal{goals.length>1?"s":""} active</span>}
                  {!canAI && <span className="pill" style={{ background:"#f59e0b15",color:"#f59e0b",border:"1px solid #f59e0b30",fontSize: 13,marginLeft:"auto" }}>Upgrade to unlock AI</span>}
                </div>

                <div style={{ flex:1,overflowY:"auto",padding:14 }}>
                  {aiMsgs.length === 0 && (
                    <div style={{ textAlign:"center",padding:"32px 16px" }}>
                      <div style={{ fontSize:28,opacity:.2,marginBottom:10 }}>⬡</div>
                      <div className="mono" style={{ color:"#a0a0b0",fontSize: 13,marginBottom:18 }}>
                        // Optional: select goals above, then ask anything.
                      </div>
                      <div style={{ display:"flex",flexDirection:"column",gap:7,maxWidth:360,margin:"0 auto" }}>
                        {[
                          "Build me a longevity stack from scratch",
                          "Best sleep peptide protocol and timing?",
                          "How do I stack Semax and Selank safely?",
                          "Explain SS-31's mechanism of action",
                          "What's the mitochondrial trinity protocol?",
                        ].map((s) => (
                          <button type="button" key={s} className="sugg-btn" onClick={() => canAI ? setAiInput(s) : openUpgradeModal()}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiMsgs.map((msg,i) => (
                    <div key={i} className={`ai-msg ${msg.role==="user"?"ai-user":"ai-bot"}`}>
                      {msg.role === "assistant" && (
                        <div className="mono" style={{ fontSize: 13,color:"#00d4aa",marginBottom:5,letterSpacing:".15em" }}>
                          <span style={{ color:"#00d4aa" }}>Pep</span>GuideIQ
                        </div>
                      )}
                      <div style={{ whiteSpace:"pre-wrap",color:msg.role==="user"?"#dde4ef":"#8fa5bf" }}>{msg.content}</div>
                      {msg.role === "assistant" && msg.limitReached && (
                        <button type="button" className="btn-teal" onClick={openUpgradeModal} style={{ marginTop:10, fontSize: 13, padding:"6px 12px" }}>
                          Upgrade for more queries
                        </button>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-msg ai-bot">
                      <div className="mono pulse" style={{ fontSize: 13,color:"#00d4aa" }}>// Analyzing protocol data…</div>
                    </div>
                  )}
                  <div ref={msgEnd} />
                </div>

                <div style={{ padding:10,borderTop:"1px solid #0e1822",display:"flex",flexDirection:"column",gap:4 }}>
                  <div style={{ display:"flex",gap:8 }}>
                    <textarea className="ai-input" rows={2} placeholder="Ask about dosing, protocols, stacking, mechanisms, cycling…"
                      value={aiInput} onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
                    />
                    <button type="button" className="btn-teal" onClick={sendAI} disabled={aiLoading||!aiInput.trim()} style={{ padding:"0 18px",alignSelf:"stretch",fontSize:16 }}>
                      {aiLoading?"…":"→"}
                    </button>
                  </div>
                  {canAI && aiQueryUsage != null && (
                    <div style={{ fontSize: 13,color:"#8fa5bf",textAlign:"right",marginTop:4 }}>
                      {aiQueryUsage.today} of {aiQueryUsage.limit} queries used today
                      {aiQueryUsage.today >= aiQueryUsage.limit && (
                        <span style={{ color:"#f97316",marginLeft:8 }}>· Limit reached</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && user?.id && (
            <div>
              <div className="brand" style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>
                Profile
              </div>
              <ProfileTab
                user={user}
                setUser={setUser}
                onOpenUpgrade={openUpgradeModal}
                onSignOut={handleSignOut}
              />
            </div>
          )}
        </div>

        {selPeptide && (() => {
          const p = selPeptide;
          const pCat = primaryCategory(p);
          const cc = getCatColor(pCat);
          const inStack = myStack.some((s)=>s.id===p.id);
          return (
            <Modal onClose={() => setSelPeptide(null)} label={p.name}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                <div>
                  <div className="brand" style={{ fontSize:20,fontWeight:800,color:"#dde4ef" }}>{p.name}</div>
                  {p.variantOf && (
                    <div
                      className="mono"
                      title={typeof p.variantNote === "string" && p.variantNote.trim() ? p.variantNote : undefined}
                      style={{
                        fontSize: 13,
                        opacity: 0.65,
                        color: "#8fa5bf",
                        marginTop: 4,
                        lineHeight: 1.4,
                        fontWeight: 400,
                        ...(p.variantNote ? { cursor: "help" } : {}),
                      }}
                    >
                      Variant of: {getVariantParent(p)?.name ?? p.variantOf}
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 13,color:"#a0a0b0",marginTop:3 }}>{p.aliases.join(" · ")}</div>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35` }}>{pCat}</span>
                  <button type="button" style={{ background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:20,lineHeight:1 }} onClick={() => setSelPeptide(null)} aria-label="Close">×</button>
                </div>
              </div>
              <div style={{ borderLeft:`3px solid ${cc}`,paddingLeft:12,marginBottom:14,fontSize: 13,color:"#a0a0b0",lineHeight:1.6 }}>{p.mechanism}</div>
              {typeof p.bioavailabilityNote === "string" && p.bioavailabilityNote.trim() !== "" && (
                <div className="mono" style={{ fontSize: 13, color: "#f59e0b", marginBottom: 12, lineHeight: 1.45 }}>
                  ⚠ {p.bioavailabilityNote}
                </div>
              )}
              {[["Typical Dose",p.typicalDose],["Start Dose",p.startDose],["Titration",p.titrationNote],["Half-life",p.halfLife],["Route",p.route.join(", ")],["Cycle",p.cycle],["Storage",p.storage],["Reconstitution",p.reconstitution]].map(([l,v]) => (
                <div key={l} className="drow"><span className="dlabel">{l}</span><span className="dval mono">{v}</span></div>
              ))}
              <div style={{ marginTop:12 }}>
                <div className="mono" style={{ fontSize: 13,color:"#00d4aa",letterSpacing:".12em",marginBottom:7 }}>// BENEFITS</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.benefits.map((b) => <span key={b} className="pill" style={{ background:"#00d4aa0e",color:"#00d4aa70",border:"1px solid #00d4aa18" }}>{b}</span>)}</div>
              </div>
              <div style={{ marginTop:10 }}>
                <div className="mono" style={{ fontSize: 13,color:"#f59e0b",letterSpacing:".12em",marginBottom:7 }}>// SIDE EFFECTS</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.sideEffects.map((s) => <span key={s} className="pill" style={{ background:"#f59e0b0e",color:"#f59e0b70",border:"1px solid #f59e0b18" }}>{s}</span>)}</div>
              </div>
              {p.stacksWith.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div className="mono" style={{ fontSize: 13,color:"#8b5cf6",letterSpacing:".12em",marginBottom:7 }}>// STACKS WELL WITH</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.stacksWith.map((s) => <span key={s} className="pill" style={{ background:"#8b5cf60e",color:"#8b5cf670",border:"1px solid #8b5cf618" }}>{s}</span>)}</div>
                </div>
              )}
              {p.notes && (
                <div style={{ marginTop:12,background:"#07090e",border:"1px solid #0e1822",borderRadius:6,padding:12 }}>
                  <div className="mono" style={{ fontSize: 13,color:"#c8c8d4",marginBottom:5,letterSpacing:".15em" }}>// NOTES</div>
                  <div style={{ fontSize: 13,color:"#a0a0b0",lineHeight:1.65 }}>{p.notes}</div>
                </div>
              )}
              <div style={{ marginTop:16,display:"flex",justifyContent:"flex-end",gap:8 }}>
                <button type="button" className="btn-teal" style={{ fontSize: 13 }}
                  onClick={() => {
                    if (!canAI) {
                      openUpgradeModal();
                      return;
                    }
                    setSelPeptide(null);
                    setAiInput(`Deep dive on ${p.name}: optimal protocol, titration, stacking strategy, and advanced use cases`);
                    setActiveTab("guide");
                  }}>
                  Ask AI →
                </button>
                <button type="button" className={inStack?"btn-green":"btn-teal"} style={{ fontSize: 13 }}
                  onClick={() => { if (!inStack) { openAdd(p); setSelPeptide(null); } }}>
                  {inStack ? "✓ Saved" : "+ Add to Saved Stack"}
                </button>
              </div>
            </Modal>
          );
        })()}

        {showAdd && addTarget && (
          <Modal onClose={() => { setShowAdd(false); setAddTarget(null); }} maxWidth={380} label="Add to Saved Stack">
            <AddToStackForm
              peptide={addTarget}
              onCancel={() => { setShowAdd(false); setAddTarget(null); }}
              onSave={confirmAdd}
            />
          </Modal>
        )}

        {showUpgrade && (
          <UpgradePlanModal
            onClose={closeUpgradeModal}
            user={user}
            upgradeFocusTier={upgradeFocusTier}
            setUser={setUser}
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
            background: "#07090e",
            borderTop: "1px solid #0e1822",
            padding: "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div
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
              aria-label={`Library, ${PEPTIDES.length} compounds`}
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
                border: activeTab === "library" ? "1px solid rgba(0, 212, 170, 0.55)" : "1px solid #1e2a38",
                background: activeTab === "library" ? "rgba(0, 212, 170, 0.14)" : "rgba(255, 255, 255, 0.03)",
                boxShadow: activeTab === "library" ? "0 0 0 1px rgba(0, 212, 170, 0.12)" : "none",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, opacity: activeTab === "library" ? 1 : 0.72 }} aria-hidden>
                🧬
              </span>
              <span
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 6,
                  lineHeight: 1.15,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.03em",
                    color: "#7a8694",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {PEPTIDES.length}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    color: activeTab === "library" ? "#00d4aa" : "#5c6d82",
                    fontWeight: 500,
                  }}
                >
                  LIBRARY
                </span>
              </span>
            </button>
            <div
              role="group"
              aria-label="Protocol session"
              style={{
                flex: "1.45 1 0",
                minWidth: 0,
                display: "flex",
                alignItems: "stretch",
                gap: 3,
              }}
            >
              {[
                { session: "morning", emoji: "🌅", label: "MORNING" },
                { session: "afternoon", emoji: "☀️", label: "AFTERNOON" },
                { session: "evening", emoji: "🌇", label: "EVENING" },
                { session: "night", emoji: "🌙", label: "NIGHT" },
              ].map(({ session, emoji, label }) => {
                const isActive = activeTab === "protocol" && protocolDeepLink === session;
                const ariaLabel =
                  session === "morning"
                    ? "Morning"
                    : session === "afternoon"
                      ? "Afternoon"
                      : session === "evening"
                        ? "Evening"
                        : "Night";
                return (
                  <button
                    key={session}
                    type="button"
                    aria-label={ariaLabel}
                    onClick={() => {
                      setActiveTab("protocol");
                      setProtocolDeepLink(session);
                    }}
                    style={{
                      flex: "1 1 0",
                      minWidth: 0,
                      minHeight: 44,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      padding: "6px 0",
                      borderRadius: 12,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: isActive ? "1px solid rgba(0, 212, 170, 0.55)" : "1px solid #1e2a38",
                      background: isActive ? "rgba(0, 212, 170, 0.14)" : "rgba(255, 255, 255, 0.03)",
                      boxShadow: isActive ? "0 0 0 1px rgba(0, 212, 170, 0.12)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, opacity: isActive ? 1 : 0.72 }} aria-hidden>
                      {emoji}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        lineHeight: 1.15,
                        letterSpacing: "0.06em",
                        color: isActive ? "#00d4aa" : "#5c6d82",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {[
              {
                tabId: "vials",
                emoji: "🧪",
                label: "VIALS",
                isActive: activeTab === "stack",
                onClick: () => setActiveTab("stack"),
              },
              {
                tabId: "stacks",
                emoji: "📋",
                label: "STACKS",
                isActive: activeTab === "stack",
                onClick: () => setActiveTab("stack"),
              },
              {
                tabId: "profile",
                emoji: "👤",
                label: "PROFILE",
                isActive: activeTab === "profile",
                onClick: () => setActiveTab("profile"),
              },
            ].map((item) => (
              <button
                key={item.tabId}
                type="button"
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
                  border: item.isActive ? "1px solid rgba(0, 212, 170, 0.55)" : "1px solid #1e2a38",
                  background: item.isActive ? "rgba(0, 212, 170, 0.14)" : "rgba(255, 255, 255, 0.03)",
                  boxShadow: item.isActive ? "0 0 0 1px rgba(0, 212, 170, 0.12)" : "none",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, opacity: item.isActive ? 1 : 0.72 }} aria-hidden>
                  {item.emoji}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.15,
                    letterSpacing: "0.06em",
                    color: item.isActive ? "#00d4aa" : "#5c6d82",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <ProfileSwitcher onOpenUpgrade={openUpgradeModal} />

        <div style={{ paddingBottom: 72 }}>
          <LegalDisclaimer />
        </div>

      </div>
    </>
  );
}

export default function PepGuideIQ() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const u = await getCurrentUser();
      if (!cancelled && u) setUser(u);
      if (!cancelled) setAuthReady(true);
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
  }, []);

  if (!authReady) {
    return (
      <>
        <GlobalStyles />
        <div
          className="mono"
          style={{
            minHeight: "100vh",
            background: "#07090e",
            color: "#a0a0b0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          // Loading session…
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <GlobalStyles />
        <AuthScreen onAuth={setUser} />
      </>
    );
  }

  return (
    <ProfileProvider userId={user.id} plan={user.plan ?? "entry"}>
      <PepGuideIQApp user={user} setUser={setUser} />
    </ProfileProvider>
  );
}
