import { useCallback, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "pepv_nav_tips_seen";

/** @type {{ id: string, text: string }[]} */
const TAB_TOOLTIPS = [
  { id: "library", text: "Browse 171+ research compounds" },
  { id: "vialTracker", text: "Log doses and track your vials" },
  { id: "stackBuilder", text: "Build your personal compound stack" },
  { id: "stacks", text: "View and manage your saved stacks" },
  { id: "network", text: "Discover protocols from other users" },
];

const GAP_PX = 10;

const cardStyle = {
  background: "#0e1520",
  border: "1px solid var(--color-accent-subtle-40)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 11,
  color: "#b0bec5",
  fontFamily: "'Outfit', sans-serif",
  whiteSpace: "normal",
  textAlign: "center",
  maxWidth: 140,
  boxSizing: "border-box",
  width: "max-content",
};

/**
 * First-login nav hints above bottom tabs; any tap dismisses forever.
 * @param {{ tabButtonRefs: import("react").MutableRefObject<Partial<Record<string, HTMLButtonElement | null>>> }} props
 */
export function NavTooltips({ tabButtonRefs }) {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) == null;
    } catch {
      return false;
    }
  });

  const [layouts, setLayouts] = useState(/** @type {Array<{ left: number; top: number } | null> | null} */ (null));

  const dismiss = useCallback(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setActive(false);
  }, []);

  useLayoutEffect(() => {
    if (!active) {
      setLayouts(null);
      return;
    }
    const measure = () => {
      const refs = tabButtonRefs.current;
      setLayouts(
        TAB_TOOLTIPS.map(({ id }) => {
          const el = refs[id];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left + r.width / 2, top: r.top - GAP_PX };
        })
      );
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    const id = window.requestAnimationFrame(() => measure());
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      window.cancelAnimationFrame(id);
    };
  }, [active, tabButtonRefs]);

  if (!active || typeof document === "undefined") return null;

  const layer = (
    <div
      role="presentation"
      onPointerDown={(e) => {
        e.preventDefault();
        dismiss();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        touchAction: "none",
      }}
    >
      {TAB_TOOLTIPS.map(({ id, text }, i) => {
        const pos = layouts?.[i];
        if (!pos) return null;
        return (
          <div
            key={id}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -100%)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <div style={cardStyle}>{text}</div>
            <svg width={14} height={8} viewBox="0 0 14 8" aria-hidden style={{ display: "block", marginTop: -1 }}>
              <path
                d="M0 0 L14 0 L7 8 Z"
                fill="#0e1520"
                stroke="var(--color-accent-subtle-40)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );

  return createPortal(layer, document.body);
}
