async function parseWorkerJson(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data && typeof data.error === "string" && data.error.trim() ? data.error.trim() : fallbackMessage;
    throw new Error(message);
  }
  return data;
}

/**
 * @param {{ followerProfileId: string, followingProfileId: string, isFollowing: boolean }} detail
 */
function dispatchFollowsChanged(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pepguide:follows-changed", { detail }));
}

/**
 * @param {string} query
 * @param {string} workerUrl
 * @param {string} token
 * @param {{ handleOnly?: boolean }} [opts] When true, server searches handle/display_handle only (leading `@` in UI).
 */
export async function searchMemberProfiles(query, workerUrl, token, opts = {}) {
  const raw = String(query ?? "").trim();
  const q = encodeURIComponent(raw);
  const handleQs = opts.handleOnly === true ? "&handle_only=1" : "";
  const res = await fetch(`${workerUrl}/member-profiles/search?q=${q}${handleQs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseWorkerJson(res, "Could not search member profiles.");
  return data.profiles ?? [];
}

export async function followMemberProfile(followerProfileId, followingProfileId, workerUrl, token) {
  const res = await fetch(`${workerUrl}/member-follows`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      follower_profile_id: followerProfileId,
      following_profile_id: followingProfileId,
    }),
  });
  const data = await parseWorkerJson(res, "Could not follow this profile.");
  dispatchFollowsChanged({ followerProfileId, followingProfileId, isFollowing: true });
  return data;
}

export async function unfollowMemberProfile(followerProfileId, followingProfileId, workerUrl, token) {
  const res = await fetch(`${workerUrl}/member-follows`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      follower_profile_id: followerProfileId,
      following_profile_id: followingProfileId,
    }),
  });
  const data = await parseWorkerJson(res, "Could not unfollow this profile.");
  dispatchFollowsChanged({ followerProfileId, followingProfileId, isFollowing: false });
  return data;
}

export async function getMyFollowing(profileId, workerUrl, token) {
  const res = await fetch(`${workerUrl}/member-follows/following?profile_id=${profileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseWorkerJson(res, "Could not load follows.");
  return new Set(data.following ?? []);
}
