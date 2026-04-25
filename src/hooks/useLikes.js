import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { primaryGoalEmoji } from "../lib/goalEmoji.js";

/**
 * Optimistic-toggle likes hook for `post_likes` and `comment_likes`.
 *
 * Tracks viewer-has-liked, exact like count, and the top-3 most-recent
 * `liker_goal_emoji` values (for the stacked row / social proof).
 * `showBurst` flips to `true` for 700ms after a fresh like so the
 * button can render its particle burst.
 *
 * @param {{
 *   entityType: 'post' | 'comment',
 *   entityId: string,
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   currentProfileGoals: string | string[] | null,
 * }} args
 */
export function useLikes({
  entityType,
  entityId,
  currentUserId,
  currentProfileId,
  currentProfileGoals,
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [topEmojis, setTopEmojis] = useState(/** @type {string[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimer = useRef(/** @type {number | null} */ (null));

  const table = entityType === "post" ? "post_likes" : "comment_likes";
  const fkColumn = entityType === "post" ? "post_id" : "comment_id";

  const refresh = useCallback(async () => {
    if (!entityId || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const topPromise = supabase
      .from(table)
      .select("liker_goal_emoji", { count: "exact" })
      .eq(fkColumn, entityId)
      .order("created_at", { ascending: false })
      .limit(6);
    const minePromise = currentProfileId
      ? supabase
          .from(table)
          .select("id")
          .eq(fkColumn, entityId)
          .eq("profile_id", currentProfileId)
          .maybeSingle()
      : Promise.resolve({ data: null });

    const [{ data: rows, count }, { data: mine }] = await Promise.all([
      topPromise,
      minePromise,
    ]);

    setTopEmojis((rows || []).map((r) => r?.liker_goal_emoji).filter(Boolean));
    setLikeCount(typeof count === "number" ? count : 0);
    setLiked(!!mine);
    setLoading(false);
  }, [table, fkColumn, entityId, currentProfileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!currentUserId || !currentProfileId || !supabase) return;

    const wasLiked = liked;
    const myEmoji = primaryGoalEmoji(currentProfileGoals);

    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    if (!wasLiked) {
      setTopEmojis((prev) => [myEmoji, ...prev].slice(0, 6));
      setShowBurst(true);
      if (burstTimer.current != null) {
        window.clearTimeout(burstTimer.current);
      }
      burstTimer.current = window.setTimeout(() => setShowBurst(false), 700);
    } else {
      setTopEmojis((prev) => {
        const idx = prev.indexOf(myEmoji);
        if (idx < 0) return prev;
        const next = prev.slice();
        next.splice(idx, 1);
        return next;
      });
    }

    const result = wasLiked
      ? await supabase
          .from(table)
          .delete()
          .eq(fkColumn, entityId)
          .eq("profile_id", currentProfileId)
      : await supabase.from(table).insert({
          [fkColumn]: entityId,
          user_id: currentUserId,
          profile_id: currentProfileId,
          liker_goal_emoji: myEmoji,
        });

    if (result.error) {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
      void refresh();
    }
  }, [
    liked,
    currentUserId,
    currentProfileId,
    currentProfileGoals,
    table,
    fkColumn,
    entityId,
    refresh,
  ]);

  useEffect(
    () => () => {
      if (burstTimer.current != null) {
        window.clearTimeout(burstTimer.current);
        burstTimer.current = null;
      }
    },
    []
  );

  return { liked, likeCount, topEmojis, toggle, loading, showBurst, refresh };
}
