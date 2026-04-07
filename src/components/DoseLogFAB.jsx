import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getProtocolSessionsOrdered } from "../data/protocolSessions.js";
import { useDemoTourOptional } from "../context/DemoTourContext.jsx";

const FAB_SIZE = 56;
const FAB_BODY_MIN_HEIGHT = 72;
/** Clears bottom nav; safe-area keeps FAB above home indicator on notched phones. */
const FAB_BOTTOM_CSS = "calc(80px + env(safe-area-inset-bottom, 0px))";
const EDGE = 16;
const TAP_MAX_PX = 10;
/** Below this horizontal drag distance, snap back to the edge for the side we started on. */
const COMMIT_DRAG_PX = 40;
const TOUR_STRIP_ID = "pepv-demo-tour-strip";
const TOUR_GAP_PX = 8;

/** Bottom-right default: same as `right: 16px` intent for the centered-transform layout. */
function defaultOffsetXBottomRight() {
  if (typeof window === "undefined") return 0;
  return window.innerWidth / 2 - FAB_SIZE - EDGE;
}

/** @param {"left" | "right"} side */
function snapOffsetXForSide(side) {
  const w = window.innerWidth;
  const centerLeft = w / 2 - FAB_SIZE / 2;
  const minOff = EDGE - centerLeft;
  const maxOff = w - FAB_SIZE - EDGE - centerLeft;
  return side === "left" ? minOff : maxOff;
}

/** @param {number} offsetX */
function sideFromOffsetX(offsetX) {
  const w = window.innerWidth;
  return w / 2 + offsetX < w / 2 ? "left" : "right";
}

/** @param {{ onSessionPicked: (session: "morning"|"afternoon"|"evening"|"night") => void }} props */
export function DoseLogFAB({ onSessionPicked }) {
  const demoTour = useDemoTourOptional();
  const stripVisible = Boolean(demoTour?.stripVisible);

  const [offsetX, setOffsetX] = useState(defaultOffsetXBottomRight);
  const [transition, setTransition] = useState("transform 0.2s ease");
  const [expanded, setExpanded] = useState(false);
  const [fabBottomPx, setFabBottomPx] = useState(null);

  const draggingRef = useRef(false);
  const offsetXRef = useRef(defaultOffsetXBottomRight());
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startOffsetX: 0,
  });
  const fabRef = useRef(null);

  useEffect(() => {
    offsetXRef.current = offsetX;
  }, [offsetX]);

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

  const clampOffsetX = useCallback((raw) => {
    if (typeof window === "undefined") return raw;
    const centerLeft = window.innerWidth / 2 - FAB_SIZE / 2;
    const minOff = EDGE - centerLeft;
    const maxOff = window.innerWidth - FAB_SIZE - EDGE - centerLeft;
    return Math.min(maxOff, Math.max(minOff, raw));
  }, []);

  const syncOffsetAfterResize = useCallback(() => {
    if (draggingRef.current) return;
    const next = clampOffsetX(offsetXRef.current);
    offsetXRef.current = next;
    setOffsetX(next);
  }, [clampOffsetX]);

  useLayoutEffect(() => {
    syncOffsetAfterResize();
  }, [syncOffsetAfterResize]);

  useEffect(() => {
    const onResize = () => {
      if (draggingRef.current) return;
      syncOffsetAfterResize();
      if (stripVisible) {
        const next = recomputeBottomAboveTour();
        if (next != null) setFabBottomPx(next);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [stripVisible, syncOffsetAfterResize, recomputeBottomAboveTour]);

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

  const finishDrag = useCallback((clientX, clientY) => {
    const { startX, startY, startOffsetX } = dragRef.current;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const dist = Math.hypot(dx, dy);

    draggingRef.current = false;
    setTransition("transform 0.2s ease");

    if (dist < TAP_MAX_PX) {
      setExpanded((v) => !v);
      return;
    }

    setExpanded(false);

    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    const startSide = sideFromOffsetX(startOffsetX);

    if (Math.abs(dx) < COMMIT_DRAG_PX) {
      const snap = snapOffsetXForSide(startSide);
      setOffsetX(snap);
      offsetXRef.current = snap;
      return;
    }

    const currentCenterX = w / 2 + offsetXRef.current;
    const nextSide = currentCenterX < w / 2 ? "left" : "right";
    const snap = snapOffsetXForSide(nextSide);
    setOffsetX(snap);
    offsetXRef.current = snap;
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetXRef.current,
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
    const { startX, startOffsetX } = dragRef.current;
    const dx = e.clientX - startX;
    const next = clampOffsetX(startOffsetX + dx);
    offsetXRef.current = next;
    setOffsetX(next);
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
    setTransition("transform 0.2s ease");
    const { startOffsetX } = dragRef.current;
    setOffsetX(startOffsetX);
    offsetXRef.current = startOffsetX;
  };

  const sessions = getProtocolSessionsOrdered();

  const pickSession = (id) => {
    setExpanded(false);
    onSessionPicked(id);
  };

  const bottomStyle = fabBottomPx != null ? `${fabBottomPx}px` : FAB_BOTTOM_CSS;

  return (
    <div
      ref={fabRef}
      style={{
        position: "fixed",
        zIndex: 38,
        left: "50%",
        right: "auto",
        bottom: bottomStyle,
        top: "auto",
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
