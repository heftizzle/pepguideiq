import { useState, useEffect, useRef } from "react";
import { PEPTIDES, CATEGORIES, GOALS, CAT_COLORS, PLANS } from "./data/catalog.js";

const DEMO_USER = { id:"u1", email:"demo@pepguideiq.io", password:"demo1234", name:"Demo User", plan:"pro" };

function mockLogin(email, pw) {
  if (email === DEMO_USER.email && pw === DEMO_USER.password) return { ...DEMO_USER, password: undefined };
  return null;
}

function mockRegister(name, email) {
  return { id:"u_" + Date.now(), email, name, plan: "free" };
}

const getCatColor = (cat) => CAT_COLORS[cat] || "#00d4aa";

function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = () => [...el.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')];
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const els = focusable();
      if (!els.length) return;
      if (e.shiftKey) {
        if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
      } else {
        if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
      }
    };
    focusable()[0]?.focus();
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [active, ref]);
}

function Modal({ onClose, children, maxWidth = 580, label = "Dialog" }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);

  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16 }}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{ background:"#0b0f17",border:"1px solid #1a2840",borderRadius:12,padding:24,maxWidth,width:"100%",maxHeight:"90vh",overflowY:"auto" }}
      >
        {children}
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);
  const [newUser, setNewUser] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setError(""); setBusy(true);
    setTimeout(() => {
      if (mode === "login") {
        const u = mockLogin(form.email, form.password);
        if (u) onAuth(u); else setError("Invalid email or password.");
      } else {
        if (!form.name || !form.email || !form.password) { setError("All fields required."); setBusy(false); return; }
        const u = mockRegister(form.name, form.email);
        setNewUser(u); setMode("plans");
      }
      setBusy(false);
    }, 500);
  };

  const selectPlan = (planId) => onAuth({ ...newUser, plan: planId });

  if (mode === "plans") {
    return (
      <div style={{ minHeight:"100vh",background:"#07090e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px" }}>
        <Logo style={{ marginBottom:28 }} />
        <div className="mono" style={{ fontSize:9,color:"#243040",letterSpacing:".2em",marginBottom:28,textAlign:"center" }}>SELECT YOUR PLAN</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,maxWidth:720,width:"100%" }}>
          {PLANS.map((plan) => (
            <div key={plan.id} style={{ background:"#0b0f17",border:`1px solid ${plan.popular ? plan.color : "#14202e"}`,borderRadius:10,padding:20,position:"relative",display:"flex",flexDirection:"column" }}>
              {plan.popular && (
                <div style={{ position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",background:plan.color,color:"#07090e",fontSize:8,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",padding:"2px 12px",borderRadius:"0 0 6px 6px",letterSpacing:".12em",whiteSpace:"nowrap" }}>MOST POPULAR</div>
              )}
              <div className="brand" style={{ fontWeight:800,fontSize:15,color:plan.color,marginBottom:4,marginTop:plan.popular?8:0 }}>{plan.label}</div>
              <div style={{ marginBottom:14 }}>
                <span className="brand" style={{ fontSize:22,fontWeight:800,color:"#dde4ef" }}>{plan.price}</span>
                <span style={{ fontSize:10,color:"#4a6080",marginLeft:4 }}>{plan.period}</span>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:18,flex:1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display:"flex",gap:6,alignItems:"flex-start" }}>
                    <span style={{ color:plan.color,fontSize:10,marginTop:2,flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:11,color:"#4a6080",lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-teal" style={{ borderColor:plan.color,color:plan.color,background:plan.color+"12",width:"100%",padding:"8px 0",fontSize:12 }} onClick={() => selectPlan(plan.id)}>
                {plan.id === "free" ? "Start Free" : `Get ${plan.label}`}
              </button>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16,fontSize:11,color:"#243040" }}>Subscriptions managed via App Store / Google Play on mobile.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:"#07090e",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:380 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <Logo />
          <div className="mono" style={{ fontSize:9,color:"#243040",letterSpacing:".18em",marginTop:4 }}>
            {mode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        <div style={{ background:"#0b0f17",border:"1px solid #14202e",borderRadius:10,padding:24 }}>
          {mode === "register" && (
            <div style={{ marginBottom:14 }}>
              <div className="mono" style={{ fontSize:9,color:"#00d4aa",marginBottom:5,letterSpacing:".12em" }}>NAME</div>
              <input className="form-input" style={{ width:"100%" }} value={form.name} placeholder="Your name" onChange={set("name")} />
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <div className="mono" style={{ fontSize:9,color:"#00d4aa",marginBottom:5,letterSpacing:".12em" }}>EMAIL</div>
            <input className="form-input" style={{ width:"100%" }} type="email" value={form.email} placeholder="you@email.com" onChange={set("email")}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="mono" style={{ fontSize:9,color:"#00d4aa",marginBottom:5,letterSpacing:".12em" }}>PASSWORD</div>
            <input className="form-input" style={{ width:"100%" }} type="password" value={form.password} placeholder="••••••••" onChange={set("password")}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {error && <div style={{ fontSize:11,color:"#ef4444",marginBottom:14,fontFamily:"'JetBrains Mono',monospace" }}>{error}</div>}
          <button type="button" className="btn-teal" style={{ width:"100%",padding:"10px 0",fontSize:13,opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>
            {busy ? "…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div style={{ marginTop:16,textAlign:"center",fontSize:11,color:"#243040" }}>
            {mode === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button type="button" style={{ background:"none",border:"none",color:"#00d4aa",cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif" }} onClick={() => { setMode("register"); setError(""); }}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" style={{ background:"none",border:"none",color:"#00d4aa",cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif" }} onClick={() => { setMode("login"); setError(""); }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          {mode === "login" && (
            <div style={{ marginTop:12,textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#1a2840",fontFamily:"'JetBrains Mono',monospace",marginBottom:4 }}>— DEMO ACCOUNT —</div>
              <div style={{ fontSize:9,color:"#243040",fontFamily:"'JetBrains Mono',monospace" }}>demo@pepguideiq.io / demo1234</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Logo({ size = 19, style = {} }) {
  return (
    <div style={{ display:"inline-flex",alignItems:"center",gap:10,...style }}>
      <div style={{ width:32,height:32,background:"linear-gradient(135deg,#00d4aa,#0891b2)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>⬡</div>
      <div>
        <div className="brand" style={{ fontSize:size,fontWeight:800,letterSpacing:".05em",lineHeight:1.1 }}>
          <span style={{ color:"#00d4aa" }}>Pep</span><span style={{ color:"#dde4ef" }}>Guide</span><span style={{ color:"#00d4aa",fontSize:size*.7 }}>IQ</span>
        </div>
        <div className="mono" style={{ fontSize:7,color:"#243040",letterSpacing:".18em" }}>RESEARCH INTELLIGENCE</div>
      </div>
    </div>
  );
}

export default function PepGuideIQ() {
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
  const msgEnd = useRef(null);

  const filtered = PEPTIDES.filter((p) => {
    const mc = selCat === "All" || p.category === selCat;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    return mc && ms;
  });

  const canAddToStack = user?.plan !== "free" || myStack.length < 3;
  const canAI = user?.plan !== "free";

  const openAdd = (p) => { setAddTarget(p); setStackEntry({ dose:p.startDose, frequency:"", notes:"" }); setShowAdd(true); };
  const confirmAdd = () => {
    if (!addTarget) return;
    if (!canAddToStack) { setShowUpgrade(true); setShowAdd(false); return; }
    if (!myStack.find((s) => s.id === addTarget.id)) {
      setMyStack((prev) => [...prev, { ...addTarget, stackDose:stackEntry.dose, stackFrequency:stackEntry.frequency, stackNotes:stackEntry.notes, addedDate:new Date().toLocaleDateString() }]);
    }
    setShowAdd(false); setAddTarget(null);
  };
  const removeFromStack = (id) => setMyStack((prev) => prev.filter((s) => s.id !== id));

  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    if (!canAI) { setShowUpgrade(true); return; }
    const userMsg = { role:"user", content:aiInput };
    const msgs = [...aiMsgs, userMsg];
    setAiMsgs(msgs); setAiInput(""); setAiLoading(true);
    const stackCtx = myStack.length > 0 ? `\n\nUser's current stack: ${myStack.map((p) => `${p.name} (${p.stackDose||p.startDose}${p.stackFrequency?", "+p.stackFrequency:""})`).join("; ")}.` : "";
    const goalsCtx = goals.length > 0 ? `\n\nUser's goals: ${goals.join(", ")}.` : "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are an expert peptide research advisor with deep knowledge of peptide pharmacology, biohacking protocols, dosing strategies, and interactions. Be direct, technical, and practical. Always include safety notes — these are research chemicals requiring physician oversight. The user is an advanced biohacker.${stackCtx}${goalsCtx}`,
          messages:msgs }),
      });
      const data = await res.json();
      setAiMsgs((prev) => [...prev, { role:"assistant", content:data.content?.[0]?.text || "No response." }]);
    } catch {
      setAiMsgs((prev) => [...prev, { role:"assistant", content:"API error — check connection." }]);
    }
    setAiLoading(false);
  };

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [aiMsgs]);

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
                  <span className="pill" style={{ background: user.plan==="elite"?"#f59e0b20":user.plan==="pro"?"#00d4aa20":"#14202e", color:user.plan==="elite"?"#f59e0b":user.plan==="pro"?"#00d4aa":"#4a6080", border:`1px solid ${user.plan==="elite"?"#f59e0b30":user.plan==="pro"?"#00d4aa30":"#14202e"}`, fontSize:9 }}>
                    {user.plan.toUpperCase()}
                  </span>
                  <span style={{ fontSize:11,color:"#243040",fontFamily:"'JetBrains Mono',monospace" }}>{user.name}</span>
                  <button type="button" className="btn-red" style={{ fontSize:10,padding:"3px 8px" }} onClick={() => setUser(null)}>↩</button>
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
                  <div className="mono" style={{ fontSize:10,color:"#243040",marginTop:2 }}>{myStack.length} compound{myStack.length!==1?"s":""} active{user.plan==="free"?` · ${3-myStack.length} slots remaining (Free plan)`:""}</div>
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
                          <button type="button" key={s} className="sugg-btn" onClick={() => canAI ? setAiInput(s) : setShowUpgrade(true)}>{s}</button>
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
          <Modal onClose={() => setShowUpgrade(false)} maxWidth={480} label="Upgrade Plan">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
              <div className="brand" style={{ fontSize:16,fontWeight:700 }}>Upgrade Your Plan</div>
              <button type="button" style={{ background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:20 }} onClick={() => setShowUpgrade(false)} aria-label="Close">×</button>
            </div>
            <div style={{ fontSize:12,color:"#4a6080",marginBottom:20 }}>
              {user.plan === "free" ? "You've hit the Free plan limit. Upgrade to unlock unlimited stack tracking and AI Advisor." : "Upgrade to Elite for lab tracking, custom entries, and physician export."}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {PLANS.filter((p) => p.id !== "free" && p.id !== user.plan).map((plan) => (
                <div key={plan.id} style={{ background:"#07090e",border:`1px solid ${plan.color}30`,borderRadius:8,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div className="brand" style={{ color:plan.color,fontWeight:700,fontSize:14 }}>{plan.label} — {plan.price}<span style={{ fontSize:10,color:"#4a6080" }}> {plan.period}</span></div>
                    <div style={{ fontSize:11,color:"#4a6080",marginTop:3 }}>{plan.features[0]}, {plan.features[1]}</div>
                  </div>
                  <button type="button" className="btn-teal" style={{ borderColor:plan.color,color:plan.color,background:plan.color+"12",fontSize:12,whiteSpace:"nowrap",marginLeft:12 }}
                    onClick={() => { setUser((u) => ({ ...u, plan:plan.id })); setShowUpgrade(false); }}>
                    Upgrade
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14,fontSize:10,color:"#243040",fontFamily:"'JetBrains Mono',monospace" }}>
              Subscriptions billed via App Store / Google Play on mobile.
            </div>
          </Modal>
        )}

      </div>
    </>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-thumb{background:#00d4aa30;border-radius:2px}
      .grid-bg{background-image:linear-gradient(rgba(0,212,170,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,.025) 1px,transparent 1px);background-size:48px 48px}
      .tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;color:#4a6080;padding:12px 16px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;white-space:nowrap}
      .tab-btn:hover{color:#8fa5bf}
      .tab-btn.active{color:#00d4aa;border-bottom-color:#00d4aa}
      .pcard{background:#0b0f17;border:1px solid #14202e;border-radius:8px;padding:16px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
      .pcard::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--cc,#00d4aa);opacity:.5}
      .pcard:hover{border-color:var(--cc,#00d4aa);transform:translateY(-2px);box-shadow:0 10px 40px rgba(0,0,0,.5)}
      .pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
      .search-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:10px 14px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:13px;outline:none;transition:border-color .2s;width:100%}
      .search-input:focus{border-color:#00d4aa50}
      .search-input::placeholder{color:#243040}
      .btn-teal{background:#00d4aa14;border:1px solid #00d4aa;color:#00d4aa;padding:7px 14px;border-radius:5px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;transition:all .2s}
      .btn-teal:hover{background:#00d4aa22}
      .btn-teal:disabled{opacity:.4;cursor:not-allowed}
      .btn-green{background:#10b98115;border:1px solid #10b981;color:#10b981;padding:7px 14px;border-radius:5px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:12px;font-weight:500}
      .btn-red{background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 11px;border-radius:4px;cursor:pointer;font-size:11px;font-family:'Outfit',sans-serif;transition:all .2s}
      .btn-red:hover{background:#ef444418}
      .cat-btn{background:transparent;border:1px solid #14202e;color:#4a6080;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:11px;white-space:nowrap;transition:all .2s;font-family:'Outfit',sans-serif}
      .cat-btn.active{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .cat-btn:hover:not(.active){border-color:#243040;color:#8fa5bf}
      .mono{font-family:'JetBrains Mono',monospace}
      .brand{font-family:'Oxanium',sans-serif}
      .drow{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #0e1822;align-items:flex-start}
      .dlabel{font-family:'JetBrains Mono',monospace;font-size:9px;color:#00d4aa;text-transform:uppercase;letter-spacing:.12em;min-width:110px;padding-top:3px;flex-shrink:0}
      .dval{font-size:12px;color:#8fa5bf;flex:1;line-height:1.5}
      .goal-chip{padding:6px 10px;border-radius:20px;border:1px solid #14202e;background:transparent;color:#4a6080;cursor:pointer;font-size:11px;font-family:'Outfit',sans-serif;transition:all .2s;text-align:left;width:100%}
      .goal-chip.on{border-color:#00d4aa;color:#00d4aa;background:#00d4aa10}
      .ai-msg{padding:12px 14px;border-radius:8px;margin:6px 0;font-size:13px;line-height:1.65;animation:fi .3s ease}
      @keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
      .ai-user{background:#00d4aa0e;border:1px solid #00d4aa18;margin-left:32px}
      .ai-bot{background:#0b0f17;border:1px solid #14202e;margin-right:32px}
      .ai-input{background:#0b0f17;border:1px solid #14202e;color:#dde4ef;padding:11px 13px;border-radius:7px;font-family:'Outfit',sans-serif;font-size:13px;outline:none;resize:none;flex:1;transition:border-color .2s}
      .ai-input:focus{border-color:#00d4aa50}
      .scard{background:#0b0f17;border:1px solid #14202e;border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:14px;transition:border-color .2s}
      .scard:hover{border-color:#1e2e40}
      .form-input{background:#07090e;border:1px solid #14202e;color:#dde4ef;padding:8px 11px;border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:12px;outline:none;width:100%;transition:border-color .2s}
      .form-input:focus{border-color:#00d4aa50}
      .pulse{animation:pulse 2s infinite}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      .sugg-btn{background:#0b0f17;border:1px solid #14202e;color:#4a6080;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Outfit',sans-serif;text-align:left;transition:all .2s;width:100%}
      .sugg-btn:hover{border-color:#00d4aa30;color:#8fa5bf}
      .advisor-sidebar{scrollbar-width:thin}
      @media (max-width: 640px) {
        .advisor-sidebar{display:none}
        .tab-btn{padding:10px 10px;font-size:11px}
      }
    `}</style>
  );
}
