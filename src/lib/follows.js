import { normalizeHandleInput } from "./memberProfileHandle.js";

async function parseWorkerJson(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data && typeof data.error === "string" && data.error.trim() ? data.error.trim() : fallbackMessage;
    throw new Error(message);
  }
  return data;
}

export async function searchMemberProfiles(query, workerUrl, token) {
  const n = normalizeHandleInput(query);
  const q = encodeURIComponent(n);
  const res = await fetch(`${workerUrl}/member-profiles/search?q=${q}`, {
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
  return parseWorkerJson(res, "Could not follow this profile.");
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
  return parseWorkerJson(res, "Could not unfollow this profile.");
}

export async function getMyFollowing(profileId, workerUrl, token) {
  const res = await fetch(`${workerUrl}/member-follows/following?profile_id=${profileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseWorkerJson(res, "Could not load follows.");
  return new Set(data.following ?? []);
}
