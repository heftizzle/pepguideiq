import { useEffect, useMemo, useState } from "react";
import { fetchFollowers, fetchFollowing, getSessionAccessToken } from "../lib/supabase.js";
import { followMemberProfile, unfollowMemberProfile } from "../lib/follows.js";
import { resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";
import { formatHandleDisplay } from "../lib/memberProfileHandle.js";
import { getTier } from "../lib/tiers.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { Modal } from "./Modal.jsx";

const TAB_FOLLOWERS = "followers";
const TAB_FOLLOWING = "following";

function FollowersSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr auto",
            gap: 10,
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid var(--color-border-default)",
          }}
          aria-hidden
        >
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-bg-hover)" }} />
          <div>
            <div style={{ height: 12, width: "64%", borderRadius: 6, background: "var(--color-bg-hover)", marginBottom: 8 }} />
            <div style={{ height: 10, width: "44%", borderRadius: 6, background: "var(--color-bg-hover)" }} />
          </div>
          <div style={{ width: 88, height: 32, borderRadius: 8, background: "var(--color-bg-hover)" }} />
        </div>
      ))}
    </>
  );
}

/**
 * @param {{
 *   isOpen: boolean
 *   onClose: () => void
 *   targetProfileId: string | null
 *   viewerProfileId: string | null
 *   initialTab?: "followers" | "following"
 *   onCountsChange?: (next: { followerCount?: number, followingCount?: number }) => void
 * }} props
 */
export default function FollowersModal({
  isOpen,
  onClose,
  targetProfileId,
  viewerProfileId,
  initialTab = TAB_FOLLOWERS,
  onCountsChange,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusByTab, setStatusByTab] = useState({
    [TAB_FOLLOWERS]: "idle",
    [TAB_FOLLOWING]: "idle",
  });
  const [errorByTab, setErrorByTab] = useState({
    [TAB_FOLLOWERS]: "",
    [TAB_FOLLOWING]: "",
  });
  const [rowsByTab, setRowsByTab] = useState({
    [TAB_FOLLOWERS]: /** @type {any[]} */ ([]),
    [TAB_FOLLOWING]: /** @type {any[]} */ ([]),
  });
  const [pendingIds, setPendingIds] = useState(() => new Set());

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const loadTab = async (tab) => {
    if (!targetProfileId) return;
    if (statusByTab[tab] === "loading") return;
    if (statusByTab[tab] === "success") return;
    setStatusByTab((prev) => ({ ...prev, [tab]: "loading" }));
    setErrorByTab((prev) => ({ ...prev, [tab]: "" }));
    const loader = tab === TAB_FOLLOWERS ? fetchFollowers : fetchFollowing;
    const { rows, error } = await loader(targetProfileId);
    if (error) {
      setStatusByTab((prev) => ({ ...prev, [tab]: "error" }));
      setErrorByTab((prev) => ({ ...prev, [tab]: error.message || "Could not load list." }));
      return;
    }
    setRowsByTab((prev) => ({ ...prev, [tab]: Array.isArray(rows) ? rows : [] }));
    setStatusByTab((prev) => ({ ...prev, [tab]: "success" }));
  };

  useEffect(() => {
    if (!isOpen || !targetProfileId) return;
    void loadTab(activeTab);
  }, [isOpen, targetProfileId, activeTab]);

  const activeRows = rowsByTab[activeTab] ?? [];
  const activeStatus = statusByTab[activeTab];
  const activeError = errorByTab[activeTab];
  const isAuthed = Boolean(viewerProfileId);

  const emptyLabel =
    activeTab === TAB_FOLLOWERS ? "No followers yet." : "Not following anyone yet.";

  const toggleFollow = async (row) => {
    if (!isAuthed || !viewerProfileId || !isApiWorkerConfigured()) return;
    const profileId = typeof row?.id === "string" ? row.id : "";
    if (!profileId || profileId === viewerProfileId) return;
    if (pendingIds.has(profileId)) return;

    const next = !row.is_following_by_me;
    setPendingIds((prev) => new Set(prev).add(profileId));
    setRowsByTab((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).map((r) =>
        r.id === profileId ? { ...r, is_following_by_me: next } : r
      ),
    }));

    try {
      const token = await getSessionAccessToken();
      if (!token) throw new Error("Please sign in to follow members.");
      if (next) {
        await followMemberProfile(viewerProfileId, profileId, API_WORKER_URL, token);
      } else {
        await unfollowMemberProfile(viewerProfileId, profileId, API_WORKER_URL, token);
      }
      if (typeof onCountsChange === "function" && activeTab === TAB_FOLLOWING && targetProfileId === viewerProfileId) {
        onCountsChange({ followingCount: Math.max(0, (rowsByTab[TAB_FOLLOWING]?.length ?? 0) + (next ? 1 : -1)) });
      }
      if (targetProfileId === viewerProfileId && activeTab === TAB_FOLLOWING && !next) {
        setRowsByTab((prev) => ({
          ...prev,
          [TAB_FOLLOWING]: (prev[TAB_FOLLOWING] ?? []).filter((r) => r.id !== profileId),
        }));
      }
    } catch {
      setRowsByTab((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] ?? []).map((r) =>
          r.id === profileId ? { ...r, is_following_by_me: !next } : r
        ),
      }));
    } finally {
      setPendingIds((prev) => {
        const nextIds = new Set(prev);
        nextIds.delete(profileId);
        return nextIds;
      });
    }
  };

  const title = useMemo(() => (activeTab === TAB_FOLLOWERS ? "Followers" : "Following"), [activeTab]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth={580} label="Followers and following">
      <div style={{ marginBottom: 8 }}>
        <h2 className="brand" style={{ margin: 0, fontSize: 22 }}>
          {title}
        </h2>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className={activeTab === TAB_FOLLOWERS ? "btn-teal" : ""}
          onClick={() => setActiveTab(TAB_FOLLOWERS)}
          style={{ minHeight: 36, padding: "6px 12px", opacity: activeTab === TAB_FOLLOWERS ? 1 : 0.8 }}
        >
          Followers
        </button>
        <button
          type="button"
          className={activeTab === TAB_FOLLOWING ? "btn-teal" : ""}
          onClick={() => setActiveTab(TAB_FOLLOWING)}
          style={{ minHeight: 36, padding: "6px 12px", opacity: activeTab === TAB_FOLLOWING ? 1 : 0.8 }}
        >
          Following
        </button>
      </div>

      {!isAuthed ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: "0 0 12px", color: "var(--color-text-secondary)" }}>Sign in to view followers and following.</p>
          <button
            type="button"
            className="btn-teal"
            onClick={() => {
              onClose();
              window.location.assign("/");
            }}
          >
            Sign in
          </button>
        </div>
      ) : (
        <div style={{ maxHeight: "62vh", overflowY: "auto", borderTop: "1px solid var(--color-border-default)" }}>
          {activeStatus === "loading" ? <FollowersSkeletonRows /> : null}
          {activeStatus === "error" ? (
            <p style={{ margin: "12px 0", color: "var(--color-warning)" }}>{activeError || "Could not load list."}</p>
          ) : null}
          {activeStatus === "success" && activeRows.length === 0 ? (
            <p style={{ margin: "12px 0", color: "var(--color-text-secondary)" }}>{emptyLabel}</p>
          ) : null}
          {activeStatus === "success"
            ? activeRows.map((row) => {
                const profileId = typeof row?.id === "string" ? row.id : "";
                const handle = typeof row?.handle === "string" ? row.handle : "";
                const displayName = typeof row?.display_name === "string" ? row.display_name.trim() : "";
                const avatarKey = typeof row?.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";
                const avatar = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";
                const tier = getTier(typeof row?.plan === "string" ? row.plan.trim().toLowerCase() : "entry");
                const busy = pendingIds.has(profileId);
                const iFollow = Boolean(row?.is_following_by_me);
                const canToggle = profileId && profileId !== viewerProfileId;
                return (
                  <div
                    key={profileId || handle}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr auto",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--color-border-default)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openPublicMemberProfile(handle);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "1px solid var(--color-border-default)",
                        padding: 0,
                        background: "var(--color-bg-hover)",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openPublicMemberProfile(handle);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                        <span aria-hidden>{tier.emoji} </span>
                        {displayName || "Member"}
                      </div>
                      <div className="mono" style={{ color: "var(--color-accent)", fontSize: 12 }}>
                        {formatHandleDisplay(handle, row?.display_handle)}
                      </div>
                    </button>
                    <button
                      type="button"
                      className={iFollow ? "btn-green" : "btn-teal"}
                      disabled={busy || !canToggle}
                      onClick={() => void toggleFollow(row)}
                      style={{ minHeight: 34, padding: "6px 10px", whiteSpace: "nowrap", opacity: canToggle ? 1 : 0.6 }}
                    >
                      {busy ? "…" : iFollow ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })
            : null}
        </div>
      )}
    </Modal>
  );
}
