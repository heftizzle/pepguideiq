export function Logo({ size = 19, style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}>
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        ⬡
      </div>
      <div>
        <div className="brand" style={{ fontSize: size, fontWeight: 800, letterSpacing: ".05em", lineHeight: 1.1 }}>
          <span style={{ color: "var(--color-accent)" }}>Pep</span>
          <span style={{ color: "var(--color-text-primary)" }}>Guide</span>
          <span style={{ color: "var(--color-accent)", fontSize: size * 0.7 }}>IQ</span>
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", letterSpacing: ".18em" }}>
          RESEARCH INTELLIGENCE
        </div>
      </div>
    </div>
  );
}
