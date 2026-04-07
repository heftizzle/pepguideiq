import { useCallback, useEffect, useState } from "react";
import { NETWORK_TAB_EMOJI } from "../context/DemoTourContext.jsx";
import { fetchNetworkFeed } from "../lib/supabase.js";
import { isSupabaseConfigured } from "../lib/config.js";
import { buildStackShareUrl } from "../lib/stackShare.js";
import { formatHandleDisplay } from "../lib/memberProfileHandle.js";

/** Tier emoji for Network cards (entry shown as free 🌱). */
const NETWORK_TIER_EMOJI = {
  entry: "🌱",
  pro: "🔬",
  elite: "⚡",
  goat: "🐐",
};

function networkTierEmoji(tier) {
  const t = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  return NETWORK_TIER_EMOJI[t] ?? NETWORK_TIER_EMOJI.entry;
}

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

function NetworkFeedSkeleton() {
  return (
    <div
      className="pcard"
      style={{
        cursor: "default",
        pointerEvents: "none",
        minHeight: 112,
        transform: "none",
        boxShadow: "none",
      }}
      aria-hidden
    >
      <div style={{ height: 14, background: "#1a2430", borderRadius: 6, width: "38%", marginBottom: 14 }} />
      <div style={{ height: 16, background: "#1a2430", borderRadius: 6, width: "72%", marginBottom: 10 }} />
      <div style={{ height: 12, background: "#1a2430", borderRadius: 6, width: "50%" }} />
    </div>
  );
}

/**
 * @param {{ userId?: string }} props
 */
export function NetworkTab({ userId }) {
  const [items, setItems] = useState(/** @type {object[]} */ ([]));
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await fetchNetworkFeed();
    setItems(rows);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (!userId) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div className="mono" style={{ color: "#6b7c8f", fontSize: 14 }}>
          Sign in to browse the Network feed.
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div className="mono" style={{ color: "#6b7c8f", fontSize: 14 }}>
          Configure Supabase to use Network.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="brand" style={{ fontSize: 17, fontWeight: 700 }}>
            NETWORK
          </div>
          <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginTop: 4, maxWidth: 520 }}>
            Public stacks shared by the community.
          </div>
        </div>
        <button
          type="button"
          className="btn-teal"
          disabled={loading}
          onClick={() => void loadFeed()}
          style={{ fontSize: 13, padding: "8px 14px", minHeight: 44, flexShrink: 0 }}
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NetworkFeedSkeleton />
          <NetworkFeedSkeleton />
          <NetworkFeedSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            border: "1px dashed #14202e",
            borderRadius: 12,
            padding: "56px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.35 }} aria-hidden>
            {NETWORK_TAB_EMOJI}
          </div>
          <div style={{ fontSize: 14, color: "#8fa5bf", lineHeight: 1.55, maxWidth: 360, margin: "0 auto" }}>
            No stacks shared yet. Be the first — share your stack from the Stacks tab.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((row, idx) => {
            const shareId = typeof row.share_id === "string" ? row.share_id.trim() : "";
            const handle = typeof row.handle === "string" ? row.handle.trim() : "";
            const displayName = typeof row.display_name === "string" ? row.display_name.trim() : "—";
            const tier = typeof row.tier === "string" ? row.tier : "entry";
            const compoundCount =
              typeof row.compound_count === "number" ? row.compound_count : Number(row.compound_count) || 0;
            const score =
              typeof row.pepguideiq_score === "number"
                ? row.pepguideiq_score
                : Number(row.pepguideiq_score) || 0;
            const updatedAt = typeof row.updated_at === "string" ? row.updated_at : "";
            const tierEmoji = networkTierEmoji(tier);
            const url = shareId ? buildStackShareUrl(shareId) : "";
            const compoundLabel = `${compoundCount} compound${compoundCount === 1 ? "" : "s"}`;

            return (
              <button
                key={`${shareId || idx}`}
                type="button"
                className="pcard"
                onClick={() => {
                  if (!shareId) return;
                  window.location.assign(`/stack/${encodeURIComponent(shareId)}`);
                }}
                style={{
                  textAlign: "left",
                  cursor: url ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontFamily: "'Outfit', sans-serif",
                  color: "#dde4ef",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                    <div className="mono" style={{ fontSize: 14, color: "#00d4aa", marginBottom: handle ? 6 : 0 }}>
                      {handle ? formatHandleDisplay(handle) : displayName}
                    </div>
                    {handle ? (
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>{displayName}</div>
                    ) : null}
                  </div>
                  <span className="pepv-emoji" style={{ fontSize: 22, flexShrink: 0 }} title={tier} aria-hidden>
                    {tierEmoji}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 13, color: "#6b7c8f" }}>
                    {compoundLabel}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "#8fa5bf" }}>
                    pepguideIQ{" "}
                    <span style={{ color: "#00d4aa", fontWeight: 700 }}>{score}</span>
                  </span>
                  {updatedAt ? (
                    <span className="mono" style={{ fontSize: 12, color: "#5c6d82" }}>
                      {formatTimeAgo(updatedAt)}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
