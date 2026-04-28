import { useState } from "react";
import { updateUserVial } from "../../lib/supabase.js";

/**
 * Owner-only: show/hide notes on the Network card.
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

  const activeStyle = {
    color: "var(--color-accent)",
    border: "1px solid var(--color-bell-border-unread)",
    background: "var(--color-accent-dim)",
  };
  const inactiveStyle = {
    color: "var(--color-text-secondary)",
    border: "1px solid var(--color-border-default)",
    background: "transparent",
  };

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
      disabled={busy}
      onClick={() => void toggle()}
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 12,
        cursor: busy ? "wait" : "pointer",
        ...(shown ? activeStyle : inactiveStyle),
      }}
    >
      {busy ? "…" : shown ? "Hide notes on shared card" : "Show notes on shared card"}
    </button>
  );
}
