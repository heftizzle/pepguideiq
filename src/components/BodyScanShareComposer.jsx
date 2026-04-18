import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TIER_RANK } from "../lib/tiers.js";
import { inbodyDaysBetweenScanDates, inbodyToNum, INBODY_SCORE_RING_C, inbodyScoreProgressDash } from "../lib/inbodyScanDisplay.js";
import { insertInbodyProgressNetworkPost } from "../lib/supabase.js";
import { Modal } from "./Modal.jsx";

const CAPTION_X_MAX = 280;

/** @typedef {"weight_lbs"|"smm_lbs"|"pbf_pct"|"inbody_score"|"lean_mass_lbs"|"bmr_kcal"} MetricId */

/** @type {{ id: MetricId, label: string }[]} */
const METRICS = [
  { id: "weight_lbs", label: "Weight" },
  { id: "smm_lbs", label: "SMM" },
  { id: "pbf_pct", label: "BF%" },
  { id: "inbody_score", label: "InBody Score" },
  { id: "lean_mass_lbs", label: "Lean Mass" },
  { id: "bmr_kcal", label: "BMR" },
];

/**
 * @param {Record<string, unknown>} cur
 * @param {Record<string, unknown>} prev
 */
function computeDeltas(cur, prev) {
  /** @param {MetricId} k */
  const d = (k) => {
    const a = inbodyToNum(cur[k] ?? null);
    const b = inbodyToNum(prev[k] ?? null);
    if (a == null || b == null) return null;
    return a - b;
  };
  return {
    weight_lbs: d("weight_lbs"),
    smm_lbs: d("smm_lbs"),
    pbf_pct: d("pbf_pct"),
    inbody_score: d("inbody_score"),
    lean_mass_lbs: d("lean_mass_lbs"),
    bmr_kcal: d("bmr_kcal"),
  };
}

/**
 * @param {{
 *   days: number | null,
 *   deltas: Record<string, number | null>,
 *   stackLine: string,
 *   handle: string,
 * }} p
 */
function defaultCaption({ days, deltas, stackLine, handle }) {
  const dw = deltas.weight_lbs;
  const ds = deltas.smm_lbs;
  const db = deltas.pbf_pct;
  const wStr = dw == null ? "— lbs" : `${dw > 0 ? "+" : ""}${dw.toFixed(1)} lbs`;
  const sStr = ds == null ? "— lbs muscle" : `${ds > 0 ? "+" : ""}${ds.toFixed(1)} lbs muscle`;
  const bStr = db == null ? "—% body fat" : `${db > 0 ? "+" : ""}${db.toFixed(1)}% body fat`;
  const n = days == null ? "—" : String(days);
  const h = typeof handle === "string" && handle.trim() ? handle.trim().replace(/^@/, "") : "handle";
  return `${n} days. ${wStr}. ${sStr}. ${bStr}. 🔬\n\nProtocol: ${stackLine}\n\nTracked & receipted via @pepguideiq\npepguideiq.com/@${h}`;
}

/**
 * @param {{
 *   layout: "story" | "square",
 *   handle: string,
 *   deltas: Record<string, number | null>,
 *   stackPills: string[],
 *   scanDateLabel: string,
 *   score: number | null,
 * }} p
 */
function ShareExportCard({ layout, handle, deltas, stackPills, scanDateLabel, score }) {
  const w = layout === "square" ? 1080 : 1080;
  const h = layout === "square" ? 1080 : 1920;
  const dw = deltas.weight_lbs;
  const ds = deltas.smm_lbs;
  const db = deltas.pbf_pct;
  const c = INBODY_SCORE_RING_C;
  const dash = inbodyScoreProgressDash(score, c);
  const hp = typeof handle === "string" && handle.trim() ? handle.trim().replace(/^@/, "") : "member";
  const fmt = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}`);

  return (
    <div
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        background: "#0c0f1a",
        color: "#e8edf7",
        padding: layout === "square" ? 48 : 56,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        position: "relative",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.2em", color: "#5eead4" }}>PEPGUIDEIQ</div>
      <div style={{ fontSize: 36, fontWeight: 600, marginTop: 12, color: "#f8fafc" }}>@{hp}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, color: "#94a3b8", marginBottom: 8 }}>Weight change</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: "#38bdf8" }}>{fmt(dw)}</div>
          <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 4 }}>lb</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 80, width: "100%", maxWidth: 900 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, color: "#94a3b8" }}>SMM</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: "#4ade80" }}>{fmt(ds)}</div>
            <div style={{ fontSize: 20, color: "#94a3b8" }}>lb</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, color: "#94a3b8" }}>Body fat %</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: "#fb7185" }}>{fmt(db)}</div>
          </div>
        </div>
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <svg width={160} height={160} viewBox="0 0 72 72" aria-hidden>
            <circle cx={36} cy={36} r={30} fill="none" stroke="#334155" strokeWidth={5} strokeDasharray={`${c} ${c}`} transform="rotate(-90 36 36)" />
            <circle
              cx={36}
              cy={36}
              r={30}
              fill="none"
              stroke="#378ADD"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
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
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {score == null ? "—" : Math.round(score)}
          </div>
        </div>
        {stackPills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {stackPills.map((name) => (
              <span
                key={name}
                style={{
                  border: "1px solid rgba(94,234,212,0.45)",
                  color: "#5eead4",
                  borderRadius: 999,
                  padding: "8px 18px",
                  fontSize: 22,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: "auto", textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#94a3b8" }}>
          InBody 570 · Receipted · {scanDateLabel}
        </div>
        <div style={{ fontSize: 24, color: "#64748b", marginTop: 10 }}>pepguideiq.com/@{hp}</div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   onClose: () => void,
 *   currentScan: Record<string, unknown>,
 *   previousScan: Record<string, unknown>,
 *   activeStack: { id: string, name: string }[],
 *   handle: string,
 *   userId: string,
 *   profileId: string,
 *   tier: string,
 *   onPosted: () => void,
 *   onErrorMessage?: (msg: string) => void,
 *   onOpenUpgrade?: () => void,
 * }} props
 */
export function BodyScanShareComposer({
  onClose,
  currentScan,
  previousScan,
  activeStack,
  handle,
  userId,
  profileId,
  tier,
  onPosted,
  onErrorMessage,
  onOpenUpgrade,
}) {
  const planKey = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  const isProPlus = (TIER_RANK[planKey] ?? 0) >= TIER_RANK.pro;

  const deltas = useMemo(() => computeDeltas(currentScan, previousScan), [currentScan, previousScan]);
  const days = useMemo(
    () => inbodyDaysBetweenScanDates(previousScan.scan_date ?? null, currentScan.scan_date ?? null),
    [currentScan, previousScan]
  );

  const stackNamesAll = useMemo(
    () =>
      Array.isArray(activeStack)
        ? activeStack.map((x) => (typeof x.name === "string" && x.name.trim() ? x.name.trim() : "")).filter(Boolean)
        : [],
    [activeStack]
  );

  const [includeStack, setIncludeStack] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [selected, setSelected] = useState(() => new Set(/** @type {MetricId[]} */ (["weight_lbs", "smm_lbs", "pbf_pct", "inbody_score"])));
  const [caption, setCaption] = useState("");
  const [postBusy, setPostBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [exportLayout, setExportLayout] = useState(/** @type {"story"|"square"} */ ("story"));
  const exportRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const line = includeStack && stackNamesAll.length ? stackNamesAll.join(" · ") : "—";
    setCaption(defaultCaption({ days, deltas, stackLine: line, handle }));
  }, [days, deltas, handle, includeStack, stackNamesAll]);

  const toggleMetric = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return next;
        next.delete(id);
      } else {
        if (next.size >= 6) return prev;
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedList = useMemo(() => METRICS.filter((m) => selected.has(m.id)).map((m) => m.id), [selected]);

  const onPostNetwork = useCallback(async () => {
    if (selectedList.length === 0) {
      onErrorMessage?.("Select at least one metric.");
      return;
    }
    const scanId = typeof currentScan.id === "string" ? currentScan.id : "";
    if (!scanId) {
      onErrorMessage?.("Missing scan id.");
      return;
    }
    setPostBusy(true);
    const contentJson = {
      selectedMetrics: selectedList,
      deltas,
      caption: caption.trim(),
      scanId,
      scanDate: currentScan.scan_date ?? null,
      previousScanDate: previousScan.scan_date ?? null,
      daysBetween: days,
      stackSnapshot: includeStack ? stackNamesAll.map((name) => ({ name })) : [],
      includeStack,
    };
    const { error } = await insertInbodyProgressNetworkPost({
      userId,
      profileId,
      contentJson,
      publicVisible: publicProfile,
    });
    setPostBusy(false);
    if (error) {
      onErrorMessage?.(error.message || "Could not post to Network.");
      return;
    }
    onPosted();
  }, [
    caption,
    currentScan.id,
    currentScan.scan_date,
    days,
    deltas,
    includeStack,
    onErrorMessage,
    onPosted,
    previousScan.scan_date,
    profileId,
    publicProfile,
    selectedList,
    stackNamesAll,
    userId,
  ]);

  const runSocialShare = useCallback(async () => {
    if (!isProPlus) {
      onOpenUpgrade?.();
      return;
    }
    const el = exportRef.current;
    if (!el) {
      onErrorMessage?.("Share preview not ready.");
      return;
    }
    setShareBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: "#0c0f1a",
        useCORS: true,
      });
      const blob = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
      if (!blob) {
        onErrorMessage?.("Could not create image.");
        setShareBusy(false);
        return;
      }
      const file = new File([blob], "pepguideiq-progress.png", { type: "image/png" });
      const cap = caption.trim();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: cap });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pepguideiq-progress.png";
        a.click();
        URL.revokeObjectURL(url);
        try {
          await navigator.clipboard.writeText(cap);
        } catch {
          /* ignore */
        }
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(cap)}`, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      onErrorMessage?.(e instanceof Error ? e.message : "Share failed.");
    }
    setShareBusy(false);
  }, [caption, isProPlus, onErrorMessage, onOpenUpgrade]);

  const scanDateLabel = useMemo(() => {
    const raw = currentScan.scan_date ?? null;
    if (raw == null) return "—";
    const t = Date.parse(String(raw));
    if (!Number.isFinite(t)) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(t);
    } catch {
      return "—";
    }
  }, [currentScan.scan_date]);

  const score = inbodyToNum(currentScan.inbody_score ?? null);
  const stackPills = includeStack ? stackNamesAll : [];

  return (
    <Modal onClose={onClose} label="Share InBody progress" maxWidth={560}>
      <div style={{ fontFamily: "'Outfit', sans-serif", color: "var(--color-text-primary)" }}>
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
          Pick {1}–{6} metrics. Days and deltas use scan dates from your saved rows only.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMetric(m.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: selected.has(m.id) ? "1px solid var(--color-accent)" : "1px solid var(--color-border-default)",
                background: selected.has(m.id) ? "var(--color-accent-nav-fill)" : "transparent",
                color: selected.has(m.id) ? "var(--color-accent)" : "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 8, fontSize: 11, color: "var(--color-text-muted)" }}>Caption</div>
        <textarea
          className="form-input"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={8}
          style={{ width: "100%", resize: "vertical", minHeight: 140, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: caption.length > CAPTION_X_MAX ? "var(--color-text-danger)" : "var(--color-text-muted)" }}>
            X · {caption.length} / {CAPTION_X_MAX}
          </span>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />
          Show on public profile
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={includeStack} onChange={(e) => setIncludeStack(e.target.checked)} />
          Include active stack
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="btn-teal" disabled={postBusy} onClick={() => void onPostNetwork()}>
            {postBusy ? "Posting…" : "Post to Network"}
          </button>
          <button
            type="button"
            className="btn-teal"
            disabled={shareBusy}
            style={{ opacity: isProPlus ? 1 : 0.55 }}
            onClick={() => void runSocialShare()}
          >
            {shareBusy ? "Preparing…" : "Share to social (Pro+)"}
          </button>
        </div>
        {!isProPlus ? (
          <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 8 }}>Social export requires Pro or higher.</div>
        ) : null}
        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Export shape</span>
          <button
            type="button"
            onClick={() => setExportLayout("story")}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              border: exportLayout === "story" ? "1px solid var(--color-accent)" : "1px solid var(--color-border-default)",
              background: exportLayout === "story" ? "var(--color-accent-nav-fill)" : "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            Story 9:16
          </button>
          <button
            type="button"
            onClick={() => setExportLayout("square")}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              border: exportLayout === "square" ? "1px solid var(--color-accent)" : "1px solid var(--color-border-default)",
              background: exportLayout === "square" ? "var(--color-accent-nav-fill)" : "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            Square 1:1
          </button>
        </div>
      </div>
      <div
        ref={exportRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <ShareExportCard
          layout={exportLayout}
          handle={handle}
          deltas={deltas}
          stackPills={stackPills}
          scanDateLabel={scanDateLabel}
          score={score}
        />
      </div>
    </Modal>
  );
}
