import { useState, useEffect, useMemo, useRef } from "react";
import { PEPTIDES, CATEGORIES, GOALS, CAT_COLORS } from "./data/catalog.js";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import { Logo } from "./components/Logo.jsx";
import { Modal } from "./components/Modal.jsx";
import { AddToStackForm } from "./components/AddToStackForm.jsx";
import { SavedStackEntryRow, getStackRowListKey } from "./components/SavedStackEntryRow.jsx";
import { SavedStackNameInput } from "./components/SavedStackNameInput.jsx";
import { UpgradePlanModal } from "./components/UpgradePlanModal.jsx";
import { formatPlan, getNextTierId, getTier, hasAccess, TIER_RANK } from "./lib/tiers.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./lib/config.js";
import {
  getCurrentUser,
  getSessionAccessToken,
  loadStack,
  onAuthStateChange,
  saveStack,
  signOut,
} from "./lib/supabase.js";

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

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "tier", label: "Tier" },
  { value: "category", label: "Category" },
];

export default function PepGuideIQ() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState("library");
  const [selCat, setSelCat]       = useState("All");
  const [sortMode, setSortMode]   = useState("default");
  const [search, setSearch]       = useState("");
  const [selPeptide, setSelPeptide] = useState(null);
  const [myStack, setMyStack]     = useState([]);
  const [stackName, setStackName] = useState("");
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
  const msgEnd = useRef(null);
  const stackHydrated = useRef(false);

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
    const { data: { subscription } } = onAuthStateChange(async () => {
      const u = await getCurrentUser();
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    stackHydrated.current = false;
    if (!user?.id || !isSupabaseConfigured()) {
      return;
    }
    let ignore = false;
    loadStack(user.id).then((s) => {
      if (ignore) return;
      const stack = s && typeof s === "object" && !Array.isArray(s) && Array.isArray(s.stack) ? s.stack : Array.isArray(s) ? s : [];
      const name = s && typeof s === "object" && !Array.isArray(s) && typeof s.name === "string" ? s.name : "";
      setMyStack(stack);
      setStackName(name);
      stackHydrated.current = true;
    });
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured() || !stackHydrated.current) return;
    const t = setTimeout(() => {
      saveStack(user.id, myStack, stackName);
    }, 800);
    return () => clearTimeout(t);
  }, [myStack, stackName, user?.id]);

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
        const ms =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
        return mc && ms;
      }),
    [selCat, search]
  );

  const sortedPeptides = useMemo(() => {
    const base = [...filtered];
    switch (sortMode) {
      case "az":
        return base.sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return base.sort((a, b) => b.name.localeCompare(a.name));
      case "tier":
        return base.sort((a, b) => (TIER_RANK[a.tier] ?? 0) - (TIER_RANK[b.tier] ?? 0));
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
        body: JSON.stringify({ messages: msgs, system, plan: user.plan }),
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

  if (!authReady) {
    return (
      <>
        <GlobalStyles />
        <div
          className="mono"
          style={{
            minHeight: "100vh",
            background: "#07090e",
            color: "#243040",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          // Loading session…
        </div>
      </>
    );
  }

  if (!user) return (
    <>
      <GlobalStyles />
      <AuthScreen onAuth={setUser} />
    </>
  );

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh",background:"#07090e",color:"#dde4ef",fontFamily:"'Outfit',sans-serif" }}>

        <div className="grid-bg" style={{ borderBottom:"1px solid #0e1822" }}>
          <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 16px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0 0",flexWrap:"wrap",gap:8 }}>
              <Logo />
              <div style={{ display:"flex",alignItems:"center",gap:0,overflowX:"auto" }}>
                {[
                  { id:"library", label:"Library", count:PEPTIDES.length },
                  { id:"stack",   label:"Saved Stacks", count:myStack.length||null },
                  { id:"advisor", label:"AI Advisor" },
                ].map((t) => (
                  <button type="button" key={t.id} className={`tab-btn ${activeTab===t.id?"active":""}`} onClick={() => setActiveTab(t.id)}>
                    {t.label}{t.count ? ` (${t.count})` : ""}
                  </button>
                ))}
                <div style={{ width:1,height:20,background:"#14202e",margin:"0 8px" }} />
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span className="pill" style={{ background: user.plan==="goat"?"#a855f720":user.plan==="elite"?"#f59e0b20":user.plan==="pro"?"#00d4aa20":"#14202e", color:user.plan==="goat"?"#a855f7":user.plan==="elite"?"#f59e0b":user.plan==="pro"?"#00d4aa":"#4a6080", border:`1px solid ${user.plan==="goat"?"#a855f730":user.plan==="elite"?"#f59e0b30":user.plan==="pro"?"#00d4aa30":"#14202e"}`, fontSize:9 }}>
                    {formatPlan(user.plan)}
                  </span>
                  {user.plan === "goat" ? (
                    <button type="button" disabled className="btn-teal" style={{ fontSize:10,padding:"4px 10px",opacity:0.45,cursor:"not-allowed",borderColor:"#243040",color:"#4a6080",background:"#0b0f17" }} title="You are on the highest plan">
                      Max Tier
                    </button>
                  ) : (
                    <button type="button" className="btn-teal" style={{ fontSize:10,padding:"4px 10px" }} onClick={openUpgradeModal}>
                      Upgrade
                    </button>
                  )}
                  <span style={{ fontSize:11,color:"#243040",fontFamily:"'JetBrains Mono',monospace" }}>{user.name}</span>
                  <button type="button" className="btn-red" style={{ fontSize:10,padding:"3px 8px" }} onClick={() => void handleSignOut()}>↩</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1200,margin:"0 auto",padding:"20px 16px" }}>

          {activeTab === "library" && (
            <div>
              <div style={{ display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
                <input className="search-input" style={{ maxWidth:280,flex:"1 1 200px" }} placeholder="Search by name, alias, tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div style={{ display:"flex",gap:6,flex:1,flexWrap:"wrap",alignItems:"center",overflowX:"auto",paddingBottom:2,minWidth:0 }}>
                  {CATEGORIES.map((cat) => (
                    <button type="button" key={cat} className={`cat-btn ${selCat===cat?"active":""}`} onClick={() => handleCategorySelect(cat)}>{cat}</button>
                  ))}
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexWrap:"wrap" }}>
                    <span style={{ color:"#dde4ef",fontSize:11 }}>Sort</span>
                    <div style={{ display:"flex",gap:2,alignItems:"center",flexWrap:"wrap" }}>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSortMode(opt.value)}
                          style={{
                            background:
                              sortMode === opt.value ? "rgba(0,212,170,0.12)" : "rgba(255,255,255,0.03)",
                            border:
                              sortMode === opt.value
                                ? "1px solid rgba(0,212,170,0.5)"
                                : "1px solid #3d4f63",
                            color: sortMode === opt.value ? "rgb(0,212,170)" : "#dde4ef",
                            fontSize: 11,
                            borderRadius: 5,
                            padding: "3px 8px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
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
                                  fontSize: 11,
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
                                      fontSize: 10,
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
                          {p.aliases[0] && <div className="mono" style={{ fontSize:9,color:"#657d99",marginTop:1 }}>{p.aliases[0]}</div>}
                        </div>
                        <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35`,fontSize:9 }}>{cat0}</span>
                      </div>
                      <div style={{ fontSize:11,color:"#7891af",marginBottom:12,lineHeight:1.55 }}>
                        {p.mechanism.length > 90 ? p.mechanism.slice(0,90)+"…" : p.mechanism}
                      </div>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <div className="mono" style={{ fontSize:10,color:"#2e4055" }}><span style={{ color:cc+"80" }}>t½</span> {p.halfLife}</div>
                        <button type="button" className={inStack?"btn-green":"btn-teal"} style={{ padding:"5px 10px",fontSize:11 }}
                          onClick={(e) => { e.stopPropagation(); if (!inStack) openAdd(p); }}>
                          {inStack ? "✓ Saved" : "+ Saved Stack"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {sortedPeptides.length === 0 && <div className="mono" style={{ color:"#243040",fontSize:12,padding:"40px 0",gridColumn:"1/-1" }}>// No results</div>}
              </div>
            </div>
          )}

          {activeTab === "stack" && (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8 }}>
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
                    style={{ fontSize:10,color:"#243040",marginTop:2,maxWidth:520 }}
                    title="A Saved Stack is a named peptide protocol you can build, save, and revisit."
                  >
                    {myStack.length} peptide{myStack.length!==1?"s":""} saved
                    {` · ${Math.max(0, savedStackLimit - myStack.length)} of ${savedStackLimit} Saved Stacks remaining`}
                  </div>
                </div>
                <button type="button" className="btn-teal" onClick={() => setActiveTab("library")}>+ Browse Library</button>
              </div>
              {myStack.length === 0 ? (
                <div style={{ border:"1px dashed #14202e",borderRadius:10,padding:"80px 0",textAlign:"center" }}>
                  <div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>⬡</div>
                  <div className="mono" style={{ color:"#243040",fontSize:12 }}>// No Saved Stacks yet. Add compounds from the Library.</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  <div style={{ marginBottom:4 }}>
                    <div className="mono" style={{ fontSize:9,color:"#00d4aa",marginBottom:6,letterSpacing:".12em" }}>STACK NAME</div>
                    <SavedStackNameInput initialName={stackName} onCommit={setStackName} />
                  </div>
                  {myStack.map((p) => (
                    <SavedStackEntryRow
                      key={getStackRowListKey(p)}
                      item={p}
                      catColor={getCatColor(primaryCategory(p))}
                      catLabel={primaryCategory(p)}
                      onUpdate={updateStackItem}
                      onRemove={removeFromStack}
                    />
                  ))}
                  <div style={{ marginTop:12,background:"#0b0f17",border:"1px solid #14202e",borderRadius:8,padding:14 }}>
                    <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".15em",marginBottom:10 }}>// SAVED STACK BREAKDOWN</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {[...new Set(myStack.map((p) => primaryCategory(p)))].map((cat) => {
                        const cc = getCatColor(cat); const n = myStack.filter((p) => primaryCategory(p) === cat).length;
                        return <span key={cat} className="pill" style={{ background:cc+"15",color:cc,border:`1px solid ${cc}30`,fontSize:10,padding:"4px 10px" }}>{cat}: {n}</span>;
                      })}
                    </div>
                    <button type="button" className="btn-teal" style={{ fontSize:12 }}
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
                        setActiveTab("advisor");
                      }}>
                      Analyze with AI →
                    </button>
                    <div style={{ marginTop:10,fontSize:11,color:"#2e4055" }}>
                      <span style={{ color:"#f59e0b" }}>⚠ </span>Review injection schedules for timing conflicts. Consult your physician.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "advisor" && (
            <div style={{ display:"flex",gap:16,height:"calc(100vh - 170px)",flexDirection:"row" }}>
              <div style={{ width:190,flexShrink:0,overflowY:"auto",display:"flex",flexDirection:"column",gap:5 }} className="advisor-sidebar">
                <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".15em",marginBottom:6 }}>// GOALS <span style={{ color:"#243040" }}>(optional)</span></div>
                {GOALS.map((g) => (
                  <button type="button" key={g} className={`goal-chip ${goals.includes(g)?"on":""}`}
                    onClick={() => setGoals((prev) => prev.includes(g) ? prev.filter((x)=>x!==g) : [...prev,g])}>
                    {g}
                  </button>
                ))}
                {myStack.length > 0 && (
                  <div style={{ marginTop:14,paddingTop:14,borderTop:"1px solid #0e1822" }}>
                    <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".15em",marginBottom:6 }}>// SAVED STACK LOADED</div>
                    {myStack.map((p) => <div key={getStackRowListKey(p)} className="mono" style={{ fontSize:10,color:"#2e4055",padding:"2px 0" }}>→ {p.name}</div>)}
                  </div>
                )}
              </div>

              <div style={{ flex:1,display:"flex",flexDirection:"column",background:"#0b0f17",border:"1px solid #14202e",borderRadius:10,overflow:"hidden",minWidth:0 }}>
                <div style={{ padding:"12px 16px",borderBottom:"1px solid #0e1822",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                  <div className={aiLoading?"pulse":""} style={{ width:7,height:7,borderRadius:"50%",background:aiLoading?"#f59e0b":"#00d4aa",flexShrink:0 }} />
                  <div className="brand" style={{ fontSize:12,color:"#8fa5bf",letterSpacing:".06em" }}>
                    <span style={{ color:"#00d4aa" }}>Pep</span>GuideIQ INTELLIGENCE
                  </div>
                  {goals.length > 0 && <span className="mono" style={{ fontSize:9,color:"#243040" }}>{goals.length} goal{goals.length>1?"s":""} active</span>}
                  {!canAI && <span className="pill" style={{ background:"#f59e0b15",color:"#f59e0b",border:"1px solid #f59e0b30",fontSize:9,marginLeft:"auto" }}>Upgrade to unlock AI</span>}
                </div>

                <div style={{ flex:1,overflowY:"auto",padding:14 }}>
                  {aiMsgs.length === 0 && (
                    <div style={{ textAlign:"center",padding:"32px 16px" }}>
                      <div style={{ fontSize:28,opacity:.2,marginBottom:10 }}>⬡</div>
                      <div className="mono" style={{ color:"#243040",fontSize:11,marginBottom:18 }}>
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
                        <div className="mono" style={{ fontSize:8,color:"#00d4aa",marginBottom:5,letterSpacing:".15em" }}>
                          <span style={{ color:"#00d4aa" }}>Pep</span>GuideIQ
                        </div>
                      )}
                      <div style={{ whiteSpace:"pre-wrap",color:msg.role==="user"?"#dde4ef":"#8fa5bf" }}>{msg.content}</div>
                      {msg.role === "assistant" && msg.limitReached && (
                        <button type="button" className="btn-teal" onClick={openUpgradeModal} style={{ marginTop:10, fontSize:11, padding:"6px 12px" }}>
                          Upgrade for more queries
                        </button>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-msg ai-bot">
                      <div className="mono pulse" style={{ fontSize:10,color:"#00d4aa" }}>// Analyzing protocol data…</div>
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
                    <div style={{ fontSize:11,color:"#8fa5bf",textAlign:"right",marginTop:4 }}>
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
                        fontSize: 11,
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
                  <div className="mono" style={{ fontSize:10,color:"#243040",marginTop:3 }}>{p.aliases.join(" · ")}</div>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35` }}>{pCat}</span>
                  <button type="button" style={{ background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:20,lineHeight:1 }} onClick={() => setSelPeptide(null)} aria-label="Close">×</button>
                </div>
              </div>
              <div style={{ borderLeft:`3px solid ${cc}`,paddingLeft:12,marginBottom:14,fontSize:12,color:"#4a6080",lineHeight:1.6 }}>{p.mechanism}</div>
              {[["Typical Dose",p.typicalDose],["Start Dose",p.startDose],["Titration",p.titrationNote],["Half-life",p.halfLife],["Route",p.route.join(", ")],["Cycle",p.cycle],["Storage",p.storage],["Reconstitution",p.reconstitution]].map(([l,v]) => (
                <div key={l} className="drow"><span className="dlabel">{l}</span><span className="dval mono">{v}</span></div>
              ))}
              <div style={{ marginTop:12 }}>
                <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".12em",marginBottom:7 }}>// BENEFITS</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.benefits.map((b) => <span key={b} className="pill" style={{ background:"#00d4aa0e",color:"#00d4aa70",border:"1px solid #00d4aa18" }}>{b}</span>)}</div>
              </div>
              <div style={{ marginTop:10 }}>
                <div className="mono" style={{ fontSize:9,color:"#f59e0b",letterSpacing:".12em",marginBottom:7 }}>// SIDE EFFECTS</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.sideEffects.map((s) => <span key={s} className="pill" style={{ background:"#f59e0b0e",color:"#f59e0b70",border:"1px solid #f59e0b18" }}>{s}</span>)}</div>
              </div>
              {p.stacksWith.length > 0 && (
                <div style={{ marginTop:10 }}>
                  <div className="mono" style={{ fontSize:9,color:"#8b5cf6",letterSpacing:".12em",marginBottom:7 }}>// STACKS WELL WITH</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>{p.stacksWith.map((s) => <span key={s} className="pill" style={{ background:"#8b5cf60e",color:"#8b5cf670",border:"1px solid #8b5cf618" }}>{s}</span>)}</div>
                </div>
              )}
              {p.notes && (
                <div style={{ marginTop:12,background:"#07090e",border:"1px solid #0e1822",borderRadius:6,padding:12 }}>
                  <div className="mono" style={{ fontSize:8,color:"#243040",marginBottom:5,letterSpacing:".15em" }}>// NOTES</div>
                  <div style={{ fontSize:11,color:"#4a6080",lineHeight:1.65 }}>{p.notes}</div>
                </div>
              )}
              <div style={{ marginTop:16,display:"flex",justifyContent:"flex-end",gap:8 }}>
                <button type="button" className="btn-teal" style={{ fontSize:12 }}
                  onClick={() => { setSelPeptide(null); setAiInput(`Deep dive on ${p.name}: optimal protocol, titration, stacking strategy, and advanced use cases`); setActiveTab("advisor"); }}>
                  Ask AI →
                </button>
                <button type="button" className={inStack?"btn-green":"btn-teal"} style={{ fontSize:12 }}
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

      </div>
    </>
  );
}
