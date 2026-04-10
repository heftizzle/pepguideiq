import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCatalogPeptideForStackRow } from "../lib/resolveStackCatalogPeptide.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildProtocolDoseRow } from "../lib/protocolDoseRows.js";
import { formatProtocolInjectableDosePreview } from "../lib/doseLogDisplay.js";
import { roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import { insertDoseLog, listPeptideIdsWithDosesOnLocalDay } from "../lib/supabase.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";
import { isProtocolSessionId } from "../data/protocolSessions.js";
import { inferProtocolSessionForNow } from "../lib/sessionSchedule.js";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";
import { useShowDoseToast } from "../context/DoseToastContext.jsx";
import { getDoseLogCelebrationMessage } from "../lib/doseLogCelebration.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";

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
 * @param {{
 *   userId: string;
 *   profileId: string;
 *   protocolBaseRows: { peptideId: string; name: string; sessions: string[] }[];
 *   canUse: boolean;
 *   onUpgrade: () => void;
 *   initialSession: string | null;
 *   wakeTime?: string | null;
 *   onDeepLinkConsumed: () => void;
 *   onLoggedNavigateLibrary: () => void;
 *   userPlan?: string;
 * }} props
 */
export function ProtocolTab({
  userId,
  profileId,
  protocolBaseRows,
  canUse,
  onUpgrade,
  initialSession,
  wakeTime = null,
  onDeepLinkConsumed,
  onLoggedNavigateLibrary: _onLoggedNavigateLibrary,
  userPlan: _userPlan = "entry",
}) {
  const session = useMemo(
    () => (isProtocolSessionId(initialSession) ? initialSession : inferProtocolSessionForNow(wakeTime)),
    [initialSession, wakeTime]
  );

  const [rows, setRows] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [loggingPeptideId, setLoggingPeptideId] = useState(null);
  const [loggedTodayIds, setLoggedTodayIds] = useState(() => new Set());
  const [guardrail, setGuardrail] = useState(null);
  const showDoseToast = useShowDoseToast();
  const skipGuardrailForPeptideIdRef = useRef(null);
  const deepLinkConsumedRef = useRef(false);
  const demo = useDemoTourOptional();
  const { refreshMemberProfiles } = useActiveProfile();

  useEffect(() => {
    if (initialSession && !deepLinkConsumedRef.current) {
      deepLinkConsumedRef.current = true;
      onDeepLinkConsumed?.();
    }
  }, [initialSession, onDeepLinkConsumed]);

  useEffect(() => {
    setGuardrail(null);
    skipGuardrailForPeptideIdRef.current = null;
  }, [session]);

  const protocolCandidates = useMemo(
    () => protocolBaseRows.filter((r) => Array.isArray(r.sessions) && r.sessions.includes(session)),
    [protocolBaseRows, session]
  );

  const load = useCallback(async () => {
    if (!userId || !profileId || !isSupabaseConfigured() || !canUse || protocolCandidates.length === 0) {
      setRows([]);
      return;
    }
    const ymd = todayYmd();
    const { peptideIds, error: idsError } = await listPeptideIdsWithDosesOnLocalDay(userId, profileId, ymd);
    if (!idsError && peptideIds) {
      setLoggedTodayIds(new Set(peptideIds));
    }
    const built = [];
    for (const row of protocolCandidates) {
      const peptide = findCatalogPeptideForStackRow({ id: row.peptideId, name: row.name });
      built.push(await buildProtocolDoseRow(userId, profileId, row.peptideId, row.name, peptide, ymd));
    }
    setRows(built);
  }, [userId, profileId, canUse, protocolCandidates]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const updateRowUnits = (peptideId, units) => {
    setRows((prev) =>
      (prev ?? []).map((r) =>
        r.peptideId === peptideId && r.kind === "injectable" ? { ...r, units: clampUnits(units) } : r
      )
    );
  };

  const updateRowDoseCount = (peptideId, next) => {
    const n = Math.max(1, Math.min(99, Math.round(Number(next) || 1)));
    setRows((prev) =>
      (prev ?? []).map((r) =>
        r.peptideId === peptideId && r.kind === "nonInjectable" ? { ...r, doseCount: n } : r
      )
    );
  };

  const logDoseForPeptide = async (peptideId) => {
    const list = rows ?? [];
    const r = list.find((x) => x.peptideId === peptideId);
    if (!r || loggingPeptideId != null) return;
    if (loggedTodayIds.has(peptideId)) return;

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
    void refreshMemberProfiles();
    const cat = findCatalogPeptideForStackRow({ id: peptideId, name: r.name });
    showDoseToast(getDoseLogCelebrationMessage(cat, r.name));
    bumpReload();
  };

  const emptyBecauseNoStack = protocolBaseRows.length === 0;

  if (!canUse) {
    return (
      <div className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 13, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 12 }}>
          PROTOCOL
        </div>
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
            padding: 20,
            borderRadius: 10,
            border: "1px dashed #243040",
            background: "#07090e",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.5 }}>
            Upgrade to Pro to run protocol logging with vials.
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace" }}>
        Configure Supabase to use Protocol.
      </div>
    );
  }

  return (
    <div className="mono" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 100, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 24 }}>
        {protocolHeaderLine()}
      </div>

      {emptyBecauseNoStack && (
        <div className="mono" style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.55 }}>
          No stack saved — build your stack in Saved Stacks first.
        </div>
      )}

      {!emptyBecauseNoStack && rows === null && (
        <div className="mono" style={{ fontSize: 13, color: "#a0a0b0" }}>Loading protocol…</div>
      )}

      {!emptyBecauseNoStack && rows !== null && rows.length === 0 && (
        <div className="mono" style={{ fontSize: 13, color: "#4a6080", lineHeight: 1.55 }}>
          No compounds in this session — edit Saved Stacks to assign morning / afternoon / evening / night.
        </div>
      )}

      {!emptyBecauseNoStack && rows != null && rows.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {rows.map((r, rowIdx) =>
              r.kind === "injectable" ? (
                <ProtocolInjectableRow
                  key={r.peptideId}
                  row={r}
                  session={session}
                  loggedToday={loggedTodayIds.has(r.peptideId)}
                  busy={loggingPeptideId === r.peptideId}
                  onUnitsDelta={(delta) => updateRowUnits(r.peptideId, r.units + delta)}
                  onLogDose={() => void logDoseForPeptide(r.peptideId)}
                  demoLogDose={rowIdx === 0 && Boolean(demo?.isHighlighted(DEMO_TARGET.protocol_log_dose))}
                />
              ) : r.kind === "nonInjectable" ? (
                <ProtocolNonInjectableRow
                  key={r.peptideId}
                  row={r}
                  session={session}
                  loggedToday={loggedTodayIds.has(r.peptideId)}
                  busy={loggingPeptideId === r.peptideId}
                  onDoseDelta={(delta) => updateRowDoseCount(r.peptideId, r.doseCount + delta)}
                  onLogDose={() => void logDoseForPeptide(r.peptideId)}
                  demoLogDose={rowIdx === 0 && Boolean(demo?.isHighlighted(DEMO_TARGET.protocol_log_dose))}
                />
              ) : (
                <ProtocolMissingVialRow key={r.peptideId} name={r.name} />
              )
            )}
          </div>
          {guardrail && (
            <div
              className="mono"
              style={{
                marginTop: 20,
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
        </>
      )}
    </div>
  );
}

function ProtocolMissingVialRow({ name }) {
  return (
    <div style={{ borderBottom: "1px solid #14202e", paddingBottom: 18 }}>
      <div style={{ fontSize: 14, color: "#dde4ef", fontWeight: 600, marginBottom: 6 }}>{name}</div>
      <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", lineHeight: 1.5 }}>
        Injectable — no active vial today. Add or reconstitute a vial in Vial Tracker.
      </div>
    </div>
  );
}

function ProtocolNonInjectableRow({ row, session, loggedToday, busy, onDoseDelta, onLogDose, demoLogDose = false }) {
  const timingWarning = getTimingWarning(row.peptideId, session);
  return (
    <div
      style={{ borderBottom: "1px solid #14202e", paddingBottom: 18 }}
      data-demo-target={demoLogDose ? DEMO_TARGET.protocol_log_dose : undefined}
      {...demoHighlightProps(demoLogDose)}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, color: "#dde4ef", fontWeight: 600 }}>{row.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "#4a6080" }}>
          {row.routeKind === "oral" ? "Oral" : row.routeKind === "intranasal" ? "Intranasal" : "Topical"}
        </div>
      </div>
      {timingWarning && (
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "#fbbf24",
            marginTop: 4,
            marginBottom: 4,
            lineHeight: 1.5,
            letterSpacing: "0.04em",
          }}
        >
          ⚠ {timingWarning}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 18, minWidth: 48, minHeight: 48, padding: 0, lineHeight: 1 }}
          onClick={() => onDoseDelta(-1)}
          disabled={loggedToday || busy}
        >
          −
        </button>
        <div
          style={{
            fontSize: 16,
            color: "#dde4ef",
            minWidth: 56,
            textAlign: "center",
            padding: "8px 0",
            borderBottom: "1px solid #14202e",
          }}
        >
          {row.doseCount}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 18, minWidth: 48, minHeight: 48, padding: 0, lineHeight: 1 }}
          onClick={() => onDoseDelta(1)}
          disabled={loggedToday || busy}
        >
          +
        </button>
        <div style={{ fontSize: 13, color: "#00d4aa" }}>{row.unitLabel}</div>
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

function ProtocolInjectableRow({ row, session, loggedToday, busy, onUnitsDelta, onLogDose, demoLogDose = false }) {
  const vial = row.vials.find((v) => v.id === row.selectedVialId) ?? row.vials[0];
  const catalog = useMemo(
    () => findCatalogPeptideForStackRow({ id: row.peptideId, name: row.name }),
    [row.peptideId, row.name]
  );
  const blendComponents = catalog?.components;
  const derivedMcg = useMemo(() => unitsToMcg(row.units, vial?.concentration_mcg_ml), [row.units, vial]);
  const dosePreview = useMemo(
    () => formatProtocolInjectableDosePreview(row.units, vial, blendComponents),
    [row.units, vial, blendComponents]
  );

  const vialIndex = row.vials.findIndex((v) => v.id === row.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  const timingWarning = getTimingWarning(row.peptideId, session);
  const canLog = derivedMcg != null && derivedMcg > 0 && vial;

  return (
    <div
      style={{ borderBottom: "1px solid #14202e", paddingBottom: 18 }}
      data-demo-target={demoLogDose ? DEMO_TARGET.protocol_log_dose : undefined}
      {...demoHighlightProps(demoLogDose)}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, color: "#dde4ef", fontWeight: 600 }}>
          {row.name}
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#4a6080", textAlign: "right", maxWidth: 280 }}>
          {vialTitle} · {formatConcLine(vial?.concentration_mcg_ml)}
          {row.vials.length > 1 ? " (active vial — change in Vial Tracker)" : ""}
        </div>
      </div>
      {timingWarning && (
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "#fbbf24",
            marginTop: 4,
            marginBottom: 4,
            lineHeight: 1.5,
            letterSpacing: "0.04em",
          }}
        >
          ⚠ {timingWarning}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 18, minWidth: 48, minHeight: 48, padding: 0, lineHeight: 1 }}
          onClick={() => onUnitsDelta(-0.5)}
          disabled={loggedToday || busy}
        >
          −
        </button>
        <div
          style={{
            fontSize: 16,
            color: "#dde4ef",
            minWidth: 56,
            textAlign: "center",
            padding: "8px 0",
            borderBottom: "1px solid #14202e",
          }}
        >
          {row.units}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 18, minWidth: 48, minHeight: 48, padding: 0, lineHeight: 1 }}
          onClick={() => onUnitsDelta(0.5)}
          disabled={loggedToday || busy}
        >
          +
        </button>
        <div style={{ fontSize: 13, color: "#00d4aa" }}>{dosePreview}</div>
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
