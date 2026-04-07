import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCatalogPeptideForStackRow } from "../lib/resolveStackCatalogPeptide.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildProtocolDoseRow } from "../lib/protocolDoseRows.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";
import { roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import { insertDoseLog, listPeptideIdsWithDosesOnLocalDay } from "../lib/supabase.js";
import { inferProtocolSessionForNow } from "../lib/sessionSchedule.js";
import { useShowDoseToast } from "../context/DoseToastContext.jsx";
import { getDoseLogCelebrationMessage } from "../lib/doseLogCelebration.js";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function protocolHeaderLine() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function formatConcLine(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toLocaleString(undefined, { maximumFractionDigits: 0 })} mcg/mL`;
}

function clampUnits(u) {
  return Math.max(0.5, Math.min(300, roundToHalf(Number(u) || 0.5)));
}

/**
 * Today's quick log on Stacks tab — same per-compound LOG DOSE pattern as Protocol (no vial management).
 * @param {{ userId: string, profileId: string, protocolRows: { peptideId: string, name: string }[], canUse: boolean, onUpgrade: () => void, userPlan?: string, wakeTime?: string | null }} props
 */
export function StackProtocolQuickLog({ userId, profileId, protocolRows, canUse, onUpgrade, wakeTime = null }) {
  const session = useMemo(() => inferProtocolSessionForNow(wakeTime), [wakeTime]);

  const [lines, setLines] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [loggingPeptideId, setLoggingPeptideId] = useState(null);
  const [loggedTodayIds, setLoggedTodayIds] = useState(() => new Set());
  const [guardrail, setGuardrail] = useState(null);
  const showDoseToast = useShowDoseToast();
  const skipGuardrailForPeptideIdRef = useRef(null);

  useEffect(() => {
    setGuardrail(null);
    skipGuardrailForPeptideIdRef.current = null;
  }, [session]);

  const load = useCallback(async () => {
    if (!userId || !profileId || !isSupabaseConfigured() || !canUse || protocolRows.length === 0) {
      setLines([]);
      return;
    }
    const ymd = todayYmd();
    const { peptideIds, error: idsError } = await listPeptideIdsWithDosesOnLocalDay(userId, profileId, ymd);
    if (!idsError && peptideIds) {
      setLoggedTodayIds(new Set(peptideIds));
    }
    const built = [];
    for (const row of protocolRows) {
      const peptide = findCatalogPeptideForStackRow({ id: row.peptideId, name: row.name });
      const r = await buildProtocolDoseRow(userId, profileId, row.peptideId, row.name, peptide, ymd);
      if (r.kind === "missingVial") {
        built.push({ display: "missingVial", peptideId: row.peptideId, name: row.name });
        continue;
      }
      built.push({ display: "ok", row: r });
    }
    setLines(built);
  }, [userId, profileId, canUse, protocolRows]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const updateInjectableUnits = (peptideId, units) => {
    setLines((prev) =>
      (prev ?? []).map((entry) =>
        entry.display === "ok" && entry.row.peptideId === peptideId && entry.row.kind === "injectable"
          ? { ...entry, row: { ...entry.row, units: clampUnits(units) } }
          : entry
      )
    );
  };

  const updateNonInjectableCount = (peptideId, next) => {
    const n = Math.max(1, Math.min(99, Math.round(Number(next) || 1)));
    setLines((prev) =>
      (prev ?? []).map((entry) =>
        entry.display === "ok" && entry.row.peptideId === peptideId && entry.row.kind === "nonInjectable"
          ? { ...entry, row: { ...entry.row, doseCount: n } }
          : entry
      )
    );
  };

  const logDoseForPeptide = async (peptideId) => {
    const list = lines ?? [];
    const entry = list.find((e) => e.display === "ok" && e.row.peptideId === peptideId);
    if (!entry || loggingPeptideId != null) return;
    if (loggedTodayIds.has(peptideId)) return;

    const r = entry.row;
    let payload = null;
    if (r.kind === "injectable") {
      const vial = r.vials.find((v) => v.id === r.selectedVialId);
      if (!vial) return;
      const mcg = unitsToMcg(r.units, vial.concentration_mcg_ml);
      if (mcg == null || mcg <= 0) return;
      payload = { kind: "injectable", vial, mcg };
    } else if (r.kind === "nonInjectable") {
      const n = Math.max(1, Math.min(99, r.doseCount));
      payload = { kind: "nonInjectable", doseCount: n, doseUnit: r.unitLabel };
    } else {
      return;
    }

    const skipId = skipGuardrailForPeptideIdRef.current;
    if (skipId !== peptideId) {
      if (hasAnyTimingConflict([peptideId], session)) {
        const w = getTimingWarning(peptideId, session);
        if (w) {
          setGuardrail({ peptideId, compoundName: r.name, message: w });
          return;
        }
      }
    } else {
      skipGuardrailForPeptideIdRef.current = null;
    }

    setLoggingPeptideId(peptideId);
    const now = new Date().toISOString();
    let error = null;
    if (payload.kind === "injectable") {
      const res = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: payload.vial.id,
        peptide_id: peptideId,
        dose_mcg: payload.mcg,
        notes: null,
        dosed_at: now,
      });
      error = res.error;
    } else {
      const res = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: null,
        peptide_id: peptideId,
        dose_mcg: null,
        dose_count: payload.doseCount,
        dose_unit: payload.doseUnit,
        protocol_session: session,
        notes: null,
        dosed_at: now,
      });
      error = res.error;
    }
    setLoggingPeptideId(null);
    if (error) return;
    setLoggedTodayIds((prev) => new Set([...prev, peptideId]));
    setGuardrail(null);
    const cat = findCatalogPeptideForStackRow({ id: peptideId, name: r.name });
    showDoseToast(getDoseLogCelebrationMessage(cat, r.name));
    bumpReload();
  };

  const loggableLines = useMemo(() => (lines ?? []).filter((l) => l.display === "ok"), [lines]);

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
          marginBottom: 16,
          padding: 12,
          borderRadius: 8,
          border: "1px dashed #243040",
          background: "#07090e",
          opacity: 0.55,
          cursor: "pointer",
        }}
        title="Upgrade to Pro for stack quick log"
      >
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
          TODAY — QUICK LOG
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#4a6080" }}>Upgrade to Pro to log doses from your stack</div>
      </div>
    );
  }

  if (protocolRows.length === 0) return null;

  if (!isSupabaseConfigured()) return null;

  if (lines === null) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 16 }}>Loading protocol…</div>
    );
  }

  if (loggableLines.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 8 }}>
          // {protocolHeaderLine()}
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 8 }}>
          TODAY — QUICK LOG
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.45 }}>
          Nothing to quick-log yet — add active vials for injectables in the Vials tab, or add oral / nasal compounds to your stack.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 4 }}>
        // {protocolHeaderLine()}
      </div>
      <div className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 12 }}>
        TODAY — QUICK LOG
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {(lines ?? []).map((entry, idx) => {
          const last = idx === (lines ?? []).length - 1;
          if (entry.display === "missingVial") {
            return (
              <div
                key={entry.peptideId}
                style={{
                  paddingBottom: last ? 0 : 14,
                  borderBottom: last ? "none" : "1px solid #14202e",
                }}
              >
                <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "#dde4ef" }}>{entry.name}</div>
                <div className="mono" style={{ fontSize: 12, color: "#5c6d82", marginTop: 6, lineHeight: 1.45 }}>
                  Injectable — no active vial today. Add or reconstitute in the Vials tab.
                </div>
              </div>
            );
          }
          return (
            <QuickLineRow
              key={entry.row.peptideId}
              line={entry.row}
              isLast={last}
              session={session}
              loggedToday={loggedTodayIds.has(entry.row.peptideId)}
              busy={loggingPeptideId === entry.row.peptideId}
              onUnitsDelta={(delta) => updateInjectableUnits(entry.row.peptideId, entry.row.units + delta)}
              onDoseDelta={(delta) => updateNonInjectableCount(entry.row.peptideId, entry.row.doseCount + delta)}
              onLogDose={() => void logDoseForPeptide(entry.row.peptideId)}
            />
          );
        })}
      </div>
      {guardrail && (
        <div
          className="mono"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(245, 158, 11, 0.45)",
            background: "rgba(245, 158, 11, 0.06)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#fbbf24",
              lineHeight: 1.55,
              letterSpacing: "0.03em",
              whiteSpace: "pre-line",
              marginBottom: 10,
            }}
          >
            ⚠ {guardrail.compoundName ? `${guardrail.compoundName}: ` : ""}
            {guardrail.message}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, padding: "6px 12px" }}
              onClick={() => setGuardrail(null)}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, padding: "6px 12px", opacity: 0.92 }}
              onClick={() => {
                skipGuardrailForPeptideIdRef.current = guardrail.peptideId;
                setGuardrail(null);
                void logDoseForPeptide(guardrail.peptideId);
              }}
            >
              Log anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLineRow({
  line,
  isLast,
  session,
  loggedToday,
  busy,
  onUnitsDelta,
  onDoseDelta,
  onLogDose,
}) {
  if (line.kind === "nonInjectable") {
    return (
      <QuickNonInjectableRow
        line={line}
        isLast={isLast}
        session={session}
        loggedToday={loggedToday}
        busy={busy}
        onDoseDelta={onDoseDelta}
        onLogDose={onLogDose}
      />
    );
  }
  if (line.kind !== "injectable") return null;
  return (
    <QuickInjectableRow
      line={line}
      isLast={isLast}
      session={session}
      loggedToday={loggedToday}
      busy={busy}
      onUnitsDelta={onUnitsDelta}
      onLogDose={onLogDose}
    />
  );
}

function QuickNonInjectableRow({ line, isLast, session, loggedToday, busy, onDoseDelta, onLogDose }) {
  const timingWarning = getTimingWarning(line.peptideId, session);
  return (
    <div
      style={{
        paddingBottom: isLast ? 0 : 14,
        borderBottom: isLast ? "none" : "1px solid #14202e",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "#dde4ef" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "#8fa5bf" }}>
          {line.routeKind === "oral" ? "Oral" : line.routeKind === "intranasal" ? "Intranasal" : "Topical"}
        </div>
      </div>
      {timingWarning && (
        <div className="mono" style={{ fontSize: 12, color: "#fbbf24", marginTop: 4, lineHeight: 1.45 }}>
          ⚠ {timingWarning}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onDoseDelta(-1)}
          disabled={loggedToday || busy}
        >
          −
        </button>
        <div
          className="mono"
          style={{
            fontSize: 16,
            color: "#dde4ef",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid #14202e",
          }}
        >
          {line.doseCount}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onDoseDelta(1)}
          disabled={loggedToday || busy}
        >
          +
        </button>
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa" }}>{line.unitLabel}</div>
        <button
          type="button"
          className="btn-teal"
          disabled={loggedToday || busy}
          onClick={onLogDose}
          style={{
            marginLeft: "auto",
            fontSize: 13,
            padding: "8px 14px",
            minHeight: 44,
            fontWeight: 700,
            letterSpacing: ".04em",
            fontFamily: "'JetBrains Mono', monospace",
            ...(loggedToday
              ? { opacity: 0.45, cursor: "not-allowed", color: "#6b7c8f", borderColor: "#243040" }
              : {}),
          }}
        >
          {loggedToday ? "✓ Logged" : busy ? "…" : "✓ LOG DOSE"}
        </button>
      </div>
    </div>
  );
}

function QuickInjectableRow({ line, isLast, session, loggedToday, busy, onUnitsDelta, onLogDose }) {
  const vial = line.vials.find((v) => v.id === line.selectedVialId) ?? line.vials[0];
  const derivedMcg = useMemo(() => unitsToMcg(line.units, vial?.concentration_mcg_ml), [line.units, vial?.concentration_mcg_ml]);
  const timingWarning = getTimingWarning(line.peptideId, session);
  const canLog = derivedMcg != null && derivedMcg > 0 && vial;

  const vialIndex = line.vials.findIndex((v) => v.id === line.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  return (
    <div
      style={{
        paddingBottom: isLast ? 0 : 14,
        borderBottom: isLast ? "none" : "1px solid #14202e",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "#dde4ef" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "#8fa5bf", textAlign: "right", maxWidth: 260 }}>
          {vialTitle} · {formatConcLine(vial?.concentration_mcg_ml)}
          {line.vials.length > 1 ? " (active vial — Vials tab)" : ""}
        </div>
      </div>
      {timingWarning && (
        <div className="mono" style={{ fontSize: 12, color: "#fbbf24", marginTop: 4, lineHeight: 1.45 }}>
          ⚠ {timingWarning}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onUnitsDelta(-0.5)}
          disabled={loggedToday || busy}
        >
          −
        </button>
        <div
          className="mono"
          style={{
            fontSize: 16,
            color: "#dde4ef",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid #14202e",
          }}
        >
          {line.units}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onUnitsDelta(0.5)}
          disabled={loggedToday || busy}
        >
          +
        </button>
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa" }}>
          {derivedMcg != null
            ? `= ${derivedMcg.toLocaleString(undefined, { maximumFractionDigits: 1 })} mcg`
            : "— mcg"}
        </div>
        <button
          type="button"
          className="btn-teal"
          disabled={loggedToday || busy || !canLog}
          onClick={onLogDose}
          style={{
            marginLeft: "auto",
            fontSize: 13,
            padding: "8px 14px",
            minHeight: 44,
            fontWeight: 700,
            letterSpacing: ".04em",
            fontFamily: "'JetBrains Mono', monospace",
            ...(loggedToday
              ? { opacity: 0.45, cursor: "not-allowed", color: "#6b7c8f", borderColor: "#243040" }
              : {}),
          }}
        >
          {loggedToday ? "✓ Logged" : busy ? "…" : "✓ LOG DOSE"}
        </button>
      </div>
    </div>
  );
}
