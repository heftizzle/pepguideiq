import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../../lib/openPublicProfile.js";
import { Modal } from "../Modal.jsx";
import { DEFAULT_LIKE_EMOJI } from "../../lib/goalEmoji.js";

/**
 * Modal showing everyone who liked a post or comment, grouped by goal emoji
 * (tribe-based social proof: 🧬 Longevity · 6, 🔥 Shred · 3, ...).
 *
 * Grouped view lists each emoji as a section header with the goal's likers
 * underneath; handles are clickable and navigate to the public profile.
 *
 * NOTE on visibility: the `post_likes` / `comment_likes` table has a
 * cascading-EXISTS SELECT policy through `posts`, so anon + authenticated
 * both read the `liker_goal_emoji` and count. The embedded `member_profiles`
 * row, however, depends on that liker's RLS coverage (own-profile or
 * visible-network-post-author). When the embed is null we fall back to a
 * generic "Member" row — the grouped emoji strip still conveys the social
 * proof. A follow-up Phase 2/3 migration could replace this with a
 * `SECURITY DEFINER` RPC that always resolves display fields.
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

  const table = entityType === "post" ? "post_likes" : "comment_likes";
  const fkColumn = entityType === "post" ? "post_id" : "comment_id";

  useEffect(() => {
    if (!isOpen || !entityId || !supabase) return;
    let cancelled = false;
    setStatus("loading");
    setError("");
    void (async () => {
      const { data, error: err } = await supabase
        .from(table)
        .select(
          "id, liker_goal_emoji, created_at, profile_id, member_profiles!inner(handle, display_handle, display_name, avatar_r2_key)"
        )
        .eq(fkColumn, entityId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (err) {
        const { data: bareData, error: bareErr } = await supabase
          .from(table)
          .select("id, liker_goal_emoji, created_at, profile_id")
          .eq(fkColumn, entityId)
          .order("created_at", { ascending: false })
          .limit(200);
        if (cancelled) return;
        if (bareErr) {
          setStatus("error");
          setError(bareErr.message || "Could not load likers.");
          return;
        }
        setRows(Array.isArray(bareData) ? bareData : []);
        setStatus("success");
        return;
      }
      setRows(Array.isArray(data) ? data : []);
      setStatus("success");
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, entityId, table, fkColumn]);

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
                  const mp = row?.member_profiles ?? null;
                  const handle = typeof mp?.handle === "string" ? mp.handle : "";
                  const displayName = typeof mp?.display_name === "string" ? mp.display_name.trim() : "";
                  const avatarKey = typeof mp?.avatar_r2_key === "string" ? mp.avatar_r2_key.trim() : "";
                  const avatar = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";
                  const canClick = Boolean(handle);
                  return (
                    <div
                      key={row.id}
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
                            {formatHandleDisplay(handle, mp?.display_handle)}
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
