import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PEPTIDES } from "../data/catalog.js";
import { PROTOCOL_SESSION_UI } from "../data/protocolSessions.js";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import {
  deleteUserVial,
  getEarliestDosedAtForPeptideIds,
  getSessionAccessToken,
  insertUserVial,
  listDoseLogsForPeptideIdsRange,
  listRecentDosesForVial,
  listVialsForPeptideIds,
  updateUserVial,
} from "../lib/supabase.js";
import {
  R2_UPLOAD_ACCEPT_ATTR,
  R2_UPLOAD_ALLOWED_TYPES,
  R2_UPLOAD_MAX_BYTES,
  appendImageCacheBustParam,
  shouldResetImageUploadFetchBust,
  uploadImageToR2,
} from "../lib/r2Upload.js";
import { persistVialPeptideId, vialQueryPeptideIds } from "../lib/resolveStackCatalogPeptide.js";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";
import { formatInjectableDoseHistoryAmount, isBlendCatalogComponents } from "../lib/doseLogDisplay.js";
import {
  blendConcentrationsMgPerMl,
  blendRecipeTotalMg,
  calculateBlendDose,
  resolveCatalogBlendBacRefMl,
  scaleBlendComponentsToVial,
} from "../lib/peptideMath.js";

const BLEND_DRAW_MIN = 0.05;
const BLEND_DRAW_MAX = 0.5;

function clampBlendDrawMl(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0.1;
  return Math.min(BLEND_DRAW_MAX, Math.max(BLEND_DRAW_MIN, x));
}

function formatBlendMgDraw(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: 4, minimumFractionDigits: 0 });
}

function formatBlendMcgDraw(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

/** @param {{ name: string, mgPerMl: number }[] | null | undefined} parts */
function formatBlendConcMgPerMl(parts) {
  if (!parts || parts.length === 0) return "—";
  return parts
    .map((p) => {
      const n = Number(p.mgPerMl);
      if (!Number.isFinite(n)) return `${p.name}: ratio varies — check CoA`;
      return `${p.name} ${n.toFixed(2)}mg/mL`;
    })
    .join(" · ");
}

function useWorkerObjectUrl(r2Key, workerConfigured, fetchBustMs = 0) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let revoke = null;

    async function run() {
      if (!r2Key || !workerConfigured) {
        setObjectUrl(null);
        return;
      }
      const token = await getSessionAccessToken();
      if (!token || cancelled) {
        setObjectUrl(null);
        return;
      }
      try {
        const base = `${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(r2Key)}`;
        const res = await fetch(appendImageCacheBustParam(base, fetchBustMs), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) {
          setObjectUrl(null);
          return;
        }
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        revoke = u;
        if (!cancelled) setObjectUrl(u);
      } catch {
        if (!cancelled) setObjectUrl(null);
      }
    }

    void run();
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [r2Key, workerConfigured, fetchBustMs]);

  return objectUrl;
}

/**
 * @param {{ vialId: string, r2Key: string | null | undefined, workerConfigured: boolean, canMutate: boolean, onUpgrade: () => void, onUploaded: () => Promise<void> | void }} props
 */
function VialPhotoThumb({ vialId, profileId, r2Key, workerConfigured, canMutate, onUpgrade, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [fetchBustMs, setFetchBustMs] = useState(0);
  const prevR2KeyRef = useRef(typeof r2Key === "string" ? r2Key.trim() : "");
  const key = typeof r2Key === "string" ? r2Key.trim() : "";
  const imgUrl = useWorkerObjectUrl(key || null, workerConfigured, fetchBustMs);
  const showImage = Boolean(key && imgUrl);

  useEffect(() => {
    const next = typeof r2Key === "string" ? r2Key.trim() : "";
    const prev = prevR2KeyRef.current;
    prevR2KeyRef.current = next;
    if (shouldResetImageUploadFetchBust(prev, next)) setFetchBustMs(0);
  }, [r2Key]);

  function openPicker() {
    if (uploading) return;
    if (!canMutate) {
      onUpgrade();
      return;
    }
    if (!workerConfigured) {
      setErr("Worker URL");
      return;
    }
    setErr(null);
    inputRef.current?.click();
  }

  async function onInputChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    if (!R2_UPLOAD_ALLOWED_TYPES.has(f.type)) {
      setErr("JPEG, PNG, WebP, or GIF only");
      return;
    }
    if (f.size > R2_UPLOAD_MAX_BYTES) {
      setErr("Max 10MB");
      return;
    }
    setUploading(true);
    const result = await uploadImageToR2({
      path: "/stack-photo",
      file: f,
      fields: { kind: "vial", vial_id: vialId, profile_id: profileId ?? undefined },
      onState: (state) => {
        if (state === "retrying") setErr("Retrying…");
      },
    });
    setUploading(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setErr(null);
    setFetchBustMs(Date.now());
    await onUploaded();
  }

  return (
    <div
      style={{
        flexShrink: 0,
        width: 64,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "stretch",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={R2_UPLOAD_ACCEPT_ATTR}
        style={{ display: "none" }}
        onChange={(e) => void onInputChange(e)}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        title={showImage ? "Replace photo" : "Add photo"}
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          border: showImage ? "1px solid #1e2a38" : "1px dashed #243040",
          background: "#0a0f16",
          cursor: uploading ? "wait" : "pointer",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {showImage ? (
          <img
            src={imgUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : key ? (
          <span className="mono" style={{ fontSize: 10, color: "#8fa5bf" }}>
            …
          </span>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: 4,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>
              📷
            </span>
            <span
              className="mono"
              style={{ fontSize: 9, color: "#5c6d82", lineHeight: 1.15, textAlign: "center" }}
            >
              Add photo
            </span>
          </div>
        )}
      </button>
      {err && (
        <div className="mono" style={{ fontSize: 9, color: "#f59e0b", textAlign: "center", lineHeight: 1.2 }}>
          {err}
        </div>
      )}
    </div>
  );
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localYmdFromIso(iso) {
  const x = new Date(iso);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function reconstitutedNoonIso(dateStr) {
  const [y, mo, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  if (!y || !mo || !d) return new Date().toISOString();
  return new Date(y, mo - 1, d, 12, 0, 0, 0).toISOString();
}

/** Last calendar day of stability window (end of day local). */
function expiresAtIso(dateStr, stabilityDays) {
  const [y, mo, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  if (!y || !mo || !d || !Number.isFinite(stabilityDays)) return new Date().toISOString();
  return new Date(y, mo - 1, d + stabilityDays, 23, 59, 59, 999).toISOString();
}

function daysRemaining(expiresAtIsoStr) {
  const exp = new Date(expiresAtIsoStr);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  return Math.round((expDay - startToday) / 86400000);
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Injectable (mcg) vs oral/nasal/topical count logs.
 * @param {Record<string, unknown>} d
 * @param {Record<string, unknown> | null | undefined} vial
 * @param {{ name: string, mg?: number, mgPerMl?: number | null }[] | null | undefined} catalogBlendComponents
 * @param {number} [catalogBlendBacRefMl=2]
 */
function formatDoseLogLine(d, vial, catalogBlendComponents, catalogBlendBacRefMl = 2) {
  if (d.dose_count != null && Number(d.dose_count) > 0 && typeof d.dose_unit === "string" && d.dose_unit.trim()) {
    return `${Number(d.dose_count)} ${d.dose_unit.trim()}`;
  }
  return formatInjectableDoseHistoryAmount(d.dose_mcg, vial ?? null, catalogBlendComponents, catalogBlendBacRefMl);
}

/**
 * @param {Record<string, unknown>} d
 * @param {Map<string, Record<string, unknown>> | null | undefined} vialsById
 * @param {{ name: string, mg?: number, mgPerMl?: number | null }[] | null | undefined} catalogBlendComponents
 * @param {number} [catalogBlendBacRefMl=2]
 */
function formatCalendarDoseAmount(d, vialsById, catalogBlendComponents, catalogBlendBacRefMl = 2) {
  if (d.dose_count != null && Number(d.dose_count) > 0 && typeof d.dose_unit === "string" && d.dose_unit.trim()) {
    return `${Number(d.dose_count)} ${d.dose_unit.trim()}`;
  }
  const vid = typeof d.vial_id === "string" ? d.vial_id : null;
  const vial = vid && vialsById?.get ? vialsById.get(vid) : null;
  return formatInjectableDoseHistoryAmount(d.dose_mcg, vial ?? null, catalogBlendComponents, catalogBlendBacRefMl);
}

function formatDoseTimeLocal(iso) {
  if (typeof iso !== "string" || !iso) return "";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function protocolSessionPillLabel(session) {
  if (session == null || typeof session !== "string") return null;
  const id = session.trim();
  if (!id) return null;
  const u = PROTOCOL_SESSION_UI[id];
  return u ? u.pillLabel : null;
}

function formatMediumDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatConc(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toLocaleString(undefined, { maximumFractionDigits: 0 })} mcg/mL`;
}

const PILL = {
  borderRadius: 12,
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 13,
  padding: "10px 20px",
  minHeight: 44,
  cursor: "pointer",
  lineHeight: 1.2,
  boxSizing: "border-box",
};

function SelectPill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        ...PILL,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${active ? "#00d4aa" : "#14202e"}`,
        background: active ? "#00d4aa14" : "transparent",
        color: active ? "#00d4aa" : "#8fa5bf",
      }}
    >
      {children}
    </button>
  );
}

function formatVolumeMl(vol) {
  if (!Number.isFinite(vol) || vol <= 0) return "—";
  const t = Math.round(vol * 1000) / 1000;
  return t.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function nextVialLabel(vials) {
  const nums = vials.map((v) => {
    const m = String(v.label ?? "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const n = nums.length ? Math.max(0, ...nums) + 1 : 1;
  return `Vial ${n}`;
}

const ADD_VIAL_MG_OPTIONS = [
  { key: "2", val: "2", label: "2 mg" },
  { key: "5", val: "5", label: "5 mg" },
  { key: "10", val: "10", label: "10 mg" },
  { key: "20", val: "20", label: "20 mg" },
];
const ADD_VIAL_ML_OPTIONS = [
  { key: "1", val: "1", label: "1 mL" },
  { key: "2", val: "2", label: "2 mL" },
  { key: "3", val: "3", label: "3 mL" },
];
const ADD_VIAL_DOSE_OPTIONS = [
  { key: "250", val: "250", label: "250 mcg" },
  { key: "500", val: "500", label: "500 mcg" },
  { key: "1000", val: "1000", label: "1000 mcg" },
  { key: "2000", val: "2000", label: "2000 mcg" },
];

function stripTimeLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Calendar span from local recon day → local expiry day (minimum 1). For UI only; does not alter stored expiry. */
function totalStabilityCalendarDays(reconIso, expiresIso) {
  const recon = stripTimeLocal(new Date(reconIso));
  const exp = stripTimeLocal(new Date(expiresIso));
  const days = Math.round((exp.getTime() - recon.getTime()) / 86400000);
  return Math.max(1, days);
}

/** Bar + badge colors from fraction of stability window still remaining (dr / total). */
function urgencyFromLifeRemaining(remainingFrac) {
  const f = Math.min(1, Math.max(0, remainingFrac));
  if (f > 0.5) {
    return {
      barColor: "#10b981",
      badgeBg: "rgba(16, 185, 129, 0.18)",
      badgeBorder: "rgba(16, 185, 129, 0.45)",
      badgeText: "#6ee7b7",
    };
  }
  if (f > 0.25) {
    return {
      barColor: "#f59e0b",
      badgeBg: "rgba(245, 158, 11, 0.18)",
      badgeBorder: "rgba(245, 158, 11, 0.45)",
      badgeText: "#fcd34d",
    };
  }
  return {
    barColor: "#ef4444",
    badgeBg: "rgba(239, 68, 68, 0.18)",
    badgeBorder: "rgba(239, 68, 68, 0.45)",
    badgeText: "#fca5a5",
  };
}

function startOfWeekSunday(d) {
  const x = stripTimeLocal(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function endOfWeekSaturday(d) {
  const x = stripTimeLocal(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (6 - day));
  return x;
}

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDayStartToIso(d) {
  return stripTimeLocal(d).toISOString();
}

function localDayEndToIso(d) {
  const x = stripTimeLocal(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

/** Widen fetch window: earliest dose or 160d back (whichever is earlier) through 160d forward end-of-day. */
function doseHistoryFetchRangeIso(now = new Date(), earliestDosedAtIso = null) {
  const today = stripTimeLocal(now);
  const maxEnd = new Date(today);
  maxEnd.setDate(maxEnd.getDate() + 160);
  maxEnd.setHours(23, 59, 59, 999);
  const min160 = stripTimeLocal(new Date(today));
  min160.setDate(min160.getDate() - 160);
  let minStart = stripTimeLocal(min160);
  if (earliestDosedAtIso) {
    const e = stripTimeLocal(new Date(earliestDosedAtIso));
    if (e.getTime() < minStart.getTime()) minStart = e;
  }
  return { startIso: localDayStartToIso(minStart), endIso: localDayEndToIso(maxEnd) };
}

function parseYmdLocal(ymd) {
  const [y, mo, d] = String(ymd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!y || !mo || !d) return stripTimeLocal(new Date());
  return stripTimeLocal(new Date(y, mo - 1, d));
}

function addDaysLocal(d, n) {
  const x = stripTimeLocal(d);
  x.setDate(x.getDate() + n);
  return x;
}

function defaultTwoWeekStartYmd() {
  return ymdFromDate(addDaysLocal(stripTimeLocal(new Date()), -7));
}

function monthLabelUpper(viewMonth) {
  return new Date(viewMonth.y, viewMonth.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

function currentViewMonth(now = new Date()) {
  return { y: now.getFullYear(), m: now.getMonth() };
}

function formatTwoWeekRangeHeader(startYmd) {
  const a = parseYmdLocal(startYmd);
  const b = addDaysLocal(a, 13);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  return `${fmt(a)} – ${fmt(b)}`;
}

const DOW_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function DoseHistoryCalendar({
  doses,
  expanded,
  onToggleExpand,
  twoWeekStartYmd,
  onTwoWeekPrev,
  onTwoWeekNext,
  canTwoWeekPrev,
  canTwoWeekNext,
  viewMonth,
  onMonthPrev,
  onMonthNext,
  canMonthPrev,
  canMonthNext,
  resolvePeptideName,
  vialsById,
  catalogBlendComponents,
  catalogBlendBacRefMl,
}) {
  const [selectedYmd, setSelectedYmd] = useState(null);

  const byDay = useMemo(() => {
    const m = new Map();
    for (const log of doses) {
      const k = localYmdFromIso(log.dosed_at);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return m;
  }, [doses]);

  useEffect(() => {
    setSelectedYmd(null);
  }, [viewMonth.y, viewMonth.m, twoWeekStartYmd, expanded]);

  useEffect(() => {
    if (!selectedYmd) return;
    const still = doses.some((d) => localYmdFromIso(d.dosed_at) === selectedYmd);
    if (!still) setSelectedYmd(null);
  }, [doses, selectedYmd]);

  const toggleDay = useCallback((ymd) => {
    setSelectedYmd((prev) => (prev === ymd ? null : ymd));
  }, []);

  const now = new Date();
  const today = stripTimeLocal(now);
  const todayStr = todayYmd();
  const todayMs = today.getTime();

  const canGoPrev = expanded ? canMonthPrev : canTwoWeekPrev;
  const canGoNext = expanded ? canMonthNext : canTwoWeekNext;
  const onPrev = expanded ? onMonthPrev : onTwoWeekPrev;
  const onNext = expanded ? onMonthNext : onTwoWeekNext;

  const headerTitle = expanded ? monthLabelUpper(viewMonth) : formatTwoWeekRangeHeader(twoWeekStartYmd);

  let gridCells = [];
  let monthFirst = null;
  let monthLast = null;
  if (expanded) {
    monthFirst = stripTimeLocal(new Date(viewMonth.y, viewMonth.m, 1));
    monthLast = stripTimeLocal(new Date(viewMonth.y, viewMonth.m + 1, 0));
    const gridStart = startOfWeekSunday(monthFirst);
    const gridEnd = endOfWeekSaturday(monthLast);
    for (let c = new Date(gridStart); c.getTime() <= gridEnd.getTime(); c.setDate(c.getDate() + 1)) {
      gridCells.push(new Date(c));
    }
  } else {
    const ws = parseYmdLocal(twoWeekStartYmd);
    for (let i = 0; i < 14; i += 1) {
      gridCells.push(addDaysLocal(ws, i));
    }
  }

  const renderCell = (d) => {
    const ymd = ymdFromDate(d);
    const t = stripTimeLocal(d).getTime();
    const dayLogs = byDay.get(ymd) ?? [];
    const has = dayLogs.length > 0;
    const isToday = ymd === todayStr;

    let isPadding;
    let isFutureNoClick;

    if (expanded) {
      const mf = monthFirst.getTime();
      const ml = monthLast.getTime();
      const inMonth = t >= mf && t <= ml;
      isPadding = !inMonth;
      isFutureNoClick = false;
    } else {
      isPadding = false;
      isFutureNoClick = t > todayMs && !isToday && !has;
    }

    const paddingCellStyle = {
      minWidth: 36,
      minHeight: 36,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      color: "#2e4055",
      background: "#06080c",
      border: "1px solid #0e1822",
      fontSize: 12,
      boxSizing: "border-box",
      ...(has && selectedYmd === ymd
        ? { outline: "2px solid rgba(0, 212, 170, 0.45)", outlineOffset: 1 }
        : {}),
    };

    if (isPadding || isFutureNoClick) {
      const dot = has ? (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#00d4aa",
            boxShadow: "0 0 0 1px rgba(0, 212, 170, 0.35)",
            flexShrink: 0,
            marginTop: 4,
          }}
        />
      ) : null;

      if (has) {
        return (
          <button
            key={ymd}
            type="button"
            className="mono"
            aria-label={`${dayLogs.length} dose(s) on ${ymd}`}
            aria-pressed={selectedYmd === ymd}
            title={`${dayLogs.length} dose(s) — ${ymd}`}
            onClick={() => toggleDay(ymd)}
            style={{
              ...paddingCellStyle,
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              fontFamily: "inherit",
              margin: 0,
            }}
          >
            <span>{d.getDate()}</span>
            {dot}
          </button>
        );
      }

      return (
        <div key={ymd} aria-hidden={isPadding} className="mono" style={paddingCellStyle}>
          <span>{d.getDate()}</span>
          {dot}
        </div>
      );
    }

    const isPast = t < todayMs && !isToday;
    const baseBg = isToday ? "rgba(0, 212, 170, 0.14)" : "#07090e";
    const numColor = isPast ? "#5a6d82" : "#8fa5bf";
    const borderColor = isToday ? "#00d4aa" : "#14202e";
    const borderWidth = isToday ? 2 : 1;

    const contentCellStyle = {
      minWidth: 36,
      minHeight: 36,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: "8px 6px",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 12,
      lineHeight: 1,
      color: numColor,
      background: baseBg,
      border: `${borderWidth}px solid ${borderColor}`,
      boxSizing: "border-box",
      ...(has && selectedYmd === ymd
        ? { outline: "2px solid rgba(0, 212, 170, 0.45)", outlineOffset: 1 }
        : {}),
    };

    const contentDot = has ? (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#00d4aa",
          boxShadow: "0 0 0 1px rgba(0, 212, 170, 0.35)",
          flexShrink: 0,
        }}
      />
    ) : null;

    if (has) {
      return (
        <button
          key={ymd}
          type="button"
          aria-label={`${dayLogs.length} dose(s) on ${ymd}`}
          aria-pressed={selectedYmd === ymd}
          title={`${dayLogs.length} dose(s) — ${ymd}`}
          onClick={() => toggleDay(ymd)}
          style={{
            ...contentCellStyle,
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            margin: 0,
          }}
        >
          <span>{d.getDate()}</span>
          {contentDot}
        </button>
      );
    }

    return (
      <div key={ymd} title={ymd} style={contentCellStyle}>
        <span>{d.getDate()}</span>
        {contentDot}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div className="mono" style={{ fontSize: 14, color: "#00d4aa", marginBottom: 8, letterSpacing: ".12em" }}>
        DOSE HISTORY
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn-teal"
          disabled={!canGoPrev}
          onClick={() => onPrev()}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            minWidth: 36,
            borderRadius: 12,
            opacity: canGoPrev ? 1 : 0.35,
            cursor: canGoPrev ? "pointer" : "not-allowed",
          }}
          aria-label={expanded ? "Previous month" : "Previous week"}
        >
          ←
        </button>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "#8fa5bf",
            letterSpacing: "0.06em",
            minWidth: 160,
            textAlign: "center",
          }}
        >
          {headerTitle}
        </div>
        <button
          type="button"
          className="btn-teal"
          disabled={!canGoNext}
          onClick={() => onNext()}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            minWidth: 36,
            borderRadius: 12,
            opacity: canGoNext ? 1 : 0.35,
            cursor: canGoNext ? "pointer" : "not-allowed",
          }}
          aria-label={expanded ? "Next month" : "Next week"}
        >
          →
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 4,
          maxWidth: 460,
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 420 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(36px, 1fr))",
              gap: 6,
            }}
          >
            {DOW_HEADERS.map((h, i) => (
              <div
                key={`dow-${i}`}
                className="mono"
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#8fa5bf",
                  padding: "4px 0",
                  letterSpacing: "0.06em",
                }}
              >
                {h}
              </div>
            ))}
            {gridCells.map((d) => renderCell(d))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            width: 40,
            paddingTop: 28,
            alignSelf: "stretch",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 40,
            }}
          >
            <button
              type="button"
              className="btn-teal"
              onClick={onToggleExpand}
              aria-label={expanded ? "Collapse to two-week calendar" : "Expand to full month"}
              title={expanded ? "Two-week view" : "Month view"}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                minWidth: 36,
                borderRadius: 12,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              <span aria-hidden>{expanded ? "△" : "▽"}</span>
            </button>
          </div>
        </div>
      </div>
      {selectedYmd && byDay.has(selectedYmd) ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #14202e",
            background: "#07090e",
            maxWidth: 420,
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: "#00d4aa", marginBottom: 10, letterSpacing: "0.06em" }}>
            {(() => {
              const hd = new Date(`${selectedYmd}T12:00:00`);
              return Number.isNaN(hd.getTime())
                ? selectedYmd
                : hd.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
            })()}
          </div>
          {[...(byDay.get(selectedYmd) ?? [])]
            .sort((a, b) => new Date(a.dosed_at).getTime() - new Date(b.dosed_at).getTime())
            .map((log, i) => {
              const name = resolvePeptideName(log.peptide_id);
              const amount = formatCalendarDoseAmount(log, vialsById, catalogBlendComponents, catalogBlendBacRefMl);
              const timeStr = formatDoseTimeLocal(log.dosed_at);
              const sess = protocolSessionPillLabel(log.protocol_session);
              const meta = [timeStr, sess].filter(Boolean).join(" · ");
              return (
                <div
                  key={log.id}
                  className="mono"
                  style={{
                    padding: "10px 0",
                    borderTop: i > 0 ? "1px solid #0e1822" : "none",
                    fontSize: 13,
                    color: "#dde4ef",
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ color: "#dde4ef", marginBottom: meta ? 4 : 0 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#8fa5bf" }}>
                    {amount}
                    {meta ? ` · ${meta}` : ""}
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}

function VialRow({
  vial,
  userId,
  profileId,
  canMutate,
  doses,
  onReload,
  stabilityNote,
  workerConfigured,
  onUpgrade,
  catalogBlendComponents,
  catalogBlendBacRefMl = 2,
}) {
  const [label, setLabel] = useState(vial.label ?? "Vial 1");
  const [savingLabel, setSavingLabel] = useState(false);
  const [expiryDetailOpen, setExpiryDetailOpen] = useState(false);
  const expiryDetailRef = useRef(null);

  useEffect(() => {
    setLabel(vial.label ?? "Vial 1");
  }, [vial.id, vial.label]);

  useEffect(() => {
    if (!expiryDetailOpen) return;
    function onPointerDown(e) {
      const el = expiryDetailRef.current;
      if (el && !el.contains(e.target)) setExpiryDetailOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expiryDetailOpen]);

  const dr = daysRemaining(vial.expires_at);
  const expired = dr < 0 || new Date(vial.expires_at) < new Date();
  const depleted = vial.status === "depleted";
  const totalLifeDays = totalStabilityCalendarDays(vial.reconstituted_at, vial.expires_at);
  const remainingFrac = Math.min(1, Math.max(0, dr / totalLifeDays));
  const urgency = urgencyFromLifeRemaining(remainingFrac);
  const barFillPct = Math.min(100, Math.max(0, (1 - remainingFrac) * 100));

  const vialMgNum = Number(vial.vial_size_mg);
  const bacMlNum = Number(vial.bac_water_ml);
  const recipeSumFromMg =
    Array.isArray(catalogBlendComponents) && catalogBlendComponents.length > 0
      ? catalogBlendComponents.reduce((s, c) => s + (Number.isFinite(Number(c?.mg)) ? Number(c.mg) : 0), 0)
      : 0;
  const recipeSum =
    recipeSumFromMg > 0
      ? recipeSumFromMg
      : Array.isArray(catalogBlendComponents) && catalogBlendComponents.length > 0
        ? blendRecipeTotalMg(catalogBlendComponents, catalogBlendBacRefMl)
        : 0;
  const scaledForConc =
    recipeSum > 0 && Number.isFinite(vialMgNum) && vialMgNum > 0
      ? scaleBlendComponentsToVial(catalogBlendComponents, recipeSum, vialMgNum, catalogBlendBacRefMl)
      : [];
  const blendConcParts =
    scaledForConc.length > 0 && Number.isFinite(bacMlNum) && bacMlNum > 0
      ? blendConcentrationsMgPerMl(scaledForConc, bacMlNum)
      : [];

  const blendTileCatalog = isBlendCatalogComponents(catalogBlendComponents);

  async function saveLabel() {
    if (!canMutate || label.trim() === (vial.label ?? "").trim()) return;
    setSavingLabel(true);
    await updateUserVial(vial.id, userId, profileId, { label: label.trim() || "Vial" });
    setSavingLabel(false);
    onReload();
  }

  async function markDepleted() {
    if (!canMutate) return;
    await updateUserVial(vial.id, userId, profileId, { status: "depleted" });
    onReload();
  }

  function removeVial() {
    if (!canMutate) return;
    if (
      !window.confirm(
        `Delete ${vial.label ?? "this vial"}? Your dose history for this peptide will stay saved.`
      )
    )
      return;
    void deleteUserVial(vial.id, userId, profileId).then(() => onReload());
  }

  return (
    <div
      style={{
        border: "1px solid #14202e",
        borderRadius: 12,
        padding: 10,
        background: "#07090e",
        marginBottom: 8,
        opacity: depleted ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <VialPhotoThumb
          vialId={vial.id}
          profileId={profileId}
          r2Key={vial.vial_photo_r2_key}
          workerConfigured={workerConfigured}
          canMutate={canMutate}
          onUpgrade={onUpgrade}
          onUploaded={onReload}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <input
                className="form-input"
                style={{ fontSize: 13, marginBottom: 6 }}
                value={label}
                disabled={!canMutate || savingLabel}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={() => void saveLabel()}
              />
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0" }}>
                Reconstituted {formatShortDate(vial.reconstituted_at)}
              </div>
              <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", marginTop: 4, lineHeight: 1.45, wordBreak: "break-word" }}>
                {blendTileCatalog ? (
                  blendConcParts.length > 0 ? (
                    blendConcParts.map((p, idx) => {
                      const label = typeof p.name === "string" ? p.name.trim() : "";
                      const mcgPerMl = Number(p.mgPerMl) * 1000;
                      return (
                        <div key={`${label || "c"}-${idx}`}>
                          {label || "—"}: {formatConc(mcgPerMl)}
                        </div>
                      );
                    })
                  ) : (
                    catalogBlendComponents.map((c, idx) => {
                      const label = typeof c?.name === "string" ? c.name.trim() : "";
                      const unknownRatio =
                        c && Object.prototype.hasOwnProperty.call(c, "mgPerMl") && c.mgPerMl === null;
                      return (
                        <div key={`${label || "c"}-${idx}`}>
                          {label || "—"}: {unknownRatio ? "ratio varies — check CoA" : "—"}
                        </div>
                      );
                    })
                  )
                ) : (
                  <>Conc. {formatConc(vial.concentration_mcg_ml)}</>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: 120 }}>
          {expired ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7280", textDecoration: "line-through" }}>
              EXPIRED
            </div>
          ) : depleted ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7280" }}>
              Depleted
            </div>
          ) : (
            <div
              ref={expiryDetailRef}
              style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", width: "100%" }}
            >
              <button
                type="button"
                className="mono"
                onClick={() => setExpiryDetailOpen((o) => !o)}
                style={{
                  fontSize: 13,
                  borderRadius: 12,
                  padding: "6px 12px",
                  border: `1px solid ${urgency.badgeBorder}`,
                  background: urgency.badgeBg,
                  color: urgency.badgeText,
                  cursor: "pointer",
                  lineHeight: 1.25,
                  display: "inline-flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  textAlign: "center",
                  maxWidth: 120,
                }}
              >
                Expires in {dr} day{dr === 1 ? "" : "s"}
              </button>
              {expiryDetailOpen && (
                <div
                  role="region"
                  aria-label="Expiry details"
                  style={{
                    marginTop: 8,
                    width: "100%",
                    maxWidth: 280,
                    marginLeft: "auto",
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #14202e",
                    background: "#0a0f16",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                  }}
                >
                  <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", lineHeight: 1.45, marginBottom: 10 }}>
                    {stabilityNote ||
                      "Use within 28 days refrigerated. Conservative recommendation — some sources cite up to 60 days."}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>
                    Reconstituted {formatMediumDate(vial.reconstituted_at)}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>
                    Expires {formatMediumDate(vial.expires_at)}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "#dde4ef", marginBottom: 10 }}>
                    {dr} day{dr === 1 ? "" : "s"} remaining
                  </div>
                  <div
                    aria-hidden
                    style={{
                      height: 8,
                      borderRadius: 12,
                      background: "#14202e",
                      overflow: "hidden",
                      border: "1px solid #1e2a38",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${barFillPct}%`,
                        background: urgency.barColor,
                        borderRadius: 12,
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
          </div>

          {canMutate && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              <button type="button" className="btn-teal" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 12 }} disabled={depleted} onClick={() => void markDepleted()}>
                Mark as Depleted
              </button>
              <button type="button" className="btn-red" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 12 }} onClick={() => removeVial()}>
                Delete vial
              </button>
            </div>
          )}

          {doses.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 4 }}>
                RECENT
              </div>
              {doses.map((d) => (
                <div key={d.id} className="mono" style={{ fontSize: 13, color: "#8fa5bf", padding: "2px 0" }}>
                  {formatShortDate(d.dosed_at)} — {formatDoseLogLine(d, vial, catalogBlendComponents, catalogBlendBacRefMl)}
                  {d.notes ? ` · ${d.notes}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   userId: string,
 *   profileId: string,
 *   peptideId: string,
 *   catalogEntry: { id?: string, name?: string, stabilityDays: number, stabilityNote?: string | null, components?: { name: string, mg: number }[], reconstitutionVolumeMl?: number, vialSizeOptions?: { label: string, totalMg: number, bacWaterMl: number }[] },
 *   canUse: boolean,
 *   onUpgrade: () => void,
 *   demoAnchorFirst?: boolean,
 * }} props
 */
export function VialTracker({ userId, profileId, peptideId, catalogEntry, canUse, onUpgrade, demoAnchorFirst = false }) {
  const stabilityDays = catalogEntry?.stabilityDays;
  const stabilityNote = typeof catalogEntry?.stabilityNote === "string" ? catalogEntry.stabilityNote.trim() : "";
  const compoundName = (catalogEntry?.name && String(catalogEntry.name).trim()) || "this peptide";
  const peptideNameById = useMemo(() => new Map(PEPTIDES.map((p) => [p.id, p.name])), []);
  const resolvePeptideName = useCallback(
    (id) => {
      if (id && typeof id === "string" && peptideNameById.has(id)) return peptideNameById.get(id);
      return compoundName;
    },
    [peptideNameById, compoundName]
  );
  const [vials, setVials] = useState([]);
  const [dosesByVial, setDosesByVial] = useState({});
  const [calendarDoses, setCalendarDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => currentViewMonth());
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [twoWeekStartYmd, setTwoWeekStartYmd] = useState(() => defaultTwoWeekStartYmd());
  const [earliestDosedAtIso, setEarliestDosedAtIso] = useState(/** @type {string | null} */ (null));

  const [formLabel, setFormLabel] = useState("");
  const [formRecon, setFormRecon] = useState(todayYmd);
  const [formMg, setFormMg] = useState("");
  const [formMl, setFormMl] = useState("");
  const [formDesiredMcg, setFormDesiredMcg] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [mgQuick, setMgQuick] = useState(null);
  const [mlQuick, setMlQuick] = useState(null);
  const [desiredQuick, setDesiredQuick] = useState(null);
  const [blendDrawMl, setBlendDrawMl] = useState(0.1);
  const [vialSizeOptionIndex, setVialSizeOptionIndex] = useState(0);

  const vialSizeOptionsList = useMemo(() => {
    const o = catalogEntry?.vialSizeOptions;
    return Array.isArray(o) && o.length > 0 ? o : null;
  }, [catalogEntry?.vialSizeOptions]);

  const blendCatalogBacRefMl = useMemo(() => resolveCatalogBlendBacRefMl(catalogEntry), [catalogEntry]);

  const blendComponents = useMemo(() => {
    const c = catalogEntry?.components;
    if (!Array.isArray(c) || c.length === 0) return null;
    const rows = [];
    for (const x of c) {
      const name = typeof x?.name === "string" ? x.name.trim() : "";
      if (!name) continue;
      const mg = Number(x?.mg);
      if (Number.isFinite(mg) && mg >= 0) {
        rows.push({ name, mg });
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(x, "mgPerMl")) {
        if (x.mgPerMl === null) rows.push({ name, mgPerMl: null });
        else {
          const mpm = Number(x.mgPerMl);
          if (Number.isFinite(mpm) && mpm >= 0) rows.push({ name, mgPerMl: mpm });
        }
      }
    }
    return rows.length >= 2 ? rows : null;
  }, [catalogEntry?.components]);

  const blendTotalMg = useMemo(
    () => (blendComponents?.length ? blendRecipeTotalMg(blendComponents, blendCatalogBacRefMl) : 0),
    [blendComponents, blendCatalogBacRefMl]
  );

  const effectiveBlendComponents = useMemo(() => {
    if (!blendComponents?.length || blendTotalMg <= 0) return null;
    const mg = parseFloat(String(formMg).replace(/,/g, ""));
    if (!Number.isFinite(mg) || mg <= 0) return null;
    return scaleBlendComponentsToVial(blendComponents, blendTotalMg, mg, blendCatalogBacRefMl);
  }, [blendComponents, blendTotalMg, formMg, blendCatalogBacRefMl]);

  const effectiveBlendTotalMg = useMemo(
    () => (effectiveBlendComponents ? effectiveBlendComponents.reduce((s, x) => s + x.mg, 0) : 0),
    [effectiveBlendComponents]
  );

  const blendCalc = useMemo(() => {
    if (!effectiveBlendComponents || effectiveBlendTotalMg <= 0) return null;
    const bac = parseFloat(String(formMl).replace(/,/g, ""));
    const draw = clampBlendDrawMl(blendDrawMl);
    if (!Number.isFinite(bac) || bac <= 0) return null;
    return calculateBlendDose(effectiveBlendComponents, effectiveBlendTotalMg, bac, draw);
  }, [effectiveBlendComponents, effectiveBlendTotalMg, formMl, blendDrawMl]);

  const liveBlendConcParts = useMemo(() => {
    if (!effectiveBlendComponents?.length) return [];
    const ml = parseFloat(String(formMl).replace(/,/g, ""));
    if (!Number.isFinite(ml) || ml <= 0) return [];
    return blendConcentrationsMgPerMl(effectiveBlendComponents, ml);
  }, [effectiveBlendComponents, formMl]);

  const canMutate = canUse && isSupabaseConfigured();
  const workerConfigured = isApiWorkerConfigured();
  const demo = useDemoTourOptional();
  const highlightTarget = demo?.highlightTarget;

  const catalogIdKey =
    catalogEntry != null && catalogEntry.id != null && String(catalogEntry.id).trim()
      ? String(catalogEntry.id).trim()
      : "";
  const vialLookupIds = useMemo(
    () => vialQueryPeptideIds(peptideId, catalogEntry),
    [peptideId, catalogIdKey]
  );

  const reloadGen = useRef(0);

  const vialsById = useMemo(() => new Map((vials ?? []).map((x) => [x.id, x])), [vials]);

  const calendarLimits = useMemo(() => {
    const today = stripTimeLocal(new Date());
    const maxD = stripTimeLocal(new Date(today));
    maxD.setDate(maxD.getDate() + 160);
    const min160 = stripTimeLocal(new Date(today));
    min160.setDate(min160.getDate() - 160);
    let minD = min160;
    if (earliestDosedAtIso) {
      const e = stripTimeLocal(new Date(earliestDosedAtIso));
      if (e.getTime() < minD.getTime()) minD = e;
    }
    return { minD, maxD };
  }, [earliestDosedAtIso]);

  const canTwoWeekPrev = useMemo(() => {
    const ws = parseYmdLocal(twoWeekStartYmd);
    const prevStart = addDaysLocal(ws, -7);
    return prevStart.getTime() >= calendarLimits.minD.getTime();
  }, [twoWeekStartYmd, calendarLimits.minD]);

  const canTwoWeekNext = useMemo(() => {
    const ws = parseYmdLocal(twoWeekStartYmd);
    const endAfterShift = addDaysLocal(ws, 20);
    return endAfterShift.getTime() <= calendarLimits.maxD.getTime();
  }, [twoWeekStartYmd, calendarLimits.maxD]);

  const canMonthPrev = useMemo(() => {
    const lastOfPrevMonth = new Date(viewMonth.y, viewMonth.m, 0);
    const lastStrip = stripTimeLocal(lastOfPrevMonth);
    return lastStrip.getTime() >= calendarLimits.minD.getTime();
  }, [viewMonth.y, viewMonth.m, calendarLimits.minD]);

  const canMonthNext = useMemo(() => {
    const firstOfNextMonth = new Date(viewMonth.y, viewMonth.m + 1, 1);
    const firstStrip = stripTimeLocal(firstOfNextMonth);
    return firstStrip.getTime() <= calendarLimits.maxD.getTime();
  }, [viewMonth.y, viewMonth.m, calendarLimits.maxD]);

  useEffect(() => {
    if (highlightTarget === DEMO_TARGET.vial_reconstitute && canMutate && demoAnchorFirst) setShowAdd(true);
  }, [highlightTarget, canMutate, demoAnchorFirst]);

  const reload = useCallback(async () => {
    const gen = ++reloadGen.current;
    if (!userId || !profileId || !isSupabaseConfigured() || !canUse) {
      setVials([]);
      setDosesByVial({});
      setCalendarDoses([]);
      setLoading(false);
      return;
    }
    if (vialLookupIds.length === 0) {
      setVials([]);
      setDosesByVial({});
      setCalendarDoses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { vials: v } = await listVialsForPeptideIds(userId, profileId, vialLookupIds);
    if (gen !== reloadGen.current) return;
    setVials(v);
    const nextMap = {};
    await Promise.all(
      (v ?? []).map(async (row) => {
        const { doses } = await listRecentDosesForVial(row.id, userId, profileId, 5);
        nextMap[row.id] = doses ?? [];
      })
    );
    if (gen !== reloadGen.current) return;
    setDosesByVial(nextMap);
    const fromVials = (v ?? [])
      .map((row) => row.peptide_id)
      .filter((x) => typeof x === "string" && String(x).trim());
    const calendarPeptideIds = [...new Set([...vialLookupIds, ...fromVials])];
    const { dosedAt: earliest } = await getEarliestDosedAtForPeptideIds(userId, profileId, calendarPeptideIds);
    if (gen !== reloadGen.current) return;
    setEarliestDosedAtIso(typeof earliest === "string" && earliest ? earliest : null);
    const { startIso, endIso } = doseHistoryFetchRangeIso(new Date(), earliest ?? null);
    const { doses: cal } = await listDoseLogsForPeptideIdsRange(
      userId,
      profileId,
      calendarPeptideIds,
      startIso,
      endIso
    );
    if (gen !== reloadGen.current) return;
    setCalendarDoses(cal ?? []);
    setLoading(false);
  }, [userId, profileId, vialLookupIds, canUse]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openAddVial() {
    setFormLabel(nextVialLabel(vials));
    setFormRecon(todayYmd());
    setBlendDrawMl(0.1);
    if (vialSizeOptionsList && vialSizeOptionsList.length > 0) {
      setVialSizeOptionIndex(0);
      const o = vialSizeOptionsList[0];
      setFormMg(String(o.totalMg));
      setFormMl(String(o.bacWaterMl));
      setMgQuick("other");
      const match = ADD_VIAL_ML_OPTIONS.find((x) => x.val === String(o.bacWaterMl));
      setMlQuick(match ? match.key : "other");
    } else if (blendComponents && blendTotalMg > 0) {
      setFormMg(String(blendTotalMg));
      setMgQuick("other");
      const defMl = catalogEntry?.reconstitutionVolumeMl;
      const mlStr = Number.isFinite(defMl) && defMl > 0 ? String(defMl) : "3";
      setFormMl(mlStr);
      const match = ADD_VIAL_ML_OPTIONS.find((o) => o.val === mlStr);
      setMlQuick(match ? match.key : "other");
    } else {
      setFormMg("");
      setFormMl("");
      setMgQuick(null);
      setMlQuick(null);
    }
    setFormDesiredMcg("");
    setFormNotes("");
    setDesiredQuick(null);
    setShowAdd(true);
  }

  const liveConc = useMemo(() => {
    const mg = parseFloat(String(formMg).replace(/,/g, ""));
    const ml = parseFloat(String(formMl).replace(/,/g, ""));
    if (!Number.isFinite(mg) || !Number.isFinite(ml) || ml <= 0) return null;
    return (mg * 1000) / ml;
  }, [formMg, formMl]);

  const addFormCalc = useMemo(() => {
    if (liveConc == null || !Number.isFinite(liveConc) || liveConc <= 0) return null;
    const want = parseFloat(String(formDesiredMcg).replace(/,/g, ""));
    if (!Number.isFinite(want) || want <= 0) return { concentration: liveConc };
    const mg = parseFloat(String(formMg).replace(/,/g, ""));
    const vol = want / liveConc;
    const units = vol * 100;
    const totalDoses = Number.isFinite(mg) && mg > 0 ? Math.floor((mg * 1000) / want) : 0;
    return { concentration: liveConc, want, vol, units, totalDoses };
  }, [liveConc, formDesiredMcg, formMg]);

  async function saveVial(e) {
    e.preventDefault();
    if (!canMutate || typeof stabilityDays !== "number") return;
    const mg = parseFloat(String(formMg).replace(/,/g, ""));
    const ml = parseFloat(String(formMl).replace(/,/g, ""));
    if (!Number.isFinite(mg) || mg <= 0 || !Number.isFinite(ml) || ml <= 0) return;
    const desired = parseFloat(String(formDesiredMcg).replace(/,/g, ""));
    const desiredDoseMcg = Number.isFinite(desired) && desired > 0 ? desired : null;
    const { error } = await insertUserVial({
      user_id: userId,
      profile_id: profileId,
      peptide_id: persistVialPeptideId(peptideId, catalogEntry),
      label: formLabel.trim() || nextVialLabel(vials),
      reconstituted_at: reconstitutedNoonIso(formRecon),
      vial_size_mg: mg,
      bac_water_ml: ml,
      desired_dose_mcg: desiredDoseMcg,
      expires_at: expiresAtIso(formRecon, stabilityDays),
      notes: formNotes.trim() || null,
      status: "active",
    });
    if (import.meta.env.DEV && error) {
      console.error("[VialTracker saveVial]", error.message ?? error, error);
    }
    if (!error) {
      setShowAdd(false);
      setFormMg("");
      setFormMl("");
      setFormDesiredMcg("");
      setFormNotes("");
      setMgQuick(null);
      setMlQuick(null);
      setDesiredQuick(null);
      void reload();
    }
  }

  function goTwoWeekPrev() {
    setTwoWeekStartYmd((prev) => ymdFromDate(addDaysLocal(parseYmdLocal(prev), -7)));
  }

  function goTwoWeekNext() {
    setTwoWeekStartYmd((prev) => ymdFromDate(addDaysLocal(parseYmdLocal(prev), 7)));
  }

  function goMonthPrev() {
    setViewMonth((v) => {
      const d = new Date(v.y, v.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function goMonthNext() {
    setViewMonth((v) => {
      const d = new Date(v.y, v.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  if (stabilityDays == null) return null;

  if (!canUse) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onUpgrade}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onUpgrade();
          }
        }}
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 12,
          border: "1px dashed #243040",
          background: "#07090e",
          opacity: 0.55,
          cursor: "pointer",
        }}
        title="Upgrade to Pro to use Vial Tracker"
      >
        <div className="mono" style={{ fontSize: 14, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
          VIAL TRACKER
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#8fa5bf" }}>
          Upgrade to Pro to use Vial Tracker
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div className="mono" style={{ fontSize: 14, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
        {compoundName}
      </div>

      {!isSupabaseConfigured() && (
        <div className="mono" style={{ fontSize: 13, color: "#f59e0b", marginBottom: 8 }}>Configure Supabase to sync vials</div>
      )}

      <div className="mono" style={{ fontSize: 12, color: "#5c6d82", marginBottom: 8, lineHeight: 1.45 }}>
        Inventory and history only — log doses from Protocol or Stacks quick log.
      </div>

      {loading && <div className="mono" style={{ fontSize: 13, color: "#a0a0b0" }}>Loading…</div>}

      <DoseHistoryCalendar
        doses={calendarDoses}
        expanded={calendarExpanded}
        onToggleExpand={() => {
          setCalendarExpanded((prev) => {
            const next = !prev;
            if (next) {
              const w = parseYmdLocal(twoWeekStartYmd);
              setViewMonth({ y: w.getFullYear(), m: w.getMonth() });
            }
            return next;
          });
        }}
        twoWeekStartYmd={twoWeekStartYmd}
        onTwoWeekPrev={goTwoWeekPrev}
        onTwoWeekNext={goTwoWeekNext}
        canTwoWeekPrev={canTwoWeekPrev}
        canTwoWeekNext={canTwoWeekNext}
        viewMonth={viewMonth}
        onMonthPrev={goMonthPrev}
        onMonthNext={goMonthNext}
        canMonthPrev={canMonthPrev}
        canMonthNext={canMonthNext}
        resolvePeptideName={resolvePeptideName}
        vialsById={vialsById}
        catalogBlendComponents={blendComponents ?? undefined}
        catalogBlendBacRefMl={blendCatalogBacRefMl}
      />

      {canMutate && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {!showAdd ? (
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12, minHeight: 44 }}
              data-demo-target={demoAnchorFirst ? DEMO_TARGET.vial_add : undefined}
              {...demoHighlightProps(
                demoAnchorFirst && demo?.isHighlighted(DEMO_TARGET.vial_add)
              )}
              onClick={() => openAddVial()}
            >
              + Add vial
            </button>
          ) : (
            <button type="button" className="btn-teal" style={{ fontSize: 13, padding: "5px 12px", borderRadius: 12 }} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          )}
        </div>
      )}

      {showAdd && canMutate && (
        <form
          onSubmit={saveVial}
          style={{
            marginTop: 10,
            padding: 12,
            border: "1px dashed #00d4aa55",
            borderRadius: 12,
            background: "#0b0f17",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 400,
          }}
        >
          <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 0 }}>
            NEW VIAL
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 2 }}>LABEL</div>
              <input className="form-input" style={{ fontSize: 13 }} value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
            </div>
            <div
              data-demo-target={demoAnchorFirst ? DEMO_TARGET.vial_reconstitute : undefined}
              {...demoHighlightProps(
                demoAnchorFirst && demo?.isHighlighted(DEMO_TARGET.vial_reconstitute)
              )}
            >
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 2 }}>RECONSTITUTION DATE</div>
              <input className="form-input" style={{ fontSize: 13 }} type="date" value={formRecon} onChange={(e) => setFormRecon(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>VIAL SIZE (mg)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ADD_VIAL_MG_OPTIONS.map((o) => (
                <SelectPill key={o.key} active={mgQuick === o.key} onClick={() => { setMgQuick(o.key); setFormMg(o.val); }}>
                  {o.label}
                </SelectPill>
              ))}
              <SelectPill active={mgQuick === "other"} onClick={() => setMgQuick("other")}>
                Other
              </SelectPill>
            </div>
            {mgQuick === "other" && (
              <input
                className="form-input"
                style={{ fontSize: 13, marginTop: 8, maxWidth: 200 }}
                inputMode="decimal"
                placeholder="mg"
                value={formMg}
                onChange={(e) => setFormMg(e.target.value)}
              />
            )}
          </div>

          {vialSizeOptionsList && (
            <div>
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>VIAL SIZE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {vialSizeOptionsList.map((opt, idx) => (
                  <SelectPill
                    key={opt.label}
                    active={vialSizeOptionIndex === idx}
                    onClick={() => {
                      setVialSizeOptionIndex(idx);
                      setFormMg(String(opt.totalMg));
                      setFormMl(String(opt.bacWaterMl));
                      setMgQuick("other");
                      const match = ADD_VIAL_ML_OPTIONS.find((x) => x.val === String(opt.bacWaterMl));
                      setMlQuick(match ? match.key : "other");
                    }}
                  >
                    {opt.label}
                  </SelectPill>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>BAC WATER (mL)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ADD_VIAL_ML_OPTIONS.map((o) => (
                <SelectPill key={o.key} active={mlQuick === o.key} onClick={() => { setMlQuick(o.key); setFormMl(o.val); }}>
                  {o.label}
                </SelectPill>
              ))}
              <SelectPill active={mlQuick === "other"} onClick={() => setMlQuick("other")}>
                Other
              </SelectPill>
            </div>
            {mlQuick === "other" && (
              <input
                className="form-input"
                style={{ fontSize: 13, marginTop: 8, maxWidth: 200 }}
                inputMode="decimal"
                placeholder="mL"
                value={formMl}
                onChange={(e) => setFormMl(e.target.value)}
              />
            )}
          </div>

          {blendComponents && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #1e3a32",
                background: "rgba(0, 212, 170, 0.06)",
              }}
            >
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
                BLEND CALCULATOR
              </div>
              <div className="mono" style={{ fontSize: 12, color: "#5c6d82", marginBottom: 12, lineHeight: 1.45 }}>
                Uses vial total and BAC water (mL) above. Adjust draw volume to see each component per injection.
              </div>
              {blendTotalMg <= 0 && (
                <div className="mono" style={{ fontSize: 12, color: "#c4a574", marginBottom: 12, lineHeight: 1.45 }}>
                  Per-component concentrations are not computed — blend ratios vary by vendor. Confirm masses on CoA before dosing.
                </div>
              )}
              <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>
                DRAW VOLUME (mL) — {BLEND_DRAW_MIN}–{BLEND_DRAW_MAX}
              </div>
              <input
                type="range"
                min={BLEND_DRAW_MIN}
                max={BLEND_DRAW_MAX}
                step={0.01}
                value={blendDrawMl}
                onChange={(e) => setBlendDrawMl(clampBlendDrawMl(parseFloat(e.target.value)))}
                aria-label="Draw volume in milliliters"
                style={{ width: "100%", maxWidth: 320, display: "block", marginBottom: 8 }}
              />
              <input
                className="form-input"
                style={{ fontSize: 13, maxWidth: 120 }}
                type="number"
                min={BLEND_DRAW_MIN}
                max={BLEND_DRAW_MAX}
                step={0.01}
                value={blendDrawMl}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isFinite(v)) setBlendDrawMl(clampBlendDrawMl(v));
                }}
                onBlur={() => setBlendDrawMl((d) => clampBlendDrawMl(d))}
                aria-label="Draw volume numeric"
              />
              {blendCalc && blendCalc.rows.length > 0 && (
                <div style={{ marginTop: 14, overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#dde4ef",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e2a38", color: "#8fa5bf" }}>
                        <th style={{ textAlign: "left", padding: "8px 6px 8px 0" }}>Component</th>
                        <th style={{ textAlign: "right", padding: "8px 6px" }}>mg / vial</th>
                        <th style={{ textAlign: "right", padding: "8px 6px" }}>mg / draw</th>
                        <th style={{ textAlign: "right", padding: "8px 6px 8px 0" }}>mcg / draw</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blendCalc.rows.map((r) => (
                        <tr key={r.name} style={{ borderBottom: "1px solid #14202e" }}>
                          <td style={{ padding: "6px 6px 6px 0" }}>{r.name}</td>
                          <td style={{ textAlign: "right", padding: "6px 6px" }}>{r.mgPerVial.toLocaleString()}</td>
                          <td style={{ textAlign: "right", padding: "6px 6px" }}>{formatBlendMgDraw(r.mgPerDraw)}</td>
                          <td style={{ textAlign: "right", padding: "6px 6px 6px 0" }}>{formatBlendMcgDraw(r.mcgPerDraw)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 600, color: "#00d4aa" }}>
                        <td style={{ padding: "8px 6px 0 0" }}>Total blend</td>
                        <td style={{ textAlign: "right", padding: "8px 6px 0" }}>{effectiveBlendTotalMg.toLocaleString()}</td>
                        <td style={{ textAlign: "right", padding: "8px 6px 0" }}>{formatBlendMgDraw(blendCalc.totalMgPerDraw)}</td>
                        <td style={{ textAlign: "right", padding: "8px 6px 0 0" }}>{formatBlendMcgDraw(blendCalc.totalMcgPerDraw)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 6 }}>DESIRED DOSE (mcg per injection)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ADD_VIAL_DOSE_OPTIONS.map((o) => (
                <SelectPill
                  key={o.key}
                  active={desiredQuick === o.key}
                  onClick={() => {
                    setDesiredQuick(o.key);
                    setFormDesiredMcg(o.val);
                  }}
                >
                  {o.label}
                </SelectPill>
              ))}
              <SelectPill active={desiredQuick === "other"} onClick={() => setDesiredQuick("other")}>
                Other
              </SelectPill>
            </div>
            {desiredQuick === "other" && (
              <input
                className="form-input"
                style={{ fontSize: 13, marginTop: 8, maxWidth: 200 }}
                inputMode="decimal"
                placeholder="mcg"
                value={formDesiredMcg}
                onChange={(e) => setFormDesiredMcg(e.target.value)}
              />
            )}
          </div>

          {addFormCalc != null && (
            <div
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid #14202e",
                background: "#07090e",
              }}
            >
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 8, letterSpacing: "0.08em" }}>
                LIVE RESULTS
              </div>
              {effectiveBlendComponents ? (
                <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", lineHeight: 1.5, wordBreak: "break-word" }}>
                  <span style={{ color: "#a0a0b0" }}>Blend conc.</span> {formatBlendConcMgPerMl(liveBlendConcParts)}
                </div>
              ) : (
                <div className="mono" style={{ fontSize: 13, color: "#8fa5bf" }}>
                  Concentration: {formatConc(addFormCalc.concentration)}
                </div>
              )}
              {addFormCalc.want != null && (
                <>
                  <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", marginTop: 8 }}>
                    Volume to inject: {formatVolumeMl(addFormCalc.vol)} mL
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: "#00d4aa14",
                      border: "1px solid #00d4aa",
                    }}
                  >
                    <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.06em" }}>
                      INSULIN SYRINGE
                    </div>
                    <div className="mono" style={{ fontSize: 13, color: "#00d4aa", lineHeight: 1.45 }}>
                      {addFormCalc.units.toFixed(1)} units on a 100-unit (1 mL) syringe
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", marginTop: 8 }}>
                    Total doses per vial: {addFormCalc.totalDoses.toLocaleString()} dose{addFormCalc.totalDoses === 1 ? "" : "s"}
                  </div>
                  <div
                    className="mono"
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: "#1a0f00",
                      border: "1px solid #b45309",
                      color: "#a06000",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    Draw to the {addFormCalc.units.toFixed(1)} unit mark on your insulin syringe to get exactly{" "}
                    {Number.isInteger(addFormCalc.want)
                      ? `${addFormCalc.want.toLocaleString()} mcg`
                      : `${addFormCalc.want.toLocaleString(undefined, { maximumFractionDigits: 2 })} mcg`}{" "}
                    of {compoundName}.
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 2 }}>NOTES (optional)</div>
            <input className="form-input" style={{ fontSize: 13 }} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn-teal" style={{ fontSize: 13, alignSelf: "flex-start", borderRadius: 12 }}>
            Save vial
          </button>
        </form>
      )}

      {!loading &&
        vials.map((v) => (
          <VialRow
            key={v.id}
            vial={v}
            userId={userId}
            profileId={profileId}
            canMutate={canMutate}
            doses={dosesByVial[v.id] ?? []}
            onReload={reload}
            stabilityNote={stabilityNote}
            workerConfigured={workerConfigured}
            onUpgrade={onUpgrade}
            catalogBlendComponents={blendComponents ?? undefined}
            catalogBlendBacRefMl={blendCatalogBacRefMl}
          />
        ))}
    </div>
  );
}
