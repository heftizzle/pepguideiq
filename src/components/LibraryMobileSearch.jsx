import { useEffect, useMemo, useRef, useState } from "react";
import { PEPTIDES } from "../data/catalog.js";

/**
 * @param {string} text
 * @param {string} query
 */
function highlightMatch(text, query) {
  if (!text || !query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const i = lower.indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark
        style={{
          background: "rgba(0, 212, 170, 0.35)",
          color: "#dde4ef",
          padding: "0 2px",
          borderRadius: 2,
        }}
      >
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * @param {typeof PEPTIDES[number]} p
 * @param {string} q
 */
function scoreMatch(p, q) {
  const ql = q.toLowerCase();
  const name = p.name || "";
  const nl = name.toLowerCase();
  if (nl.startsWith(ql)) return 0;
  const aliases = Array.isArray(p.aliases) ? p.aliases : [];
  for (const a of aliases) {
    const al = String(a).toLowerCase();
    if (al.startsWith(ql)) return 1;
  }
  if (nl.includes(ql)) return 2;
  for (const a of aliases) {
    if (String(a).toLowerCase().includes(ql)) return 3;
  }
  return 99;
}

/**
 * @param {string} q
 */
function suggestionsForQuery(q) {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const ql = trimmed.toLowerCase();
  const matches = PEPTIDES.filter((p) => {
    if ((p.name || "").toLowerCase().includes(ql)) return true;
    if (Array.isArray(p.aliases) && p.aliases.some((a) => String(a).toLowerCase().includes(ql))) return true;
    return false;
  });
  matches.sort((a, b) => scoreMatch(a, trimmed) - scoreMatch(b, trimmed) || a.name.localeCompare(b.name));
  return matches.slice(0, 8);
}

/**
 * Magnifying glass in header row (Library tab).
 * @param {{ open: boolean; onOpen: () => void }} props
 */
export function LibraryMobileSearchIcon({ open, onOpen }) {
  return (
    <button
      type="button"
      className="pepv-header-action-btn pepv-header-action-btn--icon"
      data-active={open ? "true" : undefined}
      aria-label="Open library search"
      aria-expanded={open}
      onClick={onOpen}
    >
      <span className="pepv-emoji" aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>
        🔍
      </span>
    </button>
  );
}

/**
 * Full-width search row below header + autocomplete (Library tab).
 * @param {{ initialSearch?: string; onDismiss: () => void; setSearch: (s: string) => void }} props
 */
export function LibraryMobileSearchPanel({ initialSearch = "", onDismiss, setSearch }) {
  const [inputValue, setInputValue] = useState(initialSearch);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const dropdownRef = useRef(null);
  const showDropdownRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  const suggestions = useMemo(() => suggestionsForQuery(inputValue), [inputValue]);
  const showDropdown = !suppressSuggestions && inputValue.trim().length >= 2;
  const showEmpty = showDropdown && suggestions.length === 0;
  showDropdownRef.current = showDropdown;

  useEffect(() => {
    const onPointerDown = (e) => {
      const root = rootRef.current;
      const dd = dropdownRef.current;
      if (!root) return;
      if (!root.contains(e.target)) {
        onDismiss();
        return;
      }
      if (dd && showDropdownRef.current && !dd.contains(e.target)) {
        setSuppressSuggestions(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [onDismiss]);

  const onChangeInput = (e) => {
    const v = e.target.value;
    setSuppressSuggestions(false);
    setInputValue(v);
    // Keep App.jsx `search` in lockstep with the input. Debouncing + unmount (dismiss / tap grid)
    // cleared the pending timeout and left parent `search` stale (often ""), so the grid “reset”
    // after closing compound detail.
    setSearch(v);
  };

  const pickPeptide = (p) => {
    const name = p.name || "";
    setSuppressSuggestions(true);
    setInputValue(name);
    setSearch(name);
    inputRef.current?.blur();
  };

  return (
    <div ref={rootRef} className="pepv-library-mobile-search-panel">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search by name, alias, tag…"
          value={inputValue}
          onChange={onChangeInput}
          aria-label="Search compounds"
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
          }}
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={onDismiss}
          style={{
            minWidth: 44,
            minHeight: 44,
            flexShrink: 0,
            borderRadius: 10,
            border: "1px solid #243040",
            background: "rgba(255,255,255,0.06)",
            color: "#8fa5bf",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            marginTop: 6,
            maxHeight: 280,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            background: "#0b0f17",
            border: "1px solid #1a2840",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            zIndex: 221,
          }}
        >
          {showEmpty ? (
            <div className="mono" style={{ padding: "14px 16px", fontSize: 13, color: "#6b7c8f" }}>
              No compounds found
            </div>
          ) : (
            suggestions.map((p) => {
              const ql = inputValue.trim().toLowerCase();
              const nameL = (p.name || "").toLowerCase();
              const nameHit = nameL.includes(ql);
              const aliasHit =
                !nameHit && Array.isArray(p.aliases)
                  ? p.aliases.find((a) => String(a).toLowerCase().includes(ql))
                  : null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPeptide(p)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid #14202e",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#dde4ef",
                  }}
                >
                  <div className="brand" style={{ fontSize: 14, fontWeight: 600 }}>
                    {nameHit ? highlightMatch(p.name, inputValue.trim()) : p.name}
                  </div>
                  {aliasHit ? (
                    <div className="mono" style={{ fontSize: 12, color: "#8fa5bf", marginTop: 4 }}>
                      {highlightMatch(String(aliasHit), inputValue.trim())}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
