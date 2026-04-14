import { normalizeHandleInput } from "./memberProfileHandle.js";

export async function searchMemberProfiles(query, workerUrl, token) {
  const n = normalizeHandleInput(query);
  const q = encodeURIComponent(n);
  const res = await fetch(`${workerUrl}/member-profiles/search?q=${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
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
  return res.json();
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
  return res.json();
}

export async function getMyFollowing(profileId, workerUrl, token) {
  const res = await fetch(`${workerUrl}/member-follows/following?profile_id=${profileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return new Set(data.following ?? []);
}
