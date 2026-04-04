export function Logo({ size = 19, style = {} }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}>
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg,#00d4aa,#0891b2)",
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
          <span style={{ color: "#00d4aa" }}>Pep</span>
          <span style={{ color: "#dde4ef" }}>Guide</span>
          <span style={{ color: "#00d4aa", fontSize: size * 0.7 }}>IQ</span>
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", letterSpacing: ".18em" }}>
          RESEARCH INTELLIGENCE
        </div>
      </div>
    </div>
  );
}
