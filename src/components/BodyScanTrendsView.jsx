import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { TIER_RANK } from "../lib/tiers.js";
import { formatInbodyScanDateOnly, inbodyToNum } from "../lib/inbodyScanDisplay.js";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { fetchProtocolEventsForTrends, getSessionAccessToken } from "../lib/supabase.js";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";

const CHART_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

/** @typedef {{ id: string, label: string, group: string, color: string }} MetricDef */

/** @type {MetricDef[]} */
const METRICS = [
  { id: "weight_lbs", label: "Weight", group: "Primary", color: "#888780" },
  { id: "smm_lbs", label: "SMM", group: "Primary", color: "#1D9E75" },
  { id: "pbf_pct", label: "BF%", group: "Primary", color: "#E24B4A" },
  { id: "lean_mass_lbs", label: "Lean Mass", group: "Primary", color: "#9CA3AF" },
  { id: "inbody_score", label: "InBody Score", group: "Primary", color: "#378ADD" },
  { id: "fat_mass_lbs", label: "Fat Mass", group: "Primary", color: "#F97316" },
  { id: "tbw_l", label: "TBW", group: "Body water", color: "#85B7EB" },
  { id: "icw_l", label: "ICW", group: "Body water", color: "#5B8DEF" },
  { id: "ecw_l", label: "ECW", group: "Body water", color: "#85B7EB" },
  { id: "ecw_tbw_ratio", label: "ECW/TBW", group: "Body water", color: "#85B7EB" },
  { id: "seg_lean_r_arm_lbs", label: "R. arm lean", group: "Segmental lean", color: "#22C55E" },
  { id: "seg_lean_l_arm_lbs", label: "L. arm lean", group: "Segmental lean", color: "#16A34A" },
  { id: "seg_lean_trunk_lbs", label: "Trunk lean", group: "Segmental lean", color: "#15803D" },
  { id: "seg_lean_r_leg_lbs", label: "R. leg lean", group: "Segmental lean", color: "#4ADE80" },
  { id: "seg_lean_l_leg_lbs", label: "L. leg lean", group: "Segmental lean", color: "#86EFAC" },
  { id: "seg_fat_r_arm_pct", label: "R. arm fat %", group: "Segmental fat", color: "#FB7185" },
  { id: "seg_fat_l_arm_pct", label: "L. arm fat %", group: "Segmental fat", color: "#F43F5E" },
  { id: "seg_fat_trunk_pct", label: "Trunk fat %", group: "Segmental fat", color: "#E11D48" },
  { id: "seg_fat_r_leg_pct", label: "R. leg fat %", group: "Segmental fat", color: "#FDA4AF" },
  { id: "seg_fat_l_leg_pct", label: "L. leg fat %", group: "Segmental fat", color: "#FECDD3" },
  { id: "bmr_kcal", label: "BMR", group: "Metabolic", color: "#AFA9EC" },
  { id: "visceral_fat_level", label: "Visceral Fat", group: "Metabolic", color: "#EF9F27" },
  { id: "bmi", label: "BMI", group: "Metabolic", color: "#64748B" },
];

const DEFAULT_METRICS = ["weight_lbs", "smm_lbs", "pbf_pct", "inbody_score"];

/** @param {string} metricId @param {number | null} delta */
function deltaFavorable(metricId, delta) {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return null;
  const lowerGood = new Set([
    "weight_lbs",
    "pbf_pct",
    "fat_mass_lbs",
    "visceral_fat_level",
    "bmi",
    "ecw_tbw_ratio",
    "seg_fat_r_arm_pct",
    "seg_fat_l_arm_pct",
    "seg_fat_trunk_pct",
    "seg_fat_r_leg_pct",
    "seg_fat_l_leg_pct",
  ]);
  const higherGood = new Set([
    "smm_lbs",
    "lean_mass_lbs",
    "inbody_score",
    "bmr_kcal",
    "seg_lean_r_arm_lbs",
    "seg_lean_l_arm_lbs",
    "seg_lean_trunk_lbs",
    "seg_lean_r_leg_lbs",
    "seg_lean_l_leg_lbs",
  ]);
  if (lowerGood.has(metricId)) return delta < 0;
  if (higherGood.has(metricId)) return delta > 0;
  return null;
}

/** @param {string} metricId */
function unitSuffix(metricId) {
  if (metricId === "pbf_pct" || metricId.startsWith("seg_fat_")) return "%";
  if (metricId === "ecw_tbw_ratio") return "";
  if (metricId === "inbody_score") return "";
  if (metricId === "bmr_kcal") return " kcal";
  if (metricId === "visceral_fat_level") return "";
  if (metricId === "bmi") return "";
  if (metricId.endsWith("_l") || metricId === "tbw_l" || metricId === "icw_l" || metricId === "ecw_l") return " L";
  return " lb";
}

/** Unit suffix for absolute delta from first scan (not % change). */
function deltaLineUnitSuffix(metricId) {
  if (metricId === "inbody_score") return " pts";
  if (metricId === "pbf_pct" || metricId.startsWith("seg_fat_")) return " %";
  if (metricId === "ecw_tbw_ratio") return "";
  if (metricId === "bmr_kcal") return " kcal";
  if (metricId === "visceral_fat_level") return "";
  if (metricId === "bmi") return "";
  if (metricId.endsWith("_l") || metricId === "tbw_l" || metricId === "icw_l" || metricId === "ecw_l") return " L";
  return " lb";
}

/** @param {string} metricId @param {number} delta */
function formatSignedDeltaBody(metricId, delta) {
  if (metricId === "ecw_tbw_ratio") {
    const r = Math.round(delta * 1000) / 1000;
    if (r > 0) return `+${r.toFixed(3)}`;
    if (r < 0) return r.toFixed(3);
    return "0";
  }
  const intish = new Set(["inbody_score", "visceral_fat_level", "bmr_kcal"]);
  if (intish.has(metricId)) {
    const r = Math.round(delta);
    if (r > 0) return `+${r}`;
    return String(r);
  }
  const r = Math.round(delta * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(1);
  if (r > 0) return `+${s}`;
  return s;
}

/**
 * @param {string} metricId
 * @param {number | null} first
 * @param {number | null} last
 * @returns {string}
 */
function absoluteDeltaFromFirstLine(metricId, first, last) {
  if (first == null || last == null || !Number.isFinite(first) || !Number.isFinite(last)) return "—";
  const delta = last - first;
  const suf = deltaLineUnitSuffix(metricId);
  if (delta === 0) return `0${suf}`;
  const arrow = delta > 0 ? "↑" : "↓";
  return `${arrow} ${formatSignedDeltaBody(metricId, delta)}${suf}`;
}

/** @param {string} metricId @param {number | null} n */
function formatLatestRaw(metricId, n) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (metricId === "inbody_score" || metricId === "visceral_fat_level" || metricId === "bmr_kcal") {
    return `${Math.round(n)}${unitSuffix(metricId)}`;
  }
  return `${n.toFixed(1)}${unitSuffix(metricId)}`;
}

function loadChartScript() {
  if (typeof globalThis !== "undefined" && globalThis.Chart) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-pepv-chart="${CHART_CDN}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Chart.js load error")));
      return;
    }
    const s = document.createElement("script");
    s.src = CHART_CDN;
    s.async = true;
    s.dataset.pepvChart = CHART_CDN;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Chart.js load error"));
    document.head.appendChild(s);
  });
}

/**
 * @param {Record<string, unknown>[]} scansAsc
 * @param {string} ymd `YYYY-MM-DD`
 */
function scanRangeContainsYmd(scansAsc, ymd) {
  if (!scansAsc.length || !ymd) return false;
  const t0 = Date.parse(String(scansAsc[0].scan_date ?? ""));
  const t1 = Date.parse(String(scansAsc[scansAsc.length - 1].scan_date ?? ""));
  const te = Date.parse(ymd);
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || !Number.isFinite(te)) return false;
  return te >= t0 && te <= t1;
}

/** @param {string} ymd */
function formatProtocolListDate(ymd) {
  const t = Date.parse(`${ymd}T12:00:00`);
  if (!Number.isFinite(t)) return ymd;
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(t);
  } catch {
    return ymd;
  }
}

/** @param {unknown} iso */
function formatInterpretedRelativeLine(iso) {
  if (iso == null) return "";
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return "";
  try {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    const sec = Math.round((t - Date.now()) / 1000);
    if (Math.abs(sec) < 45) return `Interpreted ${rtf.format(0, "second")}`;
    const min = Math.round(sec / 60);
    if (Math.abs(min) < 90) return `Interpreted ${rtf.format(min, "minute")}`;
    const hr = Math.round(min / 60);
    if (Math.abs(hr) < 36) return `Interpreted ${rtf.format(hr, "hour")}`;
    const day = Math.round(hr / 24);
    if (Math.abs(day) < 45) return `Interpreted ${rtf.format(day, "day")}`;
    return `Interpreted ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(t)}`;
  } catch {
    return "";
  }
}

/**
 * @param {{ m: MetricDef, scansAsc: Record<string, unknown>[], chartReady: boolean }} props
 */
function MetricTrendCard({ m, scansAsc, chartReady }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const chartRef = useRef(null);

  const first = scansAsc[0];
  const last = scansAsc[scansAsc.length - 1];
  const t0 = Date.parse(String(first?.scan_date ?? ""));
  const t1 = Date.parse(String(last?.scan_date ?? ""));
  const days = Number.isFinite(t0) && Number.isFinite(t1) ? Math.max(1, Math.round(Math.abs(t1 - t0) / 86400000)) : null;

  const a = inbodyToNum(first?.[m.id] ?? null);
  const b = inbodyToNum(last?.[m.id] ?? null);
  const latestText = formatLatestRaw(m.id, b);
  const deltaLine = absoluteDeltaFromFirstLine(m.id, a, b);
  const total = a != null && b != null && Number.isFinite(a) && Number.isFinite(b) && days != null ? b - a : null;
  const pace = total != null && days != null ? (total / days) * 30 : null;
  const favorable = total != null && Number.isFinite(total) ? deltaFavorable(m.id, total) : null;
  const deltaTone =
    favorable === true ? "var(--color-text-success)" : favorable === false ? "var(--color-text-danger)" : "var(--color-text-muted)";

  const sparkLabels = useMemo(
    () =>
      scansAsc.map((row) => {
        const raw = row.scan_date ?? null;
        return formatInbodyScanDateOnly(raw, "short") ?? String(raw ?? "");
      }),
    [scansAsc]
  );

  const sparkData = useMemo(() => scansAsc.map((row) => inbodyToNum(row[m.id] ?? null)), [scansAsc, m.id]);

  useEffect(() => {
    const Chart = typeof globalThis !== "undefined" ? globalThis.Chart : null;
    const canvas = canvasRef.current;
    if (!chartReady || !Chart || !canvas) return;

    chartRef.current?.destroy?.();
    chartRef.current = null;

    if (!scansAsc.length) return;

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels: sparkLabels,
        datasets: [
          {
            data: sparkData,
            borderColor: m.color,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            spanGaps: true,
            pointRadius: scansAsc.length <= 3 ? 3 : 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true, mode: "index", intersect: false },
        },
        scales: {
          x: { display: false, grid: { display: false }, ticks: { display: false } },
          y: { display: false, grid: { display: false }, ticks: { display: false } },
        },
      },
    });

    return () => {
      chartRef.current?.destroy?.();
      chartRef.current = null;
    };
  }, [chartReady, m.color, scansAsc.length, sparkData, sparkLabels]);

  const paceText =
    pace == null || !Number.isFinite(pace)
      ? "—"
      : `${pace > 0 ? "+" : ""}${pace.toFixed(1)}${unitSuffix(m.id)}/mo`;

  return (
    <div
      style={{
        border: "1px solid var(--color-border-default)",
        borderRadius: 12,
        padding: 12,
        background: "var(--color-bg-card)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.02em" }}>{m.label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-text-primary)", lineHeight: 1.15 }}>
        {latestText}
      </div>
      <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: deltaTone }}>{deltaLine}</div>
      <div style={{ height: 80, width: "100%", position: "relative" }}>
        <canvas ref={canvasRef} aria-hidden />
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>{paceText}</div>
    </div>
  );
}

/**
 * @param {{
 *   scans: Record<string, unknown>[],
 *   profileId: string,
 *   userId: string,
 *   tier: string,
 *   activeStack: { id: string, name: string, stackDose?: string, stackFrequency?: string }[],
 *   workerOk: boolean,
 *   onOpenUpgrade: () => void,
 *   onGuideDeepAnalysis?: (prompt: string) => void,
 *   onInterpretationPersisted?: () => void | Promise<void>,
 * }} props
 */
export function BodyScanTrendsView({
  scans,
  profileId,
  userId,
  tier,
  activeStack,
  workerOk,
  onOpenUpgrade,
  onGuideDeepAnalysis,
  onInterpretationPersisted,
}) {
  const tutorial = useTutorialOptional();
  const planKey = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  const isProPlus = (TIER_RANK[planKey] ?? 0) >= TIER_RANK.pro;

  const scansAsc = useMemo(() => {
    const copy = [...(scans ?? [])];
    copy.sort((a, b) => {
      const ta = Date.parse(String(a.scan_date ?? ""));
      const tb = Date.parse(String(b.scan_date ?? ""));
      return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    });
    return copy;
  }, [scans]);

  const anchorRow = useMemo(() => (scansAsc.length ? scansAsc[scansAsc.length - 1] : null), [scansAsc]);

  const cachedFromRow = useMemo(() => {
    const s = anchorRow?.ai_interpretation;
    return typeof s === "string" && s.trim().length > 0;
  }, [anchorRow?.ai_interpretation]);

  const [selected, setSelected] = useState(() => new Set(DEFAULT_METRICS));
  const [protocolEvents, setProtocolEvents] = useState(/** @type {{ date: string, label: string, type: string }[]} */ ([]));
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadChartScript()
      .then(() => {
        if (!cancelled) setChartReady(true);
      })
      .catch(() => {
        if (!cancelled) setChartReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { events } = await fetchProtocolEventsForTrends(userId, profileId);
      if (alive) setProtocolEvents(events ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [userId, profileId]);

  const eventsInRange = useMemo(() => {
    return protocolEvents.filter((e) => scanRangeContainsYmd(scansAsc, e.date));
  }, [protocolEvents, scansAsc]);

  const protocolRowsDesc = useMemo(() => {
    const copy = [...eventsInRange];
    copy.sort((a, b) => {
      const ta = Date.parse(`${a.date}T12:00:00`);
      const tb = Date.parse(`${b.date}T12:00:00`);
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    return copy;
  }, [eventsInRange]);

  const selectedMetrics = useMemo(() => METRICS.filter((m) => selected.has(m.id)), [selected]);

  const [interpretText, setInterpretText] = useState("");
  const [interpretAt, setInterpretAt] = useState(/** @type {unknown} */ (null));
  const [interpretBusy, setInterpretBusy] = useState(false);
  const [interpretErr, setInterpretErr] = useState(/** @type {string | null} */ (null));
  const [reinterpreting, setReinterpreting] = useState(false);

  useEffect(() => {
    if (interpretBusy) return;
    const raw = anchorRow?.ai_interpretation;
    const txt = typeof raw === "string" ? raw.trim() : "";
    if (txt) {
      setInterpretText(typeof raw === "string" ? raw : txt);
      setInterpretAt(anchorRow?.ai_interpreted_at ?? null);
      return;
    }
    setInterpretAt(null);
    if (!interpretText.trim()) {
      setInterpretText("");
    }
  }, [anchorRow?.id, anchorRow?.ai_interpretation, anchorRow?.ai_interpreted_at, interpretBusy, interpretText]);

  const runInterpret = useCallback(
    async (reinterpret = false) => {
      if (!isProPlus || !workerOk || !isApiWorkerConfigured()) {
        setInterpretErr("Worker not configured.");
        return;
      }
      const scanId = anchorRow && typeof anchorRow.id === "string" ? anchorRow.id.trim() : "";
      if (!scanId) {
        setInterpretErr("No scan to anchor interpretation.");
        return;
      }
      setInterpretBusy(true);
      setInterpretErr(null);
      if (reinterpret) {
        setReinterpreting(true);
        setInterpretText("");
        setInterpretAt(null);
      }
      let persistAfter = false;
      try {
        const token = await getSessionAccessToken();
        if (!token) {
          setInterpretErr("Sign in required.");
          setInterpretBusy(false);
          return;
        }
        const lastFive = [...scansAsc].slice(-5);
        const res = await fetch(`${API_WORKER_URL}/inbody-scan/interpret`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            scanId,
            reinterpret,
            scans: lastFive,
            protocolEvents,
            activeStack: (activeStack ?? []).map((r) => ({
              id: r.id,
              name: r.name,
              dose: [r.stackDose, r.stackFrequency].filter((x) => typeof x === "string" && x.trim()).join(" · ").trim() || null,
            })),
          }),
        });
        const ct = res.headers.get("content-type") || "";
        if (res.ok && ct.includes("application/json")) {
          const j = await res.json().catch(() => ({}));
          if (j.cached === true && typeof j.interpretation === "string") {
            setInterpretText(j.interpretation);
            setInterpretAt(j.ai_interpreted_at ?? null);
            persistAfter = true;
            return;
          }
          setInterpretErr(typeof j.error === "string" ? j.error : "Unexpected interpretation response.");
          return;
        }
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setInterpretErr(typeof j.error === "string" ? j.error : `Request failed (${res.status})`);
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
          setInterpretErr("No response body.");
          return;
        }
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const chunks = buf.split("\n\n");
          buf = chunks.pop() ?? "";
          for (const block of chunks) {
            for (const line of block.split("\n")) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const jsonStr = t.replace(/^data:\s*/, "");
              try {
                const ev = JSON.parse(jsonStr);
                if (ev.error) setInterpretErr(String(ev.error));
                if (typeof ev.text === "string" && ev.text) setInterpretText((prev) => prev + ev.text);
                if (ev.done) persistAfter = true;
              } catch {
                /* ignore */
              }
            }
          }
        }
      } catch (e) {
        setInterpretErr(e instanceof Error ? e.message : "Interpret failed.");
      } finally {
        if (persistAfter) {
          try {
            await onInterpretationPersisted?.();
          } catch {
            /* ignore */
          }
        }
        setReinterpreting(false);
        setInterpretBusy(false);
      }
    },
    [activeStack, anchorRow, isProPlus, onInterpretationPersisted, protocolEvents, scansAsc, workerOk]
  );

  const showCachedPanel = isProPlus && cachedFromRow && !interpretBusy && !reinterpreting;
  const showInterpretTrendsButton = isProPlus && !interpretBusy && !reinterpreting && !cachedFromRow && !interpretText.trim();

  const deepPrompt = useMemo(() => {
    if (!interpretText.trim()) return "";
    return `You are the PepGuideIQ AI Atfeh. The user just ran an Elite InBody trend interpretation:\n\n${interpretText}\n\nGive a deeper, structured analysis: key drivers, what to watch next scan, and how protocol timing lines up — still no medical directives or dosing changes.`;
  }, [interpretText]);

  const toggleMetric = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => {
    /** @type {Record<string, MetricDef[]>} */
    const g = {};
    for (const m of METRICS) {
      g[m.group] = g[m.group] ?? [];
      g[m.group].push(m);
    }
    return g;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        Each card shows the latest reading, the absolute change since your first scan, a sparkline of raw values over time, and an estimated per-month pace.
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 8 }}>
            {group.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMetric(m.id)}
                style={{
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  border: selected.has(m.id) ? `2px solid ${m.color}` : "1px solid var(--color-border-default)",
                  background: selected.has(m.id) ? "var(--color-bg-elevated)" : "var(--color-bg-card)",
                  color: "var(--color-text-primary)",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {selectedMetrics.map((m) => (
          <MetricTrendCard key={m.id} m={m} scansAsc={scansAsc} chartReady={chartReady} />
        ))}
      </div>

      {protocolRowsDesc.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>
            PROTOCOL (IN SCAN RANGE)
          </div>
          {protocolRowsDesc.map((ev, i) => (
            <div
              key={`${ev.date}-${ev.type}-${i}`}
              style={{
                fontSize: 13,
                color: "var(--color-text-primary)",
                lineHeight: 1.45,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {formatProtocolListDate(ev.date)} · {ev.label}
            </div>
          ))}
        </div>
      ) : null}

      <div
        data-tutorial-target={TUTORIAL_TARGET.atfeh_scan_interpret}
        {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.atfeh_scan_interpret)))}
        style={{
          border: "1px solid var(--color-border-default)",
          borderRadius: 10,
          padding: 14,
          background: isProPlus ? "var(--color-bg-card)" : "var(--color-background-secondary)",
          opacity: isProPlus ? 1 : 0.65,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>AI scan interpretation</div>
          {isProPlus ? (
            <span
              className="mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.08em",
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent-nav-border)",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              PRO+
            </span>
          ) : null}
        </div>

        {!isProPlus ? (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>
            Available on Pro and above.
            <button type="button" className="btn-teal" style={{ marginLeft: 10, fontSize: 12, padding: "6px 12px" }} onClick={onOpenUpgrade}>
              Upgrade
            </button>
          </div>
        ) : (
          <>
            {showInterpretTrendsButton ? (
              <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "8px 14px", marginBottom: 12 }} disabled={interpretBusy} onClick={() => void runInterpret(false)}>
                Interpret trends
              </button>
            ) : null}
            {interpretErr ? (
              <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginBottom: 8 }}>
                {interpretErr}
              </div>
            ) : null}
            {interpretBusy && !interpretText ? (
              <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Analyzing your scans…</div>
            ) : null}
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              <Markdown>{interpretText || (interpretBusy ? "\u00a0" : "")}</Markdown>
            </div>
            {showCachedPanel ? (
              <>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10 }}>{formatInterpretedRelativeLine(interpretAt)}</div>
                <button
                  type="button"
                  onClick={() => void runInterpret(true)}
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    marginTop: 8,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Reinterpret
                </button>
              </>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 12, padding: "6px 12px", opacity: interpretText.trim() ? 1 : 0.45 }}
                disabled={!interpretText.trim()}
                onClick={() => {
                  if (!interpretText.trim()) return;
                  onGuideDeepAnalysis?.(deepPrompt);
                }}
              >
                Deep analysis ↗
              </button>
              <button type="button" disabled style={{ fontSize: 12, padding: "6px 12px", opacity: 0.45, cursor: "not-allowed" }}>
                Export PDF (coming soon)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
