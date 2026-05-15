import { useEffect, useRef, useState } from "react";
import LikeButton from "../Likes/LikeButton.jsx";
import LikersRow from "../Likes/LikersRow.jsx";
import LikersModal from "../Likes/LikersModal.jsx";
import CommentComposer from "./CommentComposer.jsx";
import CommentMenuButton from "./CommentMenuButton.jsx";
import { dispatchDeferredDelete } from "../DeleteUndoToast.jsx";
import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../../lib/openPublicProfile.js";
import { formatTimeAgo } from "../../lib/formatTime.js";
import { HashtagText } from "../HashtagText.jsx";

/**
 * Single comment row with avatar + handle + body + footer (like button,
 * likers row, reply toggle, view-replies toggle for top-level comments).
 *
 * Depth-2 constraint from the DB is mirrored in the UI:
 *   - Top-level comments (`canReply = true`): show a Reply button and a
 *     "View N replies" expander when `reply_count > 0`.
 *   - Reply rows (`canReply = false`): no Reply button, no nested
 *     expander. They render indented 32px with a muted left border.
 *
 * Optimistic rows (id starts with `tmp-`) hide LikeButton / LikersRow
 * since the server id doesn't exist yet. The row is replaced in-place
 * by `useComments.post` once the INSERT resolves.
 *
 * @param {{
 *   comment: any,
 *   postId: string,
 *   currentUserId: string | null,
 *   currentProfileId: string | null,
 *   currentProfile: any,
 *   currentProfileGoals: unknown,
 *   canReply: boolean,
 *   replies?: any[] | null,
 *   repliesLoading?: boolean,
 *   onLoadReplies?: () => void,
 *   onPostReply?: (body: string, parentCommentId: string) => Promise<any>,
 *   onDeleteComment?: (commentId: string, parentCommentId: string | null) => { commit: () => Promise<void>, undo: () => void } | null,
 *   highlightCommentId?: string | null,
 * }} props
 */
export default function CommentItem({
  comment,
  postId,
  currentUserId,
  currentProfileId,
  currentProfile,
  currentProfileGoals,
  canReply,
  replies = null,
  repliesLoading = false,
  onLoadReplies,
  onPostReply,
  onDeleteComment,
  highlightCommentId = null,
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [highlightActive, setHighlightActive] = useState(false);
  const rowRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const highlightedRef = useRef(false);

  const mp = comment?.member_profiles ?? null;
  const handle = typeof mp?.handle === "string" ? mp.handle : "";
  const displayName =
    typeof mp?.display_name === "string" && mp.display_name.trim()
      ? mp.display_name.trim()
      : "Member";
  const avatarKey = typeof mp?.avatar_r2_key === "string" ? mp.avatar_r2_key.trim() : "";
  const avatarUrl = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";
  const handleLabel = handle ? formatHandleDisplay(handle, mp?.display_handle) : "";
  const body = typeof comment?.body === "string" ? comment.body : "";
  const createdAt = typeof comment?.created_at === "string" ? comment.created_at : "";

  const commentId = typeof comment?.id === "string" ? comment.id : "";
  const isOptimistic = !!comment?.__optimistic || commentId.startsWith("tmp-");
  const commentOwnerUserId =
    typeof comment?.user_id === "string" ? comment.user_id : null;

  useEffect(() => {
    if (!highlightCommentId || !commentId || highlightedRef.current) return;
    if (highlightCommentId !== commentId) return;
    highlightedRef.current = true;
    setHighlightActive(true);
    const scrollTimer = window.setTimeout(() => {
      try {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        /* ignore */
      }
    }, 50);
    const clearTimer = window.setTimeout(() => setHighlightActive(false), 2400);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightCommentId, commentId]);

  const replyCount = Number(comment?.reply_count) || 0;
  const hasLoadedReplies = Array.isArray(replies);
  const visibleReplies = repliesExpanded && hasLoadedReplies ? replies : [];

  const handleToggleReplies = () => {
    if (!canReply) return;
    if (!hasLoadedReplies) {
      setRepliesExpanded(true);
      if (typeof onLoadReplies === "function") {
        onLoadReplies();
      }
      return;
    }
    setRepliesExpanded((v) => !v);
  };

  const handleHandleClick = () => {
    if (handle) openPublicMemberProfile(handle);
  };

  const handlePostReply = async (body) => {
    if (typeof onPostReply !== "function" || !commentId) {
      return { ok: false, error: "Cannot reply." };
    }
    const parentId = canReply ? commentId : comment?.parent_comment_id;
    if (!parentId) return { ok: false, error: "Cannot reply." };
    const result = await onPostReply(body, parentId);
    if (result?.ok) setReplyOpen(false);
    return result;
  };

  return (
    <div
      ref={rowRef}
      data-highlight={highlightActive ? "true" : undefined}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: highlightActive ? "4px 6px" : 0,
        margin: highlightActive ? "-4px -6px" : 0,
        borderRadius: highlightActive ? 6 : 0,
        background: highlightActive ? "var(--color-accent-subtle-0e)" : "transparent",
        transition: "background 400ms ease, padding 0ms, margin 0ms",
      }}
    >
      <button
        type="button"
        onClick={handleHandleClick}
        disabled={!handle}
        aria-label={handle ? `Open ${handleLabel}'s profile` : "Member avatar"}
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid var(--color-border-default)",
          padding: 0,
          background: "var(--color-bg-hover)",
          overflow: "hidden",
          cursor: handle ? "pointer" : "default",
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
      </button>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleHandleClick}
            disabled={!handle}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              font: "inherit",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontSize: 14,
              cursor: handle ? "pointer" : "default",
              textAlign: "left",
            }}
          >
            {displayName}
          </button>
          {handleLabel ? (
            <button
              type="button"
              onClick={handleHandleClick}
              className="mono"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                fontSize: 12,
                color: "var(--color-accent)",
                cursor: "pointer",
              }}
            >
              {handleLabel}
            </button>
          ) : null}
          {createdAt ? (
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: "auto" }}
            >
              {formatTimeAgo(createdAt)}
            </span>
          ) : null}
          {!isOptimistic && commentId && commentOwnerUserId ? (
            <CommentMenuButton
              commentId={commentId}
              commentUserId={commentOwnerUserId}
              currentUserId={currentUserId}
              onDeferredDelete={() => {
                if (typeof onDeleteComment !== "function") return;
                const parentId = canReply ? null : comment?.parent_comment_id ?? null;
                const handlers = onDeleteComment(commentId, parentId);
                if (!handlers) return;
                dispatchDeferredDelete({
                  label: "Comment deleted",
                  onCommit: handlers.commit,
                  onUndo: handlers.undo,
                });
              }}
            />
          ) : null}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            color: "var(--color-text-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <HashtagText
            text={body}
            onMentionNavigate={(h) => openPublicMemberProfile(h)}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 2,
          }}
        >
          {!isOptimistic && commentId ? (
            <>
              <LikeButton
                entityType="comment"
                entityId={commentId}
                currentUserId={currentUserId}
                currentProfileId={currentProfileId}
                currentProfileGoals={currentProfileGoals}
                ownerUserId={commentOwnerUserId}
                size={16}
              />
              <LikersRow
                entityType="comment"
                entityId={commentId}
                currentUserId={currentUserId}
                currentProfileId={currentProfileId}
                currentProfileGoals={currentProfileGoals}
                onOpenModal={() => setLikersOpen(true)}
              />
            </>
          ) : null}

          {canReply && currentUserId && currentProfileId ? (
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                padding: "2px 0",
                margin: 0,
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                font: "inherit",
              }}
            >
              {replyOpen ? "Cancel" : "Reply"}
            </button>
          ) : null}
        </div>

        {canReply && replyCount > 0 ? (
          <button
            type="button"
            onClick={handleToggleReplies}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "none",
              padding: "2px 0",
              margin: 0,
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: 12,
              font: "inherit",
            }}
          >
            {repliesExpanded && hasLoadedReplies
              ? "Hide replies"
              : repliesLoading
                ? "Loading replies…"
                : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
          </button>
        ) : null}

        {canReply && replyOpen && currentUserId && currentProfileId ? (
          <div style={{ marginTop: 4 }}>
            <CommentComposer
              hook={{ post: (args) => handlePostReply(args.body) }}
              currentUserId={currentUserId}
              currentProfileId={currentProfileId}
              placeholder="Write a reply…"
              initialValue={handle ? `@${handle} ` : ""}
              autoFocus
              compact
            />
          </div>
        ) : null}

        {repliesExpanded && visibleReplies.length > 0 ? (
          <div
            style={{
              marginTop: 10,
              paddingLeft: 12,
              borderLeft: "2px solid var(--color-border-default)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {visibleReplies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                currentUserId={currentUserId}
                currentProfileId={currentProfileId}
                currentProfile={currentProfile}
                currentProfileGoals={currentProfileGoals}
                canReply={false}
                onPostReply={onPostReply}
                onDeleteComment={onDeleteComment}
                highlightCommentId={highlightCommentId}
              />
            ))}
          </div>
        ) : null}
      </div>

      {!isOptimistic && commentId ? (
        <LikersModal
          isOpen={likersOpen}
          onClose={() => setLikersOpen(false)}
          entityType="comment"
          entityId={commentId}
        />
      ) : null}
    </div>
  );
}
