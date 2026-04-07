import { useCallback, useEffect, useRef, useState } from "react";
import { getProtocolSessionsOrdered } from "../data/protocolSessions.js";

const FAB_SIZE = 56;
const EDGE = 16;
const TAP_MAX_PX = 10;
const COMMIT_DRAG_PX = 40;
const LS_KEY = "fabSide";

/** @param {{ onSessionPicked: (session: "morning"|"afternoon"|"evening"|"night") => void }} props */
export function DoseLogFAB({ onSessionPicked }) {
  const [side, setSide] = useState(() => readStoredSide());
  const [leftPx, setLeftPx] = useState(() => safeComputeLeftPx(readStoredSide()));
  const [transition, setTransition] = useState("left 0.2s ease");
  const [expanded, setExpanded] = useState(false);

  const draggingRef = useRef(false);
  const leftPxRef = useRef(leftPx);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startSide: "right",
  });
  const fabRef = useRef(null);

  useEffect(() => {
    leftPxRef.current = leftPx;
  }, [leftPx]);

  const syncLeftToSide = useCallback((s) => {
    const next = safeComputeLeftPx(s);
    leftPxRef.current = next;
    setLeftPx(next);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (draggingRef.current) return;
      syncLeftToSide(side);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [side, syncLeftToSide]);

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
      const { startX, startY, startLeft, startSide } = dragRef.current;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const dist = Math.hypot(dx, dy);
      const maxL = window.innerWidth - FAB_SIZE - EDGE;
      const currentLeft = leftPxRef.current;

      draggingRef.current = false;
      setTransition("left 0.2s ease");

      if (dist < TAP_MAX_PX) {
        setExpanded((v) => !v);
        setSide(startSide);
        persistSide(startSide);
        syncLeftToSide(startSide);
        return;
      }

      setExpanded(false);

      const hMove = Math.abs(dx);
      if (hMove < COMMIT_DRAG_PX) {
        setSide(startSide);
        persistSide(startSide);
        setLeftPx(startSide === "left" ? EDGE : maxL);
        leftPxRef.current = startSide === "left" ? EDGE : maxL;
        return;
      }

      const centerX = currentLeft + FAB_SIZE / 2;
      const nextSide = centerX < window.innerWidth / 2 ? "left" : "right";
      setSide(nextSide);
      persistSide(nextSide);
      const nextLeft = nextSide === "left" ? EDGE : maxL;
      setLeftPx(nextLeft);
      leftPxRef.current = nextLeft;
    },
    [syncLeftToSide]
  );

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: leftPxRef.current,
      startSide: side,
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
    const { startX, startLeft } = dragRef.current;
    const dx = e.clientX - startX;
    const maxL = window.innerWidth - FAB_SIZE - EDGE;
    const next = Math.min(maxL, Math.max(EDGE, startLeft + dx));
    leftPxRef.current = next;
    setLeftPx(next);
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
    setTransition("left 0.2s ease");
    syncLeftToSide(side);
  };

  const sessions = getProtocolSessionsOrdered();

  const pickSession = (id) => {
    setExpanded(false);
    onSessionPicked(id);
  };

  const inside = side === "right" ? { right: "100%", marginRight: 12 } : { left: "100%", marginLeft: 12 };
  const slideFrom = side === "right" ? 14 : -14;

  return (
    <div
      ref={fabRef}
      style={{
        position: "fixed",
        zIndex: 199,
        left: leftPx,
        top: "50%",
        width: FAB_SIZE,
        transform: "translateY(-50%)",
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
            ...inside,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: side === "right" ? "flex-end" : "flex-start",
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
            transform: translateX(${slideFrom}px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
          height: FAB_SIZE,
          minWidth: FAB_SIZE,
          minHeight: FAB_SIZE,
          borderRadius: "50%",
          border: "1px solid rgba(0, 212, 170, 0.55)",
          background: "linear-gradient(145deg, rgba(0, 212, 170, 0.22), rgba(7, 9, 14, 0.95))",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 212, 170, 0.12)",
          cursor: expanded ? "default" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          margin: 0,
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        <span className="pepv-emoji" aria-hidden style={{ pointerEvents: "none" }}>
          💉
        </span>
      </button>
    </div>
  );
}

function readStoredSide() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s === "left" || s === "right") return s;
  } catch {
    /* ignore */
  }
  return "right";
}

function persistSide(s) {
  try {
    localStorage.setItem(LS_KEY, s);
  } catch {
    /* ignore */
  }
}

function safeComputeLeftPx(s) {
  if (typeof window === "undefined") return EDGE;
  const maxL = window.innerWidth - FAB_SIZE - EDGE;
  return s === "left" ? EDGE : maxL;
}
