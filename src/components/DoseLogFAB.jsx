import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getProtocolSessionsOrdered } from "../data/protocolSessions.js";
import { useDemoTourOptional } from "../context/DemoTourContext.jsx";

const FAB_SIZE = 56;
const FAB_BODY_MIN_HEIGHT = 72;
/** Total vertical footprint used for bounds (matches main button minHeight). */
const FAB_HEIGHT = FAB_BODY_MIN_HEIGHT;
/** Clears bottom nav; safe-area keeps FAB above home indicator on notched phones. */
const FAB_BOTTOM_CSS = "calc(80px + env(safe-area-inset-bottom, 0px))";
/** Horizontal inset so the full FAB stays in view (was 16; spec asks 28px). */
const MARGIN_X = 28;
const TAP_MAX_PX = 10;
/** Below this horizontal drag distance, snap back to the edge for the side we started on. */
const COMMIT_DRAG_PX = 40;
const TOUR_STRIP_ID = "pepv-demo-tour-strip";
const TOUR_GAP_PX = 8;
/** Space reserved below header for clamping vertical position. */
const HEADER_TOP_SAFE = 60;
/** Bottom nav height — FAB must sit fully above this band. */
const NAV_BAR_HEIGHT = 80;

const STORAGE_KEY = "pepv.doseFab.pos";

/** @param {number} [w] */
function clampOffsetX(raw, w = typeof window !== "undefined" ? window.innerWidth : 0) {
  if (!w) return raw;
  const centerLeft = w / 2 - FAB_SIZE / 2;
  const minOff = MARGIN_X - centerLeft;
  const maxOff = w - MARGIN_X - FAB_SIZE / 2 - w / 2;
  return Math.min(maxOff, Math.max(minOff, raw));
}

/** @param {number} raw @param {number} [h] */
function clampFabTop(raw, h = typeof window !== "undefined" ? window.innerHeight : 0) {
  if (!h) return raw;
  const minTop = HEADER_TOP_SAFE;
  const maxTop = h - NAV_BAR_HEIGHT - FAB_HEIGHT;
  if (maxTop < minTop) return Math.max(0, (h - FAB_HEIGHT) / 2);
  return Math.min(maxTop, Math.max(minTop, raw));
}

/** Default horizontal offset per spec: (W/2) − 44px, then clamped to safe horizontal bounds. */
function defaultOffsetX() {
  if (typeof window === "undefined") return 0;
  return clampOffsetX(window.innerWidth / 2 - 44);
}

function defaultFabTop() {
  if (typeof window === "undefined") return 100;
  return clampFabTop(window.innerHeight / 2 - FAB_HEIGHT / 2);
}

function readStoredFabPosition() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (typeof o.offsetX !== "number" || typeof o.top !== "number") return null;
    return { offsetX: o.offsetX, top: o.top };
  } catch {
    return null;
  }
}

function persistFabPosition(offsetX, top) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ offsetX, top }));
  } catch {
    /* ignore */
  }
}

/** @param {"left" | "right"} side */
function snapOffsetXForSide(side) {
  const w = window.innerWidth;
  const centerLeft = w / 2 - FAB_SIZE / 2;
  const minOff = MARGIN_X - centerLeft;
  const maxOff = w - MARGIN_X - FAB_SIZE / 2 - w / 2;
  return clampOffsetX(side === "left" ? minOff : maxOff, w);
}

/** @param {number} offsetX */
function sideFromOffsetX(offsetX) {
  return offsetX < 0 ? "left" : "right";
}

function getInitialFabPosition() {
  if (typeof window === "undefined") {
    return { offsetX: 0, top: 100 };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  const defX = defaultOffsetX();
  const defTop = defaultFabTop();
  const stored = readStoredFabPosition();
  let ox = defX;
  let top = defTop;
  if (stored) {
    ox = stored.offsetX;
    top = stored.top;
  }
  const cx = clampOffsetX(ox, w);
  const ct = clampFabTop(top, h);
  if (stored && (cx !== stored.offsetX || ct !== stored.top)) {
    persistFabPosition(cx, ct);
  }
  return { offsetX: cx, top: ct };
}

/** @param {{ onSessionPicked: (session: "morning"|"afternoon"|"evening"|"night") => void }} props */
export function DoseLogFAB({ onSessionPicked }) {
  const demoTour = useDemoTourOptional();
  const stripVisible = Boolean(demoTour?.stripVisible);

  const [fabPos, setFabPos] = useState(() => getInitialFabPosition());
  const offsetX = fabPos.offsetX;
  const fabTopPx = fabPos.top;
  const [transition, setTransition] = useState("transform 0.2s ease, top 0.2s ease");
  const [expanded, setExpanded] = useState(false);
  const [fabBottomPx, setFabBottomPx] = useState(null);

  const draggingRef = useRef(false);
  const offsetXRef = useRef(offsetX);
  const fabTopRef = useRef(fabTopPx);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startTop: 0,
  });
  const fabRef = useRef(null);

  useEffect(() => {
    offsetXRef.current = offsetX;
    fabTopRef.current = fabTopPx;
  }, [offsetX, fabTopPx]);

  const recomputeBottomAboveTour = useCallback(() => {
    const el = document.getElementById(TOUR_STRIP_ID);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.round(window.innerHeight - r.top + TOUR_GAP_PX));
  }, []);

  useLayoutEffect(() => {
    if (!stripVisible) {
      setFabBottomPx(null);
      return;
    }
    let cancelled = false;
    const el = document.getElementById(TOUR_STRIP_ID);
    if (!el) {
      setFabBottomPx(null);
      const t = window.requestAnimationFrame(() => {
        if (cancelled) return;
        const next = recomputeBottomAboveTour();
        if (next != null) setFabBottomPx(next);
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(t);
      };
    }

    const apply = () => {
      const next = recomputeBottomAboveTour();
      if (next != null) setFabBottomPx(next);
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [stripVisible, recomputeBottomAboveTour, demoTour?.showCollapsedTeaser, demoTour?.showFullPanel]);

  const syncPositionAfterResize = useCallback(() => {
    if (draggingRef.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nextX = clampOffsetX(offsetXRef.current, w);
    const nextTop = clampFabTop(fabTopRef.current, h);
    offsetXRef.current = nextX;
    fabTopRef.current = nextTop;
    setFabPos({ offsetX: nextX, top: nextTop });
    persistFabPosition(nextX, nextTop);
  }, []);

  useLayoutEffect(() => {
    syncPositionAfterResize();
  }, [syncPositionAfterResize]);

  useEffect(() => {
    const onResize = () => {
      if (draggingRef.current) return;
      syncPositionAfterResize();
      if (stripVisible) {
        const next = recomputeBottomAboveTour();
        if (next != null) setFabBottomPx(next);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [stripVisible, syncPositionAfterResize, recomputeBottomAboveTour]);

  useEffect(() => {
    if (!expanded) return;
    const onDocPointerDown = (e) => {
      const el = fabRef.current;
      if (!el || el.contains(e.target)) return;
      setExpanded(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [expanded]);

  const finishDrag = useCallback(
    (clientX, clientY) => {
      const { startX, startOffsetX } = dragRef.current;
      const dx = clientX - startX;
      const dist = Math.hypot(dx, clientY - startY);

      draggingRef.current = false;
      setTransition("transform 0.2s ease, top 0.2s ease");

      if (dist < TAP_MAX_PX) {
        setExpanded((v) => !v);
        return;
      }

      setExpanded(false);

      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      const h = typeof window !== "undefined" ? window.innerHeight : 0;
      const startSide = sideFromOffsetX(startOffsetX);

      let nextX;
      if (Math.abs(dx) < COMMIT_DRAG_PX) {
        nextX = snapOffsetXForSide(startSide);
      } else {
        const currentCenterX = w / 2 + offsetXRef.current;
        const nextSide = currentCenterX < w / 2 ? "left" : "right";
        nextX = snapOffsetXForSide(nextSide);
      }
      nextX = clampOffsetX(nextX, w);

      let nextTop = fabTopRef.current;
      if (fabBottomPx == null) {
        nextTop = clampFabTop(fabTopRef.current, h);
      }

      offsetXRef.current = nextX;
      fabTopRef.current = nextTop;
      setFabPos({ offsetX: nextX, top: nextTop });
      persistFabPosition(nextX, nextTop);
    },
    [fabBottomPx]
  );

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetXRef.current,
      startTop: fabTopRef.current,
    };
    draggingRef.current = true;
    setTransition("none");
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const { startX, startY, startOffsetX, startTop } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const nextX = clampOffsetX(startOffsetX + dx);
    offsetXRef.current = nextX;
    if (fabBottomPx == null) {
      const nextTop = clampFabTop(startTop + dy);
      fabTopRef.current = nextTop;
      setFabPos({ offsetX: nextX, top: nextTop });
    } else {
      setFabPos((p) => ({ ...p, offsetX: nextX }));
    }
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishDrag(e.clientX, e.clientY);
  };

  const onPointerCancel = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setTransition("transform 0.2s ease, top 0.2s ease");
    const { startOffsetX, startTop } = dragRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = clampOffsetX(startOffsetX, w);
    const t = fabBottomPx == null ? clampFabTop(startTop, h) : clampFabTop(fabTopRef.current, h);
    offsetXRef.current = x;
    fabTopRef.current = t;
    setFabPos({ offsetX: x, top: t });
  };

  const sessions = getProtocolSessionsOrdered();

  const pickSession = (id) => {
    setExpanded(false);
    onSessionPicked(id);
  };

  const useBottomLayout = fabBottomPx != null;
  const bottomStyle = useBottomLayout ? `${fabBottomPx}px` : FAB_BOTTOM_CSS;

  return (
    <div
      ref={fabRef}
      style={{
        position: "fixed",
        zIndex: 38,
        left: "50%",
        right: "auto",
        bottom: useBottomLayout ? bottomStyle : "auto",
        top: useBottomLayout ? "auto" : fabTopPx,
        width: FAB_SIZE,
        transform: `translateX(calc(-50% + ${offsetX}px))`,
        transition,
        pointerEvents: "auto",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {expanded && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "100%",
            marginBottom: 12,
            top: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          {sessions.map(({ id, emoji, pillLabel }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => pickSession(id)}
              style={{
                minHeight: 44,
                padding: "8px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0, 212, 170, 0.45)",
                background: "rgba(7, 9, 14, 0.96)",
                color: "#dde4ef",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.04em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
                animation: `pepvFabPillIn 0.22s ease ${i * 50}ms both`,
              }}
            >
              <span className="pepv-emoji" aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
                {emoji}
              </span>
              {pillLabel}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pepvFabPillIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <button
        type="button"
        aria-label="Log dose by session"
        aria-expanded={expanded}
        aria-haspopup="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          width: FAB_SIZE,
          minWidth: FAB_SIZE,
          minHeight: FAB_BODY_MIN_HEIGHT,
          height: "auto",
          borderRadius: FAB_SIZE / 2,
          border: "1px solid rgba(0, 212, 170, 0.55)",
          background: "linear-gradient(145deg, rgba(0, 212, 170, 0.22), rgba(7, 9, 14, 0.95))",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 212, 170, 0.12)",
          cursor: expanded ? "default" : "grab",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: "6px 4px",
          margin: 0,
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        <span className="pepv-emoji" aria-hidden style={{ pointerEvents: "none" }}>
          💉
        </span>
        <span
          style={{
            fontSize: 12,
            lineHeight: 1.15,
            color: "#ffffff",
            maxWidth: FAB_SIZE,
            textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            letterSpacing: "0.06em",
            pointerEvents: "none",
          }}
        >
          Log Dose
        </span>
      </button>
    </div>
  );
}
