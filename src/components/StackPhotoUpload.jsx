import { useEffect, useRef, useState } from "react";
import { getSessionAccessToken } from "../lib/supabase.js";
import { API_WORKER_URL } from "../lib/config.js";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * @param {{
 *   stackPhotoUrl: string | null,
 *   stackPhotoKey: string | null,
 *   canUpload: boolean,
 *   workerConfigured: boolean,
 *   onUpgrade: () => void,
 *   onUploaded: () => Promise<void>,
 * }} props
 */
export function StackPhotoUpload({
  stackPhotoUrl,
  stackPhotoKey,
  canUpload,
  workerConfigured,
  onUpgrade,
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState(null);
  const [privateBlobUrl, setPrivateBlobUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let revoke = null;

    async function loadPrivate() {
      if (!stackPhotoKey || !workerConfigured) {
        setPrivateBlobUrl(null);
        return;
      }
      const token = await getSessionAccessToken();
      if (!token) {
        setPrivateBlobUrl(null);
        return;
      }
      try {
        const res = await fetch(`${API_WORKER_URL}/stack-photo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) {
          setPrivateBlobUrl(null);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoke = url;
        if (!cancelled) setPrivateBlobUrl(url);
      } catch {
        if (!cancelled) setPrivateBlobUrl(null);
      }
    }

    void loadPrivate();
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [stackPhotoKey, workerConfigured]);

  const gated = !canUpload;
  const noWorker = canUpload && !workerConfigured;

  function openPicker(e) {
    e?.stopPropagation();
    if (uploading) return;
    if (gated) {
      onUpgrade();
      return;
    }
    if (noWorker) {
      setErr("// Configure VITE_API_WORKER_URL");
      return;
    }
    setErr(null);
    inputRef.current?.click();
  }

  function zoneActivate() {
    if (uploading) return;
    if (gated) {
      onUpgrade();
      return;
    }
    if (noWorker) {
      setErr("// Configure VITE_API_WORKER_URL");
      return;
    }
    setErr(null);
    inputRef.current?.click();
  }

  async function sendFile(file) {
    if (gated) {
      onUpgrade();
      return;
    }
    if (noWorker) {
      setErr("// Configure VITE_API_WORKER_URL");
      return;
    }
    setErr(null);
    if (!file || !OK_TYPES.has(file.type)) {
      setErr("// JPEG, PNG, or WebP only");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("// Max 5MB");
      return;
    }

    const token = await getSessionAccessToken();
    if (!token) {
      setErr("// Sign in required");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_WORKER_URL}/upload-stack-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Upload failed (${res.status})`;
        setErr(`// ${msg}`);
        return;
      }
      await onUploaded();
    } catch {
      setErr("// Network error");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void sendFile(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!gated && !noWorker) setDragOver(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (gated) {
      onUpgrade();
      return;
    }
    const f = e.dataTransfer?.files?.[0];
    if (f) void sendFile(f);
  }

  const displayUrl = privateBlobUrl || stackPhotoUrl || "";
  const showThumb = Boolean(displayUrl);

  const zoneTitle = gated
    ? "Upgrade to Pro to upload your stack photo"
    : noWorker
      ? "Configure VITE_API_WORKER_URL to upload"
      : "";

  const borderColor = dragOver ? "rgba(0,212,170,0.85)" : "rgba(0,212,170,0.42)";

  return (
    <div style={{ maxWidth: 200 }}>
      <div
        className="mono"
        style={{
          fontSize: 9,
          color: "#00d4aa",
          marginBottom: 6,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        MY STACK
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={onInputChange}
      />
      <div
        role="button"
        tabIndex={0}
        title={zoneTitle}
        aria-disabled={gated || uploading}
        onClick={zoneActivate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            zoneActivate();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          position: "relative",
          width: "100%",
          minHeight: 128,
          borderRadius: 10,
          border: `2px dashed ${borderColor}`,
          background: "rgba(0,212,170,0.04)",
          cursor: gated || uploading ? "not-allowed" : "pointer",
          opacity: gated ? 0.52 : 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s ease, opacity 0.15s ease",
        }}
      >
        {uploading && (
          <div
            className="mono"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(7,9,14,0.75)",
              fontSize: 10,
              color: "#8fa5bf",
              zIndex: 2,
            }}
          >
            // Uploading…
          </div>
        )}
        {showThumb ? (
          <>
            <img
              src={displayUrl}
              alt=""
              style={{
                width: "100%",
                height: 128,
                objectFit: "cover",
                display: "block",
                pointerEvents: "none",
              }}
            />
            <button
              type="button"
              className="btn-teal"
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                zIndex: 1,
                padding: "4px 10px",
                fontSize: 10,
                pointerEvents: "auto",
              }}
              onClick={openPicker}
            >
              Replace
            </button>
          </>
        ) : (
          <div className="mono" style={{ fontSize: 11, color: "#a0a0b0", padding: "12px 14px", textAlign: "center" }}>
            // Upload your stack photo
          </div>
        )}
      </div>
      {err && (
        <div className="mono" style={{ fontSize: 9, color: "#f59e0b", marginTop: 6, lineHeight: 1.4 }}>
          {err}
        </div>
      )}
    </div>
  );
}
