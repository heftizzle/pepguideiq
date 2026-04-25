import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { primaryGoalEmoji } from "../../lib/goalEmoji.js";
import { useLikes } from "../../hooks/useLikes.js";

/**
 * Goal-emoji like button for posts or comments.
 *
 * The viewer's primary goal emoji IS the like icon (tribe-based social
 * proof — longevity likes 🧬, shred likes 🔥, etc.). Unliked state is
 * muted (opacity 0.6, grayscale), liked state is vibrant. First like
 * fires a 6-particle radial burst via pure CSS keyframes defined in
 * `GlobalStyles.jsx` (`pepvLikeBurst`) — no animation library.
 *
 * Self-likes are hidden at the UI level (button doesn't render when the
 * viewer owns the entity). RLS at the DB does not forbid self-likes,
 * but the notification trigger no-ops when owner === liker so the UX is
 * consistent either way.
 *
 * @param {{
 *   entityType: 'post' | 'comment',
 *   entityId: string,
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   currentProfileGoals: unknown,
 *   ownerUserId: string | null,
 *   size?: number,
 * }} props
 */
export default function LikeButton({
  entityType,
  entityId,
  currentUserId,
  currentProfileId,
  currentProfileGoals,
  ownerUserId,
  size = 22,
}) {
  const { liked, toggle, showBurst, loading } = useLikes({
    entityType,
    entityId,
    currentUserId,
    currentProfileId,
    currentProfileGoals,
  });

  const [tapping, setTapping] = useState(false);
  const tapTimer = useRef(/** @type {number | null} */ (null));

  const myEmoji = useMemo(
    () => primaryGoalEmoji(currentProfileGoals),
    [currentProfileGoals]
  );

  const burstParticles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 24 + ((i * 7) % 9);
        return {
          key: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          rot: ((i * 53) % 60) - 30,
          delay: i * 60,
        };
      }),
    []
  );

  useEffect(
    () => () => {
      if (tapTimer.current != null) {
        window.clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
    },
    []
  );

  const handleClick = useCallback(() => {
    if (loading || !currentUserId || !currentProfileId) return;
    setTapping(false);
    window.requestAnimationFrame(() => {
      setTapping(true);
      if (tapTimer.current != null) window.clearTimeout(tapTimer.current);
      tapTimer.current = window.setTimeout(() => setTapping(false), 220);
    });
    void toggle();
  }, [loading, currentUserId, currentProfileId, toggle]);

  const isSelf = !!ownerUserId && !!currentUserId && ownerUserId === currentUserId;
  if (isSelf) return null;
  if (!currentUserId || !currentProfileId) return null;

  const className = [
    "pepv-like-btn",
    liked ? "pepv-like-btn--on" : "pepv-like-btn--off",
    tapping ? "pepv-like-btn--tap" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={handleClick}
      style={{ width: size + 8, height: size + 8, fontSize: size }}
    >
      <span aria-hidden style={{ display: "inline-block" }}>
        {liked ? myEmoji : myEmoji}
      </span>
      {showBurst ? (
        <span aria-hidden className="pepv-like-burst">
          {burstParticles.map((p) => (
            <span
              key={p.key}
              className="pepv-like-burst-particle"
              style={{
                "--pepv-like-dx": `${p.dx}px`,
                "--pepv-like-dy": `${p.dy}px`,
                "--pepv-like-rot": `${p.rot}deg`,
                animationDelay: `${p.delay}ms`,
              }}
            >
              {myEmoji}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
