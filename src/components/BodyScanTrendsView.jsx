import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { TIER_RANK } from "../lib/tiers.js";
import { formatInbodyScanDateOnly, inbodyToNum } from "../lib/inbodyScanDisplay.js";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { fetchProtocolEventsForTrends, getSessionAccessToken } from "../lib/supabase.js";

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

/**
 * @param {unknown} chart
 * @param {number[]} scanTsAsc
 * @param {number} eventTs
 */
function xPixelForEventTs(chart, scanTsAsc, eventTs) {
  const xScale = chart.scales?.x;
  if (!xScale || !scanTsAsc.length) return null;
  const n = scanTsAsc.length;
  if (n === 1) {
    const p = xScale.getPixelForTick?.(0);
    return typeof p === "number" ? p : null;
  }
  if (eventTs <= scanTsAsc[0]) {
    const p = xScale.getPixelForTick?.(0);
    return typeof p === "number" ? p : null;
  }
  if (eventTs >= scanTsAsc[n - 1]) {
    const p = xScale.getPixelForTick?.(n - 1);
    return typeof p === "number" ? p : null;
  }
  for (let i = 0; i < n - 1; i++) {
    const t0 = scanTsAsc[i];
    const t1 = scanTsAsc[i + 1];
    if (eventTs >= t0 && eventTs <= t1) {
      const denom = t1 - t0 || 1;
      const f = (eventTs - t0) / denom;
      const x0 = xScale.getPixelForTick?.(i);
      const x1 = xScale.getPixelForTick?.(i + 1);
      if (typeof x0 === "number" && typeof x1 === "number") return x0 + f * (x1 - x0);
    }
  }
  return null;
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

const protocolOverlayPlugin = {
  id: "pepvInbodyProtocolOverlay",
  /** @param {any} chart */
  afterDraw(chart) {
    const pack = chart.pepvProtocol;
    const events = pack?.events;
    const scanTsAsc = pack?.scanTsAsc;
    if (!chart.ctx || !chart.chartArea || !events?.length || !scanTsAsc?.length) return;
    const { top, bottom } = chart.chartArea;
    const c = chart.ctx;

    /** @type {{ ev: { date: string, label: string }, x: number, stagger: number }[]} */
    const placed = [];
    for (const ev of events) {
      const te = Date.parse(`${ev.date}T12:00:00Z`);
      const x = xPixelForEventTs(chart, scanTsAsc, te);
      if (x == null || !Number.isFinite(x)) continue;
      placed.push({ ev, x, stagger: 0 });
    }
    placed.sort((a, b) => a.x - b.x);
    for (let i = 0; i < placed.length; i++) {
      if (i > 0 && placed[i].x - placed[i - 1].x <= 20) {
        placed[i].stagger = (placed[i - 1].stagger + 1) % 3;
      } else {
        placed[i].stagger = 0;
      }
    }

    for (const p of placed) {
      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = "rgba(55,138,221,0.5)";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(p.x, top);
      c.lineTo(p.x, bottom);
      c.stroke();
      c.restore();
    }

    for (const p of placed) {
      const labelY = bottom - 8 - p.stagger * 14;
      c.save();
      c.fillStyle = "rgba(55,138,221,0.95)";
      c.font = "10px 'JetBrains Mono', monospace";
      c.textAlign = "center";
      c.textBaseline = "bottom";
      c.fillText(String(p.ev.label).slice(0, 42), p.x, labelY);
      c.restore();
    }
  },
};

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

  const labels = useMemo(
    () =>
      scansAsc.map((row) => {
        const raw = row.scan_date ?? null;
        return formatInbodyScanDateOnly(raw, "medium") ?? String(raw ?? "—");
      }),
    [scansAsc]
  );

  const scanTsAsc = useMemo(
    () => scansAsc.map((row) => Date.parse(String(row.scan_date ?? ""))).map((t) => (Number.isFinite(t) ? t : NaN)),
    [scansAsc]
  );

  const [selected, setSelected] = useState(() => new Set(DEFAULT_METRICS));
  const [protocolEvents, setProtocolEvents] = useState(/** @type {{ date: string, label: string, type: string }[]} */ ([]));
  const [chartReady, setChartReady] = useState(false);
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const chartRef = useRef(null);

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

  const metricSeries = useMemo(() => {
    /** @type {Record<string, (number | null)[]>} */
    const out = {};
    for (const m of METRICS) {
      const rawVals = scansAsc.map((row) => inbodyToNum(row[m.id] ?? null));
      const first = rawVals.find((v) => v != null && Number.isFinite(v));
      out[m.id] = rawVals.map((v) => {
        if (v == null || !Number.isFinite(v) || first == null || !Number.isFinite(first) || first === 0) return null;
        return ((v - first) / first) * 100;
      });
    }
    return out;
  }, [scansAsc]);

  const buildChart = useCallback(() => {
    const Chart = typeof globalThis !== "undefined" ? globalThis.Chart : null;
    const canvas = canvasRef.current;
    if (!Chart || !canvas || !chartReady || scansAsc.length < 2) return;

    chartRef.current?.destroy?.();
    chartRef.current = null;

    const datasets = METRICS.filter((m) => selected.has(m.id)).map((m) => ({
      label: m.label,
      data: metricSeries[m.id] ?? [],
      borderColor: m.color,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 5,
      spanGaps: true,
    }));

    const cfg = {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 40 } },
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { ticks: { maxRotation: 45, minRotation: 0 } },
          y: {
            title: { display: true, text: "% change from baseline" },
            beginAtZero: false,
            ticks: {
              callback(/** @type {string | number} */ raw) {
                const value = typeof raw === "number" ? raw : Number(raw);
                if (!Number.isFinite(value)) return "";
                const n = Math.round(value);
                if (n === 0) return "0%";
                return `${n > 0 ? "+" : ""}${n}%`;
              },
            },
          },
        },
      },
      plugins: [protocolOverlayPlugin],
    };

    const chart = new Chart(canvas, cfg);
    chart.pepvProtocol = { events: eventsInRange, scanTsAsc: scanTsAsc.filter((t) => Number.isFinite(t)) };
    chart.update();
    chartRef.current = chart;
  }, [chartReady, labels, metricSeries, scansAsc.length, selected, eventsInRange, scanTsAsc]);

  useEffect(() => {
    buildChart();
    return () => {
      chartRef.current?.destroy?.();
      chartRef.current = null;
    };
  }, [buildChart]);

  const legendRows = useMemo(() => {
    return METRICS.filter((m) => selected.has(m.id)).map((m) => {
      const last = scansAsc.length ? inbodyToNum(scansAsc[scansAsc.length - 1][m.id] ?? null) : null;
      const disp = last == null ? "—" : m.id === "inbody_score" || m.id === "visceral_fat_level" || m.id === "bmr_kcal" ? String(Math.round(last)) : last.toFixed(1);
      return { ...m, valueText: disp };
    });
  }, [selected, scansAsc]);

  const rateCards = useMemo(() => {
    const first = scansAsc[0];
    const last = scansAsc[scansAsc.length - 1];
    const t0 = Date.parse(String(first?.scan_date ?? ""));
    const t1 = Date.parse(String(last?.scan_date ?? ""));
    const days = Number.isFinite(t0) && Number.isFinite(t1) ? Math.max(1, Math.round(Math.abs(t1 - t0) / 86400000)) : null;
    return METRICS.filter((m) => selected.has(m.id)).map((m) => {
      const a = inbodyToNum(first?.[m.id] ?? null);
      const b = inbodyToNum(last?.[m.id] ?? null);
      if (a == null || b == null || days == null) {
        return { id: m.id, label: m.label, total: null, pace: null, favorable: null, suffix: unitSuffix(m.id) };
      }
      const total = b - a;
      const pace = (total / days) * 30;
      const favorable = deltaFavorable(m.id, total);
      return { id: m.id, label: m.label, total, pace, favorable, suffix: unitSuffix(m.id) };
    });
  }, [selected, scansAsc]);

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
    return `You are the PepGuideIQ AI Guide. The user just ran an Elite InBody trend interpretation:\n\n${interpretText}\n\nGive a deeper, structured analysis: key drivers, what to watch next scan, and how protocol timing lines up — still no medical directives or dosing changes.`;
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
        Each line shows % change from your first scan. Up = increasing, down = decreasing.
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        {legendRows.map((m) => (
          <div
            key={m.id}
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-border-default)",
              background: "var(--color-bg-card)",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, flexShrink: 0 }} aria-hidden />
            <span style={{ color: "var(--color-text-secondary)" }}>{m.label}</span>
            <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{m.valueText}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", height: 320, width: "100%" }}>
        <canvas ref={canvasRef} aria-label="InBody trends chart" />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 200,
          overflowY: "auto",
          paddingRight: 4,
        }}
        aria-label="Rate of change per metric"
      >
        {rateCards.map((c) => {
          const tone =
            c.favorable === true ? "var(--color-text-success)" : c.favorable === false ? "var(--color-text-danger)" : "var(--color-text-muted)";
          const arrow =
            c.total == null || !Number.isFinite(c.total) || c.total === 0 ? "" : c.total > 0 ? "↑" : "↓";
          return (
            <div
              key={c.id}
              style={{
                width: "100%",
                border: "1px solid var(--color-border-default)",
                borderRadius: 10,
                padding: 12,
                background: "var(--color-bg-card)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-text-primary)" }}>
                {c.total == null || !Number.isFinite(c.total) ? "—" : `${c.total > 0 ? "+" : ""}${c.total.toFixed(1)}${c.suffix}`}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: tone, fontFamily: "'JetBrains Mono', monospace" }}>
                {arrow}{" "}
                {c.pace == null || !Number.isFinite(c.pace) ? "—" : `${c.pace > 0 ? "+" : ""}${c.pace.toFixed(1)}${c.suffix}/mo`}
              </div>
            </div>
          );
        })}
      </div>

      <div
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
