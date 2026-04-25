import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase.js";
import { formatRelativeTime } from "../lib/formatTime.js";

/**
 * Instagram-style photo wall of `public.posts` rows where `visible_profile = true`.
 * Anonymous-safe: reads through the anon Supabase client (RLS policy 070) and streams
 * images from `GET /public-post-media?key=…` which re-validates `visible_profile`
 * server-side via service role.
 *
 * Grid cells show photos only. Tap a cell to open a full-screen lightbox which
 * surfaces the post's caption + relative timestamp below the image.
 * Close via backdrop tap, × button, or Escape.
 *
 * @param {{
 *   profileId: string,
 *   workerBaseUrl: string,
 * }} props
 */
export default function PublicProfilePhotoGrid({ profileId, workerBaseUrl }) {
  const [rows, setRows] = useState(
    /** @type {Array<{ id: string, media_url: string, media_type: string | null, content: string | null, created_at: string }> | null} */ (
      null
    )
  );
  const [lightboxRow, setLightboxRow] = useState(
    /** @type {{ id: string, media_url: string, media_type: string | null, content: string | null, created_at: string } | null} */ (
      null
    )
  );

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
          .select("id, media_url, media_type, content, created_at")
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
                const content =
                  typeof row?.content === "string" ? row.content : null;
                const createdAt =
                  typeof row?.created_at === "string" ? row.created_at : "";
                if (!id || !mediaUrl) return null;
                return {
                  id,
                  media_url: mediaUrl,
                  media_type: mediaType,
                  content,
                  created_at: createdAt,
                };
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
    if (!lightboxRow) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxRow(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [lightboxRow]);

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
            onClick={() => setLightboxRow(row)}
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
    lightboxRow && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Post photo"
            onClick={() => setLightboxRow(null)}
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
                setLightboxRow(null);
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
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                maxHeight: "96vh",
                overflowY: "auto",
              }}
            >
              <img
                alt=""
                src={srcFor(lightboxRow.media_url)}
                style={{
                  maxWidth: "96vw",
                  maxHeight: "92vh",
                  objectFit: "contain",
                  display: "block",
                  borderRadius: 4,
                }}
              />
              {(lightboxRow.content || lightboxRow.created_at) && (
                <div
                  style={{
                    width: "min(640px, 96vw)",
                    padding: "12px 16px",
                    background: "rgba(0, 0, 0, 0.6)",
                    color: "rgba(255, 255, 255, 0.95)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    borderRadius: 4,
                  }}
                >
                  {lightboxRow.content && <div>{lightboxRow.content}</div>}
                  {lightboxRow.created_at && (
                    <div
                      className="mono"
                      style={{
                        marginTop: lightboxRow.content ? 8 : 0,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255, 255, 255, 0.65)",
                      }}
                    >
                      {formatRelativeTime(lightboxRow.created_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
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
