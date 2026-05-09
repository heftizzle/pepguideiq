import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { supabase } from "../lib/supabase.js";
import { FAST_TYPES, fastTypeLabel } from "../data/fastTypes.js";
import {
  computeFastProgressState,
  endMemberFast,
  fetchMemberFastsForProfile,
  formatCompletedFastDuration,
  formatElapsedDuration,
  formatTargetSummary,
  insertMemberFast,
  targetHoursFromAmountAndUnit,
  updateMemberFast,
} from "../lib/memberFasts.js";

const CARD = {
  background: "var(--color-bg-sunken)",
  border: "1px solid var(--color-border-tab)",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
};

function datetimeLocalValue(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {{
 *   userId: string,
 *   activeProfileId: string | null,
 *   setErr: (msg: string | null) => void,
 *   showSavedBriefly?: () => void,
 * }} props
 */
export function FastingTrackerSection({ userId, activeProfileId, setErr, showSavedBriefly }) {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [history, setHistory] = useState(/** @type {Record<string, unknown>[]} */ ([]));
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const [formType, setFormType] = useState(FAST_TYPES[0].id);
  const [formStarted, setFormStarted] = useState(() => datetimeLocalValue());
  const [formAmount, setFormAmount] = useState("16");
  const [formUnit, setFormUnit] = useState(/** @type {"hours"|"days"} */ ("hours"));
  const [draftStartNotes, setDraftStartNotes] = useState("");
  const [draftActiveNotes, setDraftActiveNotes] = useState("");
  const [formPublic, setFormPublic] = useState(false);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !userId || !activeProfileId) {
      setActive(null);
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { active: a, history: h, error } = await fetchMemberFastsForProfile(supabase, userId, activeProfileId);
    if (error) {
      setErr(error.message);
      setActive(null);
      setHistory([]);
    } else {
      setErr(null);
      setActive(a);
      setHistory(h);
    }
    setLoading(false);
  }, [userId, activeProfileId, setErr]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const onStart = useCallback(async () => {
    if (!supabase || !userId || !activeProfileId || active) return;
    const amount = Number(formAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setErr("Enter a positive target duration.");
      return;
    }
    const th = targetHoursFromAmountAndUnit(amount, formUnit);
    if (th <= 0 || th > 2160) {
      setErr("Target must be between 0 and 90 days.");
      return;
    }
    const started = new Date(formStarted);
    if (!Number.isFinite(started.getTime())) {
      setErr("Invalid start time.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await insertMemberFast(supabase, userId, activeProfileId, {
      fast_type: formType,
      started_at: started.toISOString(),
      target_hours: th,
      notes: draftStartNotes.trim() || null,
      public_visible: formPublic,
    });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("duplicate") ? "Finish your current fast before starting another." : error.message);
      return;
    }
    setDraftStartNotes("");
    setFormPublic(false);
    setFormStarted(datetimeLocalValue());
    await reload();
    showSavedBriefly?.();
  }, [
    supabase,
    userId,
    activeProfileId,
    active,
    formType,
    formStarted,
    formAmount,
    formUnit,
    draftStartNotes,
    formPublic,
    reload,
    setErr,
    showSavedBriefly,
  ]);

  const onEnd = useCallback(async () => {
    if (!supabase || !activeProfileId || !active?.id) return;
    setBusy(true);
    setErr(null);
    const { error } = await endMemberFast(supabase, activeProfileId, String(active.id));
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    await reload();
    showSavedBriefly?.();
  }, [supabase, activeProfileId, active, reload, setErr, showSavedBriefly]);

  const onTogglePublic = useCallback(
    async (next) => {
      if (!supabase || !activeProfileId || !active?.id) return;
      setErr(null);
      const { error } = await updateMemberFast(supabase, activeProfileId, String(active.id), { public_visible: next });
      if (error) {
        setErr(error.message);
        return;
      }
      setActive((prev) => (prev ? { ...prev, public_visible: next } : prev));
      showSavedBriefly?.();
    },
    [supabase, activeProfileId, active, setErr, showSavedBriefly]
  );

  const onNotesBlur = useCallback(async () => {
    if (!supabase || !activeProfileId || !active?.id) return;
    const cur = (typeof active.notes === "string" ? active.notes : "").trim();
    const next = draftActiveNotes.trim();
    if (cur === next) return;
    setErr(null);
    const { error } = await updateMemberFast(supabase, activeProfileId, String(active.id), {
      notes: next === "" ? null : next,
    });
    if (error) setErr(error.message);
    else {
      setActive((prev) => (prev ? { ...prev, notes: next === "" ? null : next } : prev));
      showSavedBriefly?.();
    }
  }, [supabase, activeProfileId, active, draftActiveNotes, setErr, showSavedBriefly]);

  useEffect(() => {
    if (active?.id) {
      setDraftActiveNotes(typeof active.notes === "string" ? active.notes : "");
    }
  }, [active?.id, active?.notes]);

  if (!isSupabaseConfigured()) {
    return (
      <div style={CARD}>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Fasting tracker requires Supabase.
        </div>
      </div>
    );
  }

  if (!activeProfileId) {
    return (
      <div style={CARD}>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Select a member profile to use the fasting tracker.
        </div>
      </div>
    );
  }

  void tick;
  const progress =
    active && typeof active.started_at === "string"
      ? computeFastProgressState(active.started_at, active.target_hours, Date.now())
      : null;

  return (
    <div style={CARD}>
      <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 10, letterSpacing: "0.08em" }}>
        FASTING TRACKER
      </div>

      {loading ? (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Loading…
        </div>
      ) : active ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>
            {fastTypeLabel(active.fast_type)}
          </div>
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>
            Elapsed:{" "}
            <span style={{ color: "var(--color-accent)" }}>
              {progress ? formatElapsedDuration(progress.elapsedMs) : "—"}
            </span>
          </div>
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            Target: {formatTargetSummary(active.target_hours)}
            {progress?.overTarget ? (
              <span style={{ color: "var(--color-warning)", marginLeft: 8 }}>(past target — still counting)</span>
            ) : null}
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "var(--color-border-tab)",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress ? progress.progressPct : 0}%`,
                borderRadius: 999,
                background: progress?.overTarget ? "var(--color-warning)" : "var(--color-accent)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            {progress ? `${progress.progressPct.toFixed(1)}% of target` : ""}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={Boolean(active.public_visible)}
              onChange={(e) => void onTogglePublic(e.target.checked)}
            />
            <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Show active fast on public profile
            </span>
          </label>
          <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
            NOTES (OPTIONAL)
          </div>
          <textarea
            className="form-input"
            style={{ fontSize: 13, width: "100%", minHeight: 56, resize: "vertical", marginBottom: 12 }}
            value={draftActiveNotes}
            onChange={(e) => setDraftActiveNotes(e.target.value.slice(0, 2000))}
            onBlur={() => void onNotesBlur()}
            placeholder="Private notes…"
            rows={2}
          />
          <button type="button" className="btn-teal" style={{ fontSize: 13 }} disabled={busy} onClick={() => void onEnd()}>
            {busy ? "…" : "End fast"}
          </button>
        </>
      ) : (
        <>
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14, lineHeight: 1.45 }}>
            Start a fast, track elapsed time and progress toward your goal, and optionally share your active fast on
            your public profile.
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              FAST TYPE
            </div>
            <select
              className="form-input"
              style={{ fontSize: 13, width: "100%" }}
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
            >
              {FAST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              START TIME
            </div>
            <input
              type="datetime-local"
              className="form-input"
              style={{ fontSize: 13, width: "100%", fontFamily: "'JetBrains Mono', monospace" }}
              value={formStarted}
              onChange={(e) => setFormStarted(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px", minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                TARGET
              </div>
              <input
                type="number"
                min="0.25"
                step="0.25"
                className="form-input"
                style={{ fontSize: 13, width: "100%", fontFamily: "'JetBrains Mono', monospace" }}
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div style={{ flex: "0 0 110px" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                UNIT
              </div>
              <select
                className="form-input"
                style={{ fontSize: 13, width: "100%" }}
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value === "days" ? "days" : "hours")}
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              NOTES (OPTIONAL)
            </div>
            <textarea
              className="form-input"
              style={{ fontSize: 13, width: "100%", minHeight: 48, resize: "vertical" }}
              value={draftStartNotes}
              onChange={(e) => setDraftStartNotes(e.target.value.slice(0, 2000))}
              rows={2}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={formPublic} onChange={(e) => setFormPublic(e.target.checked)} />
            <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Show on public profile when fast starts
            </span>
          </label>
          <button type="button" className="btn-green" style={{ fontSize: 13 }} disabled={busy} onClick={() => void onStart()}>
            {busy ? "…" : "Start fast"}
          </button>
        </>
      )}

      {history.length > 0 ? (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border-tab)" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 10, letterSpacing: "0.08em" }}>
            LAST {history.length} FAST{history.length === 1 ? "" : "S"}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {history.map((row) => (
              <li
                key={String(row.id)}
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-border-hairline)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "var(--color-text-secondary)" }}>{fastTypeLabel(row.fast_type)}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{formatCompletedFastDuration(row.started_at, row.ended_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
