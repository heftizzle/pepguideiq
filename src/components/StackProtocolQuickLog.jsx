import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCatalogPeptideForStackRow } from "../lib/resolveStackCatalogPeptide.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildProtocolDoseRow } from "../lib/protocolDoseRows.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";
import {
  formatConcWithUnit,
  formatDoseAmountFromMcg,
  formatProtocolInjectableDosePreview,
} from "../lib/doseLogDisplay.js";
import { resolveCatalogBlendBacRefMl } from "../lib/peptideMath.js";
import { roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import {
  getUserStackRowId,
  insertDoseLog,
  insertNetworkFeedDosePost,
  listLatestDosedAtByPeptideOnLocalDay,
  updateNetworkFeedPostPublicVisible,
} from "../lib/supabase.js";
import { lockMapFromLatestDosedAtIso } from "../lib/protocolLogCooldown.js";
import { PostDoseNetworkSheet } from "./PostDoseNetworkSheet.jsx";
import { buildDoseNetworkPreviewLine, buildNetworkFeedInsertRow } from "../lib/doseNetworkFeed.js";
import { inferProtocolSessionForNow } from "../lib/sessionSchedule.js";
import { useShowDoseToast } from "../context/DoseToastContext.jsx";
import {
  formatDoseMotivationToast,
  getConfirmationMessage,
  protocolSessionFromHour,
} from "../lib/protocolMessages.js";
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

function clampSprays(n) {
  return Math.max(1, Math.min(20, Math.round(Number(n) || 1)));
}

function clampDoseMl(ml) {
  return Math.max(0.1, Math.min(5.0, Math.round((Number(ml) || 0) * 10) / 10));
}

/**
 * Today's quick log on Stacks tab — same per-compound LOG DOSE pattern as Protocol (no vial management).
 * @param {{ userId: string, profileId: string, protocolRows: { peptideId: string, name: string }[], canUse: boolean, onUpgrade: () => void, userPlan?: string, wakeTime?: string | null, shiftSchedule?: string | null }} props
 */
export function StackProtocolQuickLog({
  userId,
  profileId,
  protocolRows,
  canUse,
  onUpgrade,
  userPlan = "entry",
  wakeTime = null,
  shiftSchedule = null,
}) {
  const { refreshMemberProfiles } = useActiveProfile();
  const session = useMemo(() => inferProtocolSessionForNow(wakeTime, shiftSchedule), [wakeTime, shiftSchedule]);

  const [lines, setLines] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [loggingPeptideId, setLoggingPeptideId] = useState(null);
  const [logLockUntilMs, setLogLockUntilMs] = useState(() => /** @type {Record<string, number>} */ ({}));
  const [cooldownTick, setCooldownTick] = useState(0);
  const [guardrail, setGuardrail] = useState(null);
  const [networkPrompt, setNetworkPrompt] = useState(
    /** @type {null | { networkFeedId: string; compoundName: string; previewLine: string; toastMessage: string }} */ (null)
  );
  const [networkPostBusy, setNetworkPostBusy] = useState(false);
  const [networkPostError, setNetworkPostError] = useState(/** @type {string | null} */ (null));
  const showDoseToast = useShowDoseToast();
  const showMotivationToast = useCallback(
    (raw, peptideId) => {
      showDoseToast(formatDoseMotivationToast(raw, { peptideId, session }));
    },
    [showDoseToast, session]
  );
  const skipGuardrailForPeptideIdRef = useRef(null);

  useEffect(() => {
    setGuardrail(null);
    skipGuardrailForPeptideIdRef.current = null;
  }, [session]);

  const load = useCallback(async () => {
    if (!userId || !profileId || !isSupabaseConfigured() || !canUse || protocolRows.length === 0) {
      setLines([]);
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

  useEffect(() => {
    return subscribeLocalCalendarDayChange(() => setReloadTick((t) => t + 1));
  }, []);

  useEffect(() => {
    const now = Date.now();
    const ends = Object.values(logLockUntilMs).filter((t) => t > now);
    if (ends.length === 0) return;
    const ms = Math.min(...ends) - now + 25;
    const id = window.setTimeout(() => setCooldownTick((x) => x + 1), ms);
    return () => window.clearTimeout(id);
  }, [logLockUntilMs, cooldownTick]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const isLogLocked = (peptideId) => (logLockUntilMs[peptideId] ?? 0) > Date.now();

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

  const updateRowSprays = (peptideId, next) => {
    const n = clampSprays(next);
    setLines((prev) =>
      (prev ?? []).map((entry) =>
        entry.display === "ok" && entry.row.peptideId === peptideId && entry.row.kind === "intranasal_spray"
          ? { ...entry, row: { ...entry.row, sprays: n } }
          : entry
      )
    );
  };

  const updateRowDoseMl = (peptideId, next) => {
    const ml = clampDoseMl(next);
    setLines((prev) =>
      (prev ?? []).map((entry) =>
        entry.display === "ok" && entry.row.peptideId === peptideId && entry.row.kind === "oral_vial"
          ? { ...entry, row: { ...entry.row, doseMl: ml } }
          : entry
      )
    );
  };

  const logDoseForPeptide = async (peptideId) => {
    const list = lines ?? [];
    const entry = list.find((e) => e.display === "ok" && e.row.peptideId === peptideId);
    if (!entry || loggingPeptideId != null) return;
    if (isLogLocked(peptideId)) return;

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
    } else if (r.kind === "intranasal_spray") {
      const vial = r.vials.find((v) => v.id === r.selectedVialId);
      const sprays = clampSprays(r.sprays || 1);
      const sprayVolumeMl = Number(vial?.spray_volume_ml) || 0.10;
      const conc = Number(vial?.concentration_mcg_ml) || 0;
      const mcg = Math.round(sprays * sprayVolumeMl * conc * 10) / 10;
      if (!vial || mcg <= 0) return;
      payload = { kind: "intranasal_spray", vial, sprays, sprayVolumeMl, mcg };
    } else if (r.kind === "oral_vial") {
      const vial = r.vials.find((v) => v.id === r.selectedVialId);
      const ml = clampDoseMl(r.doseMl ?? 0);
      const conc = Number(vial?.concentration_mcg_ml) || 0;
      const mcg = Math.round(ml * conc * 10) / 10;
      if (!vial || mcg <= 0) return;
      payload = { kind: "oral_vial", vial, doseMl: ml, mcg };
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

    const compoundIdForToast = r.peptideId;

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
    } else if (payload.kind === "intranasal_spray") {
      insertRes = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: payload.vial.id,
        peptide_id: peptideId,
        dose_mcg: payload.mcg,
        dose_count: payload.sprays,
        dose_unit: "sprays",
        notes: null,
        dosed_at: now,
      });
    } else if (payload.kind === "oral_vial") {
      insertRes = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: payload.vial.id,
        peptide_id: peptideId,
        dose_mcg: payload.mcg,
        dose_count: null,
        dose_unit: "mL",
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
    const cat = findCatalogPeptideForStackRow({ id: compoundIdForToast, name: r.name });
    const planKey = typeof userPlan === "string" ? userPlan.trim().toLowerCase() : "entry";
    const toastMessage = getConfirmationMessage(protocolSessionFromHour(), [compoundIdForToast], planKey);
    const doseLogId =
      inserted && typeof inserted.id === "string" && inserted.id.trim() ? inserted.id.trim() : "";
    if (!doseLogId) {
      showMotivationToast(toastMessage, peptideId);
      return;
    }
    try {
      const feedPayload =
        payload.kind === "intranasal_spray"
          ? { kind: "nonInjectable", doseCount: payload.sprays, doseUnit: "sprays" }
          : payload.kind === "oral_vial"
            ? { kind: "nonInjectable", doseCount: null, doseUnit: "mL" }
            : payload;
      const previewLine = buildDoseNetworkPreviewLine(r, feedPayload, cat);
      const { stackRowId } = await getUserStackRowId(userId, profileId);
      const insertRow = buildNetworkFeedInsertRow({
        userId,
        doseLogId,
        peptideId,
        payload: feedPayload,
        session,
        stackRowId: stackRowId ?? null,
        catalogPeptide: cat,
        feedVisible: false,
      });
      const { data: nf, error: nfErr } = await insertNetworkFeedDosePost(insertRow, false);
      if (nfErr || !nf?.id) {
        if (nfErr) console.error("[StackProtocolQuickLog] network_feed insert failed", nfErr);
        else console.error("[StackProtocolQuickLog] network_feed insert returned no id", nf);
        showMotivationToast(toastMessage, compoundIdForToast);
        return;
      }
      const networkFeedId = typeof nf.id === "string" ? nf.id.trim() : "";
      if (!networkFeedId) {
        console.error("[StackProtocolQuickLog] network_feed insert id empty", nf);
        showMotivationToast(toastMessage, compoundIdForToast);
        return;
      }
      setNetworkPostError(null);
      // Network "Post It" sheet is shown for every tier; do not gate on planKey.
      if (import.meta.env.DEV) console.log("[PostIt] networkFeedId set:", networkFeedId, "plan:", planKey);
      setNetworkPrompt({
        networkFeedId,
        compoundName: r.name,
        previewLine,
        toastMessage,
      });
      showMotivationToast(toastMessage, compoundIdForToast);
    } catch (err) {
      console.error("[StackProtocolQuickLog] network_feed section threw:", err);
      showMotivationToast(toastMessage, compoundIdForToast);
    }
  };

  const dismissNetworkPrompt = useCallback(() => {
    setNetworkPrompt(null);
    setNetworkPostError(null);
    setNetworkPostBusy(false);
  }, []);

  const confirmNetworkPost = useCallback(async () => {
    const id = networkPrompt?.networkFeedId?.trim();
    if (!id) return;
    setNetworkPostBusy(true);
    setNetworkPostError(null);
    const { error } = await updateNetworkFeedPostPublicVisible(id, true);
    setNetworkPostBusy(false);
    if (error) {
      console.error("[StackProtocolQuickLog] network_feed public_visible update failed", error);
      setNetworkPostError(typeof error.message === "string" ? error.message : "Could not post to Network");
      return;
    }
    setNetworkPrompt(null);
    setNetworkPostBusy(false);
  }, [networkPrompt]);

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
          border: "1px dashed var(--color-border-emphasis)",
          background: "var(--color-bg-page)",
          opacity: 0.55,
          cursor: "pointer",
        }}
        title="Upgrade to Pro for stack quick log"
      >
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: ".12em", marginBottom: 4 }}>
          TODAY — QUICK LOG
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Upgrade to Pro to log doses from your stack</div>
      </div>
    );
  }

  if (protocolRows.length === 0) return null;

  if (!isSupabaseConfigured()) return null;

  if (lines === null) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginBottom: 16 }}>Loading protocol…</div>
    );
  }

  if (loggableLines.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginBottom: 8 }}>
          {protocolHeaderLine()}
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: ".12em", marginBottom: 8 }}>
          TODAY — QUICK LOG
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
          Nothing to quick-log yet — add active vials for injectables in Vial Tracker, or add oral / nasal compounds to your stack.
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginBottom: 4 }}>
        {protocolHeaderLine()}
      </div>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: ".12em", marginBottom: 12 }}>
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
                  borderBottom: last ? "none" : "1px solid var(--color-border-default)",
                }}
              >
                <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{entry.name}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.45 }}>
                  Injectable — no active vial today. Add or reconstitute in Vial Tracker.
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
              loggedToday={isLogLocked(entry.row.peptideId)}
              busy={loggingPeptideId === entry.row.peptideId}
              onUnitsDelta={(delta) => updateInjectableUnits(entry.row.peptideId, entry.row.units + delta)}
              onDoseDelta={(delta) => updateNonInjectableCount(entry.row.peptideId, entry.row.doseCount + delta)}
              onSpraysDelta={(delta) => updateRowSprays(entry.row.peptideId, entry.row.sprays + delta)}
              onDoseMlDelta={(delta) => updateRowDoseMl(entry.row.peptideId, entry.row.doseMl + delta)}
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

function QuickLineRow({
  line,
  isLast,
  session,
  loggedToday,
  busy,
  onUnitsDelta,
  onDoseDelta,
  onSpraysDelta,
  onDoseMlDelta,
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
  if (line.kind === "intranasal_spray") {
    return (
      <QuickIntranasalSprayRow
        line={line}
        isLast={isLast}
        session={session}
        loggedToday={loggedToday}
        busy={busy}
        onSpraysDelta={onSpraysDelta}
        onLogDose={onLogDose}
      />
    );
  }
  if (line.kind === "oral_vial") {
    return (
      <QuickOralVialRow
        line={line}
        isLast={isLast}
        session={session}
        loggedToday={loggedToday}
        busy={busy}
        onDoseMlDelta={onDoseMlDelta}
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
        borderBottom: isLast ? "none" : "1px solid var(--color-border-default)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
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
            color: "var(--color-text-primary)",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid var(--color-border-default)",
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
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)" }}>{line.unitLabel}</div>
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

function QuickIntranasalSprayRow({ line, isLast, session, loggedToday, busy, onSpraysDelta, onLogDose }) {
  const vial = line.vials.find((v) => v.id === line.selectedVialId) ?? line.vials[0];
  const catalog = useMemo(
    () => findCatalogPeptideForStackRow({ id: line.peptideId, name: line.name }),
    [line.peptideId, line.name]
  );
  const sprays = line.sprays ?? 1;
  const sprayVol = Number(vial?.spray_volume_ml) || 0.10;
  const conc = Number(vial?.concentration_mcg_ml) || 0;
  const derivedMcg = useMemo(
    () => Math.round(sprays * sprayVol * conc * 10) / 10,
    [sprays, sprayVol, conc]
  );
  const mcgLbl = formatDoseAmountFromMcg(derivedMcg, catalog);
  const dosePreview = mcgLbl ? `${sprays} sprays · ${mcgLbl}` : `${sprays} sprays`;
  const timingWarning = getTimingWarning(line.peptideId, session);
  const canLog = derivedMcg > 0 && vial;
  const vialIndex = line.vials.findIndex((v) => v.id === line.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  return (
    <div
      style={{
        paddingBottom: isLast ? 0 : 14,
        borderBottom: isLast ? "none" : "1px solid var(--color-border-default)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right", maxWidth: 260 }}>
          {vialTitle} · {formatConcWithUnit(vial?.concentration_mcg_ml, catalog)}
          {line.vials.length > 1 ? " (active vial — Vial Tracker)" : ""}
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
          onClick={() => onSpraysDelta(-1)}
          disabled={loggedToday || busy || sprays <= 1}
        >
          −
        </button>
        <div
          className="mono"
          style={{
            fontSize: 16,
            color: "var(--color-text-primary)",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid var(--color-border-default)",
          }}
        >
          {sprays}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onSpraysDelta(1)}
          disabled={loggedToday || busy || sprays >= 20}
        >
          +
        </button>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)" }}>{dosePreview}</div>
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

function QuickOralVialRow({ line, isLast, session, loggedToday, busy, onDoseMlDelta, onLogDose }) {
  const vial = line.vials.find((v) => v.id === line.selectedVialId) ?? line.vials[0];
  const catalog = useMemo(
    () => findCatalogPeptideForStackRow({ id: line.peptideId, name: line.name }),
    [line.peptideId, line.name]
  );
  const doseMl = line.doseMl ?? 0.5;
  const conc = Number(vial?.concentration_mcg_ml) || 0;
  const derivedMcg = useMemo(() => Math.round(doseMl * conc * 10) / 10, [doseMl, conc]);
  const mcgLbl = formatDoseAmountFromMcg(derivedMcg, catalog);
  const dosePreview = mcgLbl ? `${doseMl} mL · ${mcgLbl}` : `${doseMl} mL`;
  const timingWarning = getTimingWarning(line.peptideId, session);
  const canLog = derivedMcg > 0 && vial;
  const vialIndex = line.vials.findIndex((v) => v.id === line.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  return (
    <div
      style={{
        paddingBottom: isLast ? 0 : 14,
        borderBottom: isLast ? "none" : "1px solid var(--color-border-default)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right", maxWidth: 260 }}>
          {vialTitle} · {formatConcWithUnit(vial?.concentration_mcg_ml, catalog)}
          {line.vials.length > 1 ? " (active vial — Vial Tracker)" : ""}
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
          onClick={() => onDoseMlDelta(-0.1)}
          disabled={loggedToday || busy || doseMl <= 0.1}
        >
          −
        </button>
        <div
          className="mono"
          style={{
            fontSize: 16,
            color: "var(--color-text-primary)",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid var(--color-border-default)",
          }}
        >
          {doseMl}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => onDoseMlDelta(0.1)}
          disabled={loggedToday || busy || doseMl >= 5.0}
        >
          +
        </button>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)" }}>{dosePreview}</div>
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

function QuickInjectableRow({ line, isLast, session, loggedToday, busy, onUnitsDelta, onLogDose }) {
  const vial = line.vials.find((v) => v.id === line.selectedVialId) ?? line.vials[0];
  const catalog = useMemo(
    () => findCatalogPeptideForStackRow({ id: line.peptideId, name: line.name }),
    [line.peptideId, line.name]
  );
  const blendComponents = catalog?.components;
  const catalogBacRefMl = useMemo(() => resolveCatalogBlendBacRefMl(catalog), [catalog]);
  const derivedMcg = useMemo(() => unitsToMcg(line.units, vial?.concentration_mcg_ml), [line.units, vial?.concentration_mcg_ml]);
  const dosePreview = useMemo(
    () => formatProtocolInjectableDosePreview(line.units, vial, blendComponents, catalogBacRefMl, catalog),
    [line.units, vial, blendComponents, catalogBacRefMl, catalog]
  );
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
        borderBottom: isLast ? "none" : "1px solid var(--color-border-default)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", textAlign: "right", maxWidth: 260 }}>
          {vialTitle} · {formatConcWithUnit(vial?.concentration_mcg_ml, catalog)}
          {line.vials.length > 1 ? " (active vial — Vial Tracker)" : ""}
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
            color: "var(--color-text-primary)",
            minWidth: 52,
            textAlign: "center",
            padding: "6px 0",
            borderBottom: "1px solid var(--color-border-default)",
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
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)" }}>{dosePreview}</div>
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
