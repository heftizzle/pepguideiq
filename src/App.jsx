import { useState, useEffect, useRef } from "react";
import { PEPTIDES, CATEGORIES, GOALS, CAT_COLORS, PLANS } from "./data/catalog.js";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import { Logo } from "./components/Logo.jsx";
import { Modal } from "./components/Modal.jsx";
import { formatPlan, hasAccess, TIER_ORDER } from "./lib/tiers.js";

function getNextTierId(plan) {
  const p = plan ?? "entry";
  const i = TIER_ORDER.indexOf(p);
  if (i === -1 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1];
}
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "./lib/config.js";
import {
  getCurrentUser,
  getSessionAccessToken,
  loadStack,
  onAuthStateChange,
  saveStack,
  signOut,
  updateUserPlan,
} from "./lib/supabase.js";

const getCatColor = (cat) => CAT_COLORS[cat] || "#00d4aa";

export default function PepGuideIQ() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [user, setUser]           = useState(null);
  const [activeTab, setActiveTab] = useState("library");
  const [selCat, setSelCat]       = useState("All");
  const [search, setSearch]       = useState("");
  const [selPeptide, setSelPeptide] = useState(null);
  const [myStack, setMyStack]     = useState([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [addTarget, setAddTarget] = useState(null);
  const [stackEntry, setStackEntry] = useState({ dose:"", frequency:"", notes:"" });
  const [aiMsgs, setAiMsgs]       = useState([]);
  const [aiInput, setAiInput]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [goals, setGoals]         = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  /** Which paid tier row to emphasize when the modal opens (next tier above current). */
  const [upgradeFocusTier, setUpgradeFocusTier] = useState(null);
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
      setMyStack(Array.isArray(s) ? s : []);
      stackHydrated.current = true;
    });
    return () => {
      ignore = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured() || !stackHydrated.current) return;
    const t = setTimeout(() => {
      saveStack(user.id, myStack);
    }, 800);
    return () => clearTimeout(t);
  }, [myStack, user?.id]);

  const filtered = PEPTIDES.filter((p) => {
    const mc = selCat === "All" || p.category === selCat;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    return mc && ms;
  });

  const canAddToStack = hasAccess(user?.plan, "pro") || myStack.length < 3;
  const canAI = hasAccess(user?.plan, "pro");

  const openUpgradeModal = () => {
    setUpgradeFocusTier(getNextTierId(user?.plan));
    setShowUpgrade(true);
  };
  const closeUpgradeModal = () => {
    setShowUpgrade(false);
    setUpgradeFocusTier(null);
  };

  const openAdd = (p) => { setAddTarget(p); setStackEntry({ dose:p.startDose, frequency:"", notes:"" }); setShowAdd(true); };
  const confirmAdd = () => {
    if (!addTarget) return;
    if (!canAddToStack) { openUpgradeModal(); setShowAdd(false); return; }
    if (!myStack.find((s) => s.id === addTarget.id)) {
      setMyStack((prev) => [...prev, { ...addTarget, stackDose:stackEntry.dose, stackFrequency:stackEntry.frequency, stackNotes:stackEntry.notes, addedDate:new Date().toLocaleDateString() }]);
    }
    setShowAdd(false); setAddTarget(null);
  };
  const removeFromStack = (id) => setMyStack((prev) => prev.filter((s) => s.id !== id));

  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    if (!canAI) { openUpgradeModal(); return; }
    const userMsg = { role:"user", content:aiInput };
    const msgs = [...aiMsgs, userMsg];
    setAiMsgs(msgs); setAiInput(""); setAiLoading(true);
    const stackCtx = myStack.length > 0 ? `\n\nUser's current stack: ${myStack.map((p) => `${p.name} (${p.stackDose||p.startDose}${p.stackFrequency?", "+p.stackFrequency:""})`).join("; ")}.` : "";
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
        const errText = typeof data.error === "string" ? data.error : data.error?.message || `Worker ${res.status}`;
        throw new Error(errText);
      }
      const text = typeof data.text === "string" ? data.text : "";
      setAiMsgs((prev) => [...prev, { role: "assistant", content: text || "No response." }]);
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
                  { id:"stack",   label:"My Stack", count:myStack.length||null },
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
                <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:2,flexWrap:"wrap" }}>
                  {CATEGORIES.map((cat) => (
                    <button type="button" key={cat} className={`cat-btn ${selCat===cat?"active":""}`} onClick={() => setSelCat(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
                {filtered.map((p) => {
                  const cc = getCatColor(p.category);
                  const inStack = myStack.some((s) => s.id === p.id);
                  return (
                    <div key={p.id} className="pcard" style={{ "--cc":cc }} onClick={() => setSelPeptide(p)} onKeyDown={(e) => e.key === "Enter" && setSelPeptide(p)} role="button" tabIndex={0}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                        <div>
                          <div className="brand" style={{ fontWeight:700,fontSize:14,color:"#dde4ef" }}>{p.name}</div>
                          {p.aliases[0] && <div className="mono" style={{ fontSize:9,color:"#243040",marginTop:1 }}>{p.aliases[0]}</div>}
                        </div>
                        <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35`,fontSize:9 }}>{p.category.split("/")[0].trim()}</span>
                      </div>
                      <div style={{ fontSize:11,color:"#4a6080",marginBottom:12,lineHeight:1.55 }}>
                        {p.mechanism.length > 90 ? p.mechanism.slice(0,90)+"…" : p.mechanism}
                      </div>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <div className="mono" style={{ fontSize:10,color:"#2e4055" }}><span style={{ color:cc+"80" }}>t½</span> {p.halfLife}</div>
                        <button type="button" className={inStack?"btn-green":"btn-teal"} style={{ padding:"5px 10px",fontSize:11 }}
                          onClick={(e) => { e.stopPropagation(); if (!inStack) openAdd(p); }}>
                          {inStack ? "✓ In Stack" : "+ Stack"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="mono" style={{ color:"#243040",fontSize:12,padding:"40px 0",gridColumn:"1/-1" }}>// No results</div>}
              </div>
            </div>
          )}

          {activeTab === "stack" && (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:8 }}>
                <div>
                  <div className="brand" style={{ fontSize:17,fontWeight:700 }}>MY PROTOCOL STACK</div>
                  <div className="mono" style={{ fontSize:10,color:"#243040",marginTop:2 }}>{myStack.length} compound{myStack.length!==1?"s":""} active{user.plan==="entry"?` · ${3-myStack.length} slots remaining (Entry plan)`:""}</div>
                </div>
                <button type="button" className="btn-teal" onClick={() => setActiveTab("library")}>+ Browse Library</button>
              </div>
              {myStack.length === 0 ? (
                <div style={{ border:"1px dashed #14202e",borderRadius:10,padding:"80px 0",textAlign:"center" }}>
                  <div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>⬡</div>
                  <div className="mono" style={{ color:"#243040",fontSize:12 }}>// Stack is empty. Add compounds from the Library.</div>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {myStack.map((p) => {
                    const cc = getCatColor(p.category);
                    return (
                      <div key={p.id} className="scard">
                        <div style={{ width:3,height:44,background:cc,borderRadius:2,flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6 }}>
                            <div>
                              <div className="brand" style={{ fontWeight:700,fontSize:14 }}>{p.name}</div>
                              <div className="mono" style={{ fontSize:9,color:"#243040",marginTop:2 }}>{p.category} · added {p.addedDate}</div>
                            </div>
                            <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                              <span className="pill" style={{ background:cc+"15",color:cc,border:`1px solid ${cc}30` }}>{p.stackDose||p.startDose}</span>
                              {p.stackFrequency && <span className="pill" style={{ background:"#14202e",color:"#4a6080" }}>{p.stackFrequency}</span>}
                              <button type="button" className="btn-red" onClick={() => removeFromStack(p.id)}>✕</button>
                            </div>
                          </div>
                          {p.stackNotes && <div style={{ fontSize:11,color:"#2e4055",marginTop:5,fontStyle:"italic" }}>{p.stackNotes}</div>}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:12,background:"#0b0f17",border:"1px solid #14202e",borderRadius:8,padding:14 }}>
                    <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".15em",marginBottom:10 }}>// STACK BREAKDOWN</div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {[...new Set(myStack.map((p) => p.category))].map((cat) => {
                        const cc = getCatColor(cat); const n = myStack.filter((p) => p.category===cat).length;
                        return <span key={cat} className="pill" style={{ background:cc+"15",color:cc,border:`1px solid ${cc}30`,fontSize:10,padding:"4px 10px" }}>{cat}: {n}</span>;
                      })}
                    </div>
                    <button type="button" className="btn-teal" style={{ fontSize:12 }}
                      onClick={() => { setAiInput(`Analyze my current stack and give me optimization recommendations, timing protocols, and safety considerations: ${myStack.map((p)=>p.name).join(", ")}`); setActiveTab("advisor"); }}>
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
                    <div className="mono" style={{ fontSize:9,color:"#00d4aa",letterSpacing:".15em",marginBottom:6 }}>// STACK LOADED</div>
                    {myStack.map((p) => <div key={p.id} className="mono" style={{ fontSize:10,color:"#2e4055",padding:"2px 0" }}>→ {p.name}</div>)}
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
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-msg ai-bot">
                      <div className="mono pulse" style={{ fontSize:10,color:"#00d4aa" }}>// Analyzing protocol data…</div>
                    </div>
                  )}
                  <div ref={msgEnd} />
                </div>

                <div style={{ padding:10,borderTop:"1px solid #0e1822",display:"flex",gap:8 }}>
                  <textarea className="ai-input" rows={2} placeholder="Ask about dosing, protocols, stacking, mechanisms, cycling…"
                    value={aiInput} onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); } }}
                  />
                  <button type="button" className="btn-teal" onClick={sendAI} disabled={aiLoading||!aiInput.trim()} style={{ padding:"0 18px",alignSelf:"stretch",fontSize:16 }}>
                    {aiLoading?"…":"→"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {selPeptide && (() => {
          const p = selPeptide; const cc = getCatColor(p.category); const inStack = myStack.some((s)=>s.id===p.id);
          return (
            <Modal onClose={() => setSelPeptide(null)} label={p.name}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                <div>
                  <div className="brand" style={{ fontSize:20,fontWeight:800,color:"#dde4ef" }}>{p.name}</div>
                  <div className="mono" style={{ fontSize:10,color:"#243040",marginTop:3 }}>{p.aliases.join(" · ")}</div>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <span className="pill" style={{ background:cc+"20",color:cc,border:`1px solid ${cc}35` }}>{p.category}</span>
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
                  {inStack ? "✓ In Stack" : "+ Add to Stack"}
                </button>
              </div>
            </Modal>
          );
        })()}

        {showAdd && addTarget && (
          <Modal onClose={() => { setShowAdd(false); setAddTarget(null); }} maxWidth={380} label="Add to Stack">
            <div className="brand" style={{ fontSize:15,fontWeight:700,marginBottom:3 }}>Add to Stack</div>
            <div className="mono" style={{ fontSize:10,color:"#243040",marginBottom:18 }}>{addTarget.name}</div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {[["DOSE","dose",addTarget.startDose],["FREQUENCY","frequency","e.g. Daily, 2x/week, Pre-sleep"],["NOTES","notes","Optional notes…"]].map(([label,key,ph]) => (
                <div key={key}>
                  <div className="mono" style={{ fontSize:9,color:"#00d4aa",marginBottom:5,letterSpacing:".12em" }}>{label}</div>
                  <input className="form-input" value={stackEntry[key]} placeholder={ph} onChange={(e) => setStackEntry((prev) => ({ ...prev,[key]:e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:18,display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button type="button" className="btn-red" onClick={() => { setShowAdd(false); setAddTarget(null); }}>Cancel</button>
              <button type="button" className="btn-teal" onClick={confirmAdd}>Add to Stack</button>
            </div>
          </Modal>
        )}

        {showUpgrade && (
          <Modal onClose={closeUpgradeModal} maxWidth={540} label="Upgrade Plan">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <div className="brand" style={{ fontSize:16,fontWeight:700 }}>Upgrade Your Plan</div>
              <button type="button" style={{ background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:20 }} onClick={closeUpgradeModal}>×</button>
            </div>
            <div style={{ fontSize:12,color:"#4a6080",marginBottom:20 }}>
              Unlock the full protocol stack.
            </div>

            {(() => {
              const upgradeHandler = async (planId) => {
                const { error } = await updateUserPlan(planId);
                if (!error) {
                  const u = await getCurrentUser();
                  if (u) setUser(u);
                }
                closeUpgradeModal();
              };

              const PlanCard = ({ plan }) => {
                const isCurrent = plan.id === user.plan;
                const isEntry = plan.id === "entry";
                const canUpgrade = !isCurrent && !isEntry;
                const btnText = isCurrent ? "Current" : isEntry ? "Included" : "Upgrade";
                const isFocused = upgradeFocusTier === plan.id;

                return (
                  <div style={{
                    background:"#07090e",
                    border:`${isFocused ? 2 : 1}px solid ${isFocused ? plan.color : plan.color + "30"}`,
                    boxShadow: isFocused ? `0 0 0 1px ${plan.color}50, 0 8px 24px ${plan.color}18` : "none",
                    borderRadius:8,padding:14,display:"flex",flexDirection:"column",gap:10,
                  }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10 }}>
                      <div>
                        <div className="brand" style={{ color:plan.color,fontWeight:800,fontSize:14 }}>{plan.label}</div>
                        <div style={{ marginTop:2 }}>
                          <span className="brand" style={{ fontSize:20,fontWeight:800,color:"#dde4ef" }}>{plan.price}</span>
                          <span style={{ fontSize:10,color:"#4a6080",marginLeft:4 }}>{plan.period}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-teal"
                        disabled={!canUpgrade}
                        style={{
                          borderColor: plan.color,
                          color: plan.color,
                          background: plan.color + "12",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          opacity: canUpgrade ? 1 : 0.5,
                          cursor: canUpgrade ? "pointer" : "not-allowed",
                        }}
                        onClick={() => void upgradeHandler(plan.id)}
                      >
                        {btnText}
                      </button>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      {plan.features.map((f) => (
                        <div key={f} style={{ fontSize:11,color:"#4a6080",lineHeight:1.4 }}>{f}</div>
                      ))}
                    </div>
                  </div>
                );
              };

              const goatPlan = PLANS.find((p) => p.id === "goat");
              const goatDisabled = user.plan === "goat";

              return (
                <>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8 }}>
                    {PLANS.filter((p) => p.id !== "goat").map((plan) => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>

                  <div style={{
                    border: `${upgradeFocusTier === "goat" ? 2 : 1}px solid ${upgradeFocusTier === "goat" ? "#a855f7" : "#a855f730"}`,
                    boxShadow: upgradeFocusTier === "goat" ? "0 0 0 1px #a855f750, 0 8px 24px #a855f718" : "none",
                    borderRadius:8,
                    background:"#a855f708",
                    padding:16,
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                  }}>
                    <div>
                      <div className="brand" style={{ color:"#a855f7",fontWeight:800,fontSize:16 }}>
                        GOAT — {goatPlan?.price ?? "$21.99"}
                        <span style={{ fontSize:10,color:"#4a6080" }}> {goatPlan?.period ?? "/mo"}</span>
                      </div>
                      <div style={{ fontSize:11,color:"#4a6080",marginTop:4 }}>4 profiles · 60 stack slots · 48 AI queries/day · Family / Couples plan</div>
                    </div>
                    <button
                      type="button"
                      className="btn-teal"
                      disabled={goatDisabled}
                      style={{
                        borderColor: "#a855f7",
                        color: "#a855f7",
                        background: "#a855f712",
                        whiteSpace: "nowrap",
                        marginLeft: 16,
                        opacity: goatDisabled ? 0.5 : 1,
                        cursor: goatDisabled ? "not-allowed" : "pointer",
                      }}
                      onClick={() => void upgradeHandler("goat")}
                    >
                      {goatDisabled ? "Current" : "Go GOAT"}
                    </button>
                  </div>
                </>
              );
            })()}

            <div style={{ marginTop:14,fontSize:10,color:"#243040",fontFamily:"'JetBrains Mono',monospace" }}>
              Subscriptions billed monthly. Cancel anytime.
            </div>
          </Modal>
        )}

      </div>
    </>
  );
}
