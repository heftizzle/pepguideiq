import { useCallback, useEffect, useRef, useState } from "react";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import { getProfileStackShotR2Keys, getSessionAccessToken } from "../lib/supabase.js";
import {
  R2_UPLOAD_ACCEPT_ATTR,
  R2_UPLOAD_ALLOWED_TYPES,
  R2_UPLOAD_MAX_BYTES,
  appendImageCacheBustParam,
  shouldResetImageUploadFetchBust,
  uploadImageToR2,
} from "../lib/r2Upload.js";

function useWorkerObjectUrl(r2Key, workerConfigured, fetchBustMs = 0) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let revoke = null;

    async function run() {
      if (!r2Key || !workerConfigured) {
        setObjectUrl(null);
        return;
      }
      const token = await getSessionAccessToken();
      if (!token || cancelled) {
        setObjectUrl(null);
        return;
      }
      try {
        const base = `${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(r2Key)}`;
        const res = await fetch(appendImageCacheBustParam(base, fetchBustMs), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) {
          setObjectUrl(null);
          return;
        }
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        revoke = u;
        if (!cancelled) setObjectUrl(u);
      } catch {
        if (!cancelled) setObjectUrl(null);
      }
    }

    void run();
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [r2Key, workerConfigured, fetchBustMs]);

  return objectUrl;
}

/**
 * @param {{ kind: "stack_shot_1" | "stack_shot_2", r2Key: string | null, workerConfigured: boolean, canMutate: boolean, onUpgrade: () => void, onUploaded: () => Promise<void> | void }} props
 */
function StackShotHeroSlot({ kind, r2Key, workerConfigured, canMutate, onUpgrade, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [fetchBustMs, setFetchBustMs] = useState(0);
  const prevR2KeyRef = useRef(typeof r2Key === "string" ? r2Key.trim() : "");
  const imgUrl = useWorkerObjectUrl(r2Key, workerConfigured, fetchBustMs);
  const showImage = Boolean(r2Key && imgUrl);

  useEffect(() => {
    const next = typeof r2Key === "string" ? r2Key.trim() : "";
    const prev = prevR2KeyRef.current;
    prevR2KeyRef.current = next;
    if (shouldResetImageUploadFetchBust(prev, next)) setFetchBustMs(0);
  }, [r2Key]);

  function openPicker() {
    if (uploading) return;
    if (!canMutate) {
      onUpgrade();
      return;
    }
    if (!workerConfigured) {
      setErr("Configure VITE_API_WORKER_URL");
      return;
    }
    setErr(null);
    inputRef.current?.click();
  }

  async function onInputChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr(null);
    if (!R2_UPLOAD_ALLOWED_TYPES.has(f.type)) {
      setErr("JPEG, PNG, WebP, or GIF only");
      return;
    }
    if (f.size > R2_UPLOAD_MAX_BYTES) {
      setErr("Max 10MB");
      return;
    }
    setUploading(true);
    const result = await uploadImageToR2({
      path: "/stack-photo",
      file: f,
      fields: { kind },
      onState: (state) => {
        if (state === "retrying") setErr("Retrying…");
      },
    });
    setUploading(false);
    if (!result.ok) {
      setErr(result.error ?? "Upload failed");
      return;
    }
    setErr(null);
    setFetchBustMs(Date.now());
    await onUploaded();
  }

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={R2_UPLOAD_ACCEPT_ATTR}
        style={{ display: "none" }}
        onChange={(e) => void onInputChange(e)}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        style={{
          width: "100%",
          aspectRatio: "3 / 4",
          maxHeight: 220,
          borderRadius: 12,
          border: showImage ? "1px solid var(--color-border-tab)" : "2px dashed var(--color-border-emphasis)",
          background: "var(--color-bg-page)",
          cursor: uploading ? "wait" : "pointer",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showImage ? (
          <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : r2Key ? (
          <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            Loading…
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 16 }}>
            <span style={{ fontSize: 32, lineHeight: 1, opacity: 0.8 }} aria-hidden>
              📷
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.08em" }}>
              STACK SHOT
            </span>
          </div>
        )}
      </button>
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-secondary)",
          textAlign: "center",
          letterSpacing: "0.06em",
          lineHeight: 1.35,
          maxWidth: "100%",
        }}
      >
        STACK SHOT
      </div>
      {err && (
        <div className="mono" style={{ fontSize: 11, color: "var(--color-warning)", textAlign: "center" }}>
          {err}
        </div>
      )}
      {uploading && (
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-placeholder)" }}>
          Uploading…
        </div>
      )}
    </div>
  );
}

/**
 * Profile-level stack reference photos (Stacks tab territory — not vial inventory).
 * @param {{ userId: string, canUse: boolean, onUpgrade: () => void }} props
 */
export function StackProfileShots({ userId, canUse, onUpgrade }) {
  const [key1, setKey1] = useState(null);
  const [key2, setKey2] = useState(null);
  const canMutate = canUse && isSupabaseConfigured();
  const workerConfigured = isApiWorkerConfigured();

  const reload = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !canUse) {
      setKey1(null);
      setKey2(null);
      return;
    }
    const keysRes = await getProfileStackShotR2Keys(userId);
    setKey1(keysRes.key1);
    setKey2(keysRes.key2);
  }, [userId, canUse]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!canUse) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 10,
        marginBottom: 12,
        alignItems: "stretch",
        maxWidth: 520,
      }}
    >
      <StackShotHeroSlot
        kind="stack_shot_1"
        r2Key={key1}
        workerConfigured={workerConfigured}
        canMutate={canMutate}
        onUpgrade={onUpgrade}
        onUploaded={reload}
      />
      <StackShotHeroSlot
        kind="stack_shot_2"
        r2Key={key2}
        workerConfigured={workerConfigured}
        canMutate={canMutate}
        onUpgrade={onUpgrade}
        onUploaded={reload}
      />
    </div>
  );
}
