/**
 * Local calendar helpers (browser default timezone — not UTC).
 * Used for protocol "logged today" boundaries and midnight refresh.
 */

/** @param {Date} [d] */
export function localTodayYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** @param {Date} [now] @returns {number} */
export function msUntilNextLocalMidnight(now = new Date()) {
  const next = new Date(now.getTime());
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

/**
 * Fires when the user's local calendar day advances (local midnight) or when the tab
 * becomes visible after the date has changed (e.g. overnight background).
 * @param {() => void} onDayChange
 * @returns {() => void} unsubscribe
 */
export function subscribeLocalCalendarDayChange(onDayChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  let lastYmd = localTodayYmd();
  let cleared = false;
  /** @type {number} */
  let timeoutId = 0;

  const fireIfNewDay = () => {
    const y = localTodayYmd();
    if (y !== lastYmd) {
      lastYmd = y;
      onDayChange();
    }
  };

  const scheduleMidnight = () => {
    if (cleared) return;
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      if (cleared) return;
      fireIfNewDay();
      scheduleMidnight();
    }, msUntilNextLocalMidnight() + 1);
  };

  const onVis = () => {
    if (document.visibilityState === "visible") fireIfNewDay();
  };

  document.addEventListener("visibilitychange", onVis);
  scheduleMidnight();

  return () => {
    cleared = true;
    window.clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/** Interim protocol log button cooldown (placeholder until doses_per_day). */
export const PROTOCOL_LOG_COOLDOWN_MS = 2 * 60 * 60 * 1000;

/** First instant of the local calendar day after `d` (local midnight at end of that day). */
export function startOfNextLocalDay(d) {
  const n = new Date(d.getTime());
  n.setDate(n.getDate() + 1);
  n.setHours(0, 0, 0, 0);
  return n;
}

/**
 * When the interim "✓ Logged" lock ends after a dose at `lastLoggedAtMs` (local clock).
 * Unlocks at min(last + 2h, next local midnight).
 * @param {number} lastLoggedAtMs
 */
export function protocolLogCooldownEndsAtMs(lastLoggedAtMs) {
  const twoH = lastLoggedAtMs + PROTOCOL_LOG_COOLDOWN_MS;
  const nextMid = startOfNextLocalDay(new Date(lastLoggedAtMs)).getTime();
  return Math.min(twoH, nextMid);
}
