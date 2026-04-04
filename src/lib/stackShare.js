/** Production share links use the marketing domain; local dev uses current origin. */
export function getStackShareBaseUrl() {
  if (typeof window === "undefined") return "https://pepguideiq.com";
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) {
    return origin.replace(/\/$/, "");
  }
  return "https://pepguideiq.com";
}

export function buildStackShareUrl(shareId) {
  const base = getStackShareBaseUrl();
  const id = String(shareId ?? "").trim();
  if (!id) return base;
  return `${base}/stack/${encodeURIComponent(id)}`;
}

const SHARE_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

/** 8-character alphanumeric slug (ambiguous glyphs omitted). */
export function generateShareId8() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += SHARE_ID_ALPHABET[bytes[i] % SHARE_ID_ALPHABET.length];
  }
  return s;
}

export function buildStackShareSmsUrl(sharePageUrl) {
  const body = `Check out my pepguideIQ stack: ${sharePageUrl}`;
  return `sms:?body=${encodeURIComponent(body)}`;
}
