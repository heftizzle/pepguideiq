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
        borderBottom: "1px solid var(--color-border-default)",
        background: "var(--color-bg-page)",
      }}
    >
      <a
        href="/pricing"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-accent)",
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
    <div style={{ minHeight: "100vh", background: "var(--color-bg-page)", display: "flex", flexDirection: "column" }}>
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

/** Server enforces Turnstile on signup/reset only when both Worker URL and site key are set. */
function workerTurnstileEnforced() {
  return isApiWorkerConfigured() && turnstileRequired;
}

/** Fire-and-forget POST to Worker for logging/analytics; does not gate auth. */
function logTurnstileTokenToWorker(token) {
  if (!token || !isApiWorkerConfigured()) return;
  void fetch(`${API_WORKER_URL}/turnstile/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  }).catch(() => {});
}

function waitForTurnstile(onReady, onTimeout, maxWait = 15000) {
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
    ? "Bot verification unavailable — proceeding with rate-limited sign-in."
    : "Optional verification is still loading — you can sign in when email and password are ready.";
}

function turnstileForgotGateMessage(unavailable) {
  return unavailable
    ? "Bot verification unavailable — try again in a few minutes."
    : "Complete the verification challenge below before sending a reset link.";
}

export function AuthScreen({ onAuth }) {
  /** Prevents double signUp (StrictMode re-entry, double-tap, duplicate plan picks). */
  const signupSubmitLockRef = useRef(false);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
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
  /** Whitelisted refs (e.g. EDON15, HEAVYDUTY15, TSource15) from URL or localStorage — drives 15% off copy on plan cards. */
  const [partnerDiscountActive, setPartnerDiscountActive] = useState(false);
  const mainWidgetIdRef = useRef(null);
  const forgotWidgetIdRef = useRef(null);

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

  const resetForgotTurnstile = () => {
    const id = forgotWidgetIdRef.current;
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
            "error-callback": () => setTurnstileToken(null),
            "timeout-callback": () => setTurnstileToken(null),
            retry: "auto",
            "retry-interval": 8000,
            "refresh-expired": "auto",
            appearance: "always",
            theme: "auto",
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
    if (mode !== "forgot") return;
    if (!workerTurnstileEnforced()) return;
    let cancelled = false;
    forgotWidgetIdRef.current = null;
    setTurnstileReady(false);
    setTurnstileUnavailable(false);
    const stopPolling = waitForTurnstile(
      () => {
        if (cancelled) return;
        const el = document.getElementById("turnstile-widget-forgot");
        if (!el || typeof window.turnstile === "undefined") {
          setTurnstileUnavailable(true);
          return;
        }
        el.innerHTML = "";
        let widgetId;
        try {
          widgetId = window.turnstile.render("#turnstile-widget-forgot", {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (t) => {
              setTurnstileToken(t);
              setTurnstileUnavailable(false);
            },
            "expired-callback": () => setTurnstileToken(null),
            "error-callback": () => setTurnstileToken(null),
            "timeout-callback": () => setTurnstileToken(null),
            retry: "auto",
            "retry-interval": 8000,
            "refresh-expired": "auto",
            appearance: "always",
            theme: "auto",
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
        forgotWidgetIdRef.current = widgetId;
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
      const id = forgotWidgetIdRef.current;
      forgotWidgetIdRef.current = null;
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
        // Turnstile is non-blocking: Managed mode + Safari / iCloud Private Relay can fail the widget
        // while Supabase auth has no server-side Turnstile gate on sign-in. Log token when present.
        if (turnstileToken) {
          logTurnstileTokenToWorker(turnstileToken);
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
        if (!form.firstName?.trim() || !form.lastName?.trim() || !form.email?.trim() || !form.password) {
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
        if (turnstileToken) {
          logTurnstileTokenToWorker(turnstileToken);
        }
        /* Keep token for Worker signup on plan pick; plans step has no Turnstile widget. */
        setMode("plans");
      }
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async () => {
    if (!form.email?.trim()) return;
    setError("");
    if (workerTurnstileEnforced() && !turnstileToken) {
      setError("Please complete bot verification before requesting a reset.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await authResetPassword(
        form.email.trim(),
        undefined,
        turnstileToken
      );
      if (err) {
        setError(err.message || "Unable to process request. Try again later.");
        resetForgotTurnstile();
        return;
      }
      setForgotSubmitted(true);
      resetForgotTurnstile();
    } finally {
      setBusy(false);
    }
  };

  const selectPlan = async (planId) => {
    if (signupSubmitLockRef.current) return;
    signupSubmitLockRef.current = true;
    setError("");
    setBusy(true);
    try {
      const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const { error: err } = await signUp(
        displayName,
        form.email.trim(),
        form.password,
        planId,
        turnstileToken
      );
      if (err) {
        setError(err.message || "Sign up failed.");
        return;
      }
      const u = await getCurrentUser();
      if (u) {
        try {
          const { profiles } = await fetchMemberProfiles(u.id);
          const pid = profiles?.find((p) => p.is_default)?.id ?? profiles?.[0]?.id;
          if (pid) await incrementMemberProfileDemoSessions(pid);
        } catch {
          /* demo counter is best-effort */
        }
        setTurnstileToken(null);
        onAuth(u);
        return;
      }
      setTurnstileToken(null);
      setError("");
      setMode("checkEmail");
    } finally {
      signupSubmitLockRef.current = false;
      setBusy(false);
    }
  };

  const emailFilled = Boolean(form.email?.trim());
  const passwordFilled = Boolean(form.password);
  const registerNamesFilled = Boolean(form.firstName?.trim()) && Boolean(form.lastName?.trim());
  const authSubmitDisabled =
    busy ||
    !emailFilled ||
    !passwordFilled ||
    (mode === "register" && !registerNamesFilled);
  const plansSelectDisabled = busy;
  const forgotSubmitDisabled =
    busy || !emailFilled || (workerTurnstileEnforced() && (!turnstileReady || !turnstileToken));

  if (mode === "checkEmail") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          boxSizing: "border-box",
          background: "var(--color-bg-page)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(20px, 5vw, 32px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(16px, 4vw, 28px)",
          }}
        >
          <div
            style={{
              fontSize: "clamp(72px, 18vw, 120px)",
              lineHeight: 1,
            }}
            aria-hidden
          >
            📬
          </div>
          <h1
            className="brand"
            style={{
              margin: 0,
              fontSize: "clamp(28px, 7vw, 40px)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Check Your Email
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(17px, 4.5vw, 22px)",
              fontWeight: 600,
              lineHeight: 1.45,
              color: "var(--color-text-primary)",
              fontFamily: "'Outfit',sans-serif",
              maxWidth: 400,
            }}
          >
            Click the link we sent you to activate your account.
          </p>
          <p
            className="mono"
            style={{
              margin: 0,
              fontSize: "clamp(13px, 3.2vw, 15px)",
              lineHeight: 1.5,
              color: "var(--color-text-secondary)",
              maxWidth: 380,
            }}
          >
            Don&apos;t see it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <AuthScaffold>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <Logo style={{ marginBottom: 20 }} />
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Copy <code style={{ color: "var(--color-accent)" }}>.env.example</code> to{" "}
            <code style={{ color: "var(--color-accent)" }}>.env.local</code> and set{" "}
            <code style={{ color: "var(--color-accent)" }}>VITE_SUPABASE_URL</code> and{" "}
            <code style={{ color: "var(--color-accent)" }}>VITE_SUPABASE_ANON_KEY</code>, then restart{" "}
            <code style={{ color: "var(--color-accent)" }}>npm run dev</code>.
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
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", letterSpacing: ".18em", marginTop: 4 }}>
              RESET PASSWORD
            </div>
          </div>
          <div style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-default)", borderRadius: 10, padding: 24 }}>
            {forgotSubmitted ? (
              <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", lineHeight: 1.55, textAlign: "center" }}>
                If that email is registered, a reset link is on the way.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
                    EMAIL
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    type="email"
                    value={form.email}
                    placeholder="you@email.com"
                    onChange={set("email")}
                    onKeyDown={(e) => e.key === "Enter" && !forgotSubmitDisabled && void submitForgot()}
                  />
                </div>
                {workerTurnstileEnforced() && (
                  <div
                    id="turnstile-widget-forgot"
                    style={{ display: "flex", justifyContent: "center", marginBottom: 16, minHeight: 65 }}
                  />
                )}
                {workerTurnstileEnforced() && !turnstileReady && (
                  <div
                    className="mono"
                    style={{
                      fontSize: 12,
                      color: turnstileUnavailable ? "var(--color-warning)" : "var(--color-text-secondary)",
                      marginBottom: 14,
                      textAlign: "center",
                    }}
                  >
                    {turnstileForgotGateMessage(turnstileUnavailable)}
                  </div>
                )}
                {error && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-danger)",
                      marginBottom: 14,
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  className="btn-teal"
                  style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: forgotSubmitDisabled ? 0.5 : 1 }}
                  onClick={() => void submitForgot()}
                  disabled={forgotSubmitDisabled}
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
                  color: "var(--color-accent)",
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
              color: "var(--color-text-secondary)",
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
            color: "var(--color-text-placeholder)",
            letterSpacing: ".2em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          SELECT YOUR PLAN
        </div>
        {partnerDiscountActive && (
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--color-accent)",
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
              color: "var(--color-danger)",
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
                background: "var(--color-bg-sunken)",
                border: `1px solid ${plan.popular ? plan.color : "var(--color-border-default)"}`,
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
                    color: "var(--color-bg-page)",
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
                      style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)", marginLeft: 10 }}
                    >
                      {priceDisplay.main}
                    </span>
                  </>
                ) : (
                  <span className="brand" style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)" }}>
                    {priceDisplay.main}
                  </span>
                )}
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", marginLeft: 4 }}>
                  {plan.period === "forever" ? "forever" : priceDisplay.suffix || plan.period}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: plan.color, fontSize: 13, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-teal"
                style={{
                  borderColor: plan.color,
                  color: plan.color,
                  background: String(plan.color).trim().startsWith("var(")
                    ? String(plan.color).includes("tier-entry")
                      ? "var(--tier-entry-dim)"
                      : "var(--color-accent-dim)"
                    : `${plan.color}12`,
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
        <div style={{ marginTop: 16, fontSize: 13, color: "var(--color-text-placeholder)" }}>
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
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", letterSpacing: ".18em", marginTop: 4 }}>
            {mode === "login" ? "SIGN IN TO YOUR ACCOUNT" : "CREATE YOUR ACCOUNT"}
          </div>
        </div>

        <div style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-default)", borderRadius: 10, padding: 24 }}>
          {mode === "register" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
                  FIRST NAME
                </div>
                <input
                  className="form-input"
                  style={{ width: "100%" }}
                  value={form.firstName}
                  placeholder="First name"
                  onChange={set("firstName")}
                  autoComplete="given-name"
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
                  LAST NAME
                </div>
                <input
                  className="form-input"
                  style={{ width: "100%" }}
                  value={form.lastName}
                  placeholder="Last name"
                  onChange={set("lastName")}
                  autoComplete="family-name"
                />
              </div>
            </>
          )}
          <div style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
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
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 5, letterSpacing: ".12em" }}>
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
                  color: "var(--color-text-secondary)",
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
                color: "var(--color-danger)",
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
                  color: "var(--color-accent)",
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
            <div className="mono" style={{ fontSize: 12, color: turnstileUnavailable ? "var(--color-warning)" : "var(--color-text-secondary)", marginBottom: 14 }}>
              {turnstileBlockedMessage(turnstileUnavailable)}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 13, color: "var(--color-danger)", marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>
              {error}
            </div>
          )}
          <button
            type="button"
            className="btn-teal"
            data-testid={mode === "login" ? "auth-toggle" : undefined}
            style={{ width: "100%", padding: "10px 0", fontSize: 13, opacity: authSubmitDisabled ? 0.5 : 1 }}
            onClick={submit}
            disabled={authSubmitDisabled}
          >
            {busy ? "…" : mode === "login" ? "Sign In" : "Continue"}
          </button>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--color-text-placeholder)" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
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
                    color: "var(--color-accent)",
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
            color: "var(--color-text-secondary)",
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
