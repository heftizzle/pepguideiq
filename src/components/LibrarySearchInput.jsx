import { useEffect, useState } from "react";

const DEBOUNCE_MS = 150;

/**
 * Local input state + debounced callback so parent filter state does not update every keystroke.
 * @param {{ onDebouncedChange: (value: string) => void, initialValue?: string, className?: string, style?: import("react").CSSProperties, placeholder?: string }} props
 */
export function LibrarySearchInput({ onDebouncedChange, initialValue = "", className = "search-input", style, placeholder }) {
  const [local, setLocal] = useState(initialValue);

  useEffect(() => {
    const t = window.setTimeout(() => {
      onDebouncedChange(local);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [local, onDebouncedChange]);

  return (
    <input
      className={className}
      style={style}
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      aria-label={placeholder}
    />
  );
}
