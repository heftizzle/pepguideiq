import { useState } from "react";
import { updateUserVial } from "../../lib/supabase.js";

/**
 * @param {{
 *   vialId: string,
 *   userId: string,
 *   profileId: string,
 *   onArchived?: () => void,
 *   disabled?: boolean,
 * }} props
 */
export function VialArchiveButton({ vialId, userId, profileId, onArchived, disabled = false }) {
  const [busy, setBusy] = useState(false);

  async function onArchive() {
    if (disabled || busy) return;
    if (
      !window.confirm(
        "Archive this vial? It hides from your active list but keeps dose history on your calendar."
      )
    ) {
      return;
    }
    setBusy(true);
    const { error } = await updateUserVial(vialId, userId, profileId, {
      archived_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      window.alert(typeof error.message === "string" ? error.message : "Could not archive.");
      return;
    }
    onArchived?.();
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => void onArchive()}
      style={{
        minHeight: 44,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 500,
        lineHeight: 1.25,
        fontSize: 13,
        padding: "4px 10px",
        borderRadius: 12,
        cursor: disabled || busy ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: "var(--color-warning)",
        background: "var(--tier-elite-dim)",
        border: "1px solid var(--tier-elite-border)",
      }}
    >
      {busy ? "…" : "Archive"}
    </button>
  );
}
