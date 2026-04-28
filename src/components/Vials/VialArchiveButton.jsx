import { useState } from "react";
import { updateUserVial } from "../../lib/supabase.js";

/**
 * Outlined amber — `.btn-amber` in GlobalStyles (same footprint as `.btn-teal` / `.btn-red`).
 *
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
    <button type="button" className="btn-amber" disabled={disabled || busy} onClick={() => void onArchive()}>
      {busy ? "…" : "Archive"}
    </button>
  );
}
