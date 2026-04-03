import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { mcgToUnits, roundToHalf, unitsToMcg } from "../lib/vialDoseMath.js";
import { calculateStreak, getStreakMessage, getStreakResetMessage } from "../lib/streakUtils.js";
import { insertDoseLog, listRecentDosedAtDates, listRecentDosesForVial, listVialsForPeptide } from "../lib/supabase.js";
import { getConfirmationMessage } from "../lib/protocolMessages.js";

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

function formatConcLine(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toLocaleString(undefined, { maximumFractionDigits: 0 })} mcg/mL`;
}

function protocolHeaderDate() {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();
}

function sessionFromLocalTime() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "night";
}

/**
 * Saved-stack “morning protocol” quick log: one row per compound with an active vial today.
 * @param {{ userId: string, protocolRows: { peptideId: string, name: string }[], canUse: boolean, onUpgrade: () => void, userPlan?: string }} props
 */
export function StackProtocolQuickLog({ userId, protocolRows, canUse, onUpgrade, userPlan = "entry" }) {
  const [lines, setLines] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [streakDisplay, setStreakDisplay] = useState({ streakLine: null, milestoneLine: null });

  const load = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !canUse || protocolRows.length === 0) {
      setLines([]);
      return;
    }
    const ymd = todayYmd();
    const built = [];
    for (const row of protocolRows) {
      const { vials } = await listVialsForPeptide(userId, row.peptideId);
      const q = (vials ?? []).filter((v) => vialActiveOnYmd(v, ymd));
      if (q.length === 0) continue;
      const pick =
        q.length === 1
          ? q[0]
          : (q.find((v) => v.desired_dose_mcg != null && Number(v.desired_dose_mcg) > 0) ?? q[0]);
      const { doses } = await listRecentDosesForVial(pick.id, userId, 5);
      const recentDoses = doses ?? [];
      const lastMcg = recentDoses.length > 0 ? recentDoses[0].dose_mcg : null;
      const units =
        mcgToUnits(lastMcg, pick.concentration_mcg_ml) ??
        mcgToUnits(pick.desired_dose_mcg, pick.concentration_mcg_ml) ??
        10;
      built.push({
        peptideId: row.peptideId,
        name: row.name,
        vial: pick,
        units: Math.max(0.5, Math.min(300, units)),
      });
    }
    setLines(built);
  }, [userId, canUse, protocolRows]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  useEffect(() => {
    if (!userId) return;
    listRecentDosedAtDates(userId).then(({ dates }) => {
      setStreak(calculateStreak(dates));
    });
  }, [userId]);

  const bumpReload = () => setReloadTick((t) => t + 1);

  const onRowLoggedSuccess = useCallback(
    async (peptideId) => {
      setReloadTick((t) => t + 1);
      const { dates } = await listRecentDosedAtDates(userId);
      const newStreak = calculateStreak(dates);
      const wasZero = streak === 0;
      setStreak(newStreak);
      const { streakLine, milestoneLine } = getStreakMessage(newStreak);
      const isReset = wasZero && newStreak === 1;
      const confirmMsg = isReset
        ? getStreakResetMessage()
        : getConfirmationMessage(sessionFromLocalTime(), [peptideId], userPlan);
      setConfirmation(confirmMsg);
      setStreakDisplay({ streakLine, milestoneLine: isReset ? null : milestoneLine });
      window.setTimeout(() => {
        setConfirmation(null);
        setStreakDisplay({ streakLine: null, milestoneLine: null });
      }, 3500);
    },
    [streak, userPlan, userId]
  );

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
        title="Upgrade to Pro for vial quick log"
      >
        <div className="mono" style={{ fontSize: 11, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 4 }}>
          MORNING PROTOCOL
        </div>
        <div className="mono" style={{ fontSize: 11, color: "#4a6080" }}>Upgrade to Pro to log doses from your stack</div>
      </div>
    );
  }

  if (protocolRows.length === 0) return null;

  if (!isSupabaseConfigured()) return null;

  if (lines === null) {
    return (
      <div className="mono" style={{ fontSize: 10, color: "#a0a0b0", marginBottom: 16 }}>Loading protocol…</div>
    );
  }

  if (lines.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 11, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 8 }}>
          {protocolHeaderDate()} — MORNING PROTOCOL
        </div>
        <div className="mono" style={{ fontSize: 10, color: "#4a6080", lineHeight: 1.45 }}>
          No active vials today — add vials below or check reconstitution dates.
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, color: "#00d4aa", letterSpacing: ".12em", marginBottom: 12 }}>
          {protocolHeaderDate()} — MORNING PROTOCOL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map((line, idx) => (
            <ProtocolLineRow
              key={line.peptideId}
              line={line}
              isLast={idx === lines.length - 1}
              userId={userId}
              onLoggedSuccess={onRowLoggedSuccess}
            />
          ))}
        </div>
      </div>
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
              fontSize: 10,
              color: "#2e4055",
              marginTop: 16,
              letterSpacing: "0.1em",
            }}
          >
            PEPGUIDEIQ
          </div>
        </div>
      )}
    </>
  );
}

function ProtocolLineRow({ line, isLast, userId, onLoggedSuccess }) {
  const [units, setUnits] = useState(line.units);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    setUnits(line.units);
  }, [line.peptideId, line.units]);

  const derivedMcg = useMemo(() => unitsToMcg(units, line.vial.concentration_mcg_ml), [units, line.vial.concentration_mcg_ml]);

  async function logDose() {
    if (!derivedMcg || derivedMcg <= 0) return;
    setLogging(true);
    const { error } = await insertDoseLog({
      user_id: userId,
      vial_id: line.vial.id,
      peptide_id: line.peptideId,
      dose_mcg: derivedMcg,
      notes: null,
      dosed_at: new Date().toISOString(),
    });
    setLogging(false);
    if (!error) void onLoggedSuccess(line.peptideId);
  }

  return (
    <div
      style={{
        paddingBottom: isLast ? 0 : 14,
        borderBottom: isLast ? "none" : "1px solid #14202e",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "#dde4ef" }}>{line.name}</div>
        <div className="mono" style={{ fontSize: 10, color: "#8fa5bf" }}>
          {line.vial.label ?? "Vial"} · {formatConcLine(line.vial.concentration_mcg_ml)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => setUnits((u) => Math.max(0.5, roundToHalf(u - 0.5)))}
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
          {units}
        </div>
        <button
          type="button"
          className="btn-teal"
          style={{ fontSize: 16, padding: "0px 12px", minHeight: 36, minWidth: 36, lineHeight: 1 }}
          onClick={() => setUnits((u) => Math.min(300, roundToHalf(u + 0.5)))}
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
          style={{ fontSize: 11, padding: "6px 14px", fontWeight: 600 }}
          disabled={logging || derivedMcg == null || derivedMcg <= 0}
          onClick={() => void logDose()}
        >
          ✓ LOG
        </button>
      </div>
    </div>
  );
}
