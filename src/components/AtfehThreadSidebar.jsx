import { useState, useEffect, useCallback, useRef } from "react";

const THREAD_LIMITS = { entry: 5, pro: 10, elite: 20, goat: 30 };

function getThreadLimit(plan) {
  return THREAD_LIMITS[plan] || THREAD_LIMITS.entry;
}

export default function AtfehThreadSidebar({
  workerUrl,
  accessToken,
  profileId,
  plan,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onUpgrade,
  refreshKey,
  mobileOpen,
  onMobileClose,
}) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const isControlled = mobileOpen !== undefined;
  const drawerOpen = isControlled ? mobileOpen : internalDrawerOpen;
  const closeDrawer = () => {
    if (isControlled) onMobileClose?.();
    else setInternalDrawerOpen(false);
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const fetchThreads = useCallback(async () => {
    if (!workerUrl || !accessToken || !profileId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${workerUrl}/atfeh/threads?profile_id=${profileId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error(`Failed to load threads (${res.status})`);
      const data = await res.json();
      setThreads([...(data.active || []), ...(data.archived || [])]);
    } catch (err) {
      setError(err.message || "Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, [workerUrl, accessToken, profileId, refreshKey]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const handleArchive = async (threadId) => {
    try {
      const res = await fetch(`${workerUrl}/atfeh/threads/${threadId}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Archive failed");
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, archived: true } : t))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestore = async (threadId) => {
    try {
      const res = await fetch(`${workerUrl}/atfeh/threads/${threadId}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Restore failed");
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, archived: false } : t))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNewThread = () => {
    const active = threads.filter((t) => !t.archived);
    const limit = getThreadLimit(plan);
    if (active.length >= limit) {
      onUpgrade("thread_limit");
      return;
    }
    onNewThread();
  };

  const active = threads
    .filter((t) => !t.archived)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const archived = threads
    .filter((t) => t.archived)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const limit = getThreadLimit(plan);

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Header */}
      <div
        className="mono"
        style={{
          fontSize: 13,
          color: "var(--color-accent)",
          letterSpacing: ".15em",
          marginBottom: 2,
          flexShrink: 0,
        }}
      >
        THREADS
      </div>

      {/* New Thread button */}
      <button
        type="button"
        className="btn-teal"
        onClick={handleNewThread}
        style={{ width: "100%", fontSize: 13, marginBottom: 8 }}
      >
        + New Thread
      </button>

      {/* Limit indicator */}
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-placeholder)",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {active.length}/{limit} threads
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-danger, #ef4444)",
            padding: "6px 8px",
            borderRadius: 6,
            background: "rgba(239,68,68,0.08)",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Thread list — scrollable */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {loading ? (
          <div style={{ padding: "18px 0", textAlign: "center" }}>
            <div
              className="mono"
              style={{ fontSize: 12, color: "var(--color-text-placeholder)" }}
            >
              Loading…
            </div>
          </div>
        ) : active.length === 0 && archived.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{
              fontSize: 28,
              marginBottom: 8,
              opacity: 0.5,
              filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--color-accent) 30%, transparent))"
            }}>⬡</div>
            <div className="mono" style={{
              color: "var(--color-text-placeholder)",
              fontSize: 12,
              lineHeight: 1.6
            }}>No threads yet —<br/>start a research<br/>conversation</div>
          </div>
        ) : (
          <>
            {active.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                isActive={t.id === activeThreadId}
                onSelect={() => {
                  onSelectThread(t.id);
                  if (isMobile) closeDrawer();
                }}
                onArchive={() => handleArchive(t.id)}
              />
            ))}

            {archived.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--color-border-hairline)",
                  marginTop: 14,
                  paddingTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={() => setArchivedOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                    cursor: "pointer",
                    color: "var(--color-text-placeholder)",
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: ".1em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: archivedOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 150ms ease",
                      fontSize: 10,
                    }}
                  >
                    ▶
                  </span>
                  ARCHIVED ({archived.length})
                </button>

                {archivedOpen &&
                  archived.map((t) => (
                    <ThreadRow
                      key={t.id}
                      thread={t}
                      isActive={t.id === activeThreadId}
                      archived
                      onSelect={() => {
                        onSelectThread(t.id);
                        if (isMobile) closeDrawer();
                      }}
                      onRestore={() => handleRestore(t.id)}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {!isControlled && (
          <button
            type="button"
            onClick={() => setInternalDrawerOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "1px solid var(--color-border-default)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "var(--color-accent)",
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            ☰ Threads
          </button>
        )}

        {drawerOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
              }}
              onClick={closeDrawer}
            />

            <div
              ref={drawerRef}
              style={{
                position: "relative",
                width: 280,
                height: "100%",
                background: "var(--color-bg-card)",
                borderRight: "1px solid var(--color-border-default)",
                padding: "16px 14px",
                overflowY: "auto",
                zIndex: 1,
                animation: "slideInLeft 200ms ease-out",
              }}
            >
              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                  minWidth: 44,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close threads drawer"
              >
                ×
              </button>

              {sidebarContent}
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
        `}</style>
      </>
    );
  }

  // Desktop: persistent sidebar
  return (
    <div
      style={{
        width: 190,
        flexShrink: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        padding: "0 0 12px 0",
      }}
    >
      {sidebarContent}
    </div>
  );
}

function ThreadRow({ thread, isActive, archived, onSelect, onArchive, onRestore }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    padding: "10px 12px",
    borderRadius: 8,
    border: isActive
      ? "1px solid var(--color-accent)"
      : "1px solid var(--color-border-default)",
    background: isActive
      ? "var(--color-accent-subtle-10)"
      : hovered
        ? "var(--color-bg-hover)"
        : "transparent",
    cursor: "pointer",
    transition: "background 150ms ease, border-color 150ms ease",
    textAlign: "left",
    width: "100%",
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: archived ? "var(--color-text-muted)" : "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {thread.title || "Untitled"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Message count badge */}
        {(thread.message_count ?? 0) > 0 && (
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-placeholder)",
              background: "var(--color-bg-hover, rgba(255,255,255,0.04))",
              borderRadius: 10,
              padding: "1px 6px",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.4,
            }}
          >
            {thread.message_count}
          </span>
        )}

        {/* Action button — archive or restore */}
        {archived && onRestore ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRestore(); }}
            title="Restore thread"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-accent)",
              fontSize: 12,
              cursor: "pointer",
              padding: "2px 4px",
              minWidth: 32,
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              opacity: hovered ? 1 : 0.5,
              transition: "opacity 150ms ease",
            }}
          >
            ↩
          </button>
        ) : !archived && onArchive && hovered ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            title="Archive thread"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-placeholder)",
              fontSize: 11,
              cursor: "pointer",
              padding: "2px 4px",
              minWidth: 32,
              minHeight: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
