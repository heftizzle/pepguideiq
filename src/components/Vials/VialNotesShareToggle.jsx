import { useState } from "react";
import { updateUserVial } from "../../lib/supabase.js";

/**
 * Same pattern as VialShareToggleButton / stacks: `btn-teal`, text toggles OFF/ON meaning.
 *
 * @param {{
 *   vialId: string,
 *   userId: string,
 *   profileId: string,
 *   currentUserId: string | null | undefined,
 *   ownerUserId: string | null | undefined,
 *   isShared: boolean,
 *   currentValue: boolean,
 *   onChange?: (next: boolean) => void,
 * }} props
 */
export function VialNotesShareToggle({
  vialId,
  userId,
  profileId,
  currentUserId,
  ownerUserId,
  isShared,
  currentValue,
  onChange,
}) {
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState(/** @type {boolean | null} */ (null));
  const shown = optimistic ?? currentValue;
  const owner =
    typeof currentUserId === "string" &&
    typeof ownerUserId === "string" &&
    currentUserId.trim() !== "" &&
    currentUserId === ownerUserId;

  if (!isShared || !owner) return null;

  async function toggle() {
    if (busy) return;
    const next = !shown;
    setOptimistic(next);
    setBusy(true);
    const { error } = await updateUserVial(vialId, userId, profileId, { share_notes_to_network: next });
    setBusy(false);
    if (error) {
      setOptimistic(null);
      window.alert(typeof error.message === "string" ? error.message : "Could not update.");
      return;
    }
    setOptimistic(null);
    onChange?.(next);
  }

  return (
    <button
      type="button"
      className="btn-teal"
      disabled={busy}
      onClick={() => void toggle()}
      style={{
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 13,
        minHeight: 44,
      }}
    >
      {busy ? "…" : shown ? "Hide notes from shared card" : "Show notes on shared card"}
    </button>
  );
}
