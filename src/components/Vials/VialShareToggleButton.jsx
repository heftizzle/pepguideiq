import { useState } from "react";
import { supabase } from "../../lib/supabase.js";

/**
 * Matches StackShareControls + Saved Stacks "Post to Network": single `btn-teal`, affordance is text-only (OFF vs ON label).
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
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4, maxWidth: 140 }}>
      <button
        type="button"
        className="btn-teal"
        title={
          archived ? "Archived vials cannot be shared to Network." : isShared ? "Shared to Network" : "Share to Network"
        }
        disabled={mergedDisabled}
        onClick={() => void onClick()}
        style={{
          whiteSpace: "normal",
          textAlign: "center",
          lineHeight: 1.25,
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
