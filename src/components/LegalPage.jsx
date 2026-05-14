import { useEffect } from "react";

const WRAP = {
  minHeight: "100vh",
  background: "var(--color-bg-page)",
  color: "var(--color-text-secondary)",
  /* Dark static page: keep headings readable when global [data-theme] is light */
  "--color-text-primary": "var(--color-text-primary)",
};

const INNER = {
  maxWidth: 780,
  margin: "0 auto",
  padding: "24px 20px 80px",
  fontFamily: "'Outfit', sans-serif",
};

const STICKY_NAV = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px 10px",
  padding: "12px 16px",
  margin: "0 -20px 28px",
  background: "rgba(7, 9, 14, 0.92)",
  borderBottom: "1px solid var(--color-border-tab)",
  backdropFilter: "blur(8px)",
  fontSize: 13,
  fontFamily: "'Outfit', sans-serif",
};

const NAV_LINK = {
  color: "var(--color-accent)",
  textDecoration: "none",
  fontWeight: 500,
};

const NAV_MUTED = { color: "var(--color-text-secondary)" };

const SECTION_HDR = {
  fontFamily: "'JetBrains Mono', monospace",
  color: "var(--color-accent)",
  fontSize: 15,
  letterSpacing: "0.06em",
  marginTop: 40,
  marginBottom: 16,
  lineHeight: 1.4,
  scrollMarginTop: 72,
};

const BODY = {
  fontSize: 15,
  lineHeight: 1.65,
  color: "var(--color-text-secondary)",
  margin: "0 0 14px",
};

function scrollToHash() {
  const h = (window.location.hash || "").replace(/^#/, "");
  if (!h) return;
  const el = document.getElementById(h);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleBack() {
  try {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  } catch {
    window.location.href = "/";
  }
}

export function LegalPage() {
  useEffect(() => {
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <div style={WRAP}>
      <style>{`
        html { scroll-padding-top: 64px; }
      `}</style>
      <div style={INNER}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "block",
            marginBottom: 16,
            padding: 0,
            border: "none",
            background: "transparent",
            color: "var(--color-accent)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Back to pepguideIQ
        </button>
        <nav aria-label="Legal sections" style={STICKY_NAV}>
          <a href="#privacy" style={NAV_LINK}>
            Privacy Policy
          </a>
          <span style={NAV_MUTED} aria-hidden>
            ·
          </span>
          <a href="#terms" style={NAV_LINK}>
            Terms of Service
          </a>
          <span style={NAV_MUTED} aria-hidden>
            ·
          </span>
          <a href="#waiver" style={NAV_LINK}>
            Research Waiver
          </a>
        </nav>

        <section id="privacy" style={{ scrollMarginTop: 72 }}>
          <h1 style={{ ...SECTION_HDR, marginTop: 0 }}>PRIVACY POLICY — pepguideIQ</h1>
          <p style={BODY}>Effective Date: May 1, 2026</p>
          <p style={BODY}>pepguideIQ LLC · Riverview, Florida</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>What We Collect</strong>
          </p>
          <p style={BODY}>Account information: email address, display name, public handle</p>
          <p style={BODY}>Protocol data: compounds logged, vial records, dose history, stacks, body metrics, progress photos</p>
          <p style={BODY}>Usage data: session activity, pepguideIQ Score inputs</p>
          <p style={BODY}>Payment data: processed by our payment processor — we never see or store card numbers</p>
          <p style={BODY}>Technical data: browser type, IP address for security and performance purposes</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>What We Don&apos;t Do</strong>
          </p>
          <p style={BODY}>We do not sell your data. Ever.</p>
          <p style={BODY}>We do not serve ads. pepguideIQ products are ad-free.</p>
          <p style={BODY}>We do not share your data with third parties except as required to operate the service</p>
          <p style={BODY}>We do not use your protocol data for marketing or profiling</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>HIPAA Notice</strong>
          </p>
          <p style={BODY}>
            pepguideIQ is not a covered entity under the Health Insurance Portability and Accountability Act (HIPAA). pepguideIQ is a
            personal research logging and educational software tool. Data you enter is not protected health information (PHI) under HIPAA.
            Do not enter clinical, diagnostic, or treatment information you believe to be HIPAA-protected.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Third Party Services</strong>
          </p>
          <p style={BODY}>
            pepguideIQ uses third party service providers for database hosting, content delivery, and payment processing. These providers
            are contractually bound to protect your data and may not use it for their own purposes.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Your Rights</strong>
          </p>
          <p style={BODY}>Access: You can review your data in your Profile tab at any time</p>
          <p style={BODY}>
            Deletion: You can delete your account and all associated data from Settings → Danger Zone. Deletion is permanent and processed
            within 30 days.
          </p>
          <p style={BODY}>Correction: You can update your profile, metrics, and handle at any time</p>
          <p style={BODY}>Portability: Protocol data export available in Profile settings (Pro+)</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Data Retention</strong>
          </p>
          <p style={BODY}>
            Active account data is retained while your account exists. Deleted accounts are purged within 30 days. Anonymized aggregate usage
            statistics may be retained indefinitely.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Children</strong>
          </p>
          <p style={BODY}>pepguideIQ is not intended for users under 18. We do not knowingly collect data from minors.</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Changes</strong>
          </p>
          <p style={BODY}>
            We will notify users of material changes via email to your registered address at least 14 days before changes take effect.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Contact</strong>
          </p>
          <p style={BODY}>hello@pepguideiq.com</p>
        </section>

        <section id="terms" style={{ scrollMarginTop: 72 }}>
          <h1 style={SECTION_HDR}>TERMS OF SERVICE — pepguideIQ</h1>
          <p style={BODY}>Effective Date: May 1, 2026</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>1. Acceptance</strong>
          </p>
          <p style={BODY}>By creating an account or using pepguideIQ, you agree to these Terms. If you do not agree, do not use the service.</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>2. What pepguideIQ Is</strong>
          </p>
          <p style={BODY}>
            pepguideIQ is an educational software platform for tracking, organizing, and researching peptide compounds. It provides
            informational content, logging tools, reconstitution calculators, and AI-assisted research guidance.
          </p>
          <p style={BODY}>pepguideIQ is NOT:</p>
          <p style={BODY}>A medical device</p>
          <p style={BODY}>A licensed pharmacy or compounding service</p>
          <p style={BODY}>A source of medical, clinical, or therapeutic advice</p>
          <p style={BODY}>A vendor or retailer of any compounds</p>
          <p style={BODY}>A HIPAA covered entity</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>3. Research Use Only — No Medical Advice</strong>
          </p>
          <p style={BODY}>
            ALL content on pepguideIQ — including compound data, dosing information, reconstitution calculators, AI Atfeh responses, and
            community posts — is provided for educational and research reference purposes only.
          </p>
          <p style={BODY}>
            Nothing on pepguideIQ constitutes medical advice, diagnosis, or treatment recommendations. Always consult a qualified, licensed
            healthcare provider before using any compound. pepguideIQ assumes no responsibility for any health outcomes related to information
            accessed through this platform.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>4. User Responsibilities</strong>
          </p>
          <p style={BODY}>You represent and warrant that:</p>
          <p style={BODY}>You are at least 18 years of age</p>
          <p style={BODY}>You will comply with all applicable laws in your jurisdiction regarding any compounds you research</p>
          <p style={BODY}>
            You understand that many compounds discussed on pepguideIQ are not approved by the FDA or equivalent regulatory bodies in your
            jurisdiction
          </p>
          <p style={BODY}>You assume full and sole responsibility for any decisions made based on information accessed through pepguideIQ</p>
          <p style={BODY}>You will not use pepguideIQ to facilitate the sale, distribution, or illegal procurement of any regulated substance</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>5. Accuracy of Information</strong>
          </p>
          <p style={BODY}>
            pepguideIQ makes reasonable efforts to maintain accurate compound information but makes no warranties regarding completeness,
            accuracy, or fitness for any purpose. Compound data, dosing ranges, and reconstitution guidance reflect general research literature
            and may not apply to your specific situation.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>6. AI Atfeh</strong>
          </p>
          <p style={BODY}>
            The pepguideIQ AI Atfeh is powered by large language model technology. AI outputs may be inaccurate, incomplete, or outdated. AI
            responses are not a substitute for professional medical advice. Do not make health decisions based solely on AI Atfeh output.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>7. Network Tab and User Content</strong>
          </p>
          <p style={BODY}>
            By posting to the pepguideIQ Network tab, you grant pepguideIQ a non-exclusive, royalty-free license to display your shared
            content within the platform. You retain ownership of your data. You agree not to post content that is false, harmful, or violates
            applicable law.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>8. Subscriptions and Billing</strong>
          </p>
          <p style={BODY}>
            Subscription fees are billed through our payment processor. You may cancel at any time from your account settings. Cancellation
            takes effect at the end of your current billing period. We do not offer refunds for partial billing periods except where required
            by law.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>9. Termination</strong>
          </p>
          <p style={BODY}>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse the
            platform.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>10. Limitation of Liability</strong>
          </p>
          <p style={BODY}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PEPGUIDEIQ LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO PEPGUIDEIQ
            IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>11. Governing Law</strong>
          </p>
          <p style={BODY}>These Terms are governed by the laws of the State of Florida, without regard to conflict of law principles.</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>Contact</strong>
          </p>
          <p style={BODY}>hello@pepguideiq.com</p>
        </section>

        <section id="waiver" style={{ scrollMarginTop: 72 }}>
          <h1 style={SECTION_HDR}>RESEARCH USE WAIVER & DISCLAIMER — pepguideIQ</h1>
          <p style={BODY}>Effective Date: May 1, 2026</p>
          <p style={BODY}>By accessing pepguideIQ, you acknowledge and agree to the following:</p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>1. Research Reference Only</strong>
          </p>
          <p style={BODY}>
            All compound information, dosing guidance, reconstitution data, protocol examples, and AI-generated content within pepguideIQ is
            provided strictly for educational and research reference purposes only. This information is not intended to guide, encourage, or
            facilitate the administration of any compound to any human or animal.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>2. Not a Medical Platform</strong>
          </p>
          <p style={BODY}>
            pepguideIQ is not a healthcare provider, medical device, or HIPAA covered entity. Information on this platform does not constitute
            medical advice, diagnosis, or treatment. Nothing here creates a patient-provider relationship of any kind.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>3. Regulatory Status</strong>
          </p>
          <p style={BODY}>
            Many compounds referenced in pepguideIQ — including but not limited to BPC-157, TB-500, GHK-Cu, Retatrutide, and related peptides
            — are not approved by the U.S. Food and Drug Administration (FDA) for human therapeutic use. Regulations governing these compounds
            vary by country and jurisdiction. It is your sole responsibility to understand and comply with the laws applicable in your
            location.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>4. No Endorsement</strong>
          </p>
          <p style={BODY}>
            pepguideIQ does not endorse, recommend, or encourage the use of any compound. The presence of a compound in the pepguideIQ
            catalog does not constitute an endorsement of its safety, efficacy, or legality.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>5. No Vendor Affiliation</strong>
          </p>
          <p style={BODY}>
            pepguideIQ is not affiliated with, sponsored by, or compensated by any peptide vendor, compounding pharmacy, or supplement
            manufacturer. This is an independent research logging and education platform. Vendor names or product references appearing in
            educational materials are for informational context only.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>6. Assumption of Risk</strong>
          </p>
          <p style={BODY}>
            You expressly acknowledge that any decisions you make regarding the acquisition, handling, or use of any compound are made
            entirely at your own risk. pepguideIQ LLC, its founders, employees, and affiliates assume no liability whatsoever for any adverse
            outcomes, legal consequences, or health effects arising from information accessed through this platform.
          </p>
          <p style={BODY}>
            <strong style={{ color: "var(--color-text-primary)" }}>7. Consult a Professional</strong>
          </p>
          <p style={BODY}>
            Always consult a licensed physician, pharmacist, or qualified healthcare provider before making any decisions related to compounds
            referenced in pepguideIQ. This platform is not a substitute for professional medical guidance.
          </p>
        </section>
      </div>
    </div>
  );
}
