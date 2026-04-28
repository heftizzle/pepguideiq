import { useState } from "react";
import { updateUserVial } from "../../lib/supabase.js";

/**
 * Owner-only: show/hide notes on the Network card.
 * Pill sizing matches "Edit reconstitution (mg / BAC mL)" in VialTracker (btn-teal-style footprint).
 * ON = filled accent + inverse text; OFF = outlined secondary.
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

  /** Same footprint as VialTracker "Edit reconstitution" pill (fontSize 13, padding 4px 10px, radius 12, min 44). */
  const pillBase = {
    minHeight: 44,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 12,
    lineHeight: 1.2,
    whiteSpace: "normal",
    textAlign: "center",
    cursor: busy ? "wait" : "pointer",
  };

  const onStyle = {
    ...pillBase,
    color: "var(--color-text-inverse)",
    background: "var(--color-accent)",
    border: "1px solid var(--color-accent)",
  };
  const offStyle = {
    ...pillBase,
    color: "var(--color-text-secondary)",
    background: "transparent",
    border: "1px solid var(--color-border-default)",
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
    <button type="button" disabled={busy} onClick={() => void toggle()} style={shown ? onStyle : offStyle}>
      {busy ? "…" : shown ? "Hide notes" : "Show notes on shared card"}
    </button>
  );
}
