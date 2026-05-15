import { API_WORKER_URL } from "./config.js";
import { getSessionAccessToken } from "./supabase.js";

/** Centralized R2 upload constants — must match the Worker. */
export const R2_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const R2_UPLOAD_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const R2_UPLOAD_ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";

/** Lab reports — Worker accepts PDF + JPEG/PNG/WebP only (`LAB_REPORT_UPLOAD_TYPES`). */
export const LAB_REPORT_UPLOAD_ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const LAB_REPORT_ACCEPT_ATTR = "application/pdf,image/jpeg,image/png,image/webp";

/**
 * Append `v` query for cache-busting image/worker URLs (e.g. right after upload).
 * @param {string} url
 * @param {number} bustMs — must be > 0 to apply; use `Date.now()` after a successful upload
 * @returns {string}
 */
export function appendImageCacheBustParam(url, bustMs) {
  const s = String(url ?? "").trim();
  if (!s) return s;
  const v = Number(bustMs);
  if (!Number.isFinite(v) || v <= 0) return s;
  const sep = s.includes("?") ? "&" : "?";
  return `${s}${sep}v=${Math.round(v)}`;
}

/**
 * Clear a post-upload fetch bust when the R2 key changes to a different object,
 * or when the key is cleared. Does not clear on first key assignment after empty
 * (e.g. right after a first successful upload).
 * @param {string} prevTrimmed
 * @param {string} nextTrimmed
 */
export function shouldResetImageUploadFetchBust(prevTrimmed, nextTrimmed) {
  const p = String(prevTrimmed ?? "").trim();
  const n = String(nextTrimmed ?? "").trim();
  if (p && n && p !== n) return true;
  if (!n && p) return true;
  return false;
}

/**
 * Map fetch errors and HTTP status codes to user-friendly messages.
 * @param {number | null} status
 * @param {string} fallback
 * @returns {string}
 */
function messageForStatus(status, fallback) {
  if (status === 401) return "Session expired — please log in again";
  if (status === 403) return "Permission denied for this upload";
  if (status === 413) return "File too large — max 10MB";
  if (status === 415) return "Unsupported file type";
  if (status === 429) return "Too many uploads — please slow down";
  if (status === 503) return "Upload service unavailable — try again";
  if (typeof status === "number" && status >= 500) {
    return "Upload service error — try again";
  }
  return fallback;
}

/**
 * Validate a file client-side before posting. Returns a user-facing error string or null.
 * @param {File | null | undefined} file
 * @returns {string | null}
 */
export function validateUploadFile(file) {
  if (!file) return "No file selected";
  if (typeof file.size !== "number" || file.size <= 0) return "File is empty";
  if (file.size > R2_UPLOAD_MAX_BYTES) return "File too large — max 10MB";
  const t = typeof file.type === "string" ? file.type.toLowerCase() : "";
  if (!R2_UPLOAD_ALLOWED_TYPES.has(t)) return "Unsupported file type";
  return null;
}

/**
 * @param {File | null | undefined} file
 * @returns {string | null}
 */
export function validateLabReportUploadFile(file) {
  if (!file) return "No file selected";
  if (typeof file.size !== "number" || file.size <= 0) return "File is empty";
  if (file.size > R2_UPLOAD_MAX_BYTES) return "File too large — max 10MB";
  const t = typeof file.type === "string" ? file.type.toLowerCase() : "";
  if (!LAB_REPORT_UPLOAD_ALLOWED_TYPES.has(t)) return "Unsupported file type — use PDF, JPEG, PNG, or WebP";
  return null;
}

/**
 * POST `/stack-photo` with kind lab_report + PDF/images (same `{ url, key, private }` contract).
 *
 * @param {object} params
 * @param {File} params.file
 * @param {string} params.memberProfileId
 * @param {(state: "uploading" | "retrying") => void} [params.onState]
 * @returns {Promise<{ ok: true, url: string, key: string, private: boolean } | { ok: false, status: number | null, error: string }>}
 */
export async function uploadLabReportToR2({ file, memberProfileId, onState }) {
  return uploadImageToR2({
    path: "/stack-photo",
    file,
    fields: { kind: "lab_report", member_profile_id: memberProfileId },
    onState,
    validateFile: validateLabReportUploadFile,
  });
}

/**
 * Upload an image to the Worker, with two automatic retries on transient
 * failures (network errors and 503). The Worker response is expected to be
 * `{ url, key, private }` — on success, `url` includes a one-time cache-bust
 * query for immediate display; persist storage keys via `key` / profile fields,
 * not the returned `url`, unless you strip cache params.
 *
 * @param {object} params
 * @param {string} params.path — Worker path, e.g. "/stack-photo".
 * @param {File} params.file
 * @param {Record<string, string | undefined | null>} [params.fields] — extra multipart fields.
 * @param {(state: "uploading" | "retrying") => void} [params.onState]
 * @param {(file: File) => string | null} [params.validateFile] — defaults to `validateUploadFile` (lab uploads pass `validateLabReportUploadFile`).
 * @returns {Promise<{ ok: true, url: string, key: string, private: boolean } | { ok: false, status: number | null, error: string }>}
 */
export async function uploadImageToR2({ path, file, fields, onState, validateFile = validateUploadFile }) {
  const validationErr = validateFile(file);
  if (validationErr) return { ok: false, status: 400, error: validationErr };
  if (!API_WORKER_URL) {
    return { ok: false, status: null, error: "Upload service not configured" };
  }
  const token = await getSessionAccessToken();
  if (!token) {
    return { ok: false, status: 401, error: "Session expired — please log in again" };
  }

  const url = `${API_WORKER_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const buildBody = () => {
    const fd = new FormData();
    fd.append("file", file);
    if (fields) {
      for (const [k, v] of Object.entries(fields)) {
        if (v != null) fd.append(k, String(v));
      }
    }
    return fd;
  };

  const MAX_ATTEMPTS = 3;
  let lastStatus = null;
  let lastError = "Upload failed";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (onState) onState(attempt === 1 ? "uploading" : "retrying");
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildBody(),
      });
    } catch {
      lastStatus = null;
      lastError = "Upload failed — check your connection";
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return { ok: false, status: null, error: lastError };
    }

    if (res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      const fullUrl =
        body && typeof body === "object" && typeof body.url === "string" && body.url.trim()
          ? body.url.trim()
          : "";
      const key =
        body && typeof body === "object" && typeof body.key === "string" && body.key.trim()
          ? body.key.trim()
          : "";
      if (!fullUrl) {
        return {
          ok: false,
          status: res.status,
          error: "Upload succeeded but server did not return a URL",
        };
      }
      const isPrivate =
        body && typeof body === "object" && body.private === true ? true : false;
      return {
        ok: true,
        url: appendImageCacheBustParam(fullUrl, Date.now()),
        key,
        private: isPrivate,
      };
    }

    let serverErr = "";
    try {
      const j = await res.json();
      if (j && typeof j === "object" && typeof j.error === "string") {
        serverErr = j.error;
      }
    } catch {
      /* ignore */
    }

    lastStatus = res.status;
    lastError = serverErr || messageForStatus(res.status, `Upload failed (${res.status})`);

    // Retry on transient 5xx (502 Bad Gateway, 503 Unavailable, 504 Gateway
    // Timeout); do NOT retry on 4xx — those are permanent client errors that
    // a retry can't fix.
    const transient = res.status === 502 || res.status === 503 || res.status === 504;
    if (transient && attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    return { ok: false, status: res.status, error: lastError };
  }

  return { ok: false, status: lastStatus, error: lastError };
}
