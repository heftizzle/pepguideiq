import { useEffect, useState } from "react";
import { Modal } from "./Modal.jsx";
import { getUpgradeTierRows } from "../data/upgradePlanCopy.js";
import { isApiWorkerConfigured } from "../lib/config.js";
import { createStripeSubscription, fetchStripeSubscription, scheduleDowngrade } from "../lib/stripeSubscription.js";
import { getCurrentUser } from "../lib/supabase.js";
import { formatPlan, getNextTierId, TIERS, TIER_ORDER, TIER_RANK } from "../lib/tiers.js";
import { getSuggestedUpgradeTier, getUpgradeGateCopy } from "../lib/upgradeGateCopy.js";

const ROWS = getUpgradeTierRows();

const CTA_DARK_TEXT = "#0f172a";

/** Modal glow / CTA fill — solid hex from `TIERS.*.modalGlowHex` (Elite amber, GOAT purple). */
function tierModalGlowHex(rowId) {
  return TIERS[rowId]?.modalGlowHex ?? "#64748b";
}

function hexToRgbTriple(hex) {
  const h = String(hex).replace("#", "");
  return `${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}`;
}

/** @param {string} priceLabel */
function splitPriceLabel(priceLabel) {
  if (!priceLabel || priceLabel === "Free") return { price: "Free", suffix: "" };
  if (priceLabel.endsWith("/mo")) return { price: priceLabel.slice(0, -3), suffix: "/mo" };
  return { price: priceLabel, suffix: "" };
}

function upgradeCtaLabel(rowId) {
  if (rowId === "pro") return "Get Pro";
  if (rowId === "elite") return "Get Elite";
  if (rowId === "goat") return "Go GOAT 🐐";
  return "Upgrade";
}

function neutralDisabledCtaStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    opacity: 0.45,
    cursor: "default",
    borderRadius: 10,
    border: "1px solid #334155",
    color: "var(--color-text-muted)",
    background: "rgba(15, 23, 42, 0.45)",
  };
}

/** @param {string} rowId */
function tierPrimaryCtaStyle(rowId, disabled) {
  const accent = tierModalGlowHex(rowId);
  const isGoat = rowId === "goat";
  const base = {
    width: "100%",
    borderRadius: 10,
    cursor: disabled ? "default" : "pointer",
    fontSize: isGoat ? 15 : 13,
    fontWeight: isGoat ? 700 : 600,
    padding: isGoat ? "14px 18px" : "10px 12px",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.15s ease",
  };
  if (rowId === "entry") {
    return {
      ...base,
      background: "transparent",
      border: `1px solid ${accent}`,
      color: accent,
    };
  }
  if (rowId === "pro") {
    return { ...base, background: accent, color: CTA_DARK_TEXT, border: "none" };
  }
  if (rowId === "elite") {
    return { ...base, background: accent, color: CTA_DARK_TEXT, border: "none" };
  }
  if (rowId === "goat") {
    return { ...base, background: accent, color: "#ffffff", border: "none" };
  }
  return { ...base, ...neutralDisabledCtaStyle() };
}

const mutedDowngradeBtn = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  borderRadius: 10,
  border: "1px solid #4a6080",
  color: "var(--color-text-secondary)",
  background: "transparent",
  cursor: "pointer",
};

/**
 * @param {{ onClose: () => void, user: object, upgradeFocusTier: string | null, setUser: (u: object | null) => void, gateReason?: string | null, planKey?: string }} props
 */
export function UpgradePlanModal({ onClose, user, upgradeFocusTier, setUser, gateReason = null, planKey = "entry" }) {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [downgradeFlow, setDowngradeFlow] = useState(null);
  const [downgradeSubmitting, setDowngradeSubmitting] = useState(false);
  const [downgradeError, setDowngradeError] = useState(null);
  const [hoverTierId, setHoverTierId] = useState(null);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [upgradeSubmitError, setUpgradeSubmitError] = useState(/** @type {string | null} */ (null));

  const gateCopy = gateReason ? getUpgradeGateCopy(gateReason) : null;
  const gateCheckoutTier =
    gateReason != null && gateReason !== ""
      ? getSuggestedUpgradeTier(gateReason, typeof planKey === "string" ? planKey : "entry")
      : null;

  const refetchSubscription = () => {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    fetchStripeSubscription().then(({ data, error }) => {
      setSubscriptionLoading(false);
      if (error) {
        setSubscriptionError(error.message);
        setSubscriptionInfo(null);
        return;
      }
      setSubscriptionInfo(data);
    });
  };

  useEffect(() => {
    let cancelled = false;
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    fetchStripeSubscription().then(({ data, error }) => {
      if (cancelled) return;
      setSubscriptionLoading(false);
      if (error) {
        setSubscriptionError(error.message);
        setSubscriptionInfo(null);
        return;
      }
      setSubscriptionInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const actionsDisabled = subscriptionLoading;
  const subscriptionOk = !subscriptionLoading && subscriptionError == null && subscriptionInfo != null;
  const profilePlanFallback =
    typeof planKey === "string" && TIER_ORDER.includes(planKey) ? planKey : "entry";
  const stripeTier =
    subscriptionOk && typeof subscriptionInfo.plan === "string" && TIER_ORDER.includes(subscriptionInfo.plan)
      ? subscriptionInfo.plan
      : profilePlanFallback;

  const canDowngrade =
    subscriptionOk &&
    subscriptionInfo.current_period_end > 0 &&
    ["active", "trialing", "past_due"].includes(subscriptionInfo.status);

  const periodEndDate =
    subscriptionOk && subscriptionInfo.current_period_end > 0
      ? new Date(subscriptionInfo.current_period_end * 1000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const nextStripeTier = getNextTierId(stripeTier);

  const tierAction = async (planId) => {
    if (actionsDisabled || upgradeSubmitting || planId === "entry") return;
    setUpgradeSubmitError(null);
    if (!isApiWorkerConfigured()) {
      setUpgradeSubmitError("App API is not configured.");
      return;
    }
    setUpgradeSubmitting(true);
    const { data, error } = await createStripeSubscription(
      /** @type {"pro"|"elite"|"goat"} */ (planId)
    );
    setUpgradeSubmitting(false);
    if (error) {
      setUpgradeSubmitError(error.message);
      return;
    }
    if (data?.no_payment_needed) {
      const u = await getCurrentUser();
      if (u) setUser(u);
      refetchSubscription();
      onClose();
      return;
    }
    if (data && typeof data.url === "string" && data.url) {
      window.location.href = data.url;
      return;
    }
    setUpgradeSubmitError("Could not start checkout. Try again or contact support.");
  };

  const confirmDowngrade = async (targetId) => {
    setDowngradeError(null);
    setDowngradeSubmitting(true);
    const { ok, error } = await scheduleDowngrade(targetId);
    setDowngradeSubmitting(false);
    if (!ok) {
      setDowngradeError(error?.message ?? "Request failed");
      return;
    }
    setDowngradeFlow(null);
    refetchSubscription();
  };

  const renderTierActions = (row) => {
    const rowId = row.id;
    const isSame = rowId === stripeTier;
    const isUpgrade = TIER_RANK[rowId] > TIER_RANK[stripeTier];
    const isDowngrade = TIER_RANK[rowId] < TIER_RANK[stripeTier];

    if (downgradeFlow?.targetId === rowId) {
      const isEntryTarget = downgradeFlow.kind === "entry";
      return (
        <div
          style={{
            border: "1px solid var(--color-border-default)",
            borderRadius: 10,
            padding: 12,
            background: "var(--color-bg-elevated)",
          }}
        >
          <div className="brand" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 10 }}>
            {isEntryTarget ? "⚠️  Moving to Entry (Free)" : "⏳  Confirm downgrade"}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 14 }}>
            {isEntryTarget ? (
              <>
                You&apos;ll keep <strong style={{ color: "var(--color-text-primary)" }}>{formatPlan(stripeTier)}</strong> access until{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{periodEndDate}</strong>.
                <br />
                On <strong style={{ color: "var(--color-text-primary)" }}>{periodEndDate}</strong>, billing stops and your plan moves to Entry.
                <br />
                You can resubscribe anytime.
              </>
            ) : (
              <>
                You&apos;ll keep <strong style={{ color: "var(--color-text-primary)" }}>{formatPlan(stripeTier)}</strong> access until{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{periodEndDate}</strong>.
                <br />
                On <strong style={{ color: "var(--color-text-primary)" }}>{periodEndDate}</strong>, your plan moves to{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>{formatPlan(rowId)}</strong>.
                <br />
                No action needed — this happens automatically.
              </>
            )}
          </div>
          {downgradeError && (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 10 }}>
              {downgradeError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-teal btn-upgrade-ghost"
              style={{ padding: "8px 12px", fontSize: 13 }}
              disabled={downgradeSubmitting}
              onClick={() => {
                setDowngradeFlow(null);
                setDowngradeError(null);
              }}
            >
              Keep current plan
            </button>
            <button
              type="button"
              className="btn-teal"
              style={{ padding: "8px 12px", fontSize: 13 }}
              disabled={downgradeSubmitting}
              onClick={() => void confirmDowngrade(rowId)}
            >
              {isEntryTarget ? "Confirm" : "Confirm downgrade"}
            </button>
          </div>
        </div>
      );
    }

    if (actionsDisabled) {
      const disabledLabel = subscriptionLoading
        ? "Loading…"
        : isSame
          ? rowId === "entry"
            ? "Start Free"
            : "This is your current plan"
          : isUpgrade
            ? upgradeCtaLabel(rowId)
            : rowId === "entry"
              ? "Move to Free"
              : "Schedule Downgrade";
      return (
        <button type="button" disabled style={neutralDisabledCtaStyle()}>
          {disabledLabel}
        </button>
      );
    }

    if (isSame) {
      const label = rowId === "entry" ? "Start Free" : "This is your current plan";
      return (
        <button type="button" disabled style={tierPrimaryCtaStyle(rowId, true)}>
          {label}
        </button>
      );
    }

    if (isUpgrade) {
      return (
        <button
          type="button"
          style={tierPrimaryCtaStyle(rowId, upgradeSubmitting)}
          disabled={upgradeSubmitting}
          onClick={() => void tierAction(rowId)}
        >
          {upgradeSubmitting ? "…" : upgradeCtaLabel(rowId)}
        </button>
      );
    }

    if (isDowngrade) {
      if (!canDowngrade) {
        return (
          <button type="button" disabled style={neutralDisabledCtaStyle()}>
            {rowId === "entry" ? "Move to Free" : "Schedule Downgrade"}
          </button>
        );
      }
      const label = rowId === "entry" ? "Move to Free" : "Schedule Downgrade";
      return (
        <button
          type="button"
          style={{ ...mutedDowngradeBtn }}
          onClick={() => {
            setDowngradeError(null);
            setDowngradeFlow({ targetId: rowId, kind: rowId === "entry" ? "entry" : "paid" });
          }}
        >
          {label}
        </button>
      );
    }

    return null;
  };

  const renderPricingTierCard = (row) => {
    const isGoat = row.id === "goat";
    const accent = tierModalGlowHex(row.id);
    const rgb = hexToRgbTriple(accent);
    const emoji = row.emoji;
    const hover = hoverTierId === row.id;
    const isCurrent = row.id === stripeTier;
    const isNext = row.id === nextStripeTier;
    const isRec = row.id === upgradeFocusTier || isNext;
    const borderA = hover ? 0.55 : 0.4;
    let glowA = hover ? 0.22 : 0.12;
    if (isRec && !isCurrent) glowA += 0.06;
    const { price, suffix } = splitPriceLabel(row.priceLabel);

    const featureListStyle = {
      margin: 0,
      paddingLeft: 0,
      listStyle: "none",
      fontSize: 13,
      lineHeight: 1.6,
      color: "var(--color-text-secondary)",
    };

    const checkRow = (line) => (
      <li key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ color: accent, flexShrink: 0, fontWeight: 700, lineHeight: 1.6 }} aria-hidden>
          ✓
        </span>
        <span>{line}</span>
      </li>
    );

    return (
      <div
        onMouseEnter={() => setHoverTierId(row.id)}
        onMouseLeave={() => setHoverTierId(null)}
        style={{
          position: "relative",
          background: `rgba(${rgb}, 0.06)`,
          border: `1px solid rgba(${rgb}, ${borderA})`,
          borderTop: `3px solid ${accent}`,
          borderRadius: 12,
          padding: isGoat ? 22 : 16,
          paddingTop: isGoat ? 28 : 20,
          display: "flex",
          flexDirection: "column",
          gap: isGoat ? 14 : 12,
          minWidth: 0,
          boxShadow: `0 0 18px rgba(${rgb}, ${glowA})`,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        {isGoat ? (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffffff",
              background: "rgba(168, 85, 247, 0.92)",
              padding: "5px 10px",
              borderRadius: 6,
            }}
          >
            GOAT TIER
          </div>
        ) : null}

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 0,
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
              className="brand"
              style={{
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: accent,
              }}
            >
              {row.name}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              className="brand"
              style={{
                fontSize: isGoat ? 36 : 28,
                fontWeight: 800,
                color: accent,
              }}
            >
              {price}
            </span>
            {suffix ? (
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>{suffix}</span>
            ) : null}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.45 }}>{row.headline}</div>

        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{row.subline}</div>

        <ul style={featureListStyle}>{row.limitBullets.map(checkRow)}</ul>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>{renderTierActions(row)}</div>
      </div>
    );
  };

  return (
    <Modal onClose={onClose} maxWidth={1120} label="Plans and pricing" variant="sheet">
      <div style={{ marginBottom: 18 }}>
        <div className="brand" style={{ fontSize: 18, fontWeight: 700 }}>
          Choose your plan
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          Compare tiers — upgrade anytime. Cancel anytime.
        </div>
      </div>

      {subscriptionError ? (
        <div
          className="mono"
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #4a6080",
            fontSize: 13,
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          Could not load subscription status ({subscriptionError}). Your profile plan is shown below; checkout still works.
        </div>
      ) : null}

      {upgradeSubmitError ? (
        <div className="mono" style={{ marginBottom: 14, fontSize: 13, color: "var(--color-warning)", lineHeight: 1.45 }}>
          {upgradeSubmitError}
        </div>
      ) : null}

      {gateCopy ? (
        <div
          style={{
            marginBottom: 18,
            padding: "16px 18px",
            borderRadius: 12,
            border: "1px solid var(--color-demo-outline)",
            background: "linear-gradient(135deg, var(--color-accent-subtle-10) 0%, var(--color-accent-subtle-0e) 100%)",
          }}
        >
          <div className="brand" style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, lineHeight: 1.3 }}>
            {gateCopy.title}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: gateCheckoutTier && gateCheckoutTier !== "entry" ? 14 : 0, maxWidth: 640 }}>
            {gateCopy.body}
          </div>
          {gateCheckoutTier && gateCheckoutTier !== "entry" ? (
            <button
              type="button"
              className="btn-teal"
              disabled={actionsDisabled || upgradeSubmitting}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 18px",
                borderRadius: 10,
                opacity: actionsDisabled || upgradeSubmitting ? 0.55 : 1,
              }}
              onClick={() => void tierAction(gateCheckoutTier)}
            >
              {upgradeSubmitting ? "…" : `${gateCopy.ctaLabel} →`}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="upgrade-tier-grid">
        {ROWS.map((row) => (
          <div key={row.id} style={{ minWidth: 0 }}>
            {renderPricingTierCard(row)}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
        Subscriptions billed monthly. Cancel anytime.
      </div>

      <style>{`
        .upgrade-tier-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 500px) {
          .upgrade-tier-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Modal>
  );
}
