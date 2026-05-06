import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";

/**
 * Instagram-style inline preview rows (Network feed cards only).
 * No timestamps or actions — expanded CommentThread owns those.
 *
 * @param {{ comments: any[] }} props
 */
export default function CommentPreview({ comments }) {
  if (!Array.isArray(comments) || comments.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {comments.map((comment, idx) => (
        <PreviewRow
          key={typeof comment?.id === "string" ? comment.id : `comment-preview-${idx}`}
          comment={comment}
        />
      ))}
    </div>
  );
}

/** @param {{ comment: any }} props */
function PreviewRow({ comment }) {
  const mp = comment?.member_profiles ?? null;
  const handle = typeof mp?.handle === "string" ? mp.handle : "";
  const displayName =
    typeof mp?.display_name === "string" && mp.display_name.trim() ? mp.display_name.trim() : "Member";
  const avatarKey = typeof mp?.avatar_r2_key === "string" ? mp.avatar_r2_key.trim() : "";
  const avatarUrl = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";
  const handleLabel = handle ? formatHandleDisplay(handle, mp?.display_handle) : "";
  const body = typeof comment?.body === "string" ? comment.body : "";
  const handleForDisplay = handleLabel ? (handleLabel.startsWith("@") ? handleLabel : `@${handleLabel}`) : displayName;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.35 }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          draggable={false}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid var(--color-border-default)",
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            flexShrink: 0,
            background: "var(--color-bg-hover)",
            border: "1px solid var(--color-border-default)",
          }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{handleForDisplay}</span>
        {body ? (
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>
            {" "}
            {body}
          </span>
        ) : null}
      </div>
    </div>
  );
}
