import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";
import { formatTimeAgo } from "../../lib/formatTime.js";
import { openPublicMemberProfile } from "../../lib/openPublicProfile.js";
import { dispatchDeferredDelete } from "../DeleteUndoToast.jsx";
import { HashtagText } from "../HashtagText.jsx";

/**
 * Instagram-style inline preview rows (Network feed cards only).
 * Renders up to 2 top-level comments with timestamps, colored
 * @handle / #hashtag bodies, and a delete button for own comments.
 * Expanding to the full CommentThread is handled by CommentsSection.
 *
 * @param {{
 *   comments: any[],
 *   currentUserId?: string | null,
 *   onDeleteComment?: (commentId: string, parentCommentId: string | null) => { commit: () => Promise<void>, undo: () => void } | null,
 * }} props
 */
export default function CommentPreview({ comments, currentUserId = null, onDeleteComment }) {
  if (!Array.isArray(comments) || comments.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {comments.map((comment, idx) => (
        <PreviewRow
          key={typeof comment?.id === "string" ? comment.id : `comment-preview-${idx}`}
          comment={comment}
          currentUserId={currentUserId}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
}

/** @param {{ comment: any, currentUserId: string | null, onDeleteComment?: Function }} props */
function PreviewRow({ comment, currentUserId, onDeleteComment }) {
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
  const isOwn = !isOptimistic && !!currentUserId && comment?.user_id === currentUserId;

  const handleClick = () => {
    if (handle) openPublicMemberProfile(handle);
  };

  const handleDelete = () => {
    if (!isOwn || typeof onDeleteComment !== "function" || !commentId) return;
    const handlers = onDeleteComment(commentId, null);
    if (!handlers) return;
    dispatchDeferredDelete({
      label: "Comment deleted",
      onCommit: handlers.commit,
      onUndo: handlers.undo,
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!handle}
        aria-label={handle ? `Open ${displayName}'s profile` : undefined}
        style={{
          flexShrink: 0,
          width: 26,
          height: 26,
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

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          <button
            type="button"
            onClick={handleClick}
            disabled={!handle}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              font: "inherit",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              cursor: handle ? "pointer" : "default",
              lineHeight: 1.3,
            }}
          >
            {handleLabel ? (handleLabel.startsWith("@") ? handleLabel : `@${handleLabel}`) : displayName}
          </button>
          {createdAt ? (
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.3 }}
            >
              {formatTimeAgo(createdAt)}
            </span>
          ) : null}
        </div>

        {body ? (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.4,
              color: "var(--color-text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <HashtagText text={body} onMentionNavigate={(h) => openPublicMemberProfile(h)} />
          </div>
        ) : null}
      </div>

      {isOwn ? (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete comment"
          title="Delete comment"
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            padding: "2px 4px",
            margin: 0,
            cursor: "pointer",
            color: "var(--color-text-muted)",
            fontSize: 14,
            lineHeight: 1,
            borderRadius: 4,
            opacity: 0.6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
