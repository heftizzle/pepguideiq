import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { mcgToUnits, roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import { calculateStreak, getStreakMessage, getStreakResetMessage } from "../lib/streakUtils.js";
import { insertDoseLog, listRecentDosedAtDates, listRecentDosesForVial, listVialsForPeptide } from "../lib/supabase.js";
import { getConfirmationMessage } from "../lib/protocolMessages.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";

const SESSIONS = [
  { id: "morning", label: "🌞" },
  { id: "afternoon", label: "🌅" },
  { id: "evening", label: "🌇" },
  { id: "night", label: "🌙" },
];

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stripTimeLocal(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
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

function sessionFromLocalTime() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  if (h < 21) return "evening";
  return "night";
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

async function buildRowForPeptide(userId, profileId, peptideId, name, ymd) {
  const { vials } = await listVialsForPeptide(userId, profileId, peptideId);
  const active = (vials ?? []).filter((v) => vialActiveOnYmd(v, ymd));
  if (active.length === 0) return null;
  const pick =
    active.length === 1
      ? active[0]
      : (active.find((v) => v.desired_dose_mcg != null && Number(v.desired_dose_mcg) > 0) ?? active[0]);
  const { doses } = await listRecentDosesForVial(pick.id, userId, profileId, 5);
  const recentDoses = doses ?? [];
  const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
  const units =
    mcgToUnits(lastMcg, pick.concentration_mcg_ml) ??
    mcgToUnits(pick.desired_dose_mcg, pick.concentration_mcg_ml) ??
    10;
  return {
    peptideId,
    name,
    vials: active,
    selectedVialId: pick.id,
    units: clampUnits(units),
  };
}

/**
 * @param {{
 *   userId: string;
 *   profileId: string;
 *   protocolBaseRows: { peptideId: string; name: string; sessions: string[] }[];
 *   canUse: boolean;
 *   onUpgrade: () => void;
 *   initialSession: string | null;
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
  onDeepLinkConsumed,
  onLoggedNavigateLibrary,
  userPlan = "entry",
}) {
  const [session, setSession] = useState(() => initialSession ?? sessionFromLocalTime());
  const [rows, setRows] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [logging, setLogging] = useState(false);
  const [streak, setStreak] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [streakDisplay, setStreakDisplay] = useState({ streakLine: null, milestoneLine: null });
  const [protocolLogGuardrailBanner, setProtocolLogGuardrailBanner] = useState(null);
  const skipProtocolGuardrailOnceRef = useRef(false);
  const deepLinkConsumedRef = useRef(false);

  useEffect(() => {
    if (initialSession && !deepLinkConsumedRef.current) {
      deepLinkConsumedRef.current = true;
      onDeepLinkConsumed?.();
    }
  }, [initialSession, onDeepLinkConsumed]);

  useEffect(() => {
    if (!userId || !profileId) return;
    listRecentDosedAtDates(userId, profileId).then(({ dates }) => {
      setStreak(calculateStreak(dates));
    });
  }, [userId, profileId]);

  useEffect(() => {
    setProtocolLogGuardrailBanner(null);
    skipProtocolGuardrailOnceRef.current = false;
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
    const built = [];
    for (const row of protocolCandidates) {
      const r = await buildRowForPeptide(userId, profileId, row.peptideId, row.name, ymd);
      if (r) built.push(r);
    }
    setRows(built);
  }, [userId, profileId, canUse, protocolCandidates]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const updateRowUnits = (peptideId, units) => {
    setRows((prev) =>
      (prev ?? []).map((r) => (r.peptideId === peptideId ? { ...r, units: clampUnits(units) } : r))
    );
  };

  const onVialSelect = async (peptideId, vialId) => {
    const row = (rows ?? []).find((r) => r.peptideId === peptideId);
    const vial = row?.vials.find((v) => v.id === vialId);
    if (!vial || !userId || !profileId) return;
    const { doses } = await listRecentDosesForVial(vialId, userId, profileId, 5);
    const recentDoses = doses ?? [];
    const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
    const units =
      mcgToUnits(lastMcg, vial.concentration_mcg_ml) ??
      mcgToUnits(vial.desired_dose_mcg, vial.concentration_mcg_ml) ??
      10;
    setRows((prev) =>
      (prev ?? []).map((r) =>
        r.peptideId === peptideId ? { ...r, selectedVialId: vialId, units: clampUnits(units) } : r
      )
    );
  };

  const logAll = async () => {
    const list = rows ?? [];
    if (list.length === 0 || logging) return;

    if (!skipProtocolGuardrailOnceRef.current) {
      const toLogIds = [];
      for (const r of list) {
        const vial = r.vials.find((v) => v.id === r.selectedVialId);
        if (!vial) continue;
        const mcg = unitsToMcg(r.units, vial.concentration_mcg_ml);
        if (mcg == null || mcg <= 0) continue;
        toLogIds.push(r.peptideId);
      }
      if (toLogIds.length > 0 && hasAnyTimingConflict(toLogIds, session)) {
        const messages = [];
        for (const id of toLogIds) {
          const w = getTimingWarning(id, session);
          if (w) messages.push(w);
        }
        const unique = [...new Set(messages)];
        if (unique.length > 0) {
          setProtocolLogGuardrailBanner(unique.join("\n\n"));
          return;
        }
      }
    } else {
      skipProtocolGuardrailOnceRef.current = false;
    }

    setLogging(true);
    const now = new Date().toISOString();
    const errors = [];
    for (const r of list) {
      const vial = r.vials.find((v) => v.id === r.selectedVialId);
      if (!vial) continue;
      const mcg = unitsToMcg(r.units, vial.concentration_mcg_ml);
      if (mcg == null || mcg <= 0) continue;
      const { error } = await insertDoseLog({
        user_id: userId,
        profile_id: profileId,
        vial_id: vial.id,
        peptide_id: r.peptideId,
        dose_mcg: mcg,
        notes: null,
        dosed_at: now,
      });
      if (error) errors.push(error);
    }
    setLogging(false);
    if (errors.length > 0) return;
    const loggedCompoundIds = list.map((r) => r.peptideId);
    const { dates } = await listRecentDosedAtDates(userId, profileId);
    const newStreak = calculateStreak(dates);
    const wasZero = streak === 0;
    setStreak(newStreak);
    const { streakLine, milestoneLine } = getStreakMessage(newStreak);
    const isReset = wasZero && newStreak === 1;
    const confirmMsg = isReset
      ? getStreakResetMessage()
      : getConfirmationMessage(session, loggedCompoundIds, userPlan);
    setConfirmation(confirmMsg);
    setStreakDisplay({ streakLine, milestoneLine: isReset ? null : milestoneLine });
    bumpReload();
    window.setTimeout(() => {
      setConfirmation(null);
      setStreakDisplay({ streakLine: null, milestoneLine: null });
      onLoggedNavigateLibrary();
    }, 3500);
  };

  const sessionToggleStyle = (active) => ({
    minWidth: 48,
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 999,
    border: active ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
    background: active ? "rgba(0,212,170,0.1)" : "rgba(255,255,255,0.03)",
    color: active ? "#00d4aa" : "#4a6080",
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
  });

  const emptyBecauseNoStack = protocolBaseRows.length === 0;

  if (!canUse) {
    return (
      <div className="mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ fontSize: 13, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 12 }}>
          // PROTOCOL
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
            // Upgrade to Pro to run protocol logging with vials.
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace" }}>
        // Configure Supabase to use Protocol.
      </div>
    );
  }

  return (
    <div className="mono" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 100, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 16 }}>
        // {protocolHeaderLine()}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {SESSIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            style={sessionToggleStyle(session === s.id)}
            onClick={() => setSession(s.id)}
            aria-pressed={session === s.id}
            aria-label={s.id}
          >
            {s.label}
          </button>
        ))}
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
          No active vials for this session — add vials in Saved Stacks.
        </div>
      )}

      {!emptyBecauseNoStack && rows != null && rows.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {rows.map((r) => (
              <ProtocolCompoundRow
                key={r.peptideId}
                row={r}
                session={session}
                onUnitsDelta={(delta) => updateRowUnits(r.peptideId, r.units + delta)}
                onVialSelect={(vialId) => void onVialSelect(r.peptideId, vialId)}
              />
            ))}
          </div>
          {protocolLogGuardrailBanner && (
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
                ⚠ {protocolLogGuardrailBanner}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 13, padding: "6px 12px" }}
                  onClick={() => setProtocolLogGuardrailBanner(null)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 13, padding: "6px 12px", opacity: 0.92 }}
                  onClick={() => {
                    skipProtocolGuardrailOnceRef.current = true;
                    setProtocolLogGuardrailBanner(null);
                    void logAll();
                  }}
                >
                  Log anyway
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn-teal"
            disabled={logging}
            onClick={() => void logAll()}
            style={{
              width: "100%",
              minHeight: 56,
              marginTop: protocolLogGuardrailBanner ? 16 : 28,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ✓ LOG PROTOCOL
          </button>
        </>
      )}

      {confirmation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 8, 12, 0.96)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 32,
            gap: 16,
          }}
        >
          {streakDisplay.streakLine && (
            <div
              className="mono"
              style={{
                fontSize: 14,
                color: "#f59e0b",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              {streakDisplay.streakLine}
            </div>
          )}
          <div
            className="mono"
            style={{
              fontSize: 22,
              color: "#00d4aa",
              textAlign: "center",
              lineHeight: 1.6,
              maxWidth: 480,
              letterSpacing: "0.04em",
              whiteSpace: "pre-line",
            }}
          >
            {confirmation}
          </div>
          {streakDisplay.milestoneLine && (
            <div
              className="mono"
              style={{
                fontSize: 13,
                color: "#8fa5bf",
                textAlign: "center",
                maxWidth: 420,
                lineHeight: 1.6,
              }}
            >
              {streakDisplay.milestoneLine}
            </div>
          )}
          <div
            className="mono"
            style={{
              fontSize: 13,
              color: "#2e4055",
              marginTop: 16,
              letterSpacing: "0.1em",
            }}
          >
            PEPGUIDEIQ
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolCompoundRow({ row, session, onUnitsDelta, onVialSelect }) {
  const vial = row.vials.find((v) => v.id === row.selectedVialId) ?? row.vials[0];
  const derivedMcg = useMemo(() => unitsToMcg(row.units, vial?.concentration_mcg_ml), [row.units, vial]);

  const vialIndex = row.vials.findIndex((v) => v.id === row.selectedVialId);
  const labelNum = vialIndex >= 0 ? vialIndex + 1 : 1;
  const vialTitle =
    typeof vial?.label === "string" && vial.label.trim() !== "" ? vial.label.trim() : `Vial ${labelNum}`;

  const timingWarning = getTimingWarning(row.peptideId, session);

  return (
    <div style={{ borderBottom: "1px solid #14202e", paddingBottom: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 14, color: "#dde4ef", fontWeight: 600 }}>
          {row.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {row.vials.length > 1 ? (
            <select
              className="form-input"
              value={row.selectedVialId}
              onChange={(e) => onVialSelect(e.target.value)}
              style={{
                fontSize: 13,
                color: "#4a6080",
                maxWidth: 220,
                padding: "6px 8px",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {row.vials.map((v, i) => {
                const t =
                  typeof v.label === "string" && v.label.trim() !== "" ? v.label.trim() : `Vial ${i + 1}`;
                return (
                  <option key={v.id} value={v.id}>
                    {t} · {formatConcLine(v.concentration_mcg_ml)}
                  </option>
                );
              })}
            </select>
          ) : (
            <div style={{ fontSize: 13, color: "#4a6080" }}>
              {vialTitle} · {formatConcLine(vial?.concentration_mcg_ml)}
            </div>
          )}
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
        >
          +
        </button>
        <div style={{ fontSize: 13, color: "#00d4aa" }}>
          {derivedMcg != null
            ? `= ${derivedMcg.toLocaleString(undefined, { maximumFractionDigits: 1 })} mcg`
            : "— mcg"}
        </div>
      </div>
    </div>
  );
}
