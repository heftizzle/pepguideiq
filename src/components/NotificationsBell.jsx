import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isSupabaseConfigured } from "../lib/config.js";
import { formatHandleDisplay, normalizeHandleInput } from "../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import {
  fetchNotificationsRecent,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/supabase.js";

/** Keep in sync with `App.jsx` top header strip (`.grid-bg`) `zIndex`. */
const PEPV_TOP_HEADER_Z_INDEX = 70;
const NOTIFICATIONS_DROPDOWN_Z_INDEX = PEPV_TOP_HEADER_Z_INDEX + 10;

function formatTimeAgo(iso) {
  if (typeof iso !== "string" || !iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

/** @param {Record<string, unknown>} row */
function actorLabel(row) {
  const h = formatHandleDisplay(row.actor_handle, row.actor_display_handle);
  if (h) return h;
  const name = typeof row.actor_display_name === "string" ? row.actor_display_name.trim() : "";
  return name || "Someone";
}

/** Goal `id` values from `ProfileTab.jsx` `GOAL_OPTIONS` / `member_profiles.goals` (case-insensitive). */
const GOAL_PRIMARY_EMOJI = {
  general_health: "💚",
  longevity: "🧬",
  performance: "🏆",
  shred: "🔥",
  bulk: "💪",
  recomp: "⚖️",
  optimize: "🎯",
  mental_elevate: "🧠",
  mental: "🧠",
};

/** @param {unknown} userGoals — string (CSV), string[], or JSON array from `member_profiles.goals` */
function normalizeGoalIdList(userGoals) {
  if (Array.isArray(userGoals)) {
    return userGoals.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (typeof userGoals === "string") {
    return userGoals.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** First selected goal → emoji; otherwise 🔔 (same keys as `GOAL_OPTIONS` in ProfileTab.jsx). */
function primaryGoalNotificationEmoji(userGoals) {
  for (const raw of normalizeGoalIdList(userGoals)) {
    const key = raw.toLowerCase();
    if (GOAL_PRIMARY_EMOJI[key]) return GOAL_PRIMARY_EMOJI[key];
  }
  return "🔔";
}

/** @param {unknown} type */
function notificationBodyFromType(type) {
  const t = String(type ?? "").toLowerCase();
  if (t === "new_follower" || t === "follow") return "started following you";
  if (t.includes("like") && t.includes("comment")) return "engaged with your post";
  if (t.includes("like") || t === "like") return "liked your post";
  if (t.includes("comment") || t === "comment") return "commented on your post";
  if (t) return t.replace(/_/g, " ");
  return "Notification";
}

/**
 * @param {{ userId?: string | null; userGoals?: unknown }} props
 */
export function NotificationsBell({ userId, userGoals }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(/** @type {object[]} */ ([]));
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  /** @type {{ top: number; left: number; width: number } | null} */
  const [panelPlacement, setPanelPlacement] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setRows([]);
      setUnread(0);
      return;
    }
    const [{ rows: list, error: e1 }, { count, error: e2 }] = await Promise.all([
      fetchNotificationsRecent(10),
      getUnreadNotificationCount(),
    ]);
    if (!e1) setRows(list);
    if (!e2) setUnread(count);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    const id = window.setInterval(() => void refresh(), 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId, refresh]);

  const updatePanelPlacement = useCallback(() => {
    const el = btnRef.current;
    if (!el || typeof window === "undefined") {
      setPanelPlacement(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const width = Math.min(340, Math.max(220, window.innerWidth - 32));
    const top = r.bottom + 8;
    let left = r.right - width;
    const pad = 16;
    if (left < pad) left = pad;
    if (left + width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - width - pad);
    }
    setPanelPlacement({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPlacement(null);
      return;
    }
    updatePanelPlacement();
    const onResize = () => updatePanelPlacement();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, updatePanelPlacement]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onToggle = () => {
    setOpen((o) => !o);
    if (!open) void refresh();
  };

  const onMarkAll = async () => {
    setMarkAllBusy(true);
    try {
      await markAllNotificationsRead();
      await refresh();
    } finally {
      setMarkAllBusy(false);
    }
  };

  const openActorProfileFromRow = useCallback(
    async (row) => {
      const h = normalizeHandleInput(row.actor_handle ?? "");
      if (!h) return;
      setOpen(false);
      openPublicMemberProfile(h);
      const nid = typeof row.id === "string" ? row.id.trim() : "";
      if (!nid || row.read === true) return;
      setBusy(true);
      try {
        await markNotificationRead(nid);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const handleNotificationRowActivate = useCallback(
    async (row) => {
      const nid = typeof row.id === "string" ? row.id.trim() : "";
      const type = String(row.type ?? "").toLowerCase();
      const alreadyRead = row.read === true;

      setOpen(false);

      const markIfNeeded = async () => {
        if (!nid || alreadyRead) return;
        await markNotificationRead(nid);
        await refresh();
      };

      setBusy(true);
      try {
        if (type === "new_follower" || type === "follow") {
          const h = normalizeHandleInput(row.actor_handle ?? "");
          if (h) {
            openPublicMemberProfile(h);
            await markIfNeeded();
            return;
          }
          await markIfNeeded();
          return;
        }

        const isEngagement =
          type.includes("like") || type.includes("comment") || type === "like" || type === "comment";
        if (isEngagement) {
          const share = typeof row.target_share_id === "string" ? row.target_share_id.trim() : "";
          if (share) {
            await markIfNeeded();
            window.location.assign(`/stack/${encodeURIComponent(share)}`);
            return;
          }
          const rawPost = row.target_network_post_id;
          const postId =
            typeof rawPost === "string"
              ? rawPost.trim()
              : rawPost != null && String(rawPost).trim()
                ? String(rawPost).trim()
                : "";
          if (postId) {
            window.dispatchEvent(new CustomEvent("pepguide:open-network-post", { detail: { postId } }));
            await markIfNeeded();
            return;
          }
          window.dispatchEvent(new CustomEvent("pepguide:open-network-tab"));
          await markIfNeeded();
          return;
        }

        await markIfNeeded();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  if (!userId || !isSupabaseConfigured()) return null;

  const bellEmoji = primaryGoalNotificationEmoji(userGoals);

  const maxPanelH =
    panelPlacement && typeof window !== "undefined"
      ? Math.min(420, Math.max(160, window.innerHeight - panelPlacement.top - 16))
      : 420;

  const panelEl =
    open && panelPlacement ? (
      <div
        ref={panelRef}
        role="menu"
        style={{
          position: "fixed",
          top: panelPlacement.top,
          left: panelPlacement.left,
          width: panelPlacement.width,
          maxHeight: maxPanelH,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#0b0f17",
          border: "1px solid #243040",
          borderRadius: 10,
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
          zIndex: NOTIFICATIONS_DROPDOWN_Z_INDEX,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 12px",
            borderBottom: "1px solid #1a2430",
            flexShrink: 0,
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "#6b7c8f", letterSpacing: "0.12em" }}>
            NOTIFICATIONS
          </span>
          <button
            type="button"
            className="mono"
            disabled={markAllBusy || unread === 0}
            onClick={() => void onMarkAll()}
            style={{
              fontSize: 11,
              color: unread === 0 ? "#4a5568" : "#00d4aa",
              background: "none",
              border: "none",
              cursor: unread === 0 ? "default" : "pointer",
              letterSpacing: "0.06em",
              padding: "4px 0",
            }}
          >
            {markAllBusy ? "…" : "Mark all read"}
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {rows.length === 0 ? (
            <div className="mono" style={{ padding: 20, fontSize: 13, color: "#6b7c8f", textAlign: "center" }}>
              No notifications yet.
            </div>
          ) : (
            rows.map((row) => {
              const id = typeof row.id === "string" ? row.id : "";
              const isRead = row.read === true;
              const label = actorLabel(row);
              const ago = formatTimeAgo(typeof row.created_at === "string" ? row.created_at : "");
              const body = notificationBodyFromType(row.type);
              const actorCanon = normalizeHandleInput(row.actor_handle ?? "");
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => void handleNotificationRowActivate(row)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    border: "none",
                    borderBottom: "1px solid #14202e",
                    background: isRead ? "transparent" : "rgba(0, 212, 170, 0.06)",
                    cursor: busy ? "wait" : "pointer",
                    display: "block",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.45 }}>
                    {actorCanon ? (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          void openActorProfileFromRow(row);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          e.stopPropagation();
                          void openActorProfileFromRow(row);
                        }}
                        style={{
                          fontWeight: 700,
                          color: "#00d4aa",
                          cursor: busy ? "wait" : "pointer",
                          textDecoration: "underline",
                          textDecorationColor: "rgba(0, 212, 170, 0.35)",
                          textUnderlineOffset: 3,
                        }}
                      >
                        {label}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 700, color: "#00d4aa" }}>{label}</span>
                    )}{" "}
                    <span style={{ color: "#94a3b8" }}>{body}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    {ago}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    ) : null;

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        className={`pepv-header-action-btn pepv-header-action-btn--icon${unread > 0 ? " pepv-notifications-bell--unread" : ""}`}
        data-active={open ? "true" : undefined}
        onClick={onToggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        style={{ position: "relative" }}
      >
        <span className="pepv-emoji" style={{ fontSize: 22, lineHeight: 1, opacity: open ? 1 : 0.88 }} aria-hidden>
          {bellEmoji}
        </span>
        {unread > 0 ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 4,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00d4aa",
              boxShadow: "0 0 0 2px #0b0f17",
            }}
          />
        ) : null}
      </button>

      {typeof document !== "undefined" && panelEl ? createPortal(panelEl, document.body) : null}
    </div>
  );
}
