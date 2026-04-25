import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase.js";

/**
 * Instagram-style photo wall of `public.posts` rows where `visible_profile = true`.
 * Anonymous-safe: reads through the anon Supabase client (RLS policy 070) and streams
 * images from `GET /public-post-media?key=…` which re-validates `visible_profile`
 * server-side via service role.
 *
 * Intentionally minimal: no captions, no timestamps, no like counts. Tap a cell to
 * open a full-screen lightbox; tap outside / X / Escape to close.
 *
 * @param {{
 *   profileId: string,
 *   workerBaseUrl: string,
 * }} props
 */
export default function PublicProfilePhotoGrid({ profileId, workerBaseUrl }) {
  const [rows, setRows] = useState(
    /** @type {Array<{ id: string, media_url: string, media_type: string | null, created_at: string }> | null} */ (null)
  );
  const [lightboxKey, setLightboxKey] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    if (!profileId || !supabase) {
      if (!cancelled) setRows([]);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, media_url, media_type, created_at")
          .eq("profile_id", profileId)
          .eq("visible_profile", true)
          .not("media_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(60);
        if (cancelled) return;
        if (error) {
          setRows([]);
          return;
        }
        const cleaned = Array.isArray(data)
          ? data
              .map((row) => {
                const id = typeof row?.id === "string" ? row.id : "";
                const mediaUrl =
                  typeof row?.media_url === "string" ? row.media_url.trim() : "";
                const mediaType =
                  typeof row?.media_type === "string" ? row.media_type : null;
                const createdAt =
                  typeof row?.created_at === "string" ? row.created_at : "";
                if (!id || !mediaUrl) return null;
                return { id, media_url: mediaUrl, media_type: mediaType, created_at: createdAt };
              })
              .filter(Boolean)
          : [];
        setRows(/** @type {any} */ (cleaned));
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    if (!lightboxKey) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxKey(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [lightboxKey]);

  const base = typeof workerBaseUrl === "string" ? workerBaseUrl.replace(/\/$/, "") : "";
  const srcFor = (key) => `${base}/public-post-media?key=${encodeURIComponent(key)}`;

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 2,
  };
  const cellBase = {
    aspectRatio: "1 / 1",
    padding: 0,
    margin: 0,
    border: "none",
    background: "var(--color-bg-input)",
    overflow: "hidden",
    display: "block",
    width: "100%",
  };

  let body;
  if (rows === null) {
    body = (
      <>
        <style>{`@keyframes pepguide-photo-pulse{0%,100%{opacity:.55}50%{opacity:.85}}`}</style>
        <div style={gridStyle} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                ...cellBase,
                cursor: "default",
                animation: "pepguide-photo-pulse 1.4s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </>
    );
  } else if (rows.length === 0) {
    body = (
      <div
        className="mono"
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary)",
          padding: "24px 0",
          textAlign: "center",
        }}
      >
        // No posts yet
      </div>
    );
  } else {
    body = (
      <div style={gridStyle}>
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setLightboxKey(row.media_url)}
            style={{ ...cellBase, cursor: "pointer" }}
            aria-label="Open post photo"
          >
            <img
              loading="lazy"
              alt=""
              src={srcFor(row.media_url)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    );
  }

  const lightbox =
    lightboxKey && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Post photo"
            onClick={() => setLightboxKey(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9000,
              padding: 16,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxKey(null);
              }}
              aria-label="Close"
              style={{
                position: "fixed",
                top: "max(16px, env(safe-area-inset-top))",
                right: 16,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                zIndex: 9001,
              }}
            >
              ×
            </button>
            <img
              alt=""
              src={srcFor(lightboxKey)}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "96vw",
                maxHeight: "92vh",
                objectFit: "contain",
                display: "block",
                borderRadius: 4,
              }}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {body}
      {lightbox}
    </>
  );
}
