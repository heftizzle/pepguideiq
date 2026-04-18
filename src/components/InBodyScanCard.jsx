const EM = "\u2014";
const SCORE_RING_C = 188.5;

/** @param {unknown} v */
function toNum(v) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {unknown} raw */
function formatScanDate(raw) {
  const t = raw == null ? NaN : Date.parse(String(raw));
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(t);
  } catch {
    return null;
  }
}

/** @param {number | null} n @param {number} [digits] */
function fmtNum(n, digits = 1) {
  if (n == null) return EM;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** @param {number | null} n */
function fmtInt(n) {
  if (n == null) return EM;
  return Math.round(n).toLocaleString(undefined);
}

/**
 * @param {{ label: string, value: number | null, max: number, lo: number, hi: number, fill: string }} p
 */
function MuscleFatBar({ label, value, max, lo, hi, fill }) {
  const v = value ?? null;
  const pct = v == null ? null : Math.min(100, Math.max(0, (v / max) * 100));
  const nzLeft = lo * 100;
  const nzW = (hi - lo) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          gap: 8,
        }}
      >
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--color-text-secondary)" }}>{v == null ? EM : fmtNum(v, 1)}</span>
      </div>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          height: 14,
          borderRadius: 4,
          background: "var(--color-border-default)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${nzLeft}%`,
            width: `${nzW}%`,
            top: 0,
            bottom: 0,
            background: "rgba(29, 158, 117, 0.28)",
            zIndex: 1,
          }}
        />
        {pct != null && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              background: fill,
              zIndex: 2,
            }}
          />
        )}
        {pct != null && (
          <div
            style={{
              position: "absolute",
              left: `${pct}%`,
              top: 0,
              bottom: 0,
              width: 0,
              borderLeft: "2px solid #1D9E75",
              marginLeft: -1,
              zIndex: 3,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * @param {{ label: string, value: number | null, max: number }} p
 */
function SegmentalLeanRow({ label, value, max }) {
  const v = value ?? null;
  const pct = v == null ? 0 : Math.min(100, Math.max(0, (v / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 56, flexShrink: 0, fontSize: 11, color: "var(--color-text-muted)", fontFamily: "'Outfit',sans-serif" }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", height: 12, borderRadius: 3, overflow: "hidden", background: "var(--color-border-default)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: "#1D9E75",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "62%",
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: "2px solid #ffffff",
            marginLeft: -1,
            zIndex: 2,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
          }}
        />
      </div>
      <div style={{ width: 52, flexShrink: 0, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--color-text-secondary)" }}>
        {v == null ? EM : `${fmtNum(v, 1)} lb`}
      </div>
    </div>
  );
}

/**
 * @param {{ label: string, children: import("react").ReactNode, sub?: import("react").ReactNode, valueColor?: string }} p
 */
function MiniMetricCard({ label, children, sub, valueColor }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: 8,
        padding: "10px 12px",
        background: "var(--color-bg-card)",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: valueColor ?? "var(--color-text-primary)" }}>{children}</div>
      {sub ? <div style={{ fontSize: 11, marginTop: 4, color: "var(--color-text-muted)" }}>{sub}</div> : null}
    </div>
  );
}

/**
 * Full visualization for one `inbody_scan_history` row (upload/parse/save flow unchanged).
 *
 * @param {{ scan: Record<string, unknown>, handle?: string | null }} props
 */
export function InBodyScanCard({ scan, handle = null }) {
  const row = scan ?? {};
  const h = typeof handle === "string" && handle.trim() ? handle.trim() : EM;

  const scan_date = formatScanDate(row.scan_date ?? null);
  const weight_lbs = toNum(row.weight_lbs ?? null);
  const lean_mass_lbs = toNum(row.lean_mass_lbs ?? null);
  const smm_lbs = toNum(row.smm_lbs ?? null);
  const pbf_pct = toNum(row.pbf_pct ?? null);
  const fat_mass_lbs = toNum(row.fat_mass_lbs ?? null);
  const inbody_score = toNum(row.inbody_score ?? null);
  const bmi = toNum(row.bmi ?? null);
  const bmr_kcal = toNum(row.bmr_kcal ?? null);
  const visceral_fat_level = toNum(row.visceral_fat_level ?? null);
  const tbw_l = toNum(row.tbw_l ?? null);
  const icw_l = toNum(row.icw_l ?? null);
  const ecw_l = toNum(row.ecw_l ?? null);
  const ecw_tbw_ratio = toNum(row.ecw_tbw_ratio ?? null);

  const seg_lean_r_arm_lbs = toNum(row.seg_lean_r_arm_lbs ?? null);
  const seg_lean_l_arm_lbs = toNum(row.seg_lean_l_arm_lbs ?? null);
  const seg_lean_trunk_lbs = toNum(row.seg_lean_trunk_lbs ?? null);
  const seg_lean_r_leg_lbs = toNum(row.seg_lean_r_leg_lbs ?? null);
  const seg_lean_l_leg_lbs = toNum(row.seg_lean_l_leg_lbs ?? null);

  const seg_fat_r_arm_pct = toNum(row.seg_fat_r_arm_pct ?? null);
  const seg_fat_l_arm_pct = toNum(row.seg_fat_l_arm_pct ?? null);
  const seg_fat_trunk_pct = toNum(row.seg_fat_trunk_pct ?? null);
  const seg_fat_r_leg_pct = toNum(row.seg_fat_r_leg_pct ?? null);
  const seg_fat_l_leg_pct = toNum(row.seg_fat_l_leg_pct ?? null);

  const scoreClamped = inbody_score == null ? null : Math.min(100, Math.max(0, inbody_score));
  const scoreDash = scoreClamped == null ? 0 : (scoreClamped / 100) * SCORE_RING_C;

  const waterPairOk = icw_l != null && ecw_l != null;
  const icwN = waterPairOk && icw_l != null ? icw_l : 0;
  const ecwN = waterPairOk && ecw_l != null ? ecw_l : 0;
  const sumW = icwN + ecwN;
  const icwFlex = sumW > 0 ? icwN / sumW : 0.5;
  const ecwFlex = sumW > 0 ? ecwN / sumW : 0.5;

  let ecwTbwColor = "var(--color-text-primary)";
  if (ecw_tbw_ratio != null) {
    if (ecw_tbw_ratio < 0.39) ecwTbwColor = "var(--color-text-success)";
    else if (ecw_tbw_ratio <= 0.4) ecwTbwColor = "var(--color-warning)";
    else ecwTbwColor = "var(--color-text-danger)";
  }

  const tbwDisplay = tbw_l ?? (icw_l != null && ecw_l != null ? icw_l + ecw_l : null);

  /** @param {number | null} p */
  const segFatColor = (p) => {
    if (p == null) return "var(--color-text-muted)";
    if (p > 25) return "var(--color-text-danger)";
    if (p > 20) return "var(--color-warning)";
    return "var(--color-text-primary)";
  };

  let visceralColor = "var(--color-text-primary)";
  if (visceral_fat_level != null) {
    if (visceral_fat_level >= 15) visceralColor = "var(--color-text-danger)";
    else if (visceral_fat_level >= 10) visceralColor = "var(--color-warning)";
  }

  const highLeanSmm = smm_lbs != null && smm_lbs > 95;

  return (
    <div
      style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: 10,
        padding: 18,
        background: "var(--color-bg-card)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", color: "var(--color-accent)" }}>INBODY 570</div>
          <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-primary)", fontWeight: 500 }}>{scan_date ?? EM}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-secondary)" }}>{h}</div>
        </div>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} viewBox="0 0 72 72" aria-hidden>
            <circle cx={36} cy={36} r={30} fill="none" stroke="#B5D4F4" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${SCORE_RING_C} ${SCORE_RING_C}`} transform="rotate(-90 36 36)" />
            <circle
              cx={36}
              cy={36}
              r={30}
              fill="none"
              stroke="#378ADD"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={`${scoreDash} ${SCORE_RING_C}`}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              fontSize: inbody_score != null && inbody_score >= 100 ? 13 : 15,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--color-text-primary)",
            }}
          >
            {inbody_score == null ? EM : fmtInt(inbody_score)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Weight</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)" }}>{weight_lbs == null ? EM : `${fmtNum(weight_lbs, 1)} lb`}</div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>SMM</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-success)" }}>{smm_lbs == null ? EM : `${fmtNum(smm_lbs, 1)} lb`}</div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Body Fat</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-danger)" }}>{pbf_pct == null ? EM : `${fmtNum(pbf_pct, 1)}%`}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-danger)" }}>{fat_mass_lbs == null ? EM : `${fmtNum(fat_mass_lbs, 1)} lb fat`}</div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Lean Mass</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)" }}>{lean_mass_lbs == null ? EM : `${fmtNum(lean_mass_lbs, 1)} lb`}</div>
        </div>
      </div>

      <div
        style={{
          background: "var(--color-background-secondary)",
          borderRadius: 8,
          padding: "14px 14px 10px",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>Muscle–fat analysis</div>
        <MuscleFatBar label="Weight" value={weight_lbs} max={300} lo={0.47} hi={0.6} fill="#888780" />
        <MuscleFatBar label="Muscle" value={smm_lbs} max={130} lo={0.55} hi={0.66} fill="#1D9E75" />
        <MuscleFatBar label="Body Fat" value={fat_mass_lbs} max={80} lo={0.19} hi={0.32} fill="#E24B4A" />
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic", marginTop: 2 }}>Shaded zone = normal range.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>Segmental lean</div>
          <SegmentalLeanRow label="R Arm" value={seg_lean_r_arm_lbs} max={12} />
          <SegmentalLeanRow label="L Arm" value={seg_lean_l_arm_lbs} max={12} />
          <SegmentalLeanRow label="Trunk" value={seg_lean_trunk_lbs} max={110} />
          <SegmentalLeanRow label="R Leg" value={seg_lean_r_leg_lbs} max={35} />
          <SegmentalLeanRow label="L Leg" value={seg_lean_l_leg_lbs} max={35} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>Body water</div>
          <div style={{ display: "flex", width: "100%", height: 18, borderRadius: 4, overflow: "hidden", marginBottom: 12, background: "var(--color-border-default)" }}>
            {!waterPairOk ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-muted)" }}>{EM}</div>
            ) : (
              <>
                <div style={{ flex: icwFlex, background: "#378ADD", minWidth: icwN > 0 ? 2 : 0 }} />
                <div style={{ flex: ecwFlex, background: "#85B7EB", minWidth: ecwN > 0 ? 2 : 0 }} />
              </>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <MiniMetricCard label="TBW (L)">{tbwDisplay == null ? EM : fmtNum(tbwDisplay, 2)}</MiniMetricCard>
            <MiniMetricCard label="ICW (L)">{icw_l == null ? EM : fmtNum(icw_l, 2)}</MiniMetricCard>
            <MiniMetricCard label="ECW (L)">{ecw_l == null ? EM : fmtNum(ecw_l, 2)}</MiniMetricCard>
            <MiniMetricCard label="ECW/TBW" valueColor={ecwTbwColor}>
              {ecw_tbw_ratio == null ? EM : fmtNum(ecw_tbw_ratio, 3)}
            </MiniMetricCard>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { k: "R Arm", v: seg_fat_r_arm_pct },
          { k: "L Arm", v: seg_fat_l_arm_pct },
          { k: "Trunk", v: seg_fat_trunk_pct },
          { k: "R Leg", v: seg_fat_r_leg_pct },
          { k: "L Leg", v: seg_fat_l_leg_pct },
        ].map(({ k, v }) => (
          <div
            key={k}
            style={{
              flex: "1 1 0",
              minWidth: 56,
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: segFatColor(v) }}>{v == null ? EM : `${fmtNum(v, 1)}%`}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border-hairline)", paddingTop: 14, marginTop: 4, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>BMR</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {bmr_kcal == null ? EM : fmtInt(bmr_kcal)}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>kcal/day</div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", lineHeight: 1.3 }}>Visceral Fat Level</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: visceral_fat_level == null ? "var(--color-text-muted)" : visceralColor }}>
            {visceral_fat_level == null ? EM : fmtInt(visceral_fat_level)}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>BMI</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{bmi == null ? EM : fmtNum(bmi, 1)}</div>
          {highLeanSmm ? <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>high lean mass adj.</div> : null}
        </div>
      </div>
    </div>
  );
}
