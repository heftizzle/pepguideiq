import { useEffect } from "react";

export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = () => [
      ...el.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])'),
    ];
    const handler = (e) => {
      if (e.key !== "Tab") return;
      const els = focusable();
      if (!els.length) return;
      if (e.shiftKey) {
        if (document.activeElement === els[0]) {
          e.preventDefault();
          els[els.length - 1].focus();
        }
      } else if (document.activeElement === els[els.length - 1]) {
        e.preventDefault();
        els[0].focus();
      }
    };
    focusable()[0]?.focus();
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [active, ref]);
}
