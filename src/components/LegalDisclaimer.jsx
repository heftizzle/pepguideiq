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
        borderTop: "1px solid #14202e",
        fontSize: 10,
        color: "#4a6080",
        lineHeight: 1.55,
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      PepGuideIQ provides educational information and software tools only. AI outputs may be inaccurate or incomplete.
      Peptides discussed may be regulated or require a prescription where you live. Consult a qualified clinician before
      use; you are responsible for compliance with applicable laws.
    </div>
  );
}
