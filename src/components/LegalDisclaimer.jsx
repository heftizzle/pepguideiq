/**
 * Non-exhaustive safety and legal context for peptide / AI content — not medical advice.
 */
export function LegalDisclaimer() {
  return (
    <div
      className="mono"
      style={{
        marginTop: 24,
        padding: "14px 16px",
        borderTop: "1px solid var(--color-border-default)",
        fontSize: 13,
        color: "var(--color-text-secondary)",
        lineHeight: 1.55,
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      PepGuideIQ provides educational information and software tools only. AI outputs may be inaccurate or incomplete.
      Peptides discussed may be regulated or require a prescription where you live. Consult a qualified clinician before
      use; you are responsible for compliance with applicable laws.
      <div
        style={{
          marginTop: 10,
          textAlign: "center",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
          fontFamily: "'Outfit', sans-serif",
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
  );
}
