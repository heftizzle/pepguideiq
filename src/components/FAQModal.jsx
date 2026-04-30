import { Modal } from "./Modal.jsx";
import { formatPrice, TIERS, TIER_ORDER } from "../lib/tiers.js";

const detailStyle = {
  borderBottom: "1px solid var(--color-border-hairline)",
  paddingBottom: 10,
  marginBottom: 10,
};

/** Tier FAQ copy — prices come from {@link TIERS} via {@link formatPrice}. */
const TIER_MEANING_SUFFIX = /** @type {Record<string, string>} */ ({
  entry: " — core tracking features",
  pro: " — expanded catalog + AI queries",
  elite: " — advanced features + higher limits",
  goat: " — full platform access, maximum limits",
});

/** @type {{ title: string; body: string | import("react").ReactNode }[]} */
const FAQ_STATIC = [
  {
    title: "What is pepguideIQ?",
    body:
      "pepguideIQ is a personal peptide management platform. It helps you build and track your peptide and wellness stacks, log doses, manage vials, and access AI-powered guidance — all in one place.",
  },
  {
    title: "Is this medical advice?",
    body:
      "No. pepguideIQ is an informational and tracking tool only. Nothing on this platform constitutes medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider before starting any protocol.",
  },
  {
    title: "How do I log a dose?",
    body:
      "Tap the Log Dose button (floating button, bottom center of the app). Select your compound, confirm your dose, and submit. Your dose history is viewable on your profile dashboard.",
  },
  {
    title: "How do I track a vial?",
    body:
      "Navigate to Vial Tracker. Add a new vial, enter your compound, concentration, and reconstitution date. The tracker will monitor remaining units and flag vials approaching the 28-day BAC water window.",
  },
  {
    title: "How do I save a stack?",
    body:
      "In Stack Builder, build your stack and tap Save. Saved stacks are accessible from your profile and can include an optional photo upload.",
  },
  {
    title: "How do I change my plan?",
    body:
      "Tap the hamburger menu (≡) top right → Plan / Upgrade. You can upgrade or change your tier at any time. Downgrades take effect at the end of your current billing cycle.",
  },
  {
    title: "How do I cancel my subscription?",
    body:
      "Tap hamburger menu → Plan / Upgrade → Manage Subscription. You can cancel at any time. You retain access through the end of your paid period.",
  },
  {
    title: "Where is my data stored?",
    body:
      "Your data is stored securely in Supabase (Postgres) with row-level security — only you can access your records. Profile photos and stack images are stored in encrypted cloud storage.",
  },
  {
    title: "How do I delete my account?",
    body:
      "Go to Settings → Account → Delete Account. This permanently removes all your data including dose history, stacks, and profile. This action cannot be undone.",
  },
  {
    title: "How do I contact support?",
    body:
      "Tap hamburger menu → Support. You can also email hello@pepguideiq.com directly. We typically respond within 24–48 hours.",
  },
  {
    title: "Where are the Terms and Privacy Policy?",
    body:
      "Tap hamburger menu → Legal / Privacy, or visit pepguideiq.com/legal.",
  },
];

/** @param {{ onClose: () => void }} props */
export function FAQModal({ onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={560} label="FAQ">
      <div style={{ marginBottom: 16 }}>
        <div className="brand" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)", marginBottom: 6 }}>
          Frequently asked questions
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Common questions about pepguideIQ. Not medical advice.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {FAQ_STATIC.map(({ title, body }) => (
          <details key={title} style={detailStyle}>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--color-text-primary)",
                lineHeight: 1.4,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              {title}
            </summary>
            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
              {body}
            </p>
          </details>
        ))}
        <details style={detailStyle}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--color-text-primary)",
              lineHeight: 1.4,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
            }}
          >
            What do the tier levels mean?
          </summary>
          <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
            {TIER_ORDER.map((id) => {
              const t = TIERS[id];
              const suffix = TIER_MEANING_SUFFIX[id] ?? "";
              const priceLabel = id === "entry" ? "free" : `${formatPrice(id)}/mo`;
              return (
                <div key={id} style={{ marginBottom: id === "goat" ? 0 : 10 }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {t.emoji} {t.name}
                  </strong>
                  {" "}
                  ({priceLabel}){suffix}
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </Modal>
  );
}
