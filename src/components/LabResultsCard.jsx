import { useEffect, useMemo, useState } from "react";
import { LAB_CATEGORIES } from "../data/labMarkers/categories.js";
import { getMarkerDef } from "../data/labMarkerRegistry.js";
import { fetchLatestLabReport } from "../lib/supabase.js";

const EM = "\u2014";
const RING_C = 188.5;

const PRIORITY_KEYS = ["hs_crp", "ldl_cholesterol", "testosterone_total", "hemoglobin_a1c"];

const TILE_LABELS = {
  hs_crp: "hs-CRP",
  ldl_cholesterol: "LDL-C",
  testosterone_total: "Total T",
  hemoglobin_a1c: "HbA1c",
};

/** @param {unknown} v */
function toNum(v) {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {Record<string, unknown>} row */
function displayNumericFromRow(row) {
  const vn = toNum(row.value_numeric ?? null);
  if (vn != null) return vn;
  const vt = row.value_text;
  if (vt == null || typeof vt !== "string") return null;
  const t = vt.trim();
  if (!t) return null;
  const m = t.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/** @param {Record<string, unknown>} row */
function hasDisplayableValue(row) {
  return displayNumericFromRow(row) != null || (typeof row.value_text === "string" && row.value_text.trim().length > 0);
}

/** @param {unknown} raw */
function formatDrawDate(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const t = Date.parse(s.length <= 10 ? `${s}T12:00:00` : s);
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(t);
  } catch {
    return null;
  }
}

/** @param {unknown} rt */
function reportTypeLabel(rt) {
  const s = typeof rt === "string" ? rt.trim() : "";
  if (s === "pdf_parsed") return "PDF parsed";
  if (s === "structured_manual") return "Structured";
  return s || EM;
}

/**
 * hs-CRP mg/L: danger >3, warning 1–3, success <1 (card thresholds; not registry flag_logic).
 * @param {number | null} v
 */
function colorHsCrp(v) {
  if (v == null) return "var(--color-text-muted)";
  if (v > 3) return "var(--color-text-danger)";
  if (v >= 1) return "var(--color-warning)";
  return "var(--color-text-success)";
}

/** @param {number | null} v */
function colorLdl(v) {
  if (v == null) return "var(--color-text-muted)";
  if (v > 130) return "var(--color-text-danger)";
  if (v >= 100) return "var(--color-warning)";
  return "var(--color-text-success)";
}

/** @param {number | null} v */
function colorHbA1c(v) {
  if (v == null) return "var(--color-text-muted)";
  if (v > 6.5) return "var(--color-text-danger)";
  if (v >= 5.7) return "var(--color-warning)";
  return "var(--color-text-success)";
}

/**
 * Sex-aware Total T: within registry male/female range = success;
 * within outer 15% band inside range = warning; outside = danger.
 * Unknown sex → muted (no false precision).
 * @param {number | null} v
 * @param {string | null | undefined} bioSex
 */
function colorTotalT(v, bioSex) {
  if (v == null) return "var(--color-text-muted)";
  const def = getMarkerDef("testosterone_total");
  const rr = def?.reference_ranges;
  if (!rr || typeof rr !== "object") return "var(--color-text-primary)";
  const sex = typeof bioSex === "string" ? bioSex.trim().toLowerCase() : "";
  const band = sex === "female" ? rr.female : sex === "male" ? rr.male : null;
  if (!band || typeof band !== "object") return "var(--color-text-muted)";
  const low = toNum(band.low ?? null);
  const high = toNum(band.high ?? null);
  if (low == null || high == null) return "var(--color-text-primary)";
  if (v < low || v > high) return "var(--color-text-danger)";
  const span = high - low;
  const margin = span * 0.15;
  if (v <= low + margin || v >= high - margin) return "var(--color-warning)";
  return "var(--color-text-success)";
}

/** @param {string} key @param {number | null} v @param {string | null | undefined} bioSex */
function metricValueColor(key, v, bioSex) {
  if (key === "hs_crp") return colorHsCrp(v);
  if (key === "ldl_cholesterol") return colorLdl(v);
  if (key === "hemoglobin_a1c") return colorHbA1c(v);
  if (key === "testosterone_total") return colorTotalT(v, bioSex);
  if (v == null) return "var(--color-text-muted)";
  return "var(--color-text-primary)";
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
 * @param {{ profileId: string, biologicalSex?: string | null, refreshKey?: number }} props
 */
export function LabResultsCard({ profileId, biologicalSex = null, refreshKey = 0 }) {
  const [report, setReport] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [results, setResults] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [viewAllFlagged, setViewAllFlagged] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const pid = typeof profileId === "string" ? profileId.trim() : "";
    if (!pid) {
      setReport(null);
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setViewAllFlagged(false);
    setExpandedCategory(null);
    void fetchLatestLabReport(pid).then(({ report: rep, results: res, error }) => {
      if (cancelled) return;
      if (error) {
        setReport(null);
        setResults([]);
      } else {
        setReport(rep);
        setResults(Array.isArray(res) ? res : []);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, refreshKey]);

  const providerName =
    typeof report?.provider_name === "string" && report.provider_name.trim()
      ? report.provider_name.trim()
      : "Unknown";
  const drawDateStr = formatDrawDate(report?.date_drawn ?? null);
  const reportType = report?.report_type ?? "";

  const total = results.length;
  /** Strict false only — null in_range is not counted as flagged. */
  const flaggedRows = useMemo(() => results.filter((r) => r.in_range === false), [results]);
  const flagged = flaggedRows.length;
  const inRangeCount = useMemo(() => results.filter((r) => r.in_range === true).length, [results]);

  const inRangeFraction = total > 0 ? inRangeCount / total : 0;
  const ringDash = inRangeFraction * RING_C;
  const flaggedFraction = total > 0 ? flagged / total : 0;
  const flaggedDash = flaggedFraction * RING_C;
  const flaggedOffset = -(inRangeFraction * RING_C);

  const byKey = useMemo(() => {
    const m = new Map();
    for (const r of results) {
      const k = typeof r.canonical_key === "string" ? r.canonical_key : "";
      if (k) m.set(k, r);
    }
    return m;
  }, [results]);

  const fourTiles = useMemo(() => {
    /** @type {{ key: string, row: Record<string, unknown>, label: string }[]} */
    const out = [];
    const used = new Set();
    for (const key of PRIORITY_KEYS) {
      if (out.length >= 4) break;
      const row = byKey.get(key);
      if (row && hasDisplayableValue(row)) {
        out.push({ key, row, label: TILE_LABELS[key] ?? key });
        used.add(key);
      }
    }
    for (const row of flaggedRows) {
      if (out.length >= 4) break;
      const key = typeof row.canonical_key === "string" ? row.canonical_key : "";
      if (!key || used.has(key)) continue;
      if (!hasDisplayableValue(row)) continue;
      const def = getMarkerDef(key);
      out.push({
        key,
        row,
        label: def?.short_name || def?.display_name || key,
      });
      used.add(key);
    }
    return out;
  }, [byKey, flaggedRows]);

  const categoryFlagGroups = useMemo(() => {
    /** @type {Map<string, Record<string, unknown>[]>} */
    const map = new Map();
    for (const r of flaggedRows) {
      const key = typeof r.canonical_key === "string" ? r.canonical_key : "";
      const cat = getMarkerDef(key)?.category ?? "unknown";
      const c = typeof cat === "string" ? cat : "unknown";
      if (!map.has(c)) map.set(c, []);
      map.get(c)?.push(r);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [flaggedRows]);

  function categoryDisplayName(catKey) {
    const hit = LAB_CATEGORIES.find((c) => c.key === catKey);
    return hit?.display ?? catKey;
  }

  function formatRowValue(row) {
    const n = displayNumericFromRow(row);
    if (n != null) {
      const abs = Math.abs(n);
      const dec = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
      return n.toFixed(dec);
    }
    const vt = row.value_text;
    return typeof vt === "string" && vt.trim() ? vt.trim() : EM;
  }

  function rowUnit(row) {
    const u = row.unit;
    return typeof u === "string" && u.trim() ? u.trim() : "";
  }

  if (loading) return null;
  if (!report || total === 0) return null;

  const flaggedListShown = viewAllFlagged ? flaggedRows : flaggedRows.slice(0, 6);

  return (
    <div
      style={{
        marginTop: 14,
        border: "1px solid var(--color-border-default)",
        borderRadius: 10,
        padding: 18,
        background: "var(--color-bg-card)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "var(--color-accent)",
            }}
          >
            LAB RESULTS
          </div>
          <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>
            {providerName}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-primary)", fontWeight: 500 }}>{drawDateStr ?? EM}</div>
          <div style={{ marginTop: 8 }}>
            <span
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.08em",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-accent-nav-border)",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              {reportTypeLabel(reportType)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 6 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg width={72} height={72} viewBox="0 0 72 72" aria-hidden>
              <circle
                cx={36}
                cy={36}
                r={30}
                fill="none"
                stroke="var(--color-border-default)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${RING_C} ${RING_C}`}
                transform="rotate(-90 36 36)"
              />
              <circle
                cx={36}
                cy={36}
                r={30}
                fill="none"
                stroke="var(--color-text-danger)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${flaggedDash} ${RING_C}`}
                strokeDashoffset={flaggedOffset}
                transform="rotate(-90 36 36)"
              />
              <circle
                cx={36}
                cy={36}
                r={30}
                fill="none"
                stroke="var(--color-text-success)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${RING_C}`}
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
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--color-text-primary)",
              }}
            >
              {total > 0 ? Math.round(inRangeFraction * 100) : EM}
              {total > 0 ? <span style={{ fontSize: 10, fontWeight: 600 }}>%</span> : null}
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", textAlign: "center", lineHeight: 1.35 }}>
            <span style={{ color: "var(--color-text-danger)" }}>{flagged}</span>
            <span style={{ color: "var(--color-text-secondary)" }}>{` flagged / ${total} total`}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 18 }}>
        {fourTiles.map(({ key, row, label }) => {
          const n = displayNumericFromRow(row);
          const u = rowUnit(row);
          const vc = metricValueColor(key, n, biologicalSex);
          return (
            <div key={key} style={{ border: "1px solid var(--color-border-default)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>{label}</div>
              <div style={{ marginTop: 6, fontSize: 20, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: vc }}>
                {formatRowValue(row)}
                {u ? <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 4 }}>{u}</span> : null}
              </div>
            </div>
          );
        })}
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
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>Out of range</div>
          <span
            className="mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.08em",
              color: flagged > 0 ? "var(--color-text-danger)" : "var(--color-text-success)",
              border: `1px solid ${flagged > 0 ? "rgba(226,75,74,0.35)" : "var(--color-accent-nav-border)"}`,
              borderRadius: 4,
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            {flagged} flagged
          </span>
        </div>
        <div
          style={{
            maxHeight: viewAllFlagged ? undefined : 200,
            overflowY: viewAllFlagged ? "visible" : "auto",
          }}
        >
          {flaggedRows.length === 0 ? (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)", padding: "8px 0" }}>
              All reported markers in range.
            </div>
          ) : (
            flaggedListShown.map((row, idx) => {
              const key = typeof row.canonical_key === "string" ? row.canonical_key : "";
              const name = getMarkerDef(key)?.display_name ?? key;
              const dotColor =
                row.in_range === true ? "var(--color-text-success)" : row.in_range === false ? "var(--color-text-danger)" : "var(--color-text-muted)";
              return (
                <div
                  key={`${key}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: idx < flaggedListShown.length - 1 ? "1px solid var(--color-border-hairline)" : undefined,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--color-text-primary)" }}>{name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {formatRowValue(row)}
                    {rowUnit(row) ? ` ${rowUnit(row)}` : ""}
                  </div>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: dotColor,
                      flexShrink: 0,
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
        {flaggedRows.length > 6 ? (
          <button
            type="button"
            onClick={() => setViewAllFlagged((v) => !v)}
            className="mono"
            style={{
              marginTop: 8,
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--color-accent)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            {viewAllFlagged ? "Show less" : "View all"}
          </button>
        ) : null}
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          By category
        </div>
        {categoryFlagGroups.length === 0 ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No out-of-range markers by category.</div>
        ) : (
          categoryFlagGroups.map(([catKey, rows]) => {
            const n = rows.length;
            const open = expandedCategory === catKey;
            return (
              <div key={catKey} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => setExpandedCategory(open ? null : catKey)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border-default)",
                    background: "var(--color-bg-card)",
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                    {categoryDisplayName(catKey)}
                    <span style={{ color: "var(--color-text-muted)" }}>{` · ${n} flagged`}</span>
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {open ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {open ? (
                  <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: "2px solid var(--color-border-hairline)" }}>
                    {rows.map((row, idx) => {
                      const key = typeof row.canonical_key === "string" ? row.canonical_key : "";
                      const name = getMarkerDef(key)?.display_name ?? key;
                      return (
                        <div
                          key={`${key}-${idx}`}
                          style={{
                            fontSize: 12,
                            padding: "6px 0",
                            borderBottom: idx < rows.length - 1 ? "1px solid var(--color-border-hairline)" : undefined,
                            color: "var(--color-text-secondary)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          <span style={{ fontFamily: "'Outfit', sans-serif", color: "var(--color-text-primary)" }}>{name}</span>
                          {` — ${formatRowValue(row)}${rowUnit(row) ? ` ${rowUnit(row)}` : ""}`}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--color-border-hairline)", paddingTop: 14, marginTop: 4, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <MiniMetricCard label="Markers extracted">{total}</MiniMetricCard>
        <MiniMetricCard label="In range" valueColor="var(--color-text-success)">
          {inRangeCount}
        </MiniMetricCard>
        <MiniMetricCard label="Draw date">{drawDateStr ?? EM}</MiniMetricCard>
      </div>
    </div>
  );
}
