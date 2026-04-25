import { useCallback, useEffect, useState } from "react";
import { GlobalStyles } from "./GlobalStyles.jsx";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import { fetchPublicMemberProfileByHandle } from "../lib/publicMemberProfile.js";
import { fetchMemberProfiles, getCurrentUser, getSessionAccessToken } from "../lib/supabase.js";
import { formatHandleDisplay, normalizeHandleInput } from "../lib/memberProfileHandle.js";
import { formatCompactNumber } from "../lib/format.js";
import { formatMemberProfileLocation, formatShiftScheduleLabel } from "../lib/memberProfileMeta.js";
import { publicProfileGoalLabel } from "../data/publicProfileGoalLabels.js";
import { followMemberProfile, getMyFollowing, unfollowMemberProfile } from "../lib/follows.js";
import { buildStackShareUrl } from "../lib/stackShare.js";
import { resolveMemberAvatarDisplayUrl, resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";
import { MemberProfileSocialIconRow } from "./MemberProfileSocialIcons.jsx";
import { PublicProfileFastingBlock } from "./PublicProfileFastingBlock.jsx";
import FollowersModal from "./FollowersModal.jsx";
import PublicProfilePhotoGrid from "./PublicProfilePhotoGrid.jsx";
import { TIERS, tierAccentCssVar } from "../lib/tiers.js";

function tierEmoji(t) {
  const k = String(t ?? "").toLowerCase();
  return (TIERS[k] ?? TIERS.entry).emoji;
}

function initialsFromProfile(displayName, handle) {
  const name = String(displayName ?? "").trim();
  if (name) return name.slice(0, 2).toUpperCase();
  const h = String(handle ?? "").trim();
  return h ? h.slice(0, 2).toUpperCase() : "?";
}

/** @param {unknown} goals */
function parseGoalIds(goals) {
  if (Array.isArray(goals)) {
    return goals.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (typeof goals === "string") {
    return goals.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** @returns {{ postId: string | null; commentId: string | null }} */
function readPostQueryFromWindow() {
  if (typeof window === "undefined") return { postId: null, commentId: null };
  try {
    const qs = new URLSearchParams(window.location.search);
    const p = (qs.get("post") || "").trim();
    const c = (qs.get("comment") || "").trim();
    return { postId: p || null, commentId: c || null };
  } catch {
    return { postId: null, commentId: null };
  }
}

/**
 * Read-only public profile for `/profile/:handle` (standalone or in-app overlay).
 * @param {{
 *   handle: string,
 *   onClose: () => void,
 *   viewerActiveProfileId?: string | null,
 *   viewerAccessToken?: string | null,
 *   includeGlobalStyles?: boolean,
 * }} props
 */
export function PublicMemberProfilePage({
  handle,
  onClose,
  viewerActiveProfileId = null,
  viewerAccessToken = null,
  includeGlobalStyles = true,
}) {
  const workerUrl = typeof API_WORKER_URL === "string" ? API_WORKER_URL.trim() : "";
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(/** @type {string | null} */ (null));
  const [profile, setProfile] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState(/** @type {"followers" | "following"} */ ("followers"));
  /** Cold `/profile/:handle` (main.jsx): recover session when parent did not pass viewer props. */
  const [bootstrapProfileId, setBootstrapProfileId] = useState(/** @type {string | null} */ (null));
  const [bootstrapToken, setBootstrapToken] = useState(/** @type {string | null} */ (null));
  /** `/profile/:handle?post=<id>&comment=<cid>` deep-link into the photo-grid lightbox. */
  const [initialPostId, setInitialPostId] = useState(
    /** @type {string | null} */ (() => readPostQueryFromWindow().postId)
  );
  const [initialCommentId, setInitialCommentId] = useState(
    /** @type {string | null} */ (() => readPostQueryFromWindow().commentId)
  );

  const effectiveViewerProfileId =
    typeof viewerActiveProfileId === "string" && viewerActiveProfileId.trim()
      ? viewerActiveProfileId.trim()
      : bootstrapProfileId;
  const effectiveViewerToken =
    typeof viewerAccessToken === "string" && viewerAccessToken.trim() ? viewerAccessToken : bootstrapToken;

  useEffect(() => {
    if (typeof viewerActiveProfileId === "string" && viewerActiveProfileId.trim()) return;
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const u = await getCurrentUser();
        if (!u?.id || cancelled) return;
        const token = await getSessionAccessToken();
        const { profiles } = await fetchMemberProfiles(u.id);
        const list = Array.isArray(profiles) ? profiles : [];
        const def = list.find((p) => p && p.is_default) ?? list[0];
        const pid = def && typeof def.id === "string" ? def.id : null;
        if (!cancelled) {
          setBootstrapToken(token ?? null);
          setBootstrapProfileId(pid);
        }
      } catch {
        if (!cancelled) {
          setBootstrapToken(null);
          setBootstrapProfileId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerActiveProfileId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setProfile(null);
    void (async () => {
      if (!isApiWorkerConfigured() || !workerUrl) {
        if (!cancelled) {
          setErr("Member profiles require the API worker (VITE_API_WORKER_URL).");
          setLoading(false);
        }
        return;
      }
      const { profile: p, error } = await fetchPublicMemberProfileByHandle(workerUrl, handle);
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }
      if (!p) {
        setErr("No member found with that handle.");
        setLoading(false);
        return;
      }
      setProfile(p);
      setFollowerCount(Number.isFinite(Number(p?.follower_count)) ? Number(p.follower_count) : 0);
      setFollowingCount(Number.isFinite(Number(p?.following_count)) ? Number(p.following_count) : 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, workerUrl]);

  useEffect(() => {
    if (!effectiveViewerProfileId || !effectiveViewerToken || !profile?.id || !workerUrl) return;
    if (effectiveViewerProfileId === profile.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await getMyFollowing(effectiveViewerProfileId, workerUrl, effectiveViewerToken);
        if (!cancelled) setFollowing(s.has(String(profile.id)));
      } catch {
        if (!cancelled) setFollowing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveViewerProfileId, effectiveViewerToken, profile?.id, workerUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const normalizedHandle = normalizeHandleInput(handle ?? "");
    const syncFromWindow = () => {
      const { postId, commentId } = readPostQueryFromWindow();
      setInitialPostId(postId);
      setInitialCommentId(commentId);
    };
    syncFromWindow();
    const onPopState = () => syncFromWindow();
    const onOpenPost = (
      /** @type {CustomEvent<{ handle?: string; postId?: string; commentId?: string | null }>} */ event
    ) => {
      const evHandle = normalizeHandleInput(event?.detail?.handle ?? "");
      if (!normalizedHandle || evHandle !== normalizedHandle) return;
      const pid = typeof event?.detail?.postId === "string" ? event.detail.postId.trim() : "";
      const cidRaw = event?.detail?.commentId;
      const cid = typeof cidRaw === "string" ? cidRaw.trim() : "";
      if (!pid) return;
      setInitialPostId(pid);
      setInitialCommentId(cid || null);
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pepguide:open-post", onOpenPost);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pepguide:open-post", onOpenPost);
    };
  }, [handle]);

  useEffect(() => {
    if (!profile?.id || typeof window === "undefined") return;
    const profileId = String(profile.id);
    const onFollowsChanged = (event) => {
      const detail = event?.detail ?? {};
      const followerProfileId = typeof detail.followerProfileId === "string" ? detail.followerProfileId : "";
      const followingProfileId = typeof detail.followingProfileId === "string" ? detail.followingProfileId : "";
      const isFollowing = Boolean(detail.isFollowing);
      if (followingProfileId === profileId) {
        setFollowerCount((prev) => Math.max(0, prev + (isFollowing ? 1 : -1)));
      }
      if (followerProfileId === profileId) {
        setFollowingCount((prev) => Math.max(0, prev + (isFollowing ? 1 : -1)));
      }
    };
    window.addEventListener("pepguide:follows-changed", onFollowsChanged);
    return () => {
      window.removeEventListener("pepguide:follows-changed", onFollowsChanged);
    };
  }, [profile?.id]);

  const toggleFollow = useCallback(async () => {
    if (!profile?.id || !effectiveViewerProfileId || !effectiveViewerToken || !workerUrl) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await followMemberProfile(effectiveViewerProfileId, String(profile.id), workerUrl, effectiveViewerToken);
      } else {
        await unfollowMemberProfile(effectiveViewerProfileId, String(profile.id), workerUrl, effectiveViewerToken);
      }
    } catch {
      setFollowing(!next);
    } finally {
      setFollowBusy(false);
    }
  }, [profile?.id, effectiveViewerProfileId, effectiveViewerToken, workerUrl, following]);

  const showFollow =
    Boolean(effectiveViewerProfileId && effectiveViewerToken && profile?.id && effectiveViewerProfileId !== profile.id);

  const bio = typeof profile?.bio === "string" ? profile.bio.trim() : "";
  const exp = typeof profile?.experience_level === "string" ? profile.experience_level.trim() : "";
  const goalIds = parseGoalIds(profile?.goals);
  const handleLine = profile ? formatHandleDisplay(profile.handle, profile.display_handle) : "";
  const dispName = typeof profile?.display_name === "string" ? profile.display_name.trim() : "";
  const avKey = typeof profile?.avatar_r2_key === "string" ? profile.avatar_r2_key.trim() : "";
  const avLegacy = typeof profile?.avatar_url === "string" ? profile.avatar_url.trim() : "";
  const av = avKey ? resolveMemberAvatarDisplayUrlFromKey(avKey) : resolveMemberAvatarDisplayUrl(avLegacy);
  const plan = typeof profile?.plan === "string" ? profile.plan.trim().toLowerCase() : "entry";
  const locationLine = formatMemberProfileLocation(profile);
  const shiftLabel = formatShiftScheduleLabel(profile?.shift_schedule);
  const publicStackShareId =
    typeof profile?.public_stack_share_id === "string" && profile.public_stack_share_id.trim()
      ? profile.public_stack_share_id.trim()
      : "";

  const inner = (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "var(--color-bg-page)",
        color: "var(--color-text-primary)",
        fontFamily: "'Outfit', sans-serif",
        padding: "max(48px, env(safe-area-inset-top)) 20px 48px",
        maxWidth: 520,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <button
        type="button"
        className="guide-takeover-close"
        style={{ zIndex: 72 }}
        onClick={onClose}
        aria-label="Close profile"
      >
        ×
      </button>

      <div className="brand" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        <span style={{ color: "var(--color-accent)" }}>Pep</span>GuideIQ
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.12em", marginBottom: 28 }}>
        PUBLIC PROFILE
      </div>

      {loading ? (
        <div className="mono" style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
          Loading…
        </div>
      ) : err ? (
        <div className="mono" style={{ fontSize: 14, color: "var(--color-warning)", lineHeight: 1.5 }}>
          {err}
        </div>
      ) : profile ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-emphasis)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              {av ? (
                <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initialsFromProfile(dispName, profile.handle)
              )}
            </div>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)", lineHeight: 1.25 }}>
                {handleLine || `@${handle}`}
              </div>
              {dispName ? (
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginTop: 6 }}>{dispName}</div>
              ) : null}
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span title="Plan tier" aria-hidden>
                  {tierEmoji(plan)}
                </span>
                <span
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: tierAccentCssVar(plan),
                    fontWeight: 600,
                  }}
                >
                  {plan}
                </span>
                {locationLine ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{locationLine}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {exp ? (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              Experience: <span style={{ color: "var(--color-text-primary)" }}>{exp.replace(/_/g, " ")}</span>
            </div>
          ) : null}

          {shiftLabel ? (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              Schedule: <span style={{ color: "var(--color-text-primary)" }}>{shiftLabel}</span>
            </div>
          ) : null}

          {goalIds.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {goalIds.map((gid) => (
                <span
                  key={gid}
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    background: "var(--color-bg-hover)",
                  }}
                >
                  {publicProfileGoalLabel(gid)}
                </span>
              ))}
            </div>
          ) : null}

          <MemberProfileSocialIconRow profile={profile} />

          <PublicProfileFastingBlock publicFast={profile.public_fast} />

          {bio ? (
            <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--color-text-primary)", marginBottom: 24, whiteSpace: "pre-wrap" }}>
              {bio}
            </div>
          ) : (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24 }}>
              No bio yet.
            </div>
          )}

          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginBottom: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 14px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setFollowersModalTab("followers");
                setFollowersModalOpen(true);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span style={{ color: "var(--color-text-primary)" }}>{formatCompactNumber(followerCount)}</span> Followers
            </button>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => {
                setFollowersModalTab("following");
                setFollowersModalOpen(true);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span style={{ color: "var(--color-text-primary)" }}>{formatCompactNumber(followingCount)}</span> Following
            </button>
          </div>

          {showFollow ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              {following ? (
                <button
                  type="button"
                  className="btn-green"
                  disabled={followBusy}
                  onClick={() => void toggleFollow()}
                  style={{ fontSize: 14 }}
                >
                  {followBusy ? "…" : "Following"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-teal"
                  disabled={followBusy}
                  onClick={() => void toggleFollow()}
                  style={{ fontSize: 14 }}
                >
                  {followBusy ? "…" : "Follow"}
                </button>
              )}
              {publicStackShareId ? (
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 14 }}
                  onClick={() => window.location.assign(buildStackShareUrl(publicStackShareId))}
                >
                  View shared stack
                </button>
              ) : null}
            </div>
          ) : !effectiveViewerProfileId && !effectiveViewerToken && profile ? (
            <div style={{ marginBottom: 20 }}>
              {publicStackShareId ? (
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 14, marginRight: 10 }}
                  onClick={() => window.location.assign(buildStackShareUrl(publicStackShareId))}
                >
                  View shared stack
                </button>
              ) : null}
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 14 }}
                onClick={() => {
                  try {
                    window.history.replaceState({}, "", "/");
                  } catch {
                    /* ignore */
                  }
                  window.location.assign("/");
                }}
              >
                Sign in to follow
              </button>
            </div>
          ) : null}
          {profile?.id ? (
            <>
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  letterSpacing: "0.12em",
                  marginTop: 8,
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                📸 Uploaded
              </div>
              <PublicProfilePhotoGrid
                profileId={String(profile.id)}
                workerBaseUrl={workerUrl}
                ownerUserId={typeof profile.user_id === "string" ? profile.user_id : null}
                initialPostId={initialPostId}
                initialCommentId={initialCommentId}
              />
            </>
          ) : null}
          <FollowersModal
            isOpen={followersModalOpen}
            onClose={() => setFollowersModalOpen(false)}
            targetProfileId={profile?.id ? String(profile.id) : null}
            viewerProfileId={effectiveViewerProfileId}
            initialTab={followersModalTab}
            onCountsChange={(next) => {
              if (typeof next.followerCount === "number") setFollowerCount(Math.max(0, next.followerCount));
              if (typeof next.followingCount === "number") setFollowingCount(Math.max(0, next.followingCount));
            }}
          />
        </>
      ) : null}
    </div>
  );

  return (
    <>
      {includeGlobalStyles ? <GlobalStyles /> : null}
      {inner}
    </>
  );
}
