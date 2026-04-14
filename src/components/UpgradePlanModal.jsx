import { useEffect, useState } from "react";
import { Modal } from "./Modal.jsx";
import { getUpgradeTierRows } from "../data/upgradePlanCopy.js";
import { getStripeCheckoutUrlWithClientRef } from "../lib/checkout.js";
import { fetchStripeSubscription, scheduleDowngrade } from "../lib/stripeSubscription.js";
import { formatPlan, getNextTierId, TIER_RANK } from "../lib/tiers.js";
import { getSuggestedUpgradeTier, getUpgradeGateCopy } from "../lib/upgradeGateCopy.js";

const ROWS = getUpgradeTierRows();

/** Modal-only accents (do not change tier pricing / Stripe ids). */
const TIER_ACCENTS = {
  entry: "#22c55e",
  pro: "#06b6d4",
  elite: "#a855f7",
  goat: "#f59e0b",
};

const CARD_EMOJI = {
  entry: "🌱",
  pro: "🔬",
  elite: "⚡",
  goat: "🐐",
};

const CTA_DARK_TEXT = "#0f172a";

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
    color: "#64748b",
    background: "rgba(15, 23, 42, 0.45)",
  };
}

/** @param {string} rowId */
function tierPrimaryCtaStyle(rowId, disabled) {
  const accent = TIER_ACCENTS[rowId] ?? "#64748b";
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
    return { ...base, background: accent, color: "#ffffff", border: "none" };
  }
  if (rowId === "goat") {
    return { ...base, background: accent, color: CTA_DARK_TEXT, border: "none" };
  }
  return { ...base, ...neutralDisabledCtaStyle() };
}

const mutedDowngradeBtn = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  borderRadius: 10,
  border: "1px solid #4a6080",
  color: "#8fa5bf",
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
  const stripeTier =
    subscriptionError != null
      ? "entry"
      : subscriptionOk && subscriptionInfo.plan
        ? subscriptionInfo.plan
        : "entry";

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
    if (actionsDisabled || planId === "entry") return;
    const url = getStripeCheckoutUrlWithClientRef(planId, user?.id);
    if (!url) return;
    onClose();
    window.location.assign(url);
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
            border: "1px solid #14202e",
            borderRadius: 10,
            padding: 12,
            background: "#0b0f17",
          }}
        >
          <div className="brand" style={{ fontSize: 13, fontWeight: 700, color: "#dde4ef", marginBottom: 10 }}>
            {isEntryTarget ? "⚠️  Moving to Entry (Free)" : "⏳  Confirm downgrade"}
          </div>
          <div style={{ fontSize: 13, color: "#8fa5bf", lineHeight: 1.55, marginBottom: 14 }}>
            {isEntryTarget ? (
              <>
                You&apos;ll keep <strong style={{ color: "#dde4ef" }}>{formatPlan(stripeTier)}</strong> access until{" "}
                <strong style={{ color: "#dde4ef" }}>{periodEndDate}</strong>.
                <br />
                On <strong style={{ color: "#dde4ef" }}>{periodEndDate}</strong>, billing stops and your plan moves to Entry.
                <br />
                You can resubscribe anytime.
              </>
            ) : (
              <>
                You&apos;ll keep <strong style={{ color: "#dde4ef" }}>{formatPlan(stripeTier)}</strong> access until{" "}
                <strong style={{ color: "#dde4ef" }}>{periodEndDate}</strong>.
                <br />
                On <strong style={{ color: "#dde4ef" }}>{periodEndDate}</strong>, your plan moves to{" "}
                <strong style={{ color: "#dde4ef" }}>{formatPlan(rowId)}</strong>.
                <br />
                No action needed — this happens automatically.
              </>
            )}
          </div>
          {downgradeError && (
            <div className="mono" style={{ fontSize: 13, color: "#f59e0b", marginBottom: 10 }}>
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

    if (subscriptionError != null && isUpgrade) {
      return (
        <button type="button" disabled style={neutralDisabledCtaStyle()}>
          Coming Soon
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
        <button type="button" style={tierPrimaryCtaStyle(rowId, false)} onClick={() => void tierAction(rowId)}>
          {upgradeCtaLabel(rowId)}
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
    const accent = TIER_ACCENTS[row.id];
    const rgb = hexToRgbTriple(accent);
    const emoji = CARD_EMOJI[row.id];
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
      color: "#cdd8e8",
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
              color: CTA_DARK_TEXT,
              background: "rgba(245, 158, 11, 0.92)",
              padding: "5px 10px",
              borderRadius: 6,
            }}
          >
            GOAT TIER
          </div>
        ) : null}

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span className="pepv-emoji" style={{ fontSize: isGoat ? 48 : 36, lineHeight: 1 }} aria-hidden>
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
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{suffix}</span>
            ) : null}
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eef6", lineHeight: 1.45 }}>{row.headline}</div>

        <div style={{ fontSize: 13, color: "#a8b8d0", lineHeight: 1.55 }}>{row.subline}</div>

        <ul style={featureListStyle}>{row.limitBullets.map(checkRow)}</ul>

        <ul style={featureListStyle}>{row.allTiersInclude.map(checkRow)}</ul>

        <div style={{ marginTop: "auto", paddingTop: 8 }}>{renderTierActions(row)}</div>
      </div>
    );
  };

  return (
    <Modal onClose={onClose} maxWidth={1120} label="Plans and pricing" variant="sheet">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12 }}>
        <div>
          <div className="brand" style={{ fontSize: 18, fontWeight: 700 }}>Choose your plan</div>
          <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginTop: 4 }}>
            Compare tiers — upgrade anytime. Cancel anytime.
          </div>
        </div>
        <button
          type="button"
          style={{ background: "none", border: "none", color: "#4a6080", cursor: "pointer", fontSize: 22, lineHeight: 1, flexShrink: 0 }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {gateCopy ? (
        <div
          style={{
            marginBottom: 18,
            padding: "16px 18px",
            borderRadius: 12,
            border: "1px solid rgba(0, 212, 170, 0.38)",
            background: "linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(6, 182, 212, 0.06) 100%)",
          }}
        >
          <div className="brand" style={{ fontSize: 17, fontWeight: 700, color: "#e8eef6", marginBottom: 8, lineHeight: 1.3 }}>
            {gateCopy.title}
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.55, marginBottom: gateCheckoutTier && gateCheckoutTier !== "entry" ? 14 : 0, maxWidth: 640 }}>
            {gateCopy.body}
          </div>
          {gateCheckoutTier && gateCheckoutTier !== "entry" ? (
            <button
              type="button"
              className="btn-teal"
              disabled={actionsDisabled}
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "10px 18px",
                borderRadius: 10,
                opacity: actionsDisabled ? 0.55 : 1,
              }}
              onClick={() => void tierAction(gateCheckoutTier)}
            >
              {gateCopy.ctaLabel} →
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

      <div style={{ marginTop: 16, fontSize: 13, color: "#a0a0b0", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
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
