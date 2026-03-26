import { Modal } from "./Modal.jsx";
import { getUpgradeTierRows } from "../data/upgradePlanCopy.js";
import { getStripeCheckoutUrl } from "../lib/checkout.js";
import { getNextTierId, TIER_ORDER } from "../lib/tiers.js";
import { getCurrentUser, updateUserPlan } from "../lib/supabase.js";

const ROWS = getUpgradeTierRows();

export function UpgradePlanModal({ onClose, user, upgradeFocusTier, setUser }) {
  const currentId = user?.plan ?? "entry";
  const currentIdx = TIER_ORDER.indexOf(currentId);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;
  const nextId = getNextTierId(currentId);

  const tierAction = async (planId) => {
    if (planId === "entry") return;
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

  const ctaForTier = (planId) => {
    const idx = TIER_ORDER.indexOf(planId);
    const isCurrent = planId === currentId;
    if (isCurrent) {
      return { kind: "current", label: "Your Plan", disabled: true };
    }
    if (idx < safeIdx) {
      return { kind: "below", label: "Included", disabled: true };
    }
    if (planId === nextId) {
      return { kind: "upgrade", label: "Upgrade Now", disabled: false };
    }
    return { kind: "learn", label: "Learn More", disabled: false };
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
        className="upgrade-tier-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {ROWS.map((row) => {
          const cta = ctaForTier(row.id);
          const isCurrent = row.id === currentId;
          const isNext = row.id === nextId;
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

              <div style={{ marginTop: "auto", paddingTop: 6 }}>
                {cta.kind === "current" && (
                  <button type="button" className="btn-teal btn-upgrade-current" disabled style={{ width: "100%", padding: "10px 12px", fontSize: 12 }}>
                    {cta.label}
                  </button>
                )}
                {cta.kind === "below" && (
                  <button type="button" className="btn-teal btn-upgrade-current" disabled style={{ width: "100%", padding: "10px 12px", fontSize: 12 }}>
                    {cta.label}
                  </button>
                )}
                {cta.kind === "upgrade" && (
                  <button
                    type="button"
                    className="btn-teal btn-upgrade-cta"
                    style={{ width: "100%", padding: "10px 12px", fontSize: 12 }}
                    onClick={() => void tierAction(row.id)}
                  >
                    {cta.label}
                  </button>
                )}
                {cta.kind === "learn" && (
                  <button
                    type="button"
                    className="btn-teal btn-upgrade-ghost"
                    style={{ width: "100%", padding: "10px 12px", fontSize: 12 }}
                    onClick={() => void tierAction(row.id)}
                  >
                    {cta.label}
                  </button>
                )}
              </div>
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
