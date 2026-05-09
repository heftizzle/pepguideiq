import { useEffect } from "react";
import { getUpgradeTierRows } from "../data/upgradePlanCopy.js";
import { buildSignupHref, captureAffiliateRefFromLocation } from "../lib/affiliateRef.js";
import { Logo } from "../components/Logo.jsx";

const BG = "var(--color-bg-page)";
const ACCENT = "var(--color-accent)";

function tierCtaHref(id) {
  if (id === "entry") return buildSignupHref({});
  return buildSignupHref({ plan: id });
}

function tierCtaLabel(id) {
  return id === "entry" ? "Get Started Free" : "Get Started";
}

function PricingPage() {
  useEffect(() => {
    captureAffiliateRefFromLocation();
  }, []);

  const rows = getUpgradeTierRows();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: "var(--color-text-primary)",
        padding: "24px 20px 48px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          maxWidth: 1100,
          margin: "0 auto 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14 }}>
          <a
            href="/"
            style={{
              color: ACCENT,
              textDecoration: "none",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 600,
            }}
          >
            Sign in
          </a>
        </nav>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", marginBottom: 36 }}>
        <h1
          className="brand"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 800,
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
          }}
        >
          Simple pricing
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "#8b9cb3",
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.55,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          Pick the tier that matches your protocol depth. Upgrade or downgrade anytime.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {rows.map((row) => {
          const emoji = row.emoji;
          const borderColor = row.id === "entry" ? "var(--color-border-tab)" : row.color;
          return (
            <article
              key={row.id}
              style={{
                background: "var(--color-bg-card)",
                border: `1px solid ${borderColor}`,
                borderRadius: 14,
                padding: "22px 20px 20px",
                display: "flex",
                flexDirection: "column",
                boxShadow:
                  row.id === "pro" ? "0 0 0 1px var(--color-accent-subtle-22), 0 12px 40px #0006" : "0 8px 32px #0005",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 0,
                  marginBottom: 10,
                }}
              >
                <span
                  className="pepv-emoji"
                  aria-hidden
                  style={{
                    fontSize: 30,
                    lineHeight: 1,
                    display: "inline-block",
                    marginRight: 8,
                    flexShrink: 0,
                  }}
                >
                  {emoji}
                </span>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: row.color,
                    fontFamily: "'JetBrains Mono',monospace",
                    letterSpacing: "0.08em",
                  }}
                >
                  {row.name}
                </div>
              </div>
              <div className="brand" style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, textAlign: "center" }}>
                {row.priceLabel}
              </div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  lineHeight: 1.4,
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                {row.headline}
              </p>
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.5,
                  flex: 1,
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                {row.subline}
              </p>
              <ul
                style={{
                  margin: "0 0 20px",
                  paddingLeft: 18,
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.55,
                  textAlign: "left",
                }}
              >
                {row.limitBullets.map((line) => (
                  <li key={line} style={{ marginBottom: 4 }}>
                    {line}
                  </li>
                ))}
              </ul>
              <a
                href={tierCtaHref(row.id)}
                className="btn-teal"
                style={{
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Outfit',sans-serif",
                  background: row.id === "entry" ? "transparent" : `${ACCENT}18`,
                  border: `2px solid ${row.id === "entry" ? "var(--color-upgrade-muted-border)" : ACCENT}`,
                  color: row.id === "entry" ? "var(--color-text-secondary)" : ACCENT,
                }}
              >
                {tierCtaLabel(row.id)}
              </a>
            </article>
          );
        })}
      </div>

      {/* FIX: removed "Mobile may use App Store / Google Play" — IAP not built yet, text was misleading users */}
      <p
        style={{
          textAlign: "center",
          marginTop: 28,
          fontSize: 12,
          color: "#475569",
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        Subscriptions billed monthly via Stripe. Cancel anytime.
      </p>
    </div>
  );
}

export default PricingPage;
