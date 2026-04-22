import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured } from "../lib/config.js";
import { R2_UPLOAD_ACCEPT_ATTR, R2_UPLOAD_MAX_BYTES, validateUploadFile, uploadImageToR2 } from "../lib/r2Upload.js";
import { supabase } from "../lib/supabase.js";

const CAPTION_MAX = 280;

/**
 * Bottom sheet: compose an image post with caption and visibility toggles.
 * @param {{
 *   open: boolean;
 *   activeProfileId: string;
 *   displayName: string;
 *   onClose: () => void;
 *   onPosted: () => void;
 * }} props
 */
export function PostItComposer({ open, activeProfileId, displayName, onClose, onPosted }) {
  const [entered, setEntered] = useState(false);
  const [mediaFile, setMediaFile] = useState(/** @type {File | null} */ (null));
  const [mediaPreview, setMediaPreview] = useState(/** @type {string | null} */ (null));
  const [caption, setCaption] = useState("");
  const [visibleNetwork, setVisibleNetwork] = useState(true);
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postError, setPostError] = useState(/** @type {string | null} */ (null));
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setMediaFile(null);
      setMediaPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCaption("");
      setVisibleNetwork(true);
      setVisibleProfile(false);
      setPostError(null);
      setUploading(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const onPickFile = useCallback((e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    setPostError(null);
    if (!f) return;
    if (f.size > R2_UPLOAD_MAX_BYTES) {
      setPostError("File too large — max 10MB");
      return;
    }
    const err = validateUploadFile(f);
    if (err) {
      setPostError(err);
      return;
    }
    setMediaFile(f);
    setMediaPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const handlePost = useCallback(async () => {
    setPostError(null);
    if (!mediaFile) {
      setPostError("Choose an image to post.");
      return;
    }
    const pid = typeof activeProfileId === "string" ? activeProfileId.trim() : "";
    if (!pid) {
      setPostError("No active profile.");
      return;
    }
    if (!isSupabaseConfigured() || !supabase) {
      setPostError("Supabase is not configured.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImageToR2({
        path: "/upload-post-media",
        file: mediaFile,
        fields: { member_profile_id: pid },
      });
      if (!result.ok) {
        setPostError(result.error || "Upload failed");
        setUploading(false);
        return;
      }
      const key = typeof result.key === "string" ? result.key.trim() : "";
      if (!key) {
        setPostError("Upload succeeded but no storage key was returned.");
        setUploading(false);
        return;
      }
      const { error } = await supabase.from("posts").insert({
        profile_id: pid,
        content: caption.trim() || null,
        media_url: key,
        media_type: "image",
        visible_network: visibleNetwork,
        visible_profile: visibleProfile,
      });
      if (error) {
        setPostError(typeof error.message === "string" ? error.message : "Could not save post.");
        setUploading(false);
        return;
      }
      onPosted();
      onClose();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }, [
    mediaFile,
    activeProfileId,
    caption,
    visibleNetwork,
    visibleProfile,
    onPosted,
    onClose,
  ]);

  if (!open || typeof document === "undefined") return null;

  const dn = typeof displayName === "string" ? displayName.trim() : "";

  return createPortal(
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        pointerEvents: "auto",
      }}
    >
      <div
        role="presentation"
        onClick={() => onClose()}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          border: "none",
          margin: 0,
          padding: 0,
          cursor: "pointer",
          background: entered ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0)",
          transition: "background 0.22s ease",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pepv-post-it-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 auto",
          width: "100%",
          maxWidth: 480,
          padding: "0 12px calc(80px + env(safe-area-inset-bottom, 0px))",
          transform: entered ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            borderRadius: "16px 16px 12px 12px",
            border: "1px solid var(--color-accent-subtle-40)",
            background: "rgba(11, 15, 23, 0.98)",
            boxShadow: "0 -12px 40px rgba(0,0,0,0.55)",
            padding: "16px 16px 14px",
          }}
        >
          <div
            id="pepv-post-it-title"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 8,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Post It
          </div>
          {dn ? (
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                lineHeight: 1.45,
                textAlign: "center",
                marginBottom: 12,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              Posting as {dn}
            </div>
          ) : null}

          <input ref={fileInputRef} type="file" accept={R2_UPLOAD_ACCEPT_ATTR} hidden onChange={onPickFile} />

          {!mediaPreview ? (
            <button
              type="button"
              className="form-input"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                minHeight: 48,
                marginBottom: 12,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
                borderRadius: 10,
                border: "1px dashed var(--color-border-emphasis)",
                background: "var(--color-bg-card)",
                color: "var(--color-text-secondary)",
              }}
            >
              Choose image…
            </button>
          ) : (
            <img
              src={mediaPreview}
              alt=""
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 10,
                marginBottom: 12,
                display: "block",
              }}
            />
          )}

          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--color-accent)",
              marginBottom: 6,
              letterSpacing: "0.08em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            CAPTION (OPTIONAL)
          </div>
          <textarea
            className="form-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
            placeholder="Say something about your post…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: 72,
              resize: "vertical",
              marginBottom: 6,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
            }}
            aria-label="Caption"
          />
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--color-text-muted)",
              textAlign: "right",
              marginBottom: 14,
            }}
          >
            {caption.length}/{CAPTION_MAX}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--color-text-primary)" }}>
                📡 Share to Network
              </span>
              <button
                type="button"
                onClick={() => setVisibleNetwork((v) => !v)}
                style={{
                  borderRadius: 999,
                  padding: "6px 16px",
                  border: `1px solid ${visibleNetwork ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  background: visibleNetwork ? "var(--color-accent-subtle-14)" : "transparent",
                  color: visibleNetwork ? "var(--color-accent)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {visibleNetwork ? "On" : "Off"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--color-text-primary)" }}>
                👤 Show on Public Profile
              </span>
              <button
                type="button"
                onClick={() => setVisibleProfile((v) => !v)}
                style={{
                  borderRadius: 999,
                  padding: "6px 16px",
                  border: `1px solid ${visibleProfile ? "var(--color-accent)" : "var(--color-border-default)"}`,
                  background: visibleProfile ? "var(--color-accent-subtle-14)" : "transparent",
                  color: visibleProfile ? "var(--color-accent)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {visibleProfile ? "On" : "Off"}
              </button>
            </div>
          </div>

          {postError ? (
            <div
              style={{
                fontSize: 12,
                color: "#f87171",
                textAlign: "center",
                marginBottom: 12,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {postError}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="form-input"
              disabled={uploading}
              onClick={() => onClose()}
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                cursor: uploading ? "default" : "pointer",
                border: "1px solid var(--color-border-default)",
                background: "var(--color-bg-hover)",
                color: "var(--color-text-secondary)",
                borderRadius: 10,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-teal"
              disabled={uploading || !mediaFile}
              onClick={() => void handlePost()}
              style={{
                flex: 1,
                minHeight: 48,
                fontSize: 14,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                borderRadius: 10,
                opacity: uploading || !mediaFile ? 0.65 : 1,
              }}
            >
              {uploading ? "Posting…" : "Post It"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
