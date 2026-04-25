import { useLikes } from "../../hooks/useLikes.js";

/**
 * Social-proof row rendered under a post or comment.
 *
 *   0 likes      → null (no empty state clutter)
 *   1–6 likes    → stacked liker-goal-emojis with -4px overlap + "liked this"
 *   7+ likes     → top-3 emojis + "+ N others"
 *
 * Clicking the row opens the LikersModal (if `onOpenModal` provided).
 *
 * @param {{
 *   entityType: 'post' | 'comment',
 *   entityId: string,
 *   currentUserId?: string | null,
 *   currentProfileId?: string | null,
 *   currentProfileGoals?: unknown,
 *   onOpenModal?: () => void,
 * }} props
 */
export default function LikersRow({
  entityType,
  entityId,
  currentUserId = null,
  currentProfileId = null,
  currentProfileGoals = null,
  onOpenModal,
}) {
  const { likeCount, topEmojis } = useLikes({
    entityType,
    entityId,
    currentUserId,
    currentProfileId,
    currentProfileGoals,
  });

  if (likeCount <= 0) return null;

  const manyMode = likeCount >= 7;
  const visibleEmojis = manyMode ? topEmojis.slice(0, 3) : topEmojis.slice(0, 6);

  const interactive = typeof onOpenModal === "function";
  const content = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "var(--color-text-secondary)",
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {visibleEmojis.map((emoji, i) => (
          <span
            key={`${emoji}-${i}`}
            style={{
              display: "inline-block",
              marginLeft: i === 0 ? 0 : -4,
              fontSize: 16,
              lineHeight: 1,
              transform: "translateZ(0)",
            }}
          >
            {emoji}
          </span>
        ))}
      </span>
      <span>
        {manyMode
          ? `+ ${likeCount - 3} other${likeCount - 3 === 1 ? "" : "s"}`
          : likeCount === 1
            ? "liked this"
            : `${likeCount} liked this`}
      </span>
    </span>
  );

  if (!interactive) {
    return <div style={{ padding: "2px 0" }}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpenModal}
      aria-label="View likers"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 0",
        margin: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
      }}
    >
      {content}
    </button>
  );
}
