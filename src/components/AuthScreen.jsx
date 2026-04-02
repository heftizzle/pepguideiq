import { useState } from "react";
import { PLANS } from "../data/catalog.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { getCurrentUser, signIn, signUp } from "../lib/supabase.js";
import { getTier } from "../lib/tiers.js";
import { Logo } from "./Logo.jsx";

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: err } = await signIn(form.email, form.password);
        if (err) {
          setError(err.message || "Sign in failed.");
          return;
        }
        const u = await getCurrentUser();
        if (u) onAuth(u);
        else setError("Could not load profile.");
      } else {
        if (!form.name?.trim() || !form.email?.trim() || !form.password) {
          setError("All fields required.");
          return;
        }
        setMode("plans");
      }
    } finally {
      setBusy(false);
    }
  };

  const selectPlan = async (planId) => {
    setError("");
    setBusy(true);
    try {
      const { error: err } = await signUp(form.name.trim(), form.email.trim(), form.password, planId);
      if (err) {
        setError(err.message || "Sign up failed.");
        return;
      }
      const u = await getCurrentUser();
      if (u) {
        onAuth(u);
        return;
      }
      setError("Check your email to confirm your account (if required), then sign in.");
      setMode("login");
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07090e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <Logo style={{ marginBottom: 20 }} />
          <div className="mono" style={{ fontSize: 11, color: "#4a6080", lineHeight: 1.6 }}>
            Copy <code style={{ color: "#00d4aa" }}>.env.example</code> to{" "}
            <code style={{ color: "#00d4aa" }}>.env.local</code> and set{" "}
            <code style={{ color: "#00d4aa" }}>VITE_SUPABASE_URL</code> and{" "}
            <code style={{ color: "#00d4aa" }}>VITE_SUPABASE_ANON_KEY</code>, then restart{" "}
            <code style={{ color: "#00d4aa" }}>npm run dev</code>.
          </div>
        </div>
      </div>
    );
  }

  if (mode === "plans") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#07090e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <Logo style={{ marginBottom: 28 }} />
        <div
          className="mono"
          style={{
            fontSize: 9,
            color: "#a0a0b0",
            letterSpacing: ".2em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          SELECT YOUR PLAN
        </div>
        {error && (
          <div
            style={{
              fontSize: 11,
              color: "#ef4444",
              marginBottom: 16,
              fontFamily: "'JetBrains Mono',monospace",
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: 12,
            maxWidth: 720,
            width: "100%",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "#0b0f17",
                border: `1px solid ${plan.popular ? plan.color : "#14202e"}`,
                borderRadius: 10,
                padding: 20,
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.color,
                    color: "#07090e",
                    fontSize: 8,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono',monospace",
                    padding: "2px 12px",
                    borderRadius: "0 0 6px 6px",
                    letterSpacing: ".12em",
                    whiteSpace: "nowrap",
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <div
                className="brand"
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: plan.color,
                  marginBottom: 4,
                  marginTop: plan.popular ? 8 : 0,
                }}
              >
                {plan.label}
              </div>
              <div style={{ marginBottom: 14 }}>
                <span className="brand" style={{ fontSize: 22, fontWeight: 800, color: "#dde4ef" }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 10, color: "#4a6080", marginLeft: 4 }}>{plan.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: plan.color, fontSize: 10, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 11, color: "#4a6080", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-teal"
                style={{
                  borderColor: plan.color,
                  color: plan.color,
                  background: plan.color + "12",
                  width: "100%",
                  padding: "8px 0",
                  fontSize: 12,
                  opacity: busy ? 0.6 : 1,
                }}
                disabled={busy}
                onClick={() => selectPlan(plan.id)}
              >
                {busy ? "…" : plan.id === "entry" ? `Start ${getTier("entry").label}` : `Get ${plan.label}`}
              </button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: "#a0a0b0" }}>
          Subscriptions managed via App Store / Google Play on mobile.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo />
          <div className="mono" style={{ fontSize: 9, color: "#a0a0b0", letterSpacing: ".18em", marginTop: 4 }}>
            {mode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        <div style={{ background: "#0b0f17", border: "1px solid #14202e", borderRadius: 10, padding: 24 }}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
                NAME
              </div>
              <input
                className="form-input"
                style={{ width: "100%" }}
                value={form.name}
                placeholder="Your name"
                onChange={set("name")}
              />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
              EMAIL
            </div>
            <input
              className="form-input"
              style={{ width: "100%" }}
              type="email"
              value={form.email}
              placeholder="you@email.com"
              onChange={set("email")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
              PASSWORD
            </div>
            <input
              className="form-input"
              style={{ width: "100%" }}
              type="password"
              value={form.password}
              placeholder="••••••••"
              onChange={set("password")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {error && (
            <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>
              {error}
            </div>
          )}
          <button
            type="button"
            className="btn-teal"
            style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: busy ? 0.6 : 1 }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "…" : mode === "login" ? "Sign In" : "Continue"}
          </button>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#a0a0b0" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00d4aa",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00d4aa",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
