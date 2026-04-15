/** Max stored length for social handle columns (matches worker PATCH). */
export const SOCIAL_HANDLE_MAX_LEN = 80;

/** @typedef {"instagram_handle"|"tiktok_handle"|"facebook_handle"|"snapchat_handle"|"linkedin_handle"|"x_handle"|"youtube_handle"|"rumble_handle"} SocialHandleColumn */

/**
 * @param {string} s
 * @returns {string}
 */
function tryDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * @param {string} raw
 * @returns {string}
 */
function firstPathSegment(raw) {
  const s = tryDecode(String(raw ?? "").trim());
  if (!s) return "";
  return s.split("/")[0].split("?")[0].split("#")[0] ?? "";
}

/**
 * Normalize user input for storage (trim pasted URLs, @, length cap). Empty string means clear field.
 * @param {SocialHandleColumn} columnKey
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeSocialHandleForColumn(columnKey, raw) {
  let s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";

  switch (columnKey) {
    case "instagram_handle": {
      s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
      s = s.replace(/^@+/, "");
      s = firstPathSegment(s);
      break;
    }
    case "tiktok_handle": {
      s = s.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, "");
      s = s.replace(/^@+/, "");
      s = firstPathSegment(s);
      break;
    }
    case "facebook_handle": {
      s = s.replace(/^https?:\/\/(www\.)?facebook\.com\//i, "");
      s = s.replace(/^@+/, "");
      s = firstPathSegment(s);
      break;
    }
    case "snapchat_handle": {
      s = s.replace(/^https?:\/\/(www\.)?snapchat\.com\/add\//i, "");
      s = s.replace(/^@+/, "");
      s = firstPathSegment(s);
      break;
    }
    case "linkedin_handle": {
      s = s.replace(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\//i, "");
      s = s.replace(/^\/+/, "");
      if (!s) return "";
      const lower = s.toLowerCase();
      if (lower.startsWith("in/")) {
        s = s.slice(3);
      } else if (lower.startsWith("pub/")) {
        s = s.slice(4);
      } else if (lower.startsWith("company/")) {
        s = `company/${s.slice(8).split("/")[0]}`;
        return s.slice(0, SOCIAL_HANDLE_MAX_LEN);
      }
      s = firstPathSegment(s);
      break;
    }
    case "x_handle": {
      s = s.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//i, "");
      s = s.replace(/^@+/, "");
      s = firstPathSegment(s);
      break;
    }
    case "youtube_handle": {
      s = s.replace(/^https?:\/\/(www\.)?youtube\.com\//i, "");
      s = s.replace(/^https?:\/\/youtu\.be\//i, "");
      s = s.replace(/^@+/, "");
      const lower = s.toLowerCase();
      if (lower.startsWith("c/")) {
        s = s.slice(2).split("/")[0] ?? "";
      } else if (lower.startsWith("user/")) {
        s = s.slice(5).split("/")[0] ?? "";
      } else if (lower.startsWith("channel/")) {
        s = s.slice(8).split("/")[0] ?? "";
      } else if (lower.startsWith("@")) {
        s = s.slice(1).split("/")[0] ?? "";
      } else {
        s = firstPathSegment(s);
      }
      break;
    }
    case "rumble_handle": {
      s = s.replace(/^https?:\/\/(www\.)?rumble\.com\//i, "");
      s = tryDecode(s.split("?")[0].split("#")[0] ?? "");
      const parts = s.split("/").filter(Boolean);
      const p0 = (parts[0] ?? "").toLowerCase();
      if (p0 === "c" && parts[1]) {
        s = `c/${parts[1]}`;
      } else if (p0 === "user" && parts[1]) {
        s = `user/${parts[1]}`;
      } else if (parts[0]) {
        s = `c/${parts[0]}`;
      } else {
        s = "";
      }
      break;
    }
    default:
      s = firstPathSegment(s.replace(/^@+/, ""));
  }

  return s.slice(0, SOCIAL_HANDLE_MAX_LEN);
}

/**
 * @param {unknown} v
 * @returns {string}
 */
export function storedSocialHandleString(v) {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function instagramProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  return `https://www.instagram.com/${encodeURIComponent(h)}/`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function tiktokProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  return `https://www.tiktok.com/@${encodeURIComponent(h)}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function facebookProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  return `https://www.facebook.com/${encodeURIComponent(h)}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function snapchatProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  return `https://www.snapchat.com/add/${encodeURIComponent(h)}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function linkedinProfileUrl(stored) {
  const s = storedSocialHandleString(stored);
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.startsWith("company/")) {
    const slug = s.slice("company/".length).split("/")[0];
    if (!slug) return null;
    return `https://www.linkedin.com/company/${encodeURIComponent(slug)}/`;
  }
  const slug = s.replace(/^in\//i, "").split("/")[0];
  if (!slug) return null;
  return `https://www.linkedin.com/in/${encodeURIComponent(slug)}/`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function xProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  return `https://x.com/${encodeURIComponent(h)}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function youtubeProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  if (/^UC[a-zA-Z0-9_-]{10,}$/.test(h)) {
    return `https://www.youtube.com/channel/${h}`;
  }
  return `https://www.youtube.com/@${encodeURIComponent(h)}`;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string | null}
 */
export function rumbleProfileUrl(stored) {
  const h = storedSocialHandleString(stored);
  if (!h) return null;
  const lower = h.toLowerCase();
  if (lower.startsWith("c/")) {
    return `https://rumble.com/${h}`;
  }
  if (lower.startsWith("user/")) {
    return `https://rumble.com/${h}`;
  }
  return `https://rumble.com/c/${encodeURIComponent(h)}`;
}

/**
 * Ordered entries for public profile icon row.
 * @param {Record<string, unknown>} profile
 * @returns {{ key: SocialHandleColumn, url: string, label: string, icon: string }[]}
 */
export function publicSocialLinksFromProfile(profile) {
  if (!profile || typeof profile !== "object") return [];
  /** @type {{ key: SocialHandleColumn, url: string | null, label: string, icon: string }[]} */
  const raw = [
    { key: "instagram_handle", url: instagramProfileUrl(profile.instagram_handle), label: "Instagram", icon: "instagram" },
    { key: "tiktok_handle", url: tiktokProfileUrl(profile.tiktok_handle), label: "TikTok", icon: "tiktok" },
    { key: "facebook_handle", url: facebookProfileUrl(profile.facebook_handle), label: "Facebook", icon: "facebook" },
    { key: "snapchat_handle", url: snapchatProfileUrl(profile.snapchat_handle), label: "Snapchat", icon: "snapchat" },
    { key: "linkedin_handle", url: linkedinProfileUrl(profile.linkedin_handle), label: "LinkedIn", icon: "linkedin" },
    { key: "x_handle", url: xProfileUrl(profile.x_handle), label: "X", icon: "x" },
    { key: "youtube_handle", url: youtubeProfileUrl(profile.youtube_handle), label: "YouTube", icon: "youtube" },
    { key: "rumble_handle", url: rumbleProfileUrl(profile.rumble_handle), label: "Rumble", icon: "rumble" },
  ];
  return raw.filter((x) => Boolean(x.url));
}

/** Edit form: column key + label (order matches public icon row). */
export const SOCIAL_EDIT_FIELDS = /** @type {const} */ ([
  { key: "instagram_handle", label: "Instagram", placeholder: "username" },
  { key: "tiktok_handle", label: "TikTok", placeholder: "username" },
  { key: "facebook_handle", label: "Facebook", placeholder: "username or page slug" },
  { key: "snapchat_handle", label: "Snapchat", placeholder: "username" },
  { key: "linkedin_handle", label: "LinkedIn", placeholder: "in/your-handle or company/name" },
  { key: "x_handle", label: "X (Twitter)", placeholder: "username" },
  { key: "youtube_handle", label: "YouTube", placeholder: "@handle or channel id" },
  { key: "rumble_handle", label: "Rumble", placeholder: "channel slug" },
]);
