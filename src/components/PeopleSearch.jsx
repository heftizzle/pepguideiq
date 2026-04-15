import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatHandleDisplay, normalizeHandleInput } from "../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import {
  followMemberProfile,
  getMyFollowing,
  searchMemberProfiles,
  unfollowMemberProfile,
} from "../lib/follows.js";

/**
 * Vertical offset below the persistent App header (grid-bg z-70: logo row + pill nav).
 * PeopleSearch renders in a portal at z-60, so header paints on top — layout padding clears it (no z-index change).
 */
const PEOPLE_SEARCH_CLEAR_BELOW_HEADER_PX = 104;

function initialsFromProfile(p) {
  const name = typeof p?.display_name === "string" ? p.display_name.trim() : "";
  if (name) return name.slice(0, 2).toUpperCase();
  const h = typeof p?.handle === "string" ? p.handle.trim() : "";
  return h ? h.slice(0, 2).toUpperCase() : "?";
}

function bioSnippet(bio) {
  const t = typeof bio === "string" ? bio.trim() : "";
  if (!t) return null;
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

/**
 * @param {{
 *   activeProfileId: string,
 *   workerUrl: string,
 *   accessToken: string | null,
 *   onClose: () => void,
 *   initialQuery?: string | null,
 * }} props
 */
export function PeopleSearch({ activeProfileId, workerUrl, accessToken, onClose, initialQuery = null }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState(/** @type {object[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [followingSet, setFollowingSet] = useState(() => new Set());
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [pending, setPending] = useState(() => new Set());
  const reqId = useRef(0);

  useEffect(() => {
    if (typeof initialQuery === "string" && initialQuery.trim()) {
      const q = initialQuery.trim();
      setQuery(q.startsWith("@") ? q : `@${q}`);
    }
  }, [initialQuery]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!accessToken || !activeProfileId) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await getMyFollowing(activeProfileId, workerUrl, accessToken);
        if (!cancelled) {
          setFollowingSet(s);
          setFollowingLoaded(true);
        }
      } catch {
        if (!cancelled) setFollowingLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, activeProfileId, workerUrl]);

  useEffect(() => {
    if (!accessToken) return;
    const q = debounced.replace(/^@/, "").trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    void (async () => {
      try {
        const rows = await searchMemberProfiles(debounced, workerUrl, accessToken);
        if (reqId.current !== id) return;
        setResults(Array.isArray(rows) ? rows : []);
      } catch {
        if (reqId.current !== id) return;
        setResults([]);
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    })();
  }, [debounced, accessToken, workerUrl]);

  const emptyQuery = debounced.replace(/^@/, "").trim().length === 0;

  const toggleFollow = useCallback(
    async (followingId, nextFollowing) => {
      if (!accessToken) return;
      setPending((s) => {
        if (s.has(followingId)) return s;
        return new Set(s).add(followingId);
      });
      setFollowingSet((prev) => {
        const n = new Set(prev);
        if (nextFollowing) n.add(followingId);
        else n.delete(followingId);
        return n;
      });
      try {
        if (nextFollowing) {
          await followMemberProfile(activeProfileId, followingId, workerUrl, accessToken);
        } else {
          await unfollowMemberProfile(activeProfileId, followingId, workerUrl, accessToken);
        }
      } catch {
        setFollowingSet((prev) => {
          const n = new Set(prev);
          if (nextFollowing) n.delete(followingId);
          else n.add(followingId);
          return n;
        });
      } finally {
        setPending((s) => {
          const n = new Set(s);
          n.delete(followingId);
          return n;
        });
      }
    },
    [accessToken, activeProfileId, workerUrl]
  );

  const showNoResults = useMemo(() => {
    return !emptyQuery && !loading && followingLoaded && results.length === 0;
  }, [emptyQuery, loading, followingLoaded, results.length]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Find people"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        paddingTop: "max(0px, env(safe-area-inset-top, 0px))",
        background: "#07090e",
        zIndex: 60,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <button type="button" className="guide-takeover-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          paddingTop: PEOPLE_SEARCH_CLEAR_BELOW_HEADER_PX,
          paddingLeft: "max(12px, env(safe-area-inset-left))",
          paddingRight: "max(12px, env(safe-area-inset-right))",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "#00d4aa",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          FIND PEOPLE
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 15, color: "#6b7c8f", flexShrink: 0 }}>
            @
          </span>
          <input
            className="search-input"
            type="search"
            autoFocus
            placeholder="Search handles or names…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search handles or names"
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>

        <div
          className={loading ? "pepv-advisor-skeleton" : ""}
          style={{
            minHeight: 120,
            borderRadius: 10,
            padding: loading ? 12 : 0,
            background: loading ? undefined : "transparent",
          }}
        >
          {!accessToken ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", padding: 12 }}>
              Loading session…
            </div>
          ) : emptyQuery ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", padding: 8 }}>
              Search for people by handle or name
            </div>
          ) : showNoResults ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", padding: 8 }}>
              No users found for @{debounced.replace(/^@/, "").trim()}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.filter((p) => typeof p?.id === "string" && p.id).map((p) => {
                const id = String(p.id);
                const isFollowing = followingSet.has(id);
                const busy = pending.has(id);
                const handleLine = formatHandleDisplay(p.handle ?? "", p.display_handle ?? "");
                const dispName = typeof p.display_name === "string" ? p.display_name.trim() : "";
                const snippet = bioSnippet(p.bio);
                const av = typeof p.avatar_url === "string" && p.avatar_url.trim() ? p.avatar_url.trim() : "";

                const canOpenProfile = typeof p.handle === "string" && Boolean(normalizeHandleInput(p.handle));

                return (
                  <div
                    key={id}
                    className="scard"
                    style={{
                      alignItems: "stretch",
                      cursor: canOpenProfile ? "pointer" : "default",
                    }}
                    onClick={() => {
                      const ch = normalizeHandleInput(p.handle ?? "");
                      if (ch) openPublicMemberProfile(ch);
                    }}
                    onKeyDown={
                      canOpenProfile
                        ? (e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            const ch = normalizeHandleInput(p.handle ?? "");
                            if (ch) openPublicMemberProfile(ch);
                          }
                        : undefined
                    }
                    role={canOpenProfile ? "link" : undefined}
                    tabIndex={canOpenProfile ? 0 : undefined}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#0b0f17",
                        border: "1px solid #243040",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#00d4aa",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {av ? (
                        <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        initialsFromProfile(p)
                      )}
                    </div>
                    <div
                      style={{
                        flex: "1 1 0",
                        minWidth: 0,
                      }}
                    >
                      <div className="brand" style={{ fontSize: 15, fontWeight: 600, color: "#00d4aa", lineHeight: 1.3 }}>
                        {handleLine || "—"}
                      </div>
                      {dispName ? (
                        <div style={{ fontSize: 13, color: "#6b7c8f", marginTop: 2 }}>{dispName}</div>
                      ) : null}
                      {snippet ? (
                        <div className="mono" style={{ fontSize: 11, color: "#8fa5bf", marginTop: 6, lineHeight: 1.45 }}>
                          {snippet}
                        </div>
                      ) : null}
                    </div>
                    {isFollowing ? (
                      <button
                        type="button"
                        className="btn-green"
                        disabled={busy || !id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFollow(id, false);
                        }}
                        style={{ flexShrink: 0, alignSelf: "center" }}
                      >
                        Following
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-teal"
                        disabled={busy || !id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleFollow(id, true);
                        }}
                        style={{ flexShrink: 0, alignSelf: "center" }}
                      >
                        Follow
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(overlay, document.body) : null;
}
