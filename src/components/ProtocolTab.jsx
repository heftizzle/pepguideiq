import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCatalogPeptideForStackRow } from "../lib/resolveStackCatalogPeptide.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildProtocolDoseRow } from "../lib/protocolDoseRows.js";
import { formatConcWithUnit, formatProtocolInjectableDosePreview } from "../lib/doseLogDisplay.js";
import { resolveCatalogBlendBacRefMl } from "../lib/peptideMath.js";
import { roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import {
  getUserStackRowId,
  insertDoseLog,
  insertNetworkFeedDosePost,
  listLatestDosedAtByPeptideOnLocalDay,
} from "../lib/supabase.js";
import { lockMapFromLatestDosedAtIso } from "../lib/protocolLogCooldown.js";
import { PostDoseNetworkSheet } from "./PostDoseNetworkSheet.jsx";
import { buildDoseNetworkPreviewLine, buildNetworkFeedInsertRow } from "../lib/doseNetworkFeed.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";
import { isProtocolSessionId } from "../data/protocolSessions.js";
import { inferProtocolSessionForNow } from "../lib/sessionSchedule.js";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";
import { useShowDoseToast } from "../context/DoseToastContext.jsx";
import { getDoseLogCelebrationMessage } from "../lib/doseLogCelebration.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import {
  localTodayYmd,
  protocolLogCooldownEndsAtMs,
  subscribeLocalCalendarDayChange,
} from "../lib/localCalendarDay.js";

function protocolHeaderLine() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
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
 *   shiftSchedule?: string | null;
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
  shiftSchedule = null,
  onDeepLinkConsumed,
  onLoggedNavigateLibrary: _onLoggedNavigateLibrary,
  userPlan: _userPlan = "entry",
}) {
  const session = useMemo(
    () => (isProtocolSessionId(initialSession) ? initialSession : inferProtocolSessionForNow(wakeTime, shiftSchedule)),
    [initialSession, wakeTime, shiftSchedule]
  );

  const [rows, setRows] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [loggingPeptideId, setLoggingPeptideId] = useState(null);
  /** Interim: peptide_id → epoch ms when "✓ Logged" unlocks (2h or local midnight, whichever first). */
  const [logLockUntilMs, setLogLockUntilMs] = useState(() => /** @type {Record<string, number>} */ ({}));
  const [cooldownTick, setCooldownTick] = useState(0);
  const [guardrail, setGuardrail] = useState(null);
  const [networkPrompt, setNetworkPrompt] = useState(
    /** @type {null | { insertRow: Record<string, unknown>; feedVisible: boolean; compoundName: string; previewLine: string; toastMessage: string }} */ (null)
  );
  const [networkPostBusy, setNetworkPostBusy] = useState(false);
  const [networkPostError, setNetworkPostError] = useState(/** @type {string | null} */ (null));
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
      setLogLockUntilMs({});
      return;
    }
    const ymd = localTodayYmd();
    const { latestByPeptide, error: latestErr } = await listLatestDosedAtByPeptideOnLocalDay(
      userId,
      profileId,
      ymd
    );
    if (!latestErr) {
      setLogLockUntilMs(lockMapFromLatestDosedAtIso(latestByPeptide));
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

  useEffect(() => {
    return subscribeLocalCalendarDayChange(() => setReloadTick((t) => t + 1));
  }, []);

  useEffect(() => {
    const now = Date.now();
    const ends = Object.values(logLockUntilMs).filter((t) => t > now);
    if (ends.length === 0) return;
    const ms = Math.min(...ends) - now + 25;
    const id = window.setTimeout(() => setCooldownTick((x) => x + 1), Math.max(0, ms));
    return () => window.clearTimeout(id);
  }, [logLockUntilMs, cooldownTick]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const isLogLocked = (peptideId) => (logLockUntilMs[peptideId] ?? 0) > Date.now();

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
    if (isLogLocked(peptideId)) return;

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
    /** @type {{ data: { id?: string } | null; error: Error | null }} */
    let insertRes = { data: null, error: null };
    if (payload.kind === "injectable") {
      insertRes = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: payload.vial.id,
        peptide_id: peptideId,
        dose_mcg: payload.mcg,
        notes: null,
        dosed_at: now,
      });
    } else {
      insertRes = await insertDoseLog({
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
    }
    const { error, data: inserted } = insertRes;
    setLoggingPeptideId(null);
    if (error) return;
    const lockUntil = protocolLogCooldownEndsAtMs(Date.now());
    setLogLockUntilMs((prev) => ({ ...prev, [peptideId]: lockUntil }));
    setGuardrail(null);
    void refreshMemberProfiles();
    bumpReload();
    const cat = findCatalogPeptideForStackRow({ id: peptideId, name: r.name });
    const toastMessage = getDoseLogCelebrationMessage(cat, r.name);
    const doseLogId =
      inserted && typeof inserted.id === "string" && inserted.id.trim() ? inserted.id.trim() : "";
    if (!doseLogId) {
      showDoseToast(toastMessage);
      return;
    }
    const previewLine = buildDoseNetworkPreviewLine(r, payload, cat);
    const { stackRowId, feedVisible } = await getUserStackRowId(userId, profileId);
    const insertRow = buildNetworkFeedInsertRow({
      userId,
      doseLogId,
      peptideId,
      payload,
      session,
      stackRowId: stackRowId ?? null,
      catalogPeptide: cat,
      feedVisible,
    });
    setNetworkPostError(null);
    setNetworkPrompt({
      insertRow,
      feedVisible,
      compoundName: r.name,
      previewLine,
      toastMessage,
    });
  };

  const dismissNetworkPrompt = useCallback(() => {
    const msg = networkPrompt?.toastMessage;
    setNetworkPrompt(null);
    setNetworkPostError(null);
    setNetworkPostBusy(false);
    if (msg) showDoseToast(msg);
  }, [networkPrompt, showDoseToast]);

  const confirmNetworkPost = useCallback(async () => {
    if (!networkPrompt?.insertRow) return;
    setNetworkPostBusy(true);
    setNetworkPostError(null);
    const { error } = await insertNetworkFeedDosePost(networkPrompt.insertRow, networkPrompt.feedVisible);
    setNetworkPostBusy(false);
    if (error) {
      setNetworkPostError(typeof error.message === "string" ? error.message : "Could not post to Network");
      return;
    }
    const msg = networkPrompt.toastMessage;
    setNetworkPrompt(null);
    setNetworkPostBusy(false);
    showDoseToast(msg);
  }, [networkPrompt, showDoseToast]);

  const emptyBecauseNoStack = protocolBaseRows.length === 0;

  if (!canUse) {
    return (
      <div className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: ".12em", marginBottom: 12 }}>
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
            border: "1px dashed var(--color-border-emphasis)",
            background: "var(--color-bg-page)",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Upgrade to Pro to run protocol logging with vials.
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
        Configure Supabase to use Protocol.
      </div>
    );
  }

  return (
    <>
    <div className="mono" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 100, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginBottom: 24 }}>
        {protocolHeaderLine()}
      </div>

      {emptyBecauseNoStack && (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
          No stack saved — build your stack in Saved Stacks first.
        </div>
      )}

      {!emptyBecauseNoStack && rows === null && (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)" }}>Loading protocol…</div>
      )}

      {!emptyBecauseNoStack && rows !== null && rows.length === 0 && (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
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
                  loggedToday={isLogLocked(r.peptideId)}
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
                  loggedToday={isLogLocked(r.peptideId)}
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
    <PostDoseNetworkSheet
      open={networkPrompt != null}
      compoundName={networkPrompt?.compoundName ?? ""}
      previewLine={networkPrompt?.previewLine ?? ""}
      busy={networkPostBusy}
      postError={networkPostError}
      onPost={confirmNetworkPost}
      onKeepPrivate={dismissNetworkPrompt}
    />
    </>
  );
}

function ProtocolMissingVialRow({ name }) {
  return (
    <div style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: 18 }}>
      <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600, marginBottom: 6 }}>{name}</div>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
        Injectable — no active vial today. Add or reconstitute a vial in Vial Tracker.
      </div>
    </div>
  );
}

function ProtocolNonInjectableRow({ row, session, loggedToday, busy, onDoseDelta, onLogDose, demoLogDose = false }) {
  const timingWarning = getTimingWarning(row.peptideId, session);
  return (
    <div
      style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: 18 }}
      data-demo-target={demoLogDose ? DEMO_TARGET.protocol_log_dose : undefined}
      {...demoHighlightProps(demoLogDose)}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>{row.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
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
            color: "var(--color-text-primary)",
            minWidth: 56,
            textAlign: "center",
            padding: "8px 0",
            borderBottom: "1px solid var(--color-border-default)",
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
        <div style={{ fontSize: 13, color: "var(--color-accent)" }}>{row.unitLabel}</div>
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
              ? { opacity: 0.45, cursor: "not-allowed", color: "var(--color-text-secondary)", borderColor: "var(--color-border-emphasis)" }
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
  const catalogBacRefMl = useMemo(() => resolveCatalogBlendBacRefMl(catalog), [catalog]);
  const derivedMcg = useMemo(() => unitsToMcg(row.units, vial?.concentration_mcg_ml), [row.units, vial]);
  const dosePreview = useMemo(
    () => formatProtocolInjectableDosePreview(row.units, vial, blendComponents, catalogBacRefMl, catalog),
    [row.units, vial, blendComponents, catalogBacRefMl, catalog]
  );

  const vialIndex = row.vials.findIndex((v) => v.id === row.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  const timingWarning = getTimingWarning(row.peptideId, session);
  const canLog = derivedMcg != null && derivedMcg > 0 && vial;

  return (
    <div
      style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: 18 }}
      data-demo-target={demoLogDose ? DEMO_TARGET.protocol_log_dose : undefined}
      {...demoHighlightProps(demoLogDose)}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, color: "var(--color-text-primary)", fontWeight: 600 }}>
          {row.name}
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right", maxWidth: 280 }}>
          {vialTitle} · {formatConcWithUnit(vial?.concentration_mcg_ml, catalog)}
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
            color: "var(--color-text-primary)",
            minWidth: 56,
            textAlign: "center",
            padding: "8px 0",
            borderBottom: "1px solid var(--color-border-default)",
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
        <div style={{ fontSize: 13, color: "var(--color-accent)" }}>{dosePreview}</div>
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
              ? { opacity: 0.45, cursor: "not-allowed", color: "var(--color-text-secondary)", borderColor: "var(--color-border-emphasis)" }
              : {}),
          }}
        >
          {loggedToday ? "✓ Logged" : busy ? "…" : "✓ LOG DOSE"}
        </button>
      </div>
    </div>
  );
}
