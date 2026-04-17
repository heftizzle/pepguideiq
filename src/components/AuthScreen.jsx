import { useEffect, useRef, useState } from "react";
import { PLANS } from "../data/catalog.js";
import { captureAffiliateRefFromLocation, getAffiliatePriceDisplay, getStoredAffiliateRef } from "../lib/affiliateRef.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import {
  authResetPassword,
  checkPwnedPassword,
  fetchMemberProfiles,
  getCurrentUser,
  incrementMemberProfileDemoSessions,
  signIn,
  signUp,
  validatePassword,
} from "../lib/supabase.js";
import { getTier } from "../lib/tiers.js";
import { Logo } from "./Logo.jsx";

function AuthPublicNav() {
  return (
    <header
      style={{
        flexShrink: 0,
        width: "100%",
        padding: "12px 24px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderBottom: "1px solid #14202e",
        background: "#07090e",
      }}
    >
      <a
        href="/pricing"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#00d4aa",
          textDecoration: "none",
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        Pricing
      </a>
    </header>
  );
}

/** @param {{ children: import("react").ReactNode }} props */
function AuthScaffold({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#07090e", display: "flex", flexDirection: "column" }}>
      <AuthPublicNav />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const ZXCVBN_STRENGTH_COLORS = ["#ef4444", "#ef4444", "#f97316", "#eab308", "#22c55e"];
const ZXCVBN_STRENGTH_LABELS = ["Weak", "Weak", "Fair", "Strong", "Very Strong"];

const TURNSTILE_SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);

async function verifyTokenWithWorker(token) {
  if (!token || !isApiWorkerConfigured()) return false;
  const res = await fetch(`${API_WORKER_URL}/turnstile/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  return data.success === true;
}

function waitForTurnstile(onReady, onTimeout, maxWait = 5000) {
  const start = Date.now();
  const interval = setInterval(() => {
    if (typeof window.turnstile !== "undefined") {
      clearInterval(interval);
      onReady();
    } else if (Date.now() - start > maxWait) {
      clearInterval(interval);
      onTimeout();
    }
  }, 100);
  return () => clearInterval(interval);
}

function turnstileBlockedMessage(unavailable) {
  return unavailable
    ? "Bot verification is unavailable right now. Please refresh or try again in a moment."
    : "Bot verification is still loading. Please wait a moment.";
}

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  /** True only after Turnstile `render()` succeeds. */
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileUnavailable, setTurnstileUnavailable] = useState(false);
  const [signupPolicyErrors, setSignupPolicyErrors] = useState([]);
  /** Set from dynamic `zxcvbn` (register password strength meter). */
  const [registerStrengthScore, setRegisterStrengthScore] = useState(null);
  /** Login / signup password field visibility (default hidden). */
  const [showPassword, setShowPassword] = useState(false);
  /** EDON15 / TSource15 (and variants) captured from URL or localStorage — drives 15% off copy on plan cards. */
  const [partnerDiscountActive, setPartnerDiscountActive] = useState(false);
  const mainWidgetIdRef = useRef(null);
  const plansWidgetIdRef = useRef(null);

  useEffect(() => {
    captureAffiliateRefFromLocation();
    setPartnerDiscountActive(Boolean(getStoredAffiliateRef()));
  }, []);

  useEffect(() => {
    if (mode === "login" || mode === "register") setShowPassword(false);
  }, [mode]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPasswordChange = (e) => {
    setForm((f) => ({ ...f, password: e.target.value }));
    setSignupPolicyErrors([]);
    setError("");
  };

  useEffect(() => {
    if (mode !== "register" || form.password.trim() === "") {
      setRegisterStrengthScore(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const mod = await import("zxcvbn");
      const zxcvbn = mod?.default;
      if (typeof zxcvbn !== "function") {
        if (!cancelled) setRegisterStrengthScore(null);
        return;
      }
      const result = zxcvbn(form.password);
      if (!cancelled) setRegisterStrengthScore(result.score);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, form.password]);

  const resetMainTurnstile = () => {
    const id = mainWidgetIdRef.current;
    if (id != null && typeof window !== "undefined" && window.turnstile?.reset) {
      try {
        window.turnstile.reset(id);
      } catch {
        /* ignore */
      }
    }
    setTurnstileToken(null);
    setTurnstileUnavailable(false);
  };

  const resetPlansTurnstile = () => {
    const id = plansWidgetIdRef.current;
    if (id != null && typeof window !== "undefined" && window.turnstile?.reset) {
      try {
        window.turnstile.reset(id);
      } catch {
        /* ignore */
      }
    }
    setTurnstileToken(null);
    setTurnstileUnavailable(false);
  };

  useEffect(() => {
    if (mode !== "login" && mode !== "register") return;
    if (!turnstileRequired) return;
    let cancelled = false;
    mainWidgetIdRef.current = null;
    setTurnstileReady(false);
    setTurnstileUnavailable(false);
    const stopPolling = waitForTurnstile(
      () => {
        if (cancelled) return;
        const el = document.getElementById("turnstile-widget");
        if (!el || typeof window.turnstile === "undefined") {
          setTurnstileUnavailable(true);
          return;
        }
        el.innerHTML = "";
        let widgetId;
        try {
          widgetId = window.turnstile.render("#turnstile-widget", {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (t) => {
              setTurnstileToken(t);
              setTurnstileUnavailable(false);
            },
            "expired-callback": () => setTurnstileToken(null),
            "error-callback": () => {
              setTurnstileToken(null);
              setTurnstileReady(false);
              setTurnstileUnavailable(true);
            },
            theme: "dark",
          });
        } catch {
          setTurnstileUnavailable(true);
          return;
        }
        if (cancelled) {
          if (window.turnstile?.remove) {
            try {
              window.turnstile.remove(widgetId);
            } catch {
              /* ignore */
            }
          }
          return;
        }
        mainWidgetIdRef.current = widgetId;
        setTurnstileReady(true);
      },
      () => {
        if (cancelled) return;
        setTurnstileReady(false);
        setTurnstileToken(null);
        setTurnstileUnavailable(true);
      }
    );
    return () => {
      cancelled = true;
      stopPolling();
      setTurnstileReady(false);
      const id = mainWidgetIdRef.current;
      mainWidgetIdRef.current = null;
      if (id != null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* ignore */
        }
      }
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "plans") return;
    if (!turnstileRequired) return;
    let cancelled = false;
    plansWidgetIdRef.current = null;
    setTurnstileReady(false);
    setTurnstileUnavailable(false);
    const stopPolling = waitForTurnstile(
      () => {
        if (cancelled) return;
        const el = document.getElementById("turnstile-widget-plans");
        if (!el || typeof window.turnstile === "undefined") {
          setTurnstileUnavailable(true);
          return;
        }
        el.innerHTML = "";
        let widgetId;
        try {
          widgetId = window.turnstile.render("#turnstile-widget-plans", {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (t) => {
              setTurnstileToken(t);
              setTurnstileUnavailable(false);
            },
            "expired-callback": () => setTurnstileToken(null),
            "error-callback": () => {
              setTurnstileToken(null);
              setTurnstileReady(false);
              setTurnstileUnavailable(true);
            },
            theme: "dark",
          });
        } catch {
          setTurnstileUnavailable(true);
          return;
        }
        if (cancelled) {
          if (window.turnstile?.remove) {
            try {
              window.turnstile.remove(widgetId);
            } catch {
              /* ignore */
            }
          }
          return;
        }
        plansWidgetIdRef.current = widgetId;
        setTurnstileReady(true);
      },
      () => {
        if (cancelled) return;
        setTurnstileReady(false);
        setTurnstileToken(null);
        setTurnstileUnavailable(true);
      }
    );
    return () => {
      cancelled = true;
      stopPolling();
      setTurnstileReady(false);
      const id = plansWidgetIdRef.current;
      plansWidgetIdRef.current = null;
      if (id != null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* ignore */
        }
      }
    };
  }, [mode]);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        if (turnstileRequired) {
          if (!turnstileReady) {
            setError(turnstileBlockedMessage(turnstileUnavailable));
            return;
          }
          if (!turnstileToken) {
            setError("Bot verification failed. Please try again.");
            return;
          }
          const ok = await verifyTokenWithWorker(turnstileToken);
          if (!ok) {
            setError("Bot verification failed. Please try again.");
            resetMainTurnstile();
            return;
          }
        }
        const { error: err } = await signIn(form.email, form.password);
        if (err) {
          setError(err.message || "Sign in failed.");
          resetMainTurnstile();
          return;
        }
        resetMainTurnstile();
        const u = await getCurrentUser();
        if (u) {
          try {
            const { profiles } = await fetchMemberProfiles(u.id);
            const pid = profiles?.find((p) => p.is_default)?.id ?? profiles?.[0]?.id;
            if (pid) await incrementMemberProfileDemoSessions(pid);
          } catch {
            /* demo counter is best-effort */
          }
          onAuth(u);
        } else setError("Could not load profile.");
      } else {
        if (!form.name?.trim() || !form.email?.trim() || !form.password) {
          setError("All fields required.");
          setSignupPolicyErrors([]);
          return;
        }
        setSignupPolicyErrors([]);
        const policy = validatePassword(form.password);
        if (!policy.valid) {
          setSignupPolicyErrors(policy.errors);
          setError("");
          return;
        }
        const mod = await import("zxcvbn");
        const zxcvbn = mod?.default;
        if (typeof zxcvbn !== "function") {
          setError("Could not verify password strength. Please try again.");
          return;
        }
        const zx = zxcvbn(form.password);
        if (zx.score < 2) {
          setError("Password is too common or predictable. Try a passphrase.");
          return;
        }
        const { pwned } = await checkPwnedPassword(form.password);
        if (pwned) {
          setError("This password has appeared in a known data breach. Please choose a different one.");
          return;
        }
        if (turnstileRequired) {
          if (!turnstileReady) {
            setError(turnstileBlockedMessage(turnstileUnavailable));
            return;
          }
          if (!turnstileToken) {
            setError("Bot verification failed. Please try again.");
            return;
          }
          const ok = await verifyTokenWithWorker(turnstileToken);
          if (!ok) {
            setError("Bot verification failed. Please try again.");
            resetMainTurnstile();
            return;
          }
        }
        setTurnstileToken(null);
        setMode("plans");
      }
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async () => {
    if (!form.email?.trim()) return;
    setError("");
    setBusy(true);
    try {
      await authResetPassword(form.email.trim());
      setForgotSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  const selectPlan = async (planId) => {
    setError("");
    setBusy(true);
    try {
      if (turnstileRequired) {
        if (!turnstileReady) {
          setError(turnstileBlockedMessage(turnstileUnavailable));
          return;
        }
        if (!turnstileToken) {
          setError("Bot verification failed. Please try again.");
          return;
        }
        const ok = await verifyTokenWithWorker(turnstileToken);
        if (!ok) {
          setError("Bot verification failed. Please try again.");
          resetPlansTurnstile();
          return;
        }
      }
      const { error: err } = await signUp(form.name.trim(), form.email.trim(), form.password, planId);
      if (err) {
        setError(err.message || "Sign up failed.");
        resetPlansTurnstile();
        return;
      }
      resetPlansTurnstile();
      const u = await getCurrentUser();
      if (u) {
        try {
          const { profiles } = await fetchMemberProfiles(u.id);
          const pid = profiles?.find((p) => p.is_default)?.id ?? profiles?.[0]?.id;
          if (pid) await incrementMemberProfileDemoSessions(pid);
        } catch {
          /* demo counter is best-effort */
        }
        onAuth(u);
        return;
      }
      setError("Check your email to confirm your account (if required), then sign in.");
      setMode("login");
    } finally {
      setBusy(false);
    }
  };

  const authSubmitDisabled =
    busy ||
    (turnstileRequired && (mode === "login" || mode === "register") && (!turnstileReady || !turnstileToken));
  const plansSelectDisabled = busy || (turnstileRequired && (!turnstileReady || !turnstileToken));

  if (!isSupabaseConfigured()) {
    return (
      <AuthScaffold>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <Logo style={{ marginBottom: 20 }} />
          <div className="mono" style={{ fontSize: 13, color: "#b0bec5", lineHeight: 1.6 }}>
            Copy <code style={{ color: "#00d4aa" }}>.env.example</code> to{" "}
            <code style={{ color: "#00d4aa" }}>.env.local</code> and set{" "}
            <code style={{ color: "#00d4aa" }}>VITE_SUPABASE_URL</code> and{" "}
            <code style={{ color: "#00d4aa" }}>VITE_SUPABASE_ANON_KEY</code>, then restart{" "}
            <code style={{ color: "#00d4aa" }}>npm run dev</code>.
          </div>
        </div>
      </AuthScaffold>
    );
  }

  if (mode === "forgot") {
    return (
      <AuthScaffold>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Logo />
            <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", letterSpacing: ".18em", marginTop: 4 }}>
              RESET PASSWORD
            </div>
          </div>
          <div style={{ background: "#0b0f17", border: "1px solid #14202e", borderRadius: 10, padding: 24 }}>
            {forgotSubmitted ? (
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", lineHeight: 1.55, textAlign: "center" }}>
                If that email is registered, a reset link is on the way.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
                    EMAIL
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    type="email"
                    value={form.email}
                    placeholder="you@email.com"
                    onChange={set("email")}
                    onKeyDown={(e) => e.key === "Enter" && submitForgot()}
                  />
                </div>
                <button
                  type="button"
                  className="btn-teal"
                  style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: busy ? 0.6 : 1 }}
                  onClick={() => void submitForgot()}
                  disabled={busy}
                >
                  {busy ? "…" : "Send reset link"}
                </button>
              </>
            )}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#00d4aa",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Outfit',sans-serif",
                }}
                onClick={() => {
                  setMode("login");
                  setForgotSubmitted(false);
                  setError("");
                }}
              >
                Back to sign in
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 12,
              color: "#b0bec5",
              lineHeight: 1.6,
            }}
          >
            <a href="/legal#privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Privacy Policy
            </a>
            <span aria-hidden> · </span>
            <a href="/legal#terms" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Terms of Service
            </a>
            <span aria-hidden> · </span>
            <a href="/legal#waiver" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
              Research Waiver
            </a>
          </div>
        </div>
      </AuthScaffold>
    );
  }

  if (mode === "plans") {
    return (
      <AuthScaffold>
        <Logo style={{ marginBottom: 28 }} />
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "#a0a0b0",
            letterSpacing: ".2em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          SELECT YOUR PLAN
        </div>
        {turnstileRequired && (
          <div
            id="turnstile-widget-plans"
            style={{ display: "flex", justifyContent: "center", marginBottom: 20, minHeight: 65 }}
          />
        )}
        {turnstileRequired && !turnstileReady && (
          <div
            className="mono"
            style={{ fontSize: 12, color: turnstileUnavailable ? "#f59e0b" : "#b0bec5", marginBottom: 16, textAlign: "center" }}
          >
            {turnstileBlockedMessage(turnstileUnavailable)}
          </div>
        )}
        {partnerDiscountActive && (
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "#00d4aa",
              marginBottom: 16,
              textAlign: "center",
              maxWidth: 420,
              lineHeight: 1.5,
              letterSpacing: "0.04em",
            }}
          >
            Partner code active — 15% off Pro, Elite, and GOAT at checkout.
          </div>
        )}
        {error && (
          <div
            style={{
              fontSize: 13,
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
          {PLANS.map((plan) => {
            const priceDisplay = getAffiliatePriceDisplay(plan.id, partnerDiscountActive);
            return (
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
                    fontSize: 13,
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
                {priceDisplay.strike ? (
                  <>
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "#64748b",
                        fontSize: 16,
                        fontWeight: 600,
                        fontFamily: "'Outfit',sans-serif",
                      }}
                    >
                      {priceDisplay.strike}
                    </span>
                    <span
                      className="brand"
                      style={{ fontSize: 22, fontWeight: 800, color: "#dde4ef", marginLeft: 10 }}
                    >
                      {priceDisplay.main}
                    </span>
                  </>
                ) : (
                  <span className="brand" style={{ fontSize: 22, fontWeight: 800, color: "#dde4ef" }}>
                    {priceDisplay.main}
                  </span>
                )}
                <span style={{ fontSize: 13, color: "#b0bec5", marginLeft: 4 }}>
                  {plan.period === "forever" ? "forever" : priceDisplay.suffix || plan.period}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: plan.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#b0bec5", lineHeight: 1.5 }}>{f}</span>
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
                  fontSize: 13,
                  opacity: plansSelectDisabled ? 0.5 : 1,
                }}
                disabled={plansSelectDisabled}
                onClick={() => selectPlan(plan.id)}
              >
                {busy ? "…" : plan.id === "entry" ? `Start ${getTier("entry").label}` : `Get ${plan.label}`}
              </button>
            </div>
          );
          })}
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "#a0a0b0" }}>
          Subscriptions managed via App Store / Google Play on mobile.
        </div>
      </AuthScaffold>
    );
  }

  let registerPasswordStrength = null;
  if (mode === "register" && form.password.trim() !== "" && registerStrengthScore != null) {
    const score = registerStrengthScore;
    const color = ZXCVBN_STRENGTH_COLORS[score] ?? "#1e293b";
    const label = ZXCVBN_STRENGTH_LABELS[score] ?? "";
    const filled = Math.min(score + 1, 4);
    registerPasswordStrength = (
      <div style={{ marginBottom: signupPolicyErrors.length > 0 ? 10 : 14 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 2,
                background: i < filled ? color : "#1e293b",
              }}
            />
          ))}
        </div>
        <div className="mono" style={{ fontSize: 12, color, marginTop: 6, letterSpacing: "0.04em" }}>
          {label}
        </div>
      </div>
    );
  }

  return (
    <AuthScaffold>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo />
          <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", letterSpacing: ".18em", marginTop: 4 }}>
            {mode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        <div style={{ background: "#0b0f17", border: "1px solid #14202e", borderRadius: 10, padding: 24 }}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
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
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
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
          <div style={{ marginBottom: mode === "register" ? 8 : 20 }}>
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>
              PASSWORD
            </div>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                className="form-input"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  paddingRight: 44,
                }}
                type={showPassword ? "text" : "password"}
                value={form.password}
                placeholder="••••••••"
                onChange={onPasswordChange}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  minHeight: 40,
                  padding: 0,
                  margin: 0,
                  border: "none",
                  borderRadius: 6,
                  background: "transparent",
                  color: "#b0bec5",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  fontFamily: "inherit",
                }}
              >
                <span aria-hidden="true">{showPassword ? "👁‍🗨" : "👁"}</span>
              </button>
            </div>
          </div>
          {registerPasswordStrength}
          {mode === "register" && signupPolicyErrors.length > 0 && (
            <ul
              style={{
                margin: "0 0 14px 0",
                paddingLeft: 18,
                fontSize: 12,
                color: "#ef4444",
                fontFamily: "'JetBrains Mono',monospace",
                lineHeight: 1.5,
              }}
            >
              {signupPolicyErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
          {mode === "login" && (
            <div style={{ marginBottom: 14, textAlign: "right" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "#00d4aa",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Outfit',sans-serif",
                }}
                onClick={() => {
                  setMode("forgot");
                  setForgotSubmitted(false);
                  setError("");
                }}
              >
                Forgot password?
              </button>
            </div>
          )}
          {turnstileRequired && (
            <div
              id="turnstile-widget"
              style={{ display: "flex", justifyContent: "center", marginBottom: 16, minHeight: 65 }}
            />
          )}
          {turnstileRequired && !turnstileReady && (
            <div className="mono" style={{ fontSize: 12, color: turnstileUnavailable ? "#f59e0b" : "#b0bec5", marginBottom: 14 }}>
              {turnstileBlockedMessage(turnstileUnavailable)}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>
              {error}
            </div>
          )}
          <button
            type="button"
            className="btn-teal"
            style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: authSubmitDisabled ? 0.5 : 1 }}
            onClick={submit}
            disabled={authSubmitDisabled}
          >
            {busy ? "…" : mode === "login" ? "Sign In" : "Continue"}
          </button>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#a0a0b0" }}>
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
                    fontSize: 13,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSignupPolicyErrors([]);
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
                    fontSize: 13,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSignupPolicyErrors([]);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 12,
            color: "#b0bec5",
            lineHeight: 1.6,
          }}
        >
          <a href="/legal#privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Privacy Policy
          </a>
          <span aria-hidden> · </span>
          <a href="/legal#terms" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Terms of Service
          </a>
          <span aria-hidden> · </span>
          <a href="/legal#waiver" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Research Waiver
          </a>
        </div>
      </div>
    </AuthScaffold>
  );
}
