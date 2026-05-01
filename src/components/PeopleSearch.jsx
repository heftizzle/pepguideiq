import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatHandleDisplay, normalizeHandleInput, stripHandleAtPrefix } from "../lib/memberProfileHandle.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { HandleSetupBanner } from "./HandleSetupBanner.jsx";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import {
  followMemberProfile,
  getMyFollowing,
  searchMemberProfiles,
  unfollowMemberProfile,
} from "../lib/follows.js";
import { resolveMemberAvatarDisplayUrl, resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";
import { fetchSuggestedProfiles } from "../lib/supabase.js";

/** Match App.jsx fixed bottom nav band so overlay leaves it visible and tappable. */
const PEOPLE_SEARCH_NAV_RESERVE_PX = "calc(80px + env(safe-area-inset-bottom, 0px))";

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

/** Primary line = display name; secondary = muted @handle when both exist. */
function peopleCardPrimarySecondary(profile) {
  const dispName = typeof profile?.display_name === "string" ? profile.display_name.trim() : "";
  const handleLine = formatHandleDisplay(profile?.handle ?? "", profile?.display_handle ?? "");
  const hasHandle = typeof profile?.handle === "string" && Boolean(normalizeHandleInput(profile.handle));
  const primary = dispName || (hasHandle ? handleLine : "—");
  const secondary = hasHandle && dispName ? handleLine : null;
  return { primary, secondary };
}

function SuggestedProfileSkeleton() {
  return (
    <div
      className="pcard"
      style={{
        cursor: "default",
        pointerEvents: "none",
        minHeight: 96,
        transform: "none",
        boxShadow: "none",
      }}
      aria-hidden
    >
      <div style={{ height: 12, background: "var(--color-surface-hover)", borderRadius: 6, width: "44%", marginBottom: 12 }} />
      <div style={{ height: 18, background: "var(--color-surface-hover)", borderRadius: 6, width: "88%", marginBottom: 8 }} />
      <div style={{ height: 12, background: "var(--color-surface-hover)", borderRadius: 6, width: "55%" }} />
    </div>
  );
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
  const { activeProfile } = useActiveProfile();
  const sessionUserId =
    activeProfile && typeof activeProfile.user_id === "string" ? activeProfile.user_id.trim() : "";

  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      try {
        onClose();
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      window.dispatchEvent(new CustomEvent("pepguide:open-network-tab"));
    } catch {
      try {
        window.history.back();
      } catch {
        /* ignore */
      }
    }
  }, [onClose]);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState(/** @type {object[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [followingSet, setFollowingSet] = useState(() => new Set());
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [pending, setPending] = useState(() => new Set());
  const [suggestedRows, setSuggestedRows] = useState(/** @type {object[]} */ ([]));
  const [suggestedLoading, setSuggestedLoading] = useState(false);
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
    if (!accessToken || !activeProfileId) {
      setSuggestedRows([]);
      setSuggestedLoading(false);
      return;
    }
    let cancelled = false;
    setSuggestedLoading(true);
    void fetchSuggestedProfiles(activeProfileId).then(({ rows, error }) => {
      if (cancelled) return;
      setSuggestedLoading(false);
      if (error) {
        setSuggestedRows([]);
        return;
      }
      setSuggestedRows(Array.isArray(rows) ? rows : []);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, activeProfileId]);

  useEffect(() => {
    if (!accessToken) return;
    const trim = debounced.trim();
    const handleOnlySearch = trim.startsWith("@");
    const qForApi = stripHandleAtPrefix(trim);
    if (!qForApi) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    void (async () => {
      try {
        const rows = await searchMemberProfiles(qForApi, workerUrl, accessToken, {
          handleOnly: handleOnlySearch,
        });
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

  const emptyQuery = stripHandleAtPrefix(debounced.trim()).length === 0;

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
        top: 0,
        left: 0,
        right: 0,
        bottom: PEOPLE_SEARCH_NAV_RESERVE_PX,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        paddingTop: "max(0px, env(safe-area-inset-top, 0px))",
        background: "var(--color-bg-page)",
        /* Above .grid-bg header (z-70) so top-right close is clickable; GlobalStyles .guide-takeover-close is only z-55 */
        zIndex: 72,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        className="guide-takeover-close"
        onClick={handleClose}
        aria-label="Close"
        style={{ zIndex: 72 }}
      >
        ×
      </button>

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          paddingTop: "var(--pepv-top-header-height, 104px)",
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
            color: "var(--color-accent)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          FIND PEOPLE
        </div>

        <HandleSetupBanner
          userId={sessionUserId}
          handle={activeProfile?.handle}
          onGoSetHandle={() => {
            try {
              window.dispatchEvent(new CustomEvent("pepguide:open-profile-tab-settings"));
            } catch {
              /* ignore */
            }
            handleClose();
          }}
        />

        {suggestedLoading || suggestedRows.length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              RUNNING SIMILAR PROTOCOLS
            </div>
            {suggestedLoading ? (
              <div className="pepv-advisor-skeleton" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SuggestedProfileSkeleton />
                <SuggestedProfileSkeleton />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {suggestedRows
                  .filter((row) => typeof row?.profile_id === "string" && row.profile_id)
                  .map((row) => {
                    const id = String(row.profile_id);
                    const isFollowing = followingSet.has(id);
                    const busy = pending.has(id);
                    const { primary: sugPrimary, secondary: sugSecondary } = peopleCardPrimarySecondary(row);
                    const avK =
                      typeof row.avatar_r2_key === "string" && row.avatar_r2_key.trim() ? row.avatar_r2_key.trim() : "";
                    const av = avK ? resolveMemberAvatarDisplayUrlFromKey(avK) : "";
                    const namesRaw = row.shared_compound_names;
                    const compoundNames = Array.isArray(namesRaw)
                      ? namesRaw.filter((n) => typeof n === "string" && n.trim())
                      : [];
                    const via =
                      typeof row.via_handle === "string" && row.via_handle.trim() ? row.via_handle.trim() : "";
                    const sharedN =
                      typeof row.shared_compounds === "number" && Number.isFinite(row.shared_compounds)
                        ? row.shared_compounds
                        : compoundNames.length;
                    const canOpenProfile = typeof row.handle === "string" && Boolean(normalizeHandleInput(row.handle));

                    return (
                      <div
                        key={id}
                        className="scard"
                        style={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 10,
                          cursor: canOpenProfile ? "pointer" : "default",
                        }}
                        onClick={() => {
                          const ch = normalizeHandleInput(row.handle ?? "");
                          if (ch) openPublicMemberProfile(ch);
                        }}
                        onKeyDown={
                          canOpenProfile
                            ? (e) => {
                                if (e.key !== "Enter" && e.key !== " ") return;
                                e.preventDefault();
                                const ch = normalizeHandleInput(row.handle ?? "");
                                if (ch) openPublicMemberProfile(ch);
                              }
                            : undefined
                        }
                        role={canOpenProfile ? "link" : undefined}
                        tabIndex={canOpenProfile ? 0 : undefined}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "var(--color-bg-elevated)",
                              border: "1px solid var(--color-border-default)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--color-accent)",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            {av ? (
                              <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initialsFromProfile(row)
                            )}
                          </div>
                          <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            <div
                              className="brand"
                              style={{ fontSize: 15, fontWeight: 600, color: "var(--color-accent)", lineHeight: 1.3 }}
                            >
                              {sugPrimary}
                            </div>
                            {sugSecondary ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--color-text-muted)",
                                  marginTop: 2,
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                }}
                              >
                                {sugSecondary}
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
                        {compoundNames.length > 0 ? (
                          <div
                            className="mono"
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                              paddingLeft: 54,
                              boxSizing: "border-box",
                            }}
                          >
                            {compoundNames.map((nm) => (
                              <span
                                key={nm}
                                style={{
                                  fontSize: 11,
                                  lineHeight: 1.3,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "var(--color-accent-dim)",
                                  border: "1px solid var(--color-accent)",
                                  color: "var(--color-text-primary)",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {nm}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {via ? (
                          <div
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-muted)",
                              paddingLeft: 54,
                              lineHeight: 1.4,
                            }}
                          >
                            Connected through @{via}
                          </div>
                        ) : sharedN > 0 ? (
                          <div
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-muted)",
                              paddingLeft: 54,
                              lineHeight: 1.4,
                            }}
                          >
                            {sharedN} shared compound{sharedN === 1 ? "" : "s"}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 15, color: "var(--color-text-secondary)", flexShrink: 0 }}>
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
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: 12 }}>
              Loading session…
            </div>
          ) : emptyQuery ? (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: 8 }}>
              Search for people by handle or name
            </div>
          ) : showNoResults ? (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: 8 }}>
              No users found for {debounced.trim().startsWith("@") ? "@" : ""}
              {stripHandleAtPrefix(debounced.trim())}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.filter((p) => typeof p?.id === "string" && p.id).map((p) => {
                const id = String(p.id);
                const isFollowing = followingSet.has(id);
                const busy = pending.has(id);
                const { primary: resPrimary, secondary: resSecondary } = peopleCardPrimarySecondary(p);
                const snippet = bioSnippet(p.bio);
                const avK = typeof p.avatar_r2_key === "string" && p.avatar_r2_key.trim() ? p.avatar_r2_key.trim() : "";
                const avLegacy = typeof p.avatar_url === "string" && p.avatar_url.trim() ? p.avatar_url.trim() : "";
                const av = avK ? resolveMemberAvatarDisplayUrlFromKey(avK) : resolveMemberAvatarDisplayUrl(avLegacy);

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
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border-default)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--color-accent)",
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
                      <div className="brand" style={{ fontSize: 15, fontWeight: 600, color: "var(--color-accent)", lineHeight: 1.3 }}>
                        {resPrimary}
                      </div>
                      {resSecondary ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            marginTop: 2,
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          }}
                        >
                          {resSecondary}
                        </div>
                      ) : null}
                      {snippet ? (
                        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 6, lineHeight: 1.45 }}>
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
}
