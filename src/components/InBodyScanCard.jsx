import { formatInbodyDecimal1, formatInbodyIntegerScan } from "../lib/inbodyScanDisplay.js";

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

/** @param {number | null} score */
function scoreDescriptor(score) {
  if (score == null) return { word: null, color: null };
  if (score < 60) return { word: "Fair", color: "var(--color-text-secondary)" };
  if (score < 70) return { word: "Average", color: "var(--color-text-warning)" };
  if (score < 80) return { word: "Good", color: "var(--color-text-success)" };
  if (score < 90) return { word: "Very Good", color: "var(--color-text-success)" };
  return { word: "Excellent", color: "var(--color-text-success)" };
}

const WEIGHT_BAR = { max: 300, lo: 0.47, hi: 0.6 };
const SMM_BAR = { max: 130, lo: 0.55, hi: 0.66 };
const FAT_BAR = { max: 80, lo: 0.19, hi: 0.32 };
const SEG_LEAN_MARKER = 0.62;

/**
 * @param {{ label: string, value: number | null, max: number, lo: number, hi: number, fill: string, rangeLine?: string | null }} p
 */
function MuscleFatBar({ label, value, max, lo, hi, fill, rangeLine }) {
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
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "var(--color-text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--color-text-secondary)" }}>
          {v == null ? EM : formatInbodyDecimal1(v)}
        </span>
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
      {rangeLine ? (
        <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.35 }}>
          {rangeLine}
        </div>
      ) : null}
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
        {v == null ? EM : `${formatInbodyDecimal1(v)} lb`}
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
 * @param {{ scan: Record<string, unknown>, handle?: string | null, prevScan?: Record<string, unknown> | null }} props
 */
export function InBodyScanCard({ scan, handle = null, prevScan = null }) {
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
  const scoreWord = scoreDescriptor(inbody_score);

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

  const wUpper = WEIGHT_BAR.hi * WEIGHT_BAR.max;
  const wLo = WEIGHT_BAR.lo * WEIGHT_BAR.max;
  let wStatus = "within";
  if (weight_lbs != null) {
    if (weight_lbs > wUpper) wStatus = "above";
    else if (weight_lbs < wLo) wStatus = "below";
  }
  const smmUpper = SMM_BAR.hi * SMM_BAR.max;
  const smmLower = SMM_BAR.lo * SMM_BAR.max;
  let mStatus = "within";
  if (smm_lbs != null) {
    if (smm_lbs > smmUpper) mStatus = "above";
    else if (smm_lbs < smmLower) mStatus = "below";
  }
  const fatUpper = FAT_BAR.hi * FAT_BAR.max;
  let fStatus = "within";
  if (fat_mass_lbs != null && fat_mass_lbs > fatUpper) fStatus = "elevated";

  const muscleAbove = mStatus === "above";
  const muscleBelow = mStatus === "below";
  const fatElevated = fStatus === "elevated";

  let mfBadgeText = "On track";
  let mfBadgeColor = "var(--color-text-success)";
  let mfBadgeBorder = "var(--color-accent-nav-border)";
  if (muscleBelow) {
    mfBadgeText = "Build opportunity";
    mfBadgeColor = "var(--color-warning)";
    mfBadgeBorder = "rgba(234,179,8,0.45)";
  } else if (muscleAbove && fatElevated) {
    mfBadgeText = "High muscle · elevated fat";
    mfBadgeColor = "var(--color-warning)";
    mfBadgeBorder = "rgba(234,179,8,0.45)";
  } else if (muscleAbove && !fatElevated) {
    mfBadgeText = "Above average";
    mfBadgeColor = "var(--color-text-success)";
    mfBadgeBorder = "var(--color-accent-nav-border)";
  }

  const weightRangeLine =
    weight_lbs == null
      ? null
      : `Normal ≤ ${formatInbodyDecimal1(wUpper)} lbs · ${wStatus === "above" ? "above" : wStatus === "below" ? "below" : "within"}`;
  const muscleRangeLine =
    smm_lbs == null
      ? null
      : `Normal ${formatInbodyDecimal1(smmLower)}–${formatInbodyDecimal1(smmUpper)} lbs · ${
          mStatus === "above" ? "above ✓" : mStatus === "below" ? "below" : "within"
        }`;
  const fatRangeLine =
    fat_mass_lbs == null
      ? null
      : `Normal ≤ ${formatInbodyDecimal1(fatUpper)} lbs · ${fStatus === "elevated" ? "elevated" : "within"}`;

  const smmNormUpper = smmUpper;
  const smmNormLower = smmLower;
  let s1 = "";
  if (smm_lbs != null && smmNormUpper > 0) {
    if (smm_lbs > smmNormUpper) {
      const pct = (((smm_lbs - smmNormUpper) / smmNormUpper) * 100).toFixed(1);
      s1 = `Muscle is ${pct}% above the normal range for your height.`;
    } else if (smm_lbs < smmNormLower) {
      const pct = (((smmNormLower - smm_lbs) / smmNormLower) * 100).toFixed(1);
      s1 = `Muscle is ${pct}% below normal — primary build opportunity.`;
    } else {
      s1 = "Muscle is within the normal range.";
    }
  }

  let s2 = "Body composition is trending in the right direction.";
  if (pbf_pct != null && pbf_pct > 25) {
    s2 = "Body fat reduction is the primary goal for this phase.";
  } else if (ecw_tbw_ratio != null && ecw_tbw_ratio >= 0.39) {
    s2 = `ECW/TBW of ${formatInbodyDecimal1(ecw_tbw_ratio)} is approaching the edema threshold — monitor hydration.`;
  }

  const segRows = [
    { label: "R Arm", v: seg_lean_r_arm_lbs, max: 12 },
    { label: "L Arm", v: seg_lean_l_arm_lbs, max: 12 },
    { label: "Trunk", v: seg_lean_trunk_lbs, max: 110 },
    { label: "R Leg", v: seg_lean_r_leg_lbs, max: 35 },
    { label: "L Leg", v: seg_lean_l_leg_lbs, max: 35 },
  ];
  const markerVals = segRows.map(({ v, max }) => (v == null ? null : SEG_LEAN_MARKER * max));
  const allAboveMarker = segRows.every(({ v, max }, i) => v != null && v > (markerVals[i] ?? 0));
  const anyWellBelow = segRows.some(({ v, max }, i) => {
    const mk = SEG_LEAN_MARKER * max;
    return v != null && v < mk * 0.9;
  });
  let segBadgeText = null;
  let segBadgeTone = "success";
  if (allAboveMarker) {
    segBadgeText = "Balanced";
    segBadgeTone = "success";
  } else if (anyWellBelow) {
    segBadgeText = "Imbalance detected";
    segBadgeTone = "warning";
  }

  const prevBmr = prevScan ? toNum(prevScan.bmr_kcal ?? null) : null;
  let bmrSub = "kcal/day";
  if (smm_lbs != null && smm_lbs > 95) bmrSub += " · elevated by muscle mass";
  if (bmr_kcal != null && prevBmr != null && bmr_kcal > prevBmr) bmrSub += " · building";

  const waterEcwLine =
    ecw_tbw_ratio != null && ecw_tbw_ratio < 0.39
      ? `ECW/TBW of ${formatInbodyDecimal1(ecw_tbw_ratio)} is within normal range — no edema signal.`
      : null;

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 4 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
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
              {formatInbodyIntegerScan(inbody_score)}
            </div>
          </div>
          {scoreWord.word ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: scoreWord.color ?? "var(--color-text-secondary)", letterSpacing: "0.04em" }}>{scoreWord.word}</div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Weight</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {weight_lbs == null ? EM : `${formatInbodyDecimal1(weight_lbs)} lb`}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>SMM</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-success)" }}>
            {smm_lbs == null ? EM : `${formatInbodyDecimal1(smm_lbs)} lb`}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Body Fat</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-danger)" }}>
            {pbf_pct == null ? EM : `${formatInbodyDecimal1(pbf_pct)}%`}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-danger)" }}>
            {fat_mass_lbs == null ? EM : `${formatInbodyDecimal1(fat_mass_lbs)} lb fat`}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Lean Mass</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {lean_mass_lbs == null ? EM : `${formatInbodyDecimal1(lean_mass_lbs)} lb`}
          </div>
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>Muscle–fat analysis</div>
          <span
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.08em",
              color: mfBadgeColor,
              border: `1px solid ${mfBadgeBorder}`,
              borderRadius: 4,
              padding: "2px 6px",
              flexShrink: 0,
              maxWidth: "52%",
              textAlign: "right",
              lineHeight: 1.25,
            }}
          >
            {mfBadgeText}
          </span>
        </div>
        <MuscleFatBar
          label="Weight"
          value={weight_lbs}
          max={WEIGHT_BAR.max}
          lo={WEIGHT_BAR.lo}
          hi={WEIGHT_BAR.hi}
          fill="#888780"
          rangeLine={weightRangeLine}
        />
        <MuscleFatBar label="Muscle" value={smm_lbs} max={SMM_BAR.max} lo={SMM_BAR.lo} hi={SMM_BAR.hi} fill="#1D9E75" rangeLine={muscleRangeLine} />
        <MuscleFatBar label="Body Fat" value={fat_mass_lbs} max={FAT_BAR.max} lo={FAT_BAR.lo} hi={FAT_BAR.hi} fill="#E24B4A" rangeLine={fatRangeLine} />
        {s1 ? (
          <div
            style={{
              marginTop: 10,
              marginBottom: 8,
              padding: "10px 12px",
              borderLeft: "2px solid var(--color-border-success)",
              background: "var(--color-background-primary)",
              fontSize: 12,
              color: "var(--color-text-secondary)",
              lineHeight: 1.45,
            }}
          >
            {`${s1} ${s2}`}
          </div>
        ) : null}
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontStyle: "italic", marginTop: 2 }}>Shaded zone = normal range.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>Segmental lean</div>
            {segBadgeText ? (
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  color: segBadgeTone === "warning" ? "var(--color-warning)" : "var(--color-text-success)",
                  border: `1px solid ${segBadgeTone === "warning" ? "rgba(234,179,8,0.45)" : "var(--color-accent-nav-border)"}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {segBadgeText}
              </span>
            ) : null}
          </div>
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
            <MiniMetricCard label="TBW (L)">{tbwDisplay == null ? EM : formatInbodyDecimal1(tbwDisplay)}</MiniMetricCard>
            <MiniMetricCard label="ICW (L)">{icw_l == null ? EM : formatInbodyDecimal1(icw_l)}</MiniMetricCard>
            <MiniMetricCard label="ECW (L)">{ecw_l == null ? EM : formatInbodyDecimal1(ecw_l)}</MiniMetricCard>
            <MiniMetricCard label="ECW/TBW" valueColor={ecwTbwColor}>
              {ecw_tbw_ratio == null ? EM : formatInbodyDecimal1(ecw_tbw_ratio)}
            </MiniMetricCard>
          </div>
          {waterEcwLine ? (
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 10, lineHeight: 1.4 }}>
              {waterEcwLine}
            </div>
          ) : null}
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
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: segFatColor(v) }}>
              {v == null ? EM : `${formatInbodyDecimal1(v)}%`}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border-hairline)", paddingTop: 14, marginTop: 4, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>BMR</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {formatInbodyIntegerScan(bmr_kcal)}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>{bmrSub}</div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", lineHeight: 1.3 }}>Visceral Fat Level</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: visceral_fat_level == null ? "var(--color-text-muted)" : visceralColor }}>
            {formatInbodyIntegerScan(visceral_fat_level)}
          </div>
        </div>
        <div style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 10px" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>BMI</div>
          <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{bmi == null ? EM : formatInbodyDecimal1(bmi)}</div>
          {highLeanSmm ? <div style={{ marginTop: 4, fontSize: 11, color: "var(--color-text-muted)" }}>high lean mass adj.</div> : null}
        </div>
      </div>
    </div>
  );
}
