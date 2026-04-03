import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { mcgToUnits, roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import {
  deleteUserVial,
  insertDoseLog,
  insertUserVial,
  listDoseLogsForPeptideRange,
  listRecentDosesForVial,
  listVialsForPeptide,
  updateUserVial,
} from "../lib/supabase.js";

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

function formatConc(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toLocaleString(undefined, { maximumFractionDigits: 0 })} mcg/mL`;
}

const PILL = {
  borderRadius: 9999,
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

function countdownStyle(days, expired) {
  if (expired) return { color: "#6b7280", textDecoration: "line-through" };
  if (days > 14) return { color: "#10b981" };
  if (days >= 7) return { color: "#f59e0b" };
  return { color: "#ef4444" };
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

/** Inclusive ISO bounds for Supabase query for the visible calendar grid. */
function getDoseHistoryQueryRange(viewMonth, now = new Date()) {
  const today = stripTimeLocal(now);
  const isCurrentMonth = viewMonth.y === today.getFullYear() && viewMonth.m === today.getMonth();
  if (isCurrentMonth) {
    const windowEnd = new Date(today);
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - 29);
    const gridStart = startOfWeekSunday(windowStart);
    const gridEnd = endOfWeekSaturday(windowEnd);
    return { startIso: localDayStartToIso(gridStart), endIso: localDayEndToIso(gridEnd) };
  }
  const monthFirst = new Date(viewMonth.y, viewMonth.m, 1);
  const monthLast = new Date(viewMonth.y, viewMonth.m + 1, 0);
  const gridStart = startOfWeekSunday(monthFirst);
  const gridEnd = endOfWeekSaturday(monthLast);
  return { startIso: localDayStartToIso(gridStart), endIso: localDayEndToIso(gridEnd) };
}

function monthLabelUpper(viewMonth) {
  return new Date(viewMonth.y, viewMonth.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

function cmpViewMonth(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  return a.m - b.m;
}

function minViewMonth(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

function currentViewMonth(now = new Date()) {
  return { y: now.getFullYear(), m: now.getMonth() };
}

function clampViewMonth(ym, now = new Date()) {
  const cur = currentViewMonth(now);
  const min = minViewMonth(now);
  if (cmpViewMonth(ym, cur) > 0) return cur;
  if (cmpViewMonth(ym, min) < 0) return min;
  return ym;
}

function vialActiveOnYmd(vial, ymd) {
  const [Y, Mo, D] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return false;
  const dayStart = new Date(Y, Mo - 1, D, 0, 0, 0, 0);
  const dayEnd = new Date(Y, Mo - 1, D, 23, 59, 59, 999);
  const reconDay = stripTimeLocal(new Date(vial.reconstituted_at)).getTime();
  if (reconDay > dayEnd.getTime()) return false;
  if (vial.status === "depleted") return true;
  const expDay = stripTimeLocal(new Date(vial.expires_at)).getTime();
  if (expDay < dayStart.getTime()) return false;
  return true;
}

function combineYmdAndTimeToIso(ymd, timeHHMM) {
  const [Y, Mo, D] = ymd.split("-").map((x) => parseInt(x, 10));
  const parts = String(timeHHMM || "08:00").split(":");
  const hh = parseInt(parts[0], 10) || 0;
  const mm = parseInt(parts[1], 10) || 0;
  return new Date(Y, Mo - 1, D, hh, mm, 0, 0).toISOString();
}

function formatLogHeaderDate(ymd) {
  const [Y, Mo, D] = ymd.split("-").map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return ymd;
  return new Date(Y, Mo - 1, D).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

const DOW_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function DoseHistoryCalendar({
  doses,
  viewMonth,
  canGoPrev,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  selectedYmd,
  onSelectDay,
}) {
  const [hoverYmd, setHoverYmd] = useState(null);

  const byDay = useMemo(() => {
    const m = new Map();
    for (const log of doses) {
      const k = localYmdFromIso(log.dosed_at);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(log);
    }
    return m;
  }, [doses]);

  const now = new Date();
  const today = stripTimeLocal(now);
  const todayStr = todayYmd();
  const isCurrentMonth = viewMonth.y === today.getFullYear() && viewMonth.m === today.getMonth();

  let gridStart;
  let gridEnd;
  let w0;
  let w1;
  let monthFirst;
  let monthLast;

  if (isCurrentMonth) {
    const windowEnd = new Date(today);
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - 29);
    w0 = windowStart.getTime();
    w1 = windowEnd.getTime();
    gridStart = startOfWeekSunday(windowStart);
    gridEnd = endOfWeekSaturday(windowEnd);
    monthFirst = null;
    monthLast = null;
  } else {
    monthFirst = stripTimeLocal(new Date(viewMonth.y, viewMonth.m, 1));
    monthLast = stripTimeLocal(new Date(viewMonth.y, viewMonth.m + 1, 0));
    gridStart = startOfWeekSunday(monthFirst);
    gridEnd = endOfWeekSaturday(monthLast);
    w0 = null;
    w1 = null;
  }

  const gridCells = [];
  for (let c = new Date(gridStart); c.getTime() <= gridEnd.getTime(); c.setDate(c.getDate() + 1)) {
    gridCells.push(new Date(c));
  }

  const headerTitle = monthLabelUpper(viewMonth);

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
          onClick={() => onPrevMonth()}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            minWidth: 36,
            opacity: canGoPrev ? 1 : 0.35,
            cursor: canGoPrev ? "pointer" : "not-allowed",
          }}
          aria-label="Previous month"
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
          onClick={() => onNextMonth()}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            minWidth: 36,
            opacity: canGoNext ? 1 : 0.35,
            cursor: canGoNext ? "pointer" : "not-allowed",
          }}
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(36px, 1fr))",
          gap: 6,
          maxWidth: 420,
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
        {gridCells.map((d) => {
          const ymd = ymdFromDate(d);
          const t = stripTimeLocal(d).getTime();
          const dayLogs = byDay.get(ymd) ?? [];
          const has = dayLogs.length > 0;
          const isToday = ymd === todayStr;
          const sel = selectedYmd === ymd;

          let inContent;
          let isFutureNoClick;
          if (isCurrentMonth) {
            inContent = t >= w0 && t <= w1;
            isFutureNoClick = inContent && t > today.getTime();
          } else {
            const mf = monthFirst.getTime();
            const ml = monthLast.getTime();
            inContent = t >= mf && t <= ml;
            isFutureNoClick = false;
          }

          const isPadding = !inContent;

          if (isPadding || isFutureNoClick) {
            return (
              <div
                key={ymd}
                aria-hidden={isPadding}
                className="mono"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  borderRadius: 6,
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
                }}
              >
                <span>{d.getDate()}</span>
                {has && (
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
                )}
              </div>
            );
          }

          const isPast = t < today.getTime() && !isToday;
          const baseBg = isToday ? "rgba(0, 212, 170, 0.14)" : "#07090e";
          const hoverBg = isToday ? "rgba(0, 212, 170, 0.2)" : "#0e1822";
          const numColor = isPast ? "#5a6d82" : "#8fa5bf";
          const borderColor = sel || isToday ? "#00d4aa" : "#14202e";
          const borderWidth = isToday || sel ? 2 : 1;

          return (
            <button
              key={ymd}
              type="button"
              title={has ? `${dayLogs.length} dose(s) — ${ymd}` : `Log dose — ${ymd}`}
              onClick={() => onSelectDay(ymd)}
              onMouseEnter={() => setHoverYmd(ymd)}
              onMouseLeave={() => setHoverYmd(null)}
              style={{
                minWidth: 36,
                minHeight: 36,
                borderRadius: 6,
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
                background: hoverYmd === ymd ? hoverBg : baseBg,
                border: `${borderWidth}px solid ${borderColor}`,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <span>{d.getDate()}</span>
              {has && (
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
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VialRow({
  vial,
  userId,
  peptideId,
  canMutate,
  doses,
  onReload,
  logOpen,
  onToggleLog,
  stabilityNote,
}) {
  const [label, setLabel] = useState(vial.label ?? "Vial 1");
  const [doseUnits, setDoseUnits] = useState(10);
  const [doseNotes, setDoseNotes] = useState("");
  const [savingLabel, setSavingLabel] = useState(false);

  useEffect(() => {
    setLabel(vial.label ?? "Vial 1");
    const recentForVial = doses ?? [];
    const lastMcg = recentForVial.length > 0 ? recentForVial[0].dose_mcg : null;
    const units =
      mcgToUnits(lastMcg, vial.concentration_mcg_ml) ??
      mcgToUnits(vial.desired_dose_mcg, vial.concentration_mcg_ml) ??
      10;
    setDoseUnits(Math.max(0.5, Math.min(300, units)));
  }, [vial.id, vial.label, vial.concentration_mcg_ml, vial.desired_dose_mcg, doses]);

  const rowDerivedMcg = useMemo(
    () => unitsToMcg(doseUnits, vial.concentration_mcg_ml),
    [doseUnits, vial.concentration_mcg_ml]
  );

  const dr = daysRemaining(vial.expires_at);
  const expired = dr < 0 || new Date(vial.expires_at) < new Date();
  const depleted = vial.status === "depleted";

  async function saveLabel() {
    if (!canMutate || label.trim() === (vial.label ?? "").trim()) return;
    setSavingLabel(true);
    await updateUserVial(vial.id, userId, { label: label.trim() || "Vial" });
    setSavingLabel(false);
    onReload();
  }

  async function markDepleted() {
    if (!canMutate) return;
    await updateUserVial(vial.id, userId, { status: "depleted" });
    onReload();
  }

  async function submitDose(e) {
    e.preventDefault();
    if (!canMutate) return;
    if (!rowDerivedMcg || rowDerivedMcg <= 0) return;
    const { error } = await insertDoseLog({
      user_id: userId,
      vial_id: vial.id,
      peptide_id: peptideId,
      dose_mcg: rowDerivedMcg,
      notes: doseNotes.trim() || null,
    });
    if (!error) {
      setDoseNotes("");
      onReload();
    }
  }

  function removeVial() {
    if (!canMutate) return;
    if (!window.confirm(`Delete ${vial.label ?? "this vial"} and its dose history?`)) return;
    void deleteUserVial(vial.id, userId).then(() => onReload());
  }

  const cs = countdownStyle(dr, expired);

  return (
    <div
      style={{
        border: "1px solid #14202e",
        borderRadius: 8,
        padding: 10,
        background: "#07090e",
        marginBottom: 8,
        opacity: depleted ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
          <input
            className="form-input"
            style={{ fontSize: 11, marginBottom: 6 }}
            value={label}
            disabled={!canMutate || savingLabel}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => void saveLabel()}
          />
          <div className="mono" style={{ fontSize: 10, color: "#a0a0b0" }}>
            Reconstituted {formatShortDate(vial.reconstituted_at)}
          </div>
          <div className="mono" style={{ fontSize: 10, color: "#8fa5bf", marginTop: 4 }}>
            Conc. {formatConc(vial.concentration_mcg_ml)}
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          {expired ? (
            <div className="mono" style={{ fontSize: 11, color: "#6b7280", textDecoration: "line-through" }}>
              EXPIRED
            </div>
          ) : depleted ? (
            <div className="mono" style={{ fontSize: 11, color: "#6b7280" }}>
              Depleted
            </div>
          ) : (
            <div className="mono" style={{ fontSize: 11, ...cs }}>
              Expires in {dr} day{dr === 1 ? "" : "s"}
            </div>
          )}
          {stabilityNote && (
            <div
              className="mono"
              style={{
                fontSize: 9,
                color: "#4a6080",
                marginTop: 6,
                lineHeight: 1.45,
                maxWidth: 220,
                marginLeft: "auto",
                textAlign: "right",
              }}
            >
              {stabilityNote}
            </div>
          )}
        </div>
      </div>

      {canMutate && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          <button type="button" className="btn-teal" style={{ fontSize: 10, padding: "4px 10px" }} disabled={depleted} onClick={() => void markDepleted()}>
            Mark as Depleted
          </button>
          <button type="button" className="btn-teal" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => onToggleLog(vial.id)}>
            Log Dose
          </button>
          <button type="button" className="btn-red" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => removeVial()}>
            Delete vial
          </button>
        </div>
      )}

      {logOpen && canMutate && (
        <form onSubmit={submitDose} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #0e1822" }}>
          <div className="mono" style={{ fontSize: 12, color: "#00d4aa", marginBottom: 6 }}>LOG DOSE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn-teal"
              style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
              onClick={() => setDoseUnits((u) => Math.max(0.5, roundToHalf(u - 0.5)))}>
              −
            </button>
            <div className="mono" style={{ fontSize: 16, color: "#dde4ef", minWidth: 50, textAlign: "center" }}>
              {doseUnits}
            </div>
            <button type="button" className="btn-teal"
              style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
              onClick={() => setDoseUnits((u) => Math.min(300, roundToHalf(u + 0.5)))}>
              +
            </button>
            <div className="mono" style={{ fontSize: 12, color: "#00d4aa" }}>
              {rowDerivedMcg != null
                ? `= ${rowDerivedMcg.toLocaleString(undefined, { maximumFractionDigits: 1 })} mcg`
                : "— mcg"}
            </div>
            <input className="form-input" style={{ flex: "1 1 120px", fontSize: 11 }}
              placeholder="Optional notes"
              value={doseNotes} onChange={(e) => setDoseNotes(e.target.value)} />
            <button type="submit" className="btn-teal" style={{ fontSize: 10, padding: "4px 12px" }}>
              Save dose
            </button>
          </div>
        </form>
      )}

      {doses.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 4 }}>RECENT</div>
          {doses.map((d) => (
            <div key={d.id} className="mono" style={{ fontSize: 10, color: "#4a6080", padding: "2px 0" }}>
              {formatShortDate(d.dosed_at)} — {Number(d.dose_mcg).toLocaleString()} mcg
              {d.notes ? ` · ${d.notes}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   userId: string,
 *   peptideId: string,
 *   catalogEntry: { name?: string, stabilityDays: number, stabilityNote?: string | null },
 *   canUse: boolean,
 *   onUpgrade: () => void,
 * }} props
 */
export function VialTracker({ userId, peptideId, catalogEntry, canUse, onUpgrade }) {
  const stabilityDays = catalogEntry?.stabilityDays;
  const stabilityNote = typeof catalogEntry?.stabilityNote === "string" ? catalogEntry.stabilityNote.trim() : "";
  const compoundName = (catalogEntry?.name && String(catalogEntry.name).trim()) || "this peptide";
  const [vials, setVials] = useState([]);
  const [dosesByVial, setDosesByVial] = useState({});
  const [calendarDoses, setCalendarDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [logVialId, setLogVialId] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => currentViewMonth());
  const [calLogYmd, setCalLogYmd] = useState(null);
  const [calLogUnits, setCalLogUnits] = useState(10);
  const [calLogTime, setCalLogTime] = useState("08:00");
  const [calLogNotes, setCalLogNotes] = useState("");
  const [calLogVialPick, setCalLogVialPick] = useState("");
  const [calLogSaving, setCalLogSaving] = useState(false);

  const [formLabel, setFormLabel] = useState("");
  const [formRecon, setFormRecon] = useState(todayYmd);
  const [formMg, setFormMg] = useState("");
  const [formMl, setFormMl] = useState("");
  const [formDesiredMcg, setFormDesiredMcg] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [mgQuick, setMgQuick] = useState(null);
  const [mlQuick, setMlQuick] = useState(null);
  const [desiredQuick, setDesiredQuick] = useState(null);

  const canMutate = canUse && isSupabaseConfigured();

  const reload = useCallback(async () => {
    if (!userId || !peptideId || !isSupabaseConfigured() || !canUse) {
      setVials([]);
      setDosesByVial({});
      setCalendarDoses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { vials: v } = await listVialsForPeptide(userId, peptideId);
    setVials(v);
    const nextMap = {};
    await Promise.all(
      (v ?? []).map(async (row) => {
        const { doses } = await listRecentDosesForVial(row.id, userId, 5);
        nextMap[row.id] = doses ?? [];
      })
    );
    setDosesByVial(nextMap);
    const { startIso, endIso } = getDoseHistoryQueryRange(viewMonth, new Date());
    const { doses: cal } = await listDoseLogsForPeptideRange(userId, peptideId, startIso, endIso);
    setCalendarDoses(cal ?? []);
    setLoading(false);
  }, [userId, peptideId, canUse, viewMonth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openAddVial() {
    setFormLabel(nextVialLabel(vials));
    setFormRecon(todayYmd());
    setFormMg("");
    setFormMl("");
    setFormDesiredMcg("");
    setFormNotes("");
    setMgQuick(null);
    setMlQuick(null);
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
      peptide_id: peptideId,
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

  const calDetail = useMemo(() => {
    if (!calLogYmd) return [];
    return calendarDoses.filter((l) => localYmdFromIso(l.dosed_at) === calLogYmd);
  }, [calLogYmd, calendarDoses]);

  const qualifyingVialsForCal = useMemo(() => {
    if (!calLogYmd) return [];
    return (vials ?? []).filter((v) => vialActiveOnYmd(v, calLogYmd));
  }, [calLogYmd, vials]);

  const calSelectedVial = useMemo(
    () => qualifyingVialsForCal.find((v) => v.id === calLogVialPick),
    [qualifyingVialsForCal, calLogVialPick]
  );

  const calDerivedMcg = useMemo(
    () => unitsToMcg(calLogUnits, calSelectedVial?.concentration_mcg_ml),
    [calLogUnits, calSelectedVial]
  );

  const canCalGoPrev = cmpViewMonth(viewMonth, minViewMonth()) > 0;
  const canCalGoNext = cmpViewMonth(viewMonth, currentViewMonth()) < 0;

  useEffect(() => {
    if (!calLogYmd) return;
    setCalLogTime("08:00");
    setCalLogNotes("");
    const q = (vials ?? []).filter((v) => vialActiveOnYmd(v, calLogYmd));
    if (q.length === 0) {
      setCalLogVialPick("");
      setCalLogUnits(10);
      return;
    }
    const pick =
      q.length === 1
        ? q[0]
        : (q.find((v) => v.desired_dose_mcg != null && Number(v.desired_dose_mcg) > 0) ?? q[0]);
    setCalLogVialPick(pick.id);
    // Prefer most recent actual log, fall back to desired_dose_mcg, fall back to 10
    const recentDoses = dosesByVial[pick.id] ?? [];
    const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
    const units =
      mcgToUnits(lastMcg, pick.concentration_mcg_ml) ??
      mcgToUnits(pick.desired_dose_mcg, pick.concentration_mcg_ml) ??
      10;
    setCalLogUnits(Math.max(0.5, Math.min(300, units)));
  }, [calLogYmd, vials, dosesByVial]);

  function goCalPrevMonth() {
    setCalLogYmd(null);
    setViewMonth((v) => {
      const d = new Date(v.y, v.m - 1, 1);
      return clampViewMonth({ y: d.getFullYear(), m: d.getMonth() });
    });
  }

  function goCalNextMonth() {
    setCalLogYmd(null);
    setViewMonth((v) => {
      const d = new Date(v.y, v.m + 1, 1);
      return clampViewMonth({ y: d.getFullYear(), m: d.getMonth() });
    });
  }

  async function submitCalendarDoseLog(e) {
    e.preventDefault();
    if (!canMutate || !calLogYmd) return;
    if (!calDerivedMcg || calDerivedMcg <= 0) return;
    if (!calLogVialPick) return;
    setCalLogSaving(true);
    const dosed_at = combineYmdAndTimeToIso(calLogYmd, calLogTime);
    const { error } = await insertDoseLog({
      user_id: userId,
      vial_id: calLogVialPick,
      peptide_id: peptideId,
      dose_mcg: calDerivedMcg,
      notes: calLogNotes.trim() || null,
      dosed_at,
    });
    setCalLogSaving(false);
    if (import.meta.env.DEV && error) {
      console.error("[VialTracker submitCalendarDoseLog]", error.message ?? error, error);
    }
    if (!error) {
      setCalLogYmd(null);
      void reload();
    }
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
          borderRadius: 8,
          border: "1px dashed #243040",
          background: "#07090e",
          opacity: 0.55,
          cursor: "pointer",
        }}
        title="Upgrade to Pro to track your vials"
      >
        <div className="mono" style={{ fontSize: 14, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
          VIALS
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#4a6080" }}>
          Upgrade to Pro to track your vials
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div className="mono" style={{ fontSize: 14, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
        VIALS
      </div>

      {!isSupabaseConfigured() && (
        <div className="mono" style={{ fontSize: 10, color: "#f59e0b", marginBottom: 8 }}>Configure Supabase to sync vials</div>
      )}

      {loading && <div className="mono" style={{ fontSize: 10, color: "#a0a0b0" }}>Loading…</div>}

      <DoseHistoryCalendar
        doses={calendarDoses}
        viewMonth={viewMonth}
        canGoPrev={canCalGoPrev}
        canGoNext={canCalGoNext}
        onPrevMonth={goCalPrevMonth}
        onNextMonth={goCalNextMonth}
        selectedYmd={calLogYmd}
        onSelectDay={(ymd) => {
          if (!canMutate) return;
          setCalLogYmd((prev) => (prev === ymd ? null : ymd));
        }}
      />

      {calLogYmd && canMutate && (
        <form
          onSubmit={submitCalendarDoseLog}
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #00d4aa44",
            borderRadius: 8,
            background: "#0b0f17",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: "#00d4aa", letterSpacing: "0.1em", lineHeight: 1.4 }}>
            LOG DOSE — {formatLogHeaderDate(calLogYmd)}
          </div>
          {calDetail.length > 0 && (
            <div style={{ paddingBottom: 10, borderBottom: "1px solid #14202e" }}>
              <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 6 }}>
                EXISTING ON THIS DAY
              </div>
              {calDetail.map((log) => (
                <div key={log.id} className="mono" style={{ fontSize: 10, color: "#dde4ef", padding: "3px 0" }}>
                  {new Date(log.dosed_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })} —{" "}
                  {Number(log.dose_mcg).toLocaleString()} mcg
                  {log.notes ? ` · ${log.notes}` : ""}
                </div>
              ))}
            </div>
          )}
          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 6 }}>UNITS DRAWN</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
                onClick={() => setCalLogUnits((u) => Math.max(0.5, roundToHalf(u - 0.5)))}
              >
                −
              </button>
              <div className="mono" style={{
                fontSize: 16,
                color: "#dde4ef",
                minWidth: 60,
                textAlign: "center",
                padding: "6px 0",
                borderBottom: "1px solid #14202e",
              }}>
                {calLogUnits}
              </div>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
                onClick={() => setCalLogUnits((u) => Math.min(300, roundToHalf(u + 0.5)))}
              >
                +
              </button>
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginLeft: 6 }}>
                {calDerivedMcg != null
                  ? `= ${calDerivedMcg.toLocaleString(undefined, { maximumFractionDigits: 1 })} mcg`
                  : "— mcg"}
              </div>
            </div>
          </div>
          {qualifyingVialsForCal.length > 1 && (
            <div>
              <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>WHICH VIAL</div>
              <select
                className="form-input"
                style={{ fontSize: 11, maxWidth: 280 }}
                value={calLogVialPick}
                onChange={(e) => {
                  const id = e.target.value;
                  setCalLogVialPick(id);
                  const v = qualifyingVialsForCal.find((x) => x.id === id);
                  if (!v) return;
                  const recentDoses = dosesByVial[v.id] ?? [];
                  const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
                  const units =
                    mcgToUnits(lastMcg, v.concentration_mcg_ml) ??
                    mcgToUnits(v.desired_dose_mcg, v.concentration_mcg_ml) ??
                    10;
                  setCalLogUnits(Math.max(0.5, Math.min(300, units)));
                }}
              >
                {qualifyingVialsForCal.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label ?? "Vial"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {qualifyingVialsForCal.length === 1 && (
            <div className="mono" style={{ fontSize: 10, color: "#8fa5bf" }}>
              Vial: {qualifyingVialsForCal[0].label ?? "Vial 1"}
            </div>
          )}
          {qualifyingVialsForCal.length === 0 && (
            <div className="mono" style={{ fontSize: 10, color: "#f59e0b" }}>
              No vial was active on this date — add a vial or adjust dates.
            </div>
          )}
          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>TIME</div>
            <input
              className="form-input"
              style={{ fontSize: 11, maxWidth: 160 }}
              type="time"
              value={calLogTime}
              onChange={(e) => setCalLogTime(e.target.value)}
            />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>NOTES (optional)</div>
            <input
              className="form-input"
              style={{ fontSize: 11 }}
              value={calLogNotes}
              onChange={(e) => setCalLogNotes(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="submit"
              className="btn-teal"
              style={{ fontSize: 10, padding: "5px 14px" }}
              disabled={calLogSaving || qualifyingVialsForCal.length === 0 || !calLogVialPick}
            >
              Log Dose
            </button>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 10, padding: "5px 14px", opacity: 0.85 }}
              onClick={() => setCalLogYmd(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {canMutate && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {!showAdd ? (
            <button type="button" className="btn-teal" style={{ fontSize: 10, padding: "5px 12px" }} onClick={() => openAddVial()}>
              + Add vial
            </button>
          ) : (
            <button type="button" className="btn-teal" style={{ fontSize: 10, padding: "5px 12px" }} onClick={() => setShowAdd(false)}>
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
            borderRadius: 8,
            background: "#0b0f17",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 400,
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: "#00d4aa", marginBottom: 0 }}>
            NEW VIAL
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>LABEL</div>
              <input className="form-input" style={{ fontSize: 11 }} value={formLabel} onChange={(e) => setFormLabel(e.target.value)} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>RECONSTITUTION DATE</div>
              <input className="form-input" style={{ fontSize: 11 }} type="date" value={formRecon} onChange={(e) => setFormRecon(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 6 }}>VIAL SIZE (mg)</div>
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
                style={{ fontSize: 11, marginTop: 8, maxWidth: 200 }}
                inputMode="decimal"
                placeholder="mg"
                value={formMg}
                onChange={(e) => setFormMg(e.target.value)}
              />
            )}
          </div>

          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 6 }}>BAC WATER (mL)</div>
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
                style={{ fontSize: 11, marginTop: 8, maxWidth: 200 }}
                inputMode="decimal"
                placeholder="mL"
                value={formMl}
                onChange={(e) => setFormMl(e.target.value)}
              />
            )}
          </div>

          <div>
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 6 }}>DESIRED DOSE (mcg per injection)</div>
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
                style={{ fontSize: 11, marginTop: 8, maxWidth: 200 }}
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
                borderRadius: 8,
                border: "1px solid #14202e",
                background: "#07090e",
              }}
            >
              <div className="mono" style={{ fontSize: 12, color: "#00d4aa", marginBottom: 8, letterSpacing: "0.08em" }}>
                LIVE RESULTS
              </div>
              <div className="mono" style={{ fontSize: 10, color: "#8fa5bf" }}>
                Concentration: {formatConc(addFormCalc.concentration)}
              </div>
              {addFormCalc.want != null && (
                <>
                  <div className="mono" style={{ fontSize: 10, color: "#8fa5bf", marginTop: 8 }}>
                    Volume to inject: {formatVolumeMl(addFormCalc.vol)} mL
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 8,
                      background: "#00d4aa14",
                      border: "1px solid #00d4aa",
                    }}
                  >
                    <div className="mono" style={{ fontSize: 12, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.06em" }}>
                      INSULIN SYRINGE
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: "#00d4aa", lineHeight: 1.45 }}>
                      {addFormCalc.units.toFixed(1)} units on a 100-unit (1 mL) syringe
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "#8fa5bf", marginTop: 8 }}>
                    Total doses per vial: {addFormCalc.totalDoses.toLocaleString()} dose{addFormCalc.totalDoses === 1 ? "" : "s"}
                  </div>
                  <div
                    className="mono"
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 6,
                      background: "#1a0f00",
                      border: "1px solid #b45309",
                      color: "#a06000",
                      fontSize: 10,
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
            <div className="mono" style={{ fontSize: 12, color: "#a0a0b0", marginBottom: 2 }}>NOTES (optional)</div>
            <input className="form-input" style={{ fontSize: 11 }} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn-teal" style={{ fontSize: 11, alignSelf: "flex-start" }}>
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
            peptideId={peptideId}
            canMutate={canMutate}
            doses={dosesByVial[v.id] ?? []}
            onReload={reload}
            logOpen={logVialId === v.id}
            onToggleLog={(id) => setLogVialId((x) => (x === id ? null : id))}
            stabilityNote={stabilityNote}
          />
        ))}
    </div>
  );
}
