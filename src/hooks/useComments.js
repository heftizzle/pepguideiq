import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";

/**
 * Comments hook for a single `public.posts` row.
 *
 * Mirrors the `useLikes` shape: imperative `refresh`/`loadInitial`, optimistic
 * `post()` mutations with rollback-on-error, cleanup on unmount.
 *
 * Shape of a comment row (matches the `member_profiles!inner(...)` embed):
 * ```
 * {
 *   id, post_id, user_id, profile_id, parent_comment_id,
 *   body, like_count, reply_count, created_at,
 *   member_profiles: { handle, display_handle, display_name, avatar_r2_key, goals, user_id }
 *     (nullable if RLS blocks the embed — consumer must fall back to "Member")
 * }
 * ```
 *
 * Optimistic rows carry a `__optimistic = true` flag and an `id` prefixed
 * with `tmp-`. On INSERT success the temp row is replaced with the server row
 * in-place (position stable). The `member_profiles` embed on the temp row is
 * seeded from `currentProfile` so the instant-render frame shows the viewer's
 * own avatar + handle, not a "Member" fallback.
 *
 * Replies are lazy: `loadReplies(parentId)` pulls the whole children list of
 * that parent (no pagination — depth-2 ceiling enforced by the DB trigger
 * `enforce_comment_depth`).
 *
 * @param {{
 *   postId: string,
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   currentProfile?: {
 *     handle?: string | null,
 *     display_handle?: string | null,
 *     display_name?: string | null,
 *     avatar_r2_key?: string | null,
 *     goals?: unknown,
 *     user_id?: string | null,
 *   } | null,
 * }} args
 */
export function useComments({
  postId,
  currentUserId,
  currentProfileId,
  currentProfile = null,
}) {
  const SELECT_COLS =
    "id, post_id, user_id, profile_id, parent_comment_id, body, like_count, reply_count, created_at, member_profiles!inner(handle, display_handle, display_name, avatar_r2_key, goals, user_id)";
  const PAGE_SIZE = 20;

  const [topLevel, setTopLevel] = useState(/** @type {any[]} */ ([]));
  const [repliesByParent, setRepliesByParent] = useState(
    /** @type {Record<string, any[]>} */ ({})
  );
  const [repliesLoading, setRepliesLoading] = useState(
    /** @type {Set<string>} */ (new Set())
  );
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState(
    /** @type {"idle"|"loading"|"error"} */ ("idle")
  );
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadInitial = useCallback(async () => {
    if (!postId || !supabase) {
      setTopLevel([]);
      setRepliesByParent({});
      setHasMore(false);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError("");
    const { data, error: err } = await supabase
      .from("comments")
      .select(SELECT_COLS)
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (cancelledRef.current) return;
    if (err) {
      setStatus("error");
      setError(err.message || "Could not load comments.");
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    setTopLevel(rows);
    setRepliesByParent({});
    setHasMore(rows.length === PAGE_SIZE);
    setStatus("idle");
  }, [postId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!postId || !supabase || !hasMore) return;
    const realTop = topLevel.filter((c) => !c?.__optimistic);
    const oldest = realTop[realTop.length - 1];
    const oldestCreatedAt = typeof oldest?.created_at === "string" ? oldest.created_at : null;
    if (!oldestCreatedAt) return;
    const { data, error: err } = await supabase
      .from("comments")
      .select(SELECT_COLS)
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .lt("created_at", oldestCreatedAt)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (cancelledRef.current) return;
    if (err) return;
    const rows = Array.isArray(data) ? data : [];
    setTopLevel((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
  }, [postId, hasMore, topLevel]);

  const loadReplies = useCallback(
    async (parentId) => {
      if (!parentId || !supabase) return;
      setRepliesLoading((prev) => {
        if (prev.has(parentId)) return prev;
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
      const { data, error: err } = await supabase
        .from("comments")
        .select(SELECT_COLS)
        .eq("parent_comment_id", parentId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelledRef.current) return;
      if (!err) {
        const rows = Array.isArray(data) ? data : [];
        setRepliesByParent((prev) => ({ ...prev, [parentId]: rows }));
      }
      setRepliesLoading((prev) => {
        if (!prev.has(parentId)) return prev;
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    },
    []
  );

  /**
   * Optimistically insert a comment, then reconcile with the server row.
   *
   * @param {{ body: string, parentCommentId?: string | null }} args
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  const post = useCallback(
    async ({ body, parentCommentId = null }) => {
      const trimmed = typeof body === "string" ? body.trim() : "";
      if (!trimmed) return { ok: false, error: "Comment body required." };
      if (!currentUserId || !currentProfileId || !supabase) {
        return { ok: false, error: "Sign in to comment." };
      }

      const tempId = `tmp-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())}`;
      const embed = {
        handle: currentProfile?.handle ?? null,
        display_handle: currentProfile?.display_handle ?? null,
        display_name: currentProfile?.display_name ?? null,
        avatar_r2_key: currentProfile?.avatar_r2_key ?? null,
        goals: currentProfile?.goals ?? null,
        user_id: currentProfile?.user_id ?? currentUserId,
      };
      const tempRow = {
        id: tempId,
        post_id: postId,
        user_id: currentUserId,
        profile_id: currentProfileId,
        parent_comment_id: parentCommentId,
        body: trimmed,
        like_count: 0,
        reply_count: 0,
        created_at: new Date().toISOString(),
        member_profiles: embed,
        __optimistic: true,
      };

      if (parentCommentId) {
        setRepliesByParent((prev) => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] ?? []), tempRow],
        }));
        setTopLevel((prev) =>
          prev.map((c) =>
            c && c.id === parentCommentId
              ? { ...c, reply_count: (Number(c.reply_count) || 0) + 1 }
              : c
          )
        );
      } else {
        setTopLevel((prev) => [tempRow, ...prev]);
      }

      const { data, error: err } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          profile_id: currentProfileId,
          parent_comment_id: parentCommentId,
          body: trimmed,
        })
        .select(SELECT_COLS)
        .single();

      if (cancelledRef.current) return { ok: true };

      if (err || !data) {
        if (parentCommentId) {
          setRepliesByParent((prev) => {
            const list = prev[parentCommentId] ?? [];
            return {
              ...prev,
              [parentCommentId]: list.filter((c) => c?.id !== tempId),
            };
          });
          setTopLevel((prev) =>
            prev.map((c) =>
              c && c.id === parentCommentId
                ? {
                    ...c,
                    reply_count: Math.max(0, (Number(c.reply_count) || 0) - 1),
                  }
                : c
            )
          );
        } else {
          setTopLevel((prev) => prev.filter((c) => c?.id !== tempId));
        }
        return { ok: false, error: err?.message || "Could not post comment." };
      }

      if (parentCommentId) {
        setRepliesByParent((prev) => {
          const list = prev[parentCommentId] ?? [];
          return {
            ...prev,
            [parentCommentId]: list.map((c) => (c?.id === tempId ? data : c)),
          };
        });
      } else {
        setTopLevel((prev) => prev.map((c) => (c?.id === tempId ? data : c)));
      }
      return { ok: true };
    },
    [postId, currentUserId, currentProfileId, currentProfile]
  );

  /**
   * Optimistically remove a comment and return `{ commit, undo }` so the caller
   * can hand them to `dispatchDeferredDelete`. Does NOT touch supabase itself.
   *
   * Replies: also decrement the parent top-level's `reply_count` optimistically,
   * and restore it on undo. Top-level comments with pre-loaded children cascade
   * client-side (children are snapshotted + restored on undo; the DB's
   * `ON DELETE CASCADE` chain takes care of the server side on commit).
   *
   * @param {string} commentId
   * @param {string | null} parentCommentId `null` for top-level comments
   * @returns {{ commit: () => Promise<void>, undo: () => void } | null}
   */
  const deleteComment = useCallback(
    (commentId, parentCommentId = null) => {
      if (!commentId || !supabase) return null;

      if (parentCommentId) {
        /** @type {any | null} */
        let removedRow = null;
        let removedIdx = -1;
        setRepliesByParent((prev) => {
          const list = prev[parentCommentId] ?? [];
          const idx = list.findIndex((c) => c && c.id === commentId);
          if (idx < 0) return prev;
          removedRow = list[idx];
          removedIdx = idx;
          const next = list.slice();
          next.splice(idx, 1);
          return { ...prev, [parentCommentId]: next };
        });
        setTopLevel((prev) =>
          prev.map((c) =>
            c && c.id === parentCommentId
              ? { ...c, reply_count: Math.max(0, (Number(c.reply_count) || 0) - 1) }
              : c
          )
        );
        return {
          commit: async () => {
            try {
              await supabase.from("comments").delete().eq("id", commentId);
            } catch {
              /* ignore — UI already optimistic */
            }
          },
          undo: () => {
            if (!removedRow || removedIdx < 0) return;
            setRepliesByParent((prev) => {
              const list = prev[parentCommentId] ?? [];
              if (list.some((c) => c && c.id === commentId)) return prev;
              const next = list.slice();
              const at = Math.max(0, Math.min(removedIdx, next.length));
              next.splice(at, 0, removedRow);
              return { ...prev, [parentCommentId]: next };
            });
            setTopLevel((prev) =>
              prev.map((c) =>
                c && c.id === parentCommentId
                  ? { ...c, reply_count: (Number(c.reply_count) || 0) + 1 }
                  : c
              )
            );
          },
        };
      }

      /** @type {any | null} */
      let removedTop = null;
      let removedTopIdx = -1;
      /** @type {any[] | undefined} */
      let removedReplies;
      setTopLevel((prev) => {
        const idx = prev.findIndex((c) => c && c.id === commentId);
        if (idx < 0) return prev;
        removedTop = prev[idx];
        removedTopIdx = idx;
        const next = prev.slice();
        next.splice(idx, 1);
        return next;
      });
      setRepliesByParent((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, commentId)) return prev;
        removedReplies = prev[commentId];
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return {
        commit: async () => {
          try {
            await supabase.from("comments").delete().eq("id", commentId);
          } catch {
            /* ignore — UI already optimistic */
          }
        },
        undo: () => {
          if (!removedTop || removedTopIdx < 0) return;
          setTopLevel((prev) => {
            if (prev.some((c) => c && c.id === commentId)) return prev;
            const next = prev.slice();
            const at = Math.max(0, Math.min(removedTopIdx, next.length));
            next.splice(at, 0, removedTop);
            return next;
          });
          if (removedReplies !== undefined) {
            const replies = removedReplies;
            setRepliesByParent((prev) => {
              if (Object.prototype.hasOwnProperty.call(prev, commentId)) return prev;
              return { ...prev, [commentId]: replies };
            });
          }
        },
      };
    },
    []
  );

  return {
    topLevel,
    repliesByParent,
    repliesLoading,
    hasMore,
    status,
    error,
    loadInitial,
    loadMore,
    loadReplies,
    post,
    deleteComment,
  };
}
