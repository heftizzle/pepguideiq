import { useState } from "react";
import { supabase } from "../../lib/supabase.js";

/**
 * Toggle Network visibility for a vial (set_vial_feed_visible RPC).
 * ON = filled accent + inverse text; OFF = outlined secondary (matches app toggle pattern).
 *
 * @param {{
 *   vialId: string,
 *   archivedAt?: string | null,
 *   isShared: boolean,
 *   onSharedChange: (next: boolean) => void,
 *   disabled?: boolean,
 * }} props
 */
export function VialShareToggleButton({ vialId, archivedAt = null, isShared, onSharedChange, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const archived = archivedAt != null && String(archivedAt).trim() !== "";
  /** Match action-row buttons; allow label wrap so width stays ~110–130px. */
  const sizeStyle = {
    minHeight: 44,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 500,
    lineHeight: 1.2,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 12,
    maxWidth: 120,
    whiteSpace: "normal",
    textAlign: "center",
  };
  const inactiveStyle = {
    ...sizeStyle,
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border-default)",
    background: "transparent",
  };
  const activeStyle = {
    ...sizeStyle,
    color: "var(--color-text-inverse)",
    border: "1px solid var(--color-accent)",
    background: "var(--color-accent)",
  };

  async function onClick() {
    if (disabled || busy || archived || !vialId) return;
    const next = !isShared;
    setBusy(true);
    setErr(null);
    onSharedChange(next);
    const { error } = await supabase.rpc("set_vial_feed_visible", {
      p_vial_id: vialId,
      p_visible: next,
    });
    setBusy(false);
    if (error) {
      onSharedChange(!next);
      const code = error.code ?? "";
      if (code === "22023") {
        setErr("Cannot share an archived vial.");
      } else if (code === "42501") {
        setErr("You don't own this vial.");
      } else if (code === "P0002") {
        setErr("Vial not found. Try refreshing.");
      } else {
        setErr(typeof error.message === "string" ? error.message : "Could not update Network.");
      }
      return;
    }
    setErr(null);
  }

  const mergedDisabled = disabled || archived || busy;
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4, maxWidth: 120 }}>
      <button
        type="button"
        title={
          archived ? "Archived vials cannot be shared to Network." : isShared ? "Shared to Network" : "Share to Network"
        }
        disabled={mergedDisabled}
        onClick={() => void onClick()}
        style={{
          cursor: mergedDisabled ? "not-allowed" : "pointer",
          opacity: archived ? 0.5 : 1,
          ...(isShared ? activeStyle : inactiveStyle),
        }}
      >
        {busy ? "…" : isShared ? "Shared to Network ✓" : "Share to Network"}
      </button>
      {err ? (
        <span className="mono" style={{ fontSize: 11, color: "var(--color-danger)", maxWidth: 220, lineHeight: 1.35 }}>
          {err}
        </span>
      ) : null}
    </div>
  );
}
