/**
 * Walk from `el` up to the document root and collect ancestors that are scroll containers.
 * Used so tutorial spotlight hole position updates when inner tab panels scroll (not only `window`).
 * @param {Element | null} el
 * @returns {Element[]}
 */
export function collectScrollRootElements(el) {
  const roots = [];
  if (!el || typeof window === "undefined") return roots;
  let p = el.parentElement;
  while (p) {
    const cs = window.getComputedStyle(p);
    const ox = cs.overflowX;
    const oy = cs.overflowY;
    if (ox === "auto" || ox === "scroll" || oy === "auto" || oy === "scroll") {
      roots.push(p);
    }
    p = p.parentElement;
  }
  return roots;
}
