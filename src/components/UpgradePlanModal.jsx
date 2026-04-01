import { useEffect, useState } from "react";
import { Modal } from "./Modal.jsx";
import { getUpgradeTierRows } from "../data/upgradePlanCopy.js";
import { getStripeCheckoutUrl } from "../lib/checkout.js";
import { fetchStripeSubscription, scheduleDowngrade } from "../lib/stripeSubscription.js";
import { formatPlan, getNextTierId, TIER_RANK } from "../lib/tiers.js";
import { getCurrentUser, updateUserPlan } from "../lib/supabase.js";

const ROWS = getUpgradeTierRows();

const BILLING_ERROR_USER_MESSAGE = "Unable to load billing info. Please try again.";

const mutedDowngradeBtn = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid #4a6080",
  color: "#8fa5bf",
  background: "transparent",
  cursor: "pointer",
};

export function UpgradePlanModal({ onClose, user, upgradeFocusTier, setUser }) {
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [downgradeFlow, setDowngradeFlow] = useState(null);
  const [downgradeSubmitting, setDowngradeSubmitting] = useState(false);
  const [downgradeError, setDowngradeError] = useState(null);

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

  const actionsDisabled = subscriptionLoading || subscriptionError != null;
  const subscriptionOk = !subscriptionLoading && subscriptionError == null && subscriptionInfo != null;
  const stripeTier = subscriptionOk && subscriptionInfo.plan ? subscriptionInfo.plan : "entry";

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
    const url = getStripeCheckoutUrl(planId);
    if (url) {
      onClose();
      window.location.assign(url);
      return;
    }
    const { error } = await updateUserPlan(planId);
    if (!error) {
      const u = await getCurrentUser();
      if (u) setUser(u);
    }
    onClose();
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
          <div style={{ fontSize: 11, color: "#8fa5bf", lineHeight: 1.55, marginBottom: 14 }}>
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
            <div className="mono" style={{ fontSize: 10, color: "#f59e0b", marginBottom: 10 }}>
              {downgradeError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-teal btn-upgrade-ghost"
              style={{ padding: "8px 12px", fontSize: 11 }}
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
              style={{ padding: "8px 12px", fontSize: 11 }}
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
      return (
        <button
          type="button"
          disabled
          className="btn-teal btn-upgrade-current"
          style={{ width: "100%", padding: "10px 12px", fontSize: 12, opacity: 0.4, cursor: "default" }}
        >
          {subscriptionLoading ? "Loading…" : isSame ? "This is your current plan" : isUpgrade ? "Upgrade" : "Downgrade"}
        </button>
      );
    }

    if (isSame) {
      return (
        <button
          type="button"
          disabled
          className="btn-teal btn-upgrade-current"
          style={{ width: "100%", padding: "10px 12px", fontSize: 12, opacity: 0.4, cursor: "default" }}
        >
          This is your current plan
        </button>
      );
    }

    if (isUpgrade) {
      const isNext = rowId === nextStripeTier;
      const label = isNext ? "Upgrade Now" : "Learn More";
      return (
        <button
          type="button"
          className={isNext ? "btn-teal btn-upgrade-cta" : "btn-teal btn-upgrade-ghost"}
          style={{ width: "100%", padding: "10px 12px", fontSize: 12 }}
          onClick={() => void tierAction(rowId)}
        >
          {label}
        </button>
      );
    }

    if (isDowngrade) {
      if (!canDowngrade) {
        return (
          <button
            type="button"
            disabled
            className="btn-teal btn-upgrade-current"
            style={{ width: "100%", padding: "10px 12px", fontSize: 12, opacity: 0.4, cursor: "default" }}
          >
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

  return (
    <Modal onClose={onClose} maxWidth={1120} label="Plans and pricing" variant="sheet">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12 }}>
        <div>
          <div className="brand" style={{ fontSize: 18, fontWeight: 700 }}>Choose your plan</div>
          <div className="mono" style={{ fontSize: 10, color: "#243040", marginTop: 4 }}>
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

      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: "#0b0f17",
          border: "1px solid #14202e",
          borderRadius: 8,
        }}
      >
        <div className="mono" style={{ fontSize: 9, color: "#00d4aa", letterSpacing: "0.12em", marginBottom: 8 }}>
          // BILLING (STRIPE)
        </div>
        {subscriptionLoading && (
          <div className="mono" style={{ fontSize: 10, color: "#4a6080" }}>
            Loading subscription…
          </div>
        )}
        {!subscriptionLoading && subscriptionError && (
          <div className="mono" style={{ fontSize: 11, color: "#f59e0b", lineHeight: 1.5 }}>
            {BILLING_ERROR_USER_MESSAGE}
          </div>
        )}
        {subscriptionOk && (
          <div style={{ fontSize: 11, color: "#8fa5bf", lineHeight: 1.55 }}>
            <div>
              <span className="mono" style={{ color: "#4a6080" }}>status</span> {subscriptionInfo.status}
            </div>
            {subscriptionInfo.current_period_end > 0 && (
              <div style={{ marginTop: 6 }}>
                <span className="mono" style={{ color: "#4a6080" }}>current_period_end</span> {periodEndDate}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              <span className="mono" style={{ color: "#4a6080" }}>cancel_at_period_end</span>{" "}
              {subscriptionInfo.cancel_at_period_end ? "true" : "false"}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="mono" style={{ color: "#4a6080" }}>plan</span> {subscriptionInfo.plan}
            </div>
            {subscriptionInfo.pending_plan != null && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #14202e", color: "#6b8299" }}>
                <span className="mono" style={{ color: "#4a6080" }}>pending_plan</span> {subscriptionInfo.pending_plan}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="upgrade-tier-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {ROWS.map((row) => {
          const isCurrent = row.id === stripeTier;
          const isNext = row.id === nextStripeTier;
          const isRec = row.id === upgradeFocusTier || isNext;

          return (
            <div
              key={row.id}
              style={{
                background: "#07090e",
                border: `${isRec && !isCurrent ? 2 : 1}px solid ${isCurrent ? row.color + "90" : isRec ? row.color + "55" : row.color + "28"}`,
                borderRadius: 10,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 0,
                boxShadow: isRec && !isCurrent ? `0 0 0 1px ${row.color}30, 0 10px 28px ${row.color}14` : "none",
              }}
            >
              <div>
                <div className="brand" style={{ fontSize: 15, fontWeight: 800, color: "#dde4ef" }}>
                  {row.name} {row.emoji}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className="brand" style={{ fontSize: 22, fontWeight: 800, color: "#dde4ef" }}>{row.priceLabel}</span>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#dde4ef", lineHeight: 1.35 }}>{row.headline}</div>

              <div style={{ fontSize: 11, color: "#6b8299", lineHeight: 1.5 }}>{row.subline}</div>

              <div style={{ marginTop: "auto", paddingTop: 6 }}>{renderTierActions(row)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: "#243040", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
        Subscriptions billed monthly. Cancel anytime.
      </div>

      <style>{`
        @media (max-width: 900px) {
          .upgrade-tier-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Modal>
  );
}
