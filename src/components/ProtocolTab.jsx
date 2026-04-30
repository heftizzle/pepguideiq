import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCatalogPeptideForStackRow } from "../lib/resolveStackCatalogPeptide.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildProtocolDoseRow } from "../lib/protocolDoseRows.js";
import {
  formatConcWithUnit,
  formatInjectableDoseHistoryAmount,
  formatProtocolInjectableDosePreview,
} from "../lib/doseLogDisplay.js";
import { resolveCatalogBlendBacRefMl } from "../lib/peptideMath.js";
import { roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import {
  deleteDoseLog,
  getUserStackRowId,
  insertDoseLog,
  insertNetworkFeedDosePost,
  listDoseLogsForPeptideIdsRange,
  listLatestDosedAtByPeptideOnLocalDay,
  updateDoseLog,
  updateNetworkFeedPostPublicVisible,
} from "../lib/supabase.js";
import { lockMapFromLatestDosedAtIso } from "../lib/protocolLogCooldown.js";
import { PostDoseNetworkSheet } from "./PostDoseNetworkSheet.jsx";
import { buildDoseNetworkPreviewLine, buildNetworkFeedInsertRow } from "../lib/doseNetworkFeed.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";
import { isProtocolSessionId } from "../data/protocolSessions.js";
import { inferProtocolSessionForNow } from "../lib/sessionSchedule.js";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";
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

/** Local calendar day bounds as ISO strings (same semantics as dose day queries). */
function localDayStartEndIso(ymd) {
  const [Y, Mo, D] = String(ymd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!Y || !Mo || !D) return { startIso: "", endIso: "" };
  const start = new Date(Y, Mo - 1, D, 0, 0, 0, 0);
  const end = new Date(Y, Mo - 1, D, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function formatDosedAtTime(iso) {
  if (typeof iso !== "string" || !iso.trim()) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
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
  userPlan = "entry",
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
    /** @type {null | { networkFeedId: string; compoundName: string; previewLine: string; toastMessage: string }} */ (null)
  );
  const [networkPostBusy, setNetworkPostBusy] = useState(false);
  const [networkPostError, setNetworkPostError] = useState(/** @type {string | null} */ (null));
  const [todayDosesByPeptide, setTodayDosesByPeptide] = useState(() => /** @type {Record<string, object[]>} */ ({}));
  const networkPromptRef = useRef(
    /** @type {null | { networkFeedId: string; compoundName: string; previewLine: string; toastMessage: string }} */ (null)
  );
  networkPromptRef.current = networkPrompt;
  const showDoseToast = useShowDoseToast();
  const showMotivationToast = useCallback(
    (raw, peptideId) => {
      showDoseToast(formatDoseMotivationToast(raw, { peptideId, session }));
    },
    [showDoseToast, session]
  );
  const skipGuardrailForPeptideIdRef = useRef(null);
  const deepLinkConsumedRef = useRef(false);
  const tutorial = useTutorialOptional();
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
      setTodayDosesByPeptide({});
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
    const { startIso, endIso } = localDayStartEndIso(ymd);
    const peptideIds = protocolCandidates.map((r) => r.peptideId).filter((id) => typeof id === "string" && id);
    /** @type {Record<string, object[]>} */
    const todayByPeptide = {};
    if (startIso && endIso && peptideIds.length > 0) {
      const { doses: todayDoses, error: dayErr } = await listDoseLogsForPeptideIdsRange(
        userId,
        profileId,
        peptideIds,
        startIso,
        endIso
      );
      if (!dayErr && Array.isArray(todayDoses)) {
        for (const d of todayDoses) {
          const pid = typeof d.peptide_id === "string" ? d.peptide_id : "";
          if (!pid) continue;
          if (!todayByPeptide[pid]) todayByPeptide[pid] = [];
          todayByPeptide[pid].push(d);
        }
        for (const pid of Object.keys(todayByPeptide)) {
          todayByPeptide[pid].sort((a, b) => String(b.dosed_at).localeCompare(String(a.dosed_at)));
        }
      }
    }
    setTodayDosesByPeptide(todayByPeptide);
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
    const cat = findCatalogPeptideForStackRow({ id: peptideId, name: r.name });
    const planKey = typeof userPlan === "string" ? userPlan.trim().toLowerCase() : "entry";
    const toastMessage = getConfirmationMessage(protocolSessionFromHour(), [peptideId], planKey);
    const doseLogId =
      inserted && typeof inserted.id === "string" && inserted.id.trim() ? inserted.id.trim() : "";
    if (!doseLogId) {
      bumpReload();
      showMotivationToast(toastMessage, compoundIdForToast);
      return;
    }
    const previewLine = buildDoseNetworkPreviewLine(r, payload, cat);
    const { stackRowId } = await getUserStackRowId(userId, profileId);
    const insertRow = buildNetworkFeedInsertRow({
      userId,
      doseLogId,
      peptideId,
      payload,
      session,
      stackRowId: stackRowId ?? null,
      catalogPeptide: cat,
      feedVisible: false,
    });
    const { data: nf, error: nfErr } = await insertNetworkFeedDosePost(insertRow, false);
    if (nfErr || !nf?.id) {
      if (nfErr) console.error("[ProtocolTab] network_feed insert failed", nfErr);
      else console.error("[ProtocolTab] network_feed insert returned no id", nf);
      bumpReload();
      showMotivationToast(toastMessage, compoundIdForToast);
      return;
    }
    const networkFeedId = typeof nf.id === "string" ? nf.id.trim() : "";
    if (!networkFeedId) {
      console.error("[ProtocolTab] network_feed insert id empty", nf);
      bumpReload();
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
    bumpReload();
  };

  const dismissNetworkPrompt = useCallback(() => {
    setNetworkPrompt(null);
    setNetworkPostError(null);
    setNetworkPostBusy(false);
  }, []);

  const confirmNetworkPost = useCallback(async () => {
    const prompt = networkPromptRef.current;
    const id = prompt?.networkFeedId?.trim();
    if (!id) return;
    setNetworkPostBusy(true);
    setNetworkPostError(null);
    const { error } = await updateNetworkFeedPostPublicVisible(id, true);
    setNetworkPostBusy(false);
    if (error) {
      console.error("[ProtocolTab] network_feed public_visible update failed", error);
      setNetworkPostError(typeof error.message === "string" ? error.message : "Could not post to Network");
      return;
    }
    setNetworkPrompt(null);
    setNetworkPostBusy(false);
  }, []);

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
                  tutorialLogDose={rowIdx === 0 && Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.protocol_log_dose))}
                  todayLogs={todayDosesByPeptide[r.peptideId] ?? []}
                  onDoseLogsChanged={bumpReload}
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
                  tutorialLogDose={rowIdx === 0 && Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.protocol_log_dose))}
                  todayLogs={todayDosesByPeptide[r.peptideId] ?? []}
                  onDoseLogsChanged={bumpReload}
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

/**
 * Today's dose log lines for one peptide (edit / delete).
 * @param {{
 *   logs: object[],
 *   rowKind: "injectable" | "nonInjectable",
 *   protocolRow: { peptideId: string, name: string, kind: string, vials?: object[], unitLabel?: string },
 *   onChanged: () => void,
 * }} props
 */
function ProtocolTodayDoseLogs({ logs, rowKind, protocolRow, onChanged }) {
  const [menuId, setMenuId] = useState(/** @type {string | null} */ (null));
  const rowMenuHostRef = useRef(/** @type {Record<string, HTMLElement | null>} */ ({}));
  const [editing, setEditing] = useState(
    /** @type {null | { id: string, doseMcg: string, doseCount: string, doseUnit: string, notes: string }} */ (null)
  );
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveErr, setSaveErr] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!menuId) return;
    const onDown = (e) => {
      const host = rowMenuHostRef.current[menuId];
      if (host && e.target instanceof Node && !host.contains(e.target)) setMenuId(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [menuId]);

  const catalog = useMemo(
    () => findCatalogPeptideForStackRow({ id: protocolRow.peptideId, name: protocolRow.name }),
    [protocolRow.peptideId, protocolRow.name]
  );
  const blendComponents = Array.isArray(catalog?.components) ? catalog.components : null;
  const catalogBacRefMl = useMemo(() => resolveCatalogBlendBacRefMl(catalog), [catalog]);

  if (!logs || logs.length === 0) return null;

  function logSummary(log) {
    if (rowKind === "injectable" && protocolRow.kind === "injectable") {
      const vid = typeof log.vial_id === "string" ? log.vial_id : "";
      const vial = protocolRow.vials?.find((x) => x.id === vid) ?? protocolRow.vials?.[0] ?? null;
      return formatInjectableDoseHistoryAmount(log.dose_mcg, vial, blendComponents, catalogBacRefMl, catalog);
    }
    const c = log.dose_count;
    const u = typeof log.dose_unit === "string" ? log.dose_unit : "";
    return `${c ?? "—"} ${u}`.trim();
  }

  async function handleDelete(log) {
    const id = typeof log.id === "string" ? log.id.trim() : "";
    if (!id) return;
    setMenuId(null);
    if (!window.confirm("Delete this log?")) return;
    const { error } = await deleteDoseLog(id);
    if (error) {
      window.alert(typeof error.message === "string" ? error.message : "Could not delete.");
      return;
    }
    onChanged();
  }

  function openEdit(log) {
    const id = typeof log.id === "string" ? log.id.trim() : "";
    if (!id) return;
    setMenuId(null);
    setSaveErr(null);
    const dm = log.dose_mcg != null ? Number(log.dose_mcg) : NaN;
    setEditing({
      id,
      doseMcg: Number.isFinite(dm) && dm > 0 ? String(Math.round(dm)) : "",
      doseCount: String(log.dose_count ?? 1),
      doseUnit:
        typeof log.dose_unit === "string" && log.dose_unit.trim()
          ? log.dose_unit.trim()
          : protocolRow.kind === "nonInjectable"
            ? String(protocolRow.unitLabel ?? "")
            : "",
      notes: typeof log.notes === "string" ? log.notes : "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaveErr(null);
    setSaveBusy(true);
    /** @type {Record<string, unknown>} */
    let patch = {};
    if (rowKind === "injectable") {
      const mcgN = parseFloat(String(editing.doseMcg).replace(/,/g, ""));
      if (!Number.isFinite(mcgN) || mcgN <= 0) {
        setSaveErr("Enter a valid dose (mcg).");
        setSaveBusy(false);
        return;
      }
      patch = { dose_mcg: mcgN, notes: editing.notes.trim() ? editing.notes.trim() : null };
    } else {
      const c = parseInt(String(editing.doseCount).replace(/\D/g, ""), 10);
      if (!Number.isFinite(c) || c < 1 || c > 99) {
        setSaveErr("Count must be 1–99.");
        setSaveBusy(false);
        return;
      }
      const u = editing.doseUnit.trim();
      if (!u) {
        setSaveErr("Unit label required.");
        setSaveBusy(false);
        return;
      }
      patch = { dose_count: c, dose_unit: u, notes: editing.notes.trim() ? editing.notes.trim() : null };
    }
    const { error } = await updateDoseLog(editing.id, patch);
    setSaveBusy(false);
    if (error) {
      setSaveErr(typeof error.message === "string" ? error.message : "Could not save.");
      return;
    }
    setEditing(null);
    onChanged();
  }

  return (
    <>
      <div
        className="mono"
        style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.08em", marginTop: 14, marginBottom: 6 }}
      >
        {"TODAY'S LOGS"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {logs.map((log, idx) => {
          const id = typeof log.id === "string" ? log.id : "";
          if (!id) return null;
          const open = menuId === id;
          return (
            <div
              key={id}
              ref={(el) => {
                rowMenuHostRef.current[id] = el;
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderTop: idx > 0 ? "1px solid var(--color-border-hairline)" : "none",
                fontSize: 13,
              }}
            >
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <div style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{formatDosedAtTime(log.dosed_at)}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
                  {logSummary(log)}
                  {log.notes ? ` · ${String(log.notes)}` : ""}
                </div>
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  type="button"
                  className="form-input"
                  aria-expanded={open}
                  aria-haspopup="menu"
                  aria-label="Log actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(open ? null : id);
                  }}
                  style={{
                    minWidth: 36,
                    minHeight: 36,
                    padding: 0,
                    fontSize: 18,
                    lineHeight: 1,
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  ⋯
                </button>
                {open ? (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 4px)",
                      zIndex: 8,
                      minWidth: 120,
                      borderRadius: 10,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-elevated)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                      padding: 4,
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="form-input"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        padding: "8px 10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => openEdit(log)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="form-input"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        padding: "8px 10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#f87171",
                      }}
                      onClick={() => void handleDelete(log)}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {editing ? (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 210,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
          onClick={() => !saveBusy && setEditing(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="mono"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 400,
              borderRadius: 12,
              border: "1px solid var(--color-border-default)",
              background: "var(--color-bg-card)",
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>Edit dose log</div>
            {rowKind === "injectable" ? (
              <>
                <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
                  Dose (mcg)
                </span>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 10, boxSizing: "border-box" }}
                  value={editing.doseMcg}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, doseMcg: e.target.value } : prev))}
                  inputMode="decimal"
                />
              </>
            ) : (
              <>
                <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
                  Count
                </span>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8, boxSizing: "border-box" }}
                  value={editing.doseCount}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, doseCount: e.target.value } : prev))}
                  inputMode="numeric"
                />
                <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
                  Unit
                </span>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 10, boxSizing: "border-box" }}
                  value={editing.doseUnit}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, doseUnit: e.target.value } : prev))}
                />
              </>
            )}
            <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>
              Notes (optional)
            </span>
            <input
              className="form-input"
              style={{ width: "100%", marginBottom: 10, boxSizing: "border-box" }}
              value={editing.notes}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
            />
            {saveErr ? <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{saveErr}</div> : null}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" className="form-input" disabled={saveBusy} onClick={() => setEditing(null)} style={{ fontSize: 13 }}>
                Cancel
              </button>
              <button type="button" className="btn-teal" disabled={saveBusy} onClick={() => void saveEdit()} style={{ fontSize: 13 }}>
                {saveBusy ? "…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function ProtocolNonInjectableRow({
  row,
  session,
  loggedToday,
  busy,
  onDoseDelta,
  onLogDose,
  tutorialLogDose = false,
  todayLogs = [],
  onDoseLogsChanged = () => {},
}) {
  const timingWarning = getTimingWarning(row.peptideId, session);
  return (
    <div
      style={{ borderBottom: "1px solid var(--color-border-default)", paddingBottom: 18 }}
      data-tutorial-target={tutorialLogDose ? TUTORIAL_TARGET.protocol_log_dose : undefined}
      {...tutorialHighlightProps(tutorialLogDose)}
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
      <ProtocolTodayDoseLogs logs={todayLogs} rowKind="nonInjectable" protocolRow={row} onChanged={onDoseLogsChanged} />
    </div>
  );
}

function ProtocolInjectableRow({
  row,
  session,
  loggedToday,
  busy,
  onUnitsDelta,
  onLogDose,
  tutorialLogDose = false,
  todayLogs = [],
  onDoseLogsChanged = () => {},
}) {
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
      data-tutorial-target={tutorialLogDose ? TUTORIAL_TARGET.protocol_log_dose : undefined}
      {...tutorialHighlightProps(tutorialLogDose)}
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
      <ProtocolTodayDoseLogs logs={todayLogs} rowKind="injectable" protocolRow={row} onChanged={onDoseLogsChanged} />
    </div>
  );
}
