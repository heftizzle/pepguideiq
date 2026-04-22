import { useCallback, useEffect, useMemo, useState } from "react";
import { PEPTIDES } from "../data/catalog.js";
import { NETWORK_TAB_EMOJI } from "../context/DemoTourContext.jsx";
import { fetchNetworkFeed, fetchPublicNetworkDoseFeed } from "../lib/supabase.js";
import { API_WORKER_URL, isSupabaseConfigured } from "../lib/config.js";
import { resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";
import { buildStackShareUrl } from "../lib/stackShare.js";
import { formatHandleDisplay } from "../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../lib/openPublicProfile.js";
import { formatDoseAmountFromMcg } from "../lib/doseLogDisplay.js";
import { TIERS, tierAccentCssVar } from "../lib/tiers.js";

const AVATAR_BASE = `${String(API_WORKER_URL || "").replace(/\/$/, "")}/avatars`;

/**
 * Public avatar image URL. Prefer full R2 key (`userId/member-profiles/…`) via Worker `/avatars/{key}`;
 * otherwise `{userId}/{r2Key}` when `r2Key` is a bare filename.
 * @param {string | null | undefined} userId
 * @param {string | null | undefined} r2Key
 * @returns {string | null}
 */
function buildAvatarUrl(userId, r2Key) {
  const key = typeof r2Key === "string" ? r2Key.trim() : "";
  if (!key || key.includes("..")) return null;
  if (key.includes("/")) {
    const u = resolveMemberAvatarDisplayUrlFromKey(key);
    return u || null;
  }
  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid || !String(API_WORKER_URL || "").trim()) return null;
  return `${AVATAR_BASE}/${uid}/${key}`;
}

/**
 * @param {{ userId?: string | null; r2Key?: string | null }} p
 */
function NetworkAvatar({ userId, r2Key }) {
  const src = buildAvatarUrl(userId, r2Key);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: "1px solid var(--color-border-default)",
      }}
    />
  );
}

/** Tier emoji for Network stack cards (aligned with `TIERS` / plan cards). */
function networkTierEmoji(tier) {
  const t = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  return (TIERS[t] ?? TIERS.entry).emoji;
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

/** @param {string | null | undefined} route */
function formatRouteLabel(route) {
  const r = typeof route === "string" ? route.trim().toLowerCase() : "";
  if (!r) return "—";
  const map = {
    injectable: "Injectable",
    oral: "Oral",
    intranasal: "Intranasal",
    topical: "Topical",
    non_injectable: "Non-injectable",
  };
  return map[r] ?? r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** @param {string | null | undefined} session */
function formatSessionLabel(session) {
  const s = typeof session === "string" ? session.trim().toLowerCase() : "";
  if (!s) return null;
  const map = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * @param {unknown} amount
 * @param {unknown} unit
 * @param {{ doseUnit?: string } | null | undefined} [catalogEntry] — e.g. HGH 191AA (`doseUnit: 'IU'`) from `PEPTIDES`
 */
function formatDoseLine(amount, unit, catalogEntry) {
  const u = typeof unit === "string" ? unit.trim().toLowerCase() : "";
  const n = Number(amount);
  if (u === "mcg" && Number.isFinite(n) && n > 0) {
    return formatDoseAmountFromMcg(n, catalogEntry) ?? `${n} mcg`;
  }
  if (Number.isFinite(n) && u) return `${n} ${unit}`.trim();
  if (Number.isFinite(n)) return String(n);
  if (typeof amount === "string" && amount.trim()) return amount.trim();
  return "—";
}

function catalogEntryByCompoundId(compoundId) {
  const id = typeof compoundId === "string" ? compoundId.trim() : "";
  if (!id) return undefined;
  return PEPTIDES.find((x) => x && x.id === id);
}

function compoundDisplayName(compoundId) {
  const p = catalogEntryByCompoundId(compoundId);
  return (p && typeof p.name === "string" && p.name.trim()) || (typeof compoundId === "string" && compoundId.trim()) || "—";
}

const INBODY_METRIC_LABEL = {
  weight_lbs: "Weight",
  smm_lbs: "SMM",
  pbf_pct: "BF%",
  inbody_score: "Score",
  lean_mass_lbs: "Lean",
  bmr_kcal: "BMR",
};

/**
 * @param {{ row: Record<string, unknown> }} p
 */
function InbodyNetworkProgressCard({ row }) {
  const cj = row.content_json;
  const o = cj != null && typeof cj === "object" ? /** @type {Record<string, unknown>} */ (cj) : {};
  const days = typeof o.daysBetween === "number" && Number.isFinite(o.daysBetween) ? o.daysBetween : null;
  const deltas = o.deltas != null && typeof o.deltas === "object" ? /** @type {Record<string, unknown>} */ (o.deltas) : {};
  const selected = Array.isArray(o.selectedMetrics) ? o.selectedMetrics.map(String) : [];
  const stackSnap = Array.isArray(o.stackSnapshot) ? o.stackSnapshot : [];
  const userId = typeof row.user_id === "string" ? row.user_id.trim() : "";
  const avatarR2Key = typeof row.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";
  const handle = typeof row.handle === "string" ? row.handle.trim() : "";
  const displayHandle = typeof row.display_handle === "string" ? row.display_handle.trim() : "";
  const displayName = typeof row.display_name === "string" ? row.display_name.trim() : "";
  const verified =
    row.verified_credential != null &&
    String(row.verified_credential).trim() !== "";
  const createdAt = typeof row.created_at === "string" ? row.created_at : "";
  const expiresAt = typeof row.expires_at === "string" ? row.expires_at : "";
  const expiresSoon = isExpiresWithinHours(expiresAt, 6);
  const handleShown = handle ? formatHandleDisplay(handle, displayHandle || null) : displayName || "Member";

  const formatDeltaVal = (k) => {
    const v = deltas[k];
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    if (k === "pbf_pct" || k === "inbody_score") return `${sign}${abs.toFixed(1)}${k === "pbf_pct" ? "%" : ""}`;
    if (k === "bmr_kcal") return `${sign}${Math.round(abs)}`;
    return `${sign}${abs.toFixed(1)}`;
  };

  return (
    <div
      className="pcard"
      role="article"
      style={{
        cursor: "default",
        transform: "none",
        boxShadow: expiresSoon ? "0 1px 3px rgba(0,0,0,0.45)" : undefined,
        opacity: expiresSoon ? 0.88 : 1,
        fontFamily: "'Outfit', sans-serif",
        color: "var(--color-text-primary)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px", marginBottom: 10 }}>
        <NetworkAvatar userId={userId} r2Key={avatarR2Key} />
        {handle ? (
          <button
            type="button"
            onClick={() => openPublicMemberProfile(handle)}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              textDecoration: "underline",
              textDecorationColor: "rgba(248, 250, 252, 0.25)",
              textUnderlineOffset: 3,
            }}
          >
            {handleShown}
          </button>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>{handleShown}</span>
        )}
        {verified ? (
          <span
            title="Verified"
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.06em",
              color: "var(--color-accent)",
              border: "1px solid var(--color-bell-border-unread)",
              borderRadius: 6,
              padding: "2px 8px",
              background: "var(--color-accent-dim)",
            }}
          >
            ✓ VERIFIED
          </span>
        ) : null}
        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: "auto" }}>
          InBody progress{days != null ? ` · ${days} days` : ""}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {(selected.length ? selected : Object.keys(deltas))
          .filter((k) => k in INBODY_METRIC_LABEL)
          .slice(0, 6)
          .map((k) => (
          <div
            key={k}
            style={{
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              padding: "8px 10px",
              minWidth: 72,
              textAlign: "center",
            }}
          >
            <div className="mono" style={{ fontSize: 9, color: "var(--color-text-muted)", marginBottom: 4 }}>
              {INBODY_METRIC_LABEL[k] ?? k}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-accent)" }}>{formatDeltaVal(k)}</div>
          </div>
        ))}
      </div>
      {stackSnap.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {stackSnap.map((s, i) => {
            const name = s && typeof s === "object" && typeof /** @type {{name?:string}} */ (s).name === "string" ? /** @type {{name?:string}} */ (s).name : "";
            if (!name.trim()) return null;
            return (
              <span
                key={`${name}-${i}`}
                className="mono"
                style={{
                  fontSize: 10,
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid var(--color-border-emphasis)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {name.trim()}
              </span>
            );
          })}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent-nav-border)",
            borderRadius: 6,
            padding: "2px 8px",
            background: "var(--color-accent-nav-fill)",
          }}
        >
          Receipted · InBody 570
        </span>
        {createdAt ? (
          <span className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {formatTimeAgo(createdAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {string | null | undefined} expiresIso
 */
function isExpiresWithinHours(expiresIso, hours) {
  if (typeof expiresIso !== "string" || !expiresIso) return false;
  const end = Date.parse(expiresIso);
  if (!Number.isFinite(end)) return false;
  const msLeft = end - Date.now();
  return msLeft > 0 && msLeft <= hours * 3600 * 1000;
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
      <div style={{ height: 14, background: "var(--color-surface-hover)", borderRadius: 6, width: "38%", marginBottom: 14 }} />
      <div style={{ height: 16, background: "var(--color-surface-hover)", borderRadius: 6, width: "72%", marginBottom: 10 }} />
      <div style={{ height: 12, background: "var(--color-surface-hover)", borderRadius: 6, width: "50%" }} />
    </div>
  );
}

function DoseFeedSkeleton() {
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
 * @param {unknown} raw
 * @returns {object[]}
 */
function normalizeDoseRpcRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw != null && typeof raw === "object") return [raw];
  return [];
}

/**
 * @param {{ userId?: string; scrollToDosePostId?: string | null; onConsumedDosePostScrollTarget?: () => void }} props
 */
export function NetworkTab({ userId, scrollToDosePostId = null, onConsumedDosePostScrollTarget }) {
  const [stackItems, setStackItems] = useState(/** @type {object[]} */ ([]));
  const [doseItems, setDoseItems] = useState(/** @type {object[]} */ ([]));
  const [stackLoading, setStackLoading] = useState(true);
  const [doseLoading, setDoseLoading] = useState(true);
  const [stackError, setStackError] = useState(/** @type {string | null} */ (null));
  const [doseError, setDoseError] = useState(/** @type {string | null} */ (null));

  const loadStackFeed = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setStackItems([]);
      setStackError(null);
      setStackLoading(false);
      return;
    }
    setStackLoading(true);
    const { rows, error } = await fetchNetworkFeed();
    if (error) {
      setStackError(error.message || "Could not load shared stacks.");
    } else {
      setStackItems(rows);
      setStackError(null);
    }
    setStackLoading(false);
  }, [userId]);

  const loadDoseFeed = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setDoseItems([]);
      setDoseError(null);
      setDoseLoading(false);
      return;
    }
    setDoseLoading(true);
    const { rows, error } = await fetchPublicNetworkDoseFeed();
    if (error) {
      setDoseError(error.message || "Could not load live dosing.");
    } else {
      setDoseItems(normalizeDoseRpcRows(rows));
      setDoseError(null);
    }
    setDoseLoading(false);
  }, [userId]);

  const refreshAll = useCallback(() => {
    void loadStackFeed();
    void loadDoseFeed();
  }, [loadStackFeed, loadDoseFeed]);

  useEffect(() => {
    void loadStackFeed();
  }, [loadStackFeed]);

  useEffect(() => {
    void loadDoseFeed();
  }, [loadDoseFeed]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    const id = window.setInterval(() => void loadDoseFeed(), 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadDoseFeed();
        void loadStackFeed();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId, loadDoseFeed, loadStackFeed]);

  useEffect(() => {
    const pid = typeof scrollToDosePostId === "string" ? scrollToDosePostId.trim() : "";
    if (!pid || doseLoading) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`pepv-network-dose-${pid}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        onConsumedDosePostScrollTarget?.();
      }
    }, 100);
    return () => window.clearTimeout(t);
  }, [scrollToDosePostId, doseLoading, doseItems, onConsumedDosePostScrollTarget]);

  const headerBusy = useMemo(() => stackLoading || doseLoading, [stackLoading, doseLoading]);

  if (!userId) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div className="mono" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          Sign in to browse the Network feed.
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center" }}>
        <div className="mono" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
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
          <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginTop: 4, maxWidth: 560 }}>
            Live dose activity from the community and public stacks shared for discovery.
          </div>
        </div>
        <button
          type="button"
          className="btn-teal"
          disabled={headerBusy}
          onClick={() => refreshAll()}
          style={{ fontSize: 13, padding: "8px 14px", minHeight: 44, flexShrink: 0 }}
        >
          {headerBusy ? "…" : "Refresh"}
        </button>
      </div>

      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.1em", marginBottom: 10 }}>
        LIVE DOSING
      </div>
      {doseError ? (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--color-warning)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          {doseItems.length > 0 ? `Could not refresh live dosing: ${doseError}` : `Live dosing is unavailable: ${doseError}`}
        </div>
      ) : null}
      {doseLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          <DoseFeedSkeleton />
          <DoseFeedSkeleton />
        </div>
      ) : doseError && doseItems.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(245, 158, 11, 0.4)",
            borderRadius: 12,
            padding: "36px 20px",
            textAlign: "center",
            marginBottom: 28,
            background: "var(--color-bg-elevated)",
          }}
        >
          <div style={{ fontSize: 13, color: "#fcd34d", lineHeight: 1.55, maxWidth: 420, margin: "0 auto" }}>
            Live dose activity could not be loaded right now. Try refresh in a moment.
          </div>
        </div>
      ) : doseItems.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--color-border-default)",
            borderRadius: 12,
            padding: "36px 20px",
            textAlign: "center",
            marginBottom: 28,
            background: "var(--color-bg-elevated)",
          }}
        >
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, maxWidth: 400, margin: "0 auto" }}>
            No recent dose posts yet. Log a dose from Protocol or Stacks and choose &quot;Post It&quot; to share here
            (posts expire after 72 hours).
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {doseItems.map((row, idx) => {
            const postType = typeof row.post_type === "string" ? row.post_type.trim().toLowerCase() : "dose";
            if (postType === "inbody_progress") {
              const id = typeof row.id === "string" ? row.id : `inbody-${idx}`;
              return <InbodyNetworkProgressCard key={id} row={row} />;
            }
            const id = typeof row.id === "string" ? row.id : `dose-${idx}`;
            const handle = typeof row.handle === "string" ? row.handle.trim() : "";
            const displayHandle = typeof row.display_handle === "string" ? row.display_handle.trim() : "";
            const displayName = typeof row.display_name === "string" ? row.display_name.trim() : "";
            const verified =
              row.verified_credential != null &&
              String(row.verified_credential).trim() !== "";
            const compoundId = typeof row.compound_id === "string" ? row.compound_id.trim() : "";
            const catalogEntry = catalogEntryByCompoundId(compoundId);
            const compoundName = compoundDisplayName(compoundId);
            const doseLine = formatDoseLine(row.dose_amount, row.dose_unit, catalogEntry);
            const routeLabel = formatRouteLabel(row.route);
            const sessionPretty = formatSessionLabel(row.session_label);
            const stackLabel = typeof row.stack_label === "string" && row.stack_label.trim() ? row.stack_label.trim() : null;
            const createdAt = typeof row.created_at === "string" ? row.created_at : "";
            const expiresAt = typeof row.expires_at === "string" ? row.expires_at : "";
            const expiresSoon = isExpiresWithinHours(expiresAt, 6);
            const handleShown = handle ? formatHandleDisplay(handle, displayHandle || null) : displayName || "Member";
            const userId = typeof row.user_id === "string" ? row.user_id.trim() : "";
            const avatarR2Key = typeof row.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";

            return (
              <div
                key={id}
                id={typeof row.id === "string" && row.id ? `pepv-network-dose-${row.id}` : undefined}
                className="pcard"
                role="article"
                style={{
                  cursor: "default",
                  transform: "none",
                  boxShadow: expiresSoon ? "0 1px 3px rgba(0,0,0,0.45)" : undefined,
                  opacity: expiresSoon ? 0.88 : 1,
                  fontFamily: "'Outfit', sans-serif",
                  color: "var(--color-text-primary)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 12px", marginBottom: 10 }}>
                  <NetworkAvatar userId={userId} r2Key={avatarR2Key} />
                  {handle ? (
                    <button
                      type="button"
                      onClick={() => openPublicMemberProfile(handle)}
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(248, 250, 252, 0.25)",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {handleShown}
                    </button>
                  ) : (
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>{handleShown}</span>
                  )}
                  {verified ? (
                    <span
                      title="Verified"
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        color: "var(--color-accent)",
                        border: "1px solid var(--color-bell-border-unread)",
                        borderRadius: 6,
                        padding: "2px 8px",
                        background: "var(--color-accent-dim)",
                      }}
                    >
                      ✓ VERIFIED
                    </span>
                  ) : null}
                  {expiresSoon ? (
                    <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginLeft: "auto" }}>
                      Expires soon
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-accent)", marginBottom: 6, lineHeight: 1.35 }}>
                  {compoundName}
                  <span style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: 14 }}>
                    {" "}
                    · {doseLine} · {routeLabel}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                  {sessionPretty ? <span>Session: {sessionPretty}</span> : null}
                  {stackLabel ? <span>Stack: {stackLabel}</span> : null}
                  {createdAt ? <span>{formatTimeAgo(createdAt)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: "0.1em", marginBottom: 10 }}>
        SHARED STACKS
      </div>
      {stackError ? (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--color-warning)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 12,
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          {stackItems.length > 0 ? `Could not refresh shared stacks: ${stackError}` : `Shared stacks are unavailable: ${stackError}`}
        </div>
      ) : null}
      {stackLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NetworkFeedSkeleton />
          <NetworkFeedSkeleton />
        </div>
      ) : stackError && stackItems.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(245, 158, 11, 0.4)",
            borderRadius: 12,
            padding: "56px 20px",
            textAlign: "center",
            background: "var(--color-bg-card)",
          }}
        >
          <div style={{ fontSize: 14, color: "#fcd34d", lineHeight: 1.55, maxWidth: 380, margin: "0 auto" }}>
            Shared stacks could not be loaded right now. Try refresh in a moment.
          </div>
        </div>
      ) : stackItems.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--color-border-default)",
            borderRadius: 12,
            padding: "56px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.35 }} aria-hidden>
            {NETWORK_TAB_EMOJI}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.55, maxWidth: 360, margin: "0 auto" }}>
            No stacks shared yet. Be the first — share your stack from the Stacks tab.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stackItems.map((row, idx) => {
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
            const stackUserId = typeof row.user_id === "string" ? row.user_id.trim() : "";
            const stackAvatarKey = typeof row.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";

            return (
              <div
                key={`${shareId || idx}`}
                className="pcard"
                role="button"
                tabIndex={shareId ? 0 : -1}
                onClick={() => {
                  if (!shareId) return;
                  window.location.assign(`/stack/${encodeURIComponent(shareId)}`);
                }}
                onKeyDown={(e) => {
                  if (!shareId) return;
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  window.location.assign(`/stack/${encodeURIComponent(shareId)}`);
                }}
                style={{
                  textAlign: "left",
                  cursor: url ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontFamily: "'Outfit', sans-serif",
                  color: "var(--color-text-primary)",
                  borderLeft: `3px solid ${tierAccentCssVar(tier)}`,
                  paddingLeft: 12,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
                    <NetworkAvatar userId={stackUserId} r2Key={stackAvatarKey} />
                    <div style={{ minWidth: 0 }}>
                      {handle ? (
                        <button
                          type="button"
                          className="mono"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPublicMemberProfile(handle);
                          }}
                          style={{
                            fontSize: 14,
                            color: "var(--color-accent)",
                            marginBottom: 6,
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                            textDecoration: "underline",
                            textDecorationColor: "var(--color-accent-subtle-50)",
                            textUnderlineOffset: 3,
                          }}
                        >
                          {formatHandleDisplay(handle)}
                        </button>
                      ) : (
                        <div className="mono" style={{ fontSize: 14, color: "var(--color-accent)", marginBottom: 0 }}>
                          {displayName}
                        </div>
                      )}
                      {handle ? (
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>{displayName}</div>
                      ) : null}
                    </div>
                  </div>
                  <span className="pepv-emoji" style={{ fontSize: 22, flexShrink: 0 }} title={tier} aria-hidden>
                    {tierEmoji}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {compoundLabel}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    pepguideIQ{" "}
                    <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{score}</span>
                  </span>
                  {updatedAt ? (
                    <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {formatTimeAgo(updatedAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
