import { useEffect, useMemo, useState } from "react";
import { PROTOCOL_SESSION_IDS, PROTOCOL_SESSION_UI } from "../data/protocolSessions.js";
import { getTimingWarning, hasAnyTimingConflict } from "../lib/protocolGuardrails.js";

const SESSION_ORDER = { morning: 0, afternoon: 1, evening: 2, night: 3 };

/** Default: compound appears in all protocol sessions. */
export const DEFAULT_STACK_SESSIONS = ["morning", "afternoon", "evening", "night"];

/** @param {unknown} s */
export function normalizeStackSessions(s) {
  const allowed = new Set(["morning", "afternoon", "evening", "night"]);
  if (!Array.isArray(s)) return [...DEFAULT_STACK_SESSIONS];
  const f = [...new Set(s.filter((x) => allowed.has(x)))];
  return f.length ? f.sort((a, b) => SESSION_ORDER[a] - SESSION_ORDER[b]) : [...DEFAULT_STACK_SESSIONS];
}

/** Stable list key for a saved stack row (uuid when present, else catalog id). */
export function getStackRowListKey(item) {
  return item.stackRowKey ?? item.id;
}

export function SavedStackEntryRow({ item, catColor, catLabel, onUpdate, onRemove }) {
  const rowKey = getStackRowListKey(item);
  const [dose, setDose] = useState(() => item.stackDose ?? item.startDose ?? "");
  const [frequency, setFrequency] = useState(() => item.stackFrequency ?? "");
  const [notes, setNotes] = useState(() => item.stackNotes ?? "");
  const [sessionTimingBannerDismissed, setSessionTimingBannerDismissed] = useState(false);

  useEffect(() => {
    setDose(item.stackDose ?? item.startDose ?? "");
    setFrequency(item.stackFrequency ?? "");
    setNotes(item.stackNotes ?? "");
  }, [rowKey]);

  const sessions = normalizeStackSessions(item.sessions);
  const peptideId = item.id;

  useEffect(() => {
    setSessionTimingBannerDismissed(false);
  }, [rowKey, sessions.join(",")]);

  const activeSessionWarning = useMemo(() => {
    for (const sid of sessions) {
      if (hasAnyTimingConflict([peptideId], sid)) {
        return getTimingWarning(peptideId, sid);
      }
    }
    return null;
  }, [peptideId, sessions.join(",")]);

  const toggleSession = (sid) => {
    if (sessions.includes(sid)) {
      if (sessions.length <= 1) return;
      onUpdate(rowKey, { sessions: sessions.filter((x) => x !== sid) });
    } else {
      onUpdate(rowKey, { sessions: normalizeStackSessions([...sessions, sid]) });
    }
  };

  const cc = catColor;

  return (
    <div className="scard" style={{ alignItems: "stretch" }}>
      <div style={{ width: 3, minHeight: 44, background: cc, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
          <div>
            <div className="brand" style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginTop: 2 }}>{catLabel} · added {item.addedDate}</div>
          </div>
          <button type="button" className="btn-red" onClick={() => onRemove(rowKey)}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <div>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 4, letterSpacing: ".12em" }}>SESSIONS</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {PROTOCOL_SESSION_IDS.map((sid) => {
                const on = sessions.includes(sid);
                const sessionWarning = getTimingWarning(peptideId, sid);
                const warnSelected = on && sessionWarning;
                const emoji = PROTOCOL_SESSION_UI[sid].emoji;
                return (
                  <button
                    key={sid}
                    type="button"
                    title={sessionWarning ? sessionWarning : sid}
                    onClick={() => toggleSession(sid)}
                    style={{
                      minWidth: 40,
                      minHeight: 40,
                      borderRadius: 8,
                      border: warnSelected
                        ? "1px solid rgba(245, 158, 11, 0.55)"
                        : on
                          ? "1px solid var(--color-bell-border-unread)"
                          : "1px solid var(--color-border-emphasis)",
                      background: on ? "var(--color-accent-dim)" : "var(--color-bg-hover)",
                      fontSize: 18,
                      lineHeight: 1,
                      cursor: "pointer",
                      opacity: on ? 1 : 0.45,
                    }}
                  >
                    <span className="pepv-emoji" aria-hidden>
                      {emoji}
                    </span>
                  </button>
                );
              })}
            </div>
            {activeSessionWarning && !sessionTimingBannerDismissed && (
              <div
                className="mono"
                style={{
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                  background: "rgba(245, 158, 11, 0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#fbbf24",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                    marginBottom: 8,
                  }}
                >
                  ⚠ {activeSessionWarning}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-teal"
                    style={{ fontSize: 13, padding: "5px 10px" }}
                    onClick={() => setSessionTimingBannerDismissed(true)}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="btn-teal"
                    style={{ fontSize: 13, padding: "5px 10px", opacity: 0.92 }}
                    onClick={() => setSessionTimingBannerDismissed(true)}
                  >
                    Keep sessions anyway
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 4, letterSpacing: ".12em" }}>DOSE</div>
            <input
              className="form-input"
              style={{ fontSize: 13 }}
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackDose: dose })}
            />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 4, letterSpacing: ".12em" }}>FREQUENCY</div>
            <input
              className="form-input"
              style={{ fontSize: 13 }}
              value={frequency}
              placeholder="e.g. Daily, 2x/week"
              onChange={(e) => setFrequency(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackFrequency: frequency })}
            />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 4, letterSpacing: ".12em" }}>NOTES</div>
            <textarea
              className="form-input"
              style={{ fontSize: 13, minHeight: 56, resize: "vertical" }}
              value={notes}
              placeholder="Optional notes…"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackNotes: notes })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
