import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../../lib/openPublicProfile.js";
import { Modal } from "../Modal.jsx";
import { DEFAULT_LIKE_EMOJI } from "../../lib/goalEmoji.js";

/**
 * Modal showing everyone who liked a post or comment, grouped by goal emoji.
 *
 * Data is loaded via the get_post_likers / get_comment_likers RPCs
 * (migration 074), which are SECURITY DEFINER and bypass member_profiles
 * RLS. Visibility is gated on the parent post inside the function body —
 * the post must be visible_profile=true, visible_network=true, or owned
 * by the caller. This replaces the prior `member_profiles!inner(...)`
 * embed that silently dropped likers whose member_profiles rows were
 * hidden by RLS.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   entityType: 'post' | 'comment',
 *   entityId: string,
 * }} props
 */
export default function LikersModal({ isOpen, onClose, entityType, entityId }) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [status, setStatus] = useState(/** @type {"idle"|"loading"|"success"|"error"} */ ("idle"));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !entityId || !supabase) return;
    let cancelled = false;
    setStatus("loading");
    setError("");
    void (async () => {
      const rpcName = entityType === "post" ? "get_post_likers" : "get_comment_likers";
      const paramKey = entityType === "post" ? "p_post_id" : "p_comment_id";

      const { data, error: err } = await supabase.rpc(rpcName, {
        [paramKey]: entityId,
      });
      if (cancelled) return;
      if (err) {
        setStatus("error");
        setError(err.message || "Could not load likers.");
        return;
      }
      setRows(Array.isArray(data) ? data : []);
      setStatus("success");
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, entityId, entityType]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const emoji = (typeof r?.liker_goal_emoji === "string" && r.liker_goal_emoji) || DEFAULT_LIKE_EMOJI;
      if (!map.has(emoji)) map.set(emoji, []);
      map.get(emoji).push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth={560} label="Likers">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="brand" style={{ margin: 0, fontSize: 22 }}>
          Liked by
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            minWidth: 36,
            minHeight: 36,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-hover)",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: "62vh", overflowY: "auto", borderTop: "1px solid var(--color-border-default)" }}>
        {status === "loading" ? (
          <p style={{ margin: "12px 0", color: "var(--color-text-secondary)" }}>Loading…</p>
        ) : null}
        {status === "error" ? (
          <p style={{ margin: "12px 0", color: "var(--color-warning)" }}>{error || "Could not load likers."}</p>
        ) : null}
        {status === "success" && rows.length === 0 ? (
          <p style={{ margin: "12px 0", color: "var(--color-text-secondary)" }}>No likes yet.</p>
        ) : null}
        {status === "success" && grouped.length > 0
          ? grouped.map(([emoji, groupRows]) => (
              <div key={emoji} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-border-default)" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 0 8px",
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span aria-hidden style={{ fontSize: 18 }}>
                    {emoji}
                  </span>
                  <span>
                    {groupRows.length} {groupRows.length === 1 ? "liker" : "likers"}
                  </span>
                </div>
                {groupRows.map((row) => {
                  const handle = typeof row?.handle === "string" ? row.handle : "";
                  const displayName = typeof row?.display_name === "string" ? row.display_name.trim() : "";
                  const avatarKey = typeof row?.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";
                  const avatar = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";
                  const canClick = Boolean(handle);
                  return (
                    <div
                      key={row.like_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "32px 1fr",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!canClick) return;
                          onClose();
                          openPublicMemberProfile(handle);
                        }}
                        disabled={!canClick}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: "1px solid var(--color-border-default)",
                          padding: 0,
                          background: "var(--color-bg-hover)",
                          overflow: "hidden",
                          cursor: canClick ? "pointer" : "default",
                        }}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canClick) return;
                          onClose();
                          openPublicMemberProfile(handle);
                        }}
                        disabled={!canClick}
                        style={{
                          border: "none",
                          background: "transparent",
                          textAlign: "left",
                          padding: 0,
                          cursor: canClick ? "pointer" : "default",
                        }}
                      >
                        <div style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: 14 }}>
                          {displayName || "Member"}
                        </div>
                        {handle ? (
                          <div className="mono" style={{ color: "var(--color-accent)", fontSize: 12 }}>
                            {formatHandleDisplay(handle, row?.display_handle)}
                          </div>
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          : null}
      </div>
    </Modal>
  );
}
