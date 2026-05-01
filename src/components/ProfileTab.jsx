import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SettingsTab } from "./SettingsTab.jsx";
import { BodyMetricStepper } from "./BodyMetricStepper.jsx";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import { formatPlan } from "../lib/tiers.js";
import { calculateStreak } from "../lib/streakUtils.js";
import {
  archiveProgressPhotoSetViaWorker,
  checkMemberProfileHandleAvailable,
  fetchBodyMetrics,
  fetchLatestInbodyScanHistory,
  fetchUserProfileStats,
  getCurrentUser,
  getSessionAccessToken,
  listRecentDosedAtDates,
  patchMemberProfileViaWorker,
  upsertBodyMetrics,
  updateMemberProfile,
  updateUserProfile,
} from "../lib/supabase.js";
import {
  R2_UPLOAD_ACCEPT_ATTR,
  R2_UPLOAD_ALLOWED_TYPES,
  R2_UPLOAD_MAX_BYTES,
  appendImageCacheBustParam,
  shouldResetImageUploadFetchBust,
  uploadImageToR2,
} from "../lib/r2Upload.js";
import { isValidMemberHandleFormat, normalizeHandleInput, stripHandleAtPrefix } from "../lib/memberProfileHandle.js";
import {
  SOCIAL_EDIT_FIELDS,
  SOCIAL_HANDLE_MAX_LEN,
  normalizeSocialHandleForColumn,
  storedSocialHandleString,
} from "../lib/socialProfileLinks.js";
import { PostItComposer } from "./PostItComposer.jsx";
import { FastingTrackerSection } from "./FastingTrackerSection.jsx";
import { formatInbodyScanDateOnly, inbodyToNum } from "../lib/inbodyScanDisplay.js";
import { BodyScanView } from "./BodyScanView.jsx";
import { InbodyScoreRing } from "./InbodyScoreRing.jsx";
import { ProfileCtx } from "../context/ProfileContext.jsx";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";
import { useMemberAvatarSrc } from "../hooks/useMemberAvatarSrc.js";

const SECTION = {
  fontSize: 13,
  color: "var(--color-accent)",
  letterSpacing: "0.12em",
  marginBottom: 12,
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
};

const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "🌱 Beginner" },
  { id: "intermediate", label: "💪 Intermediate" },
  { id: "advanced", label: "🔥 Advanced" },
  { id: "elite", label: "⚡ Elite" },
];

const GOAL_OPTIONS = [
  { id: "shred", label: "🔥 Shred" },
  { id: "bulk", label: "💪 Bulk" },
  { id: "recomp", label: "⚖️ Recomp" },
  { id: "longevity", label: "🧬 Longevity" },
  { id: "performance", label: "🏆 Performance" },
  { id: "optimize", label: "🎯 Optimize" },
  { id: "cognitive", label: "🧠 Cognitive" },
  { id: "sleep_recovery", label: "🌙 Sleep & Recovery" },
  { id: "juiced", label: "💉 Juiced" },
  { id: "general_health", label: "💚 General Health" },
];

/** Legacy CSV tokens from older app versions → canonical `GOAL_OPTIONS` ids */
const LEGACY_GOAL_ID_TO_CANONICAL = {
  mental_elevate: "cognitive",
  mental: "cognitive",
};

const GOAL_IDS = new Set(GOAL_OPTIONS.map((g) => g.id));
const GOAL_PICK_MAX = 8;

/** @param {unknown} s */
function parseGoalsFromStorage(s) {
  if (!s || typeof s !== "string") return [];
  const out = [];
  for (const p of s.split(",")) {
    const raw = p.trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    const id = LEGACY_GOAL_ID_TO_CANONICAL[lower] ?? lower;
    if (!GOAL_IDS.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

/** @param {string[]} ids */
function serializeGoals(ids) {
  const cleaned = ids.filter((id) => GOAL_IDS.has(id));
  return cleaned.length ? cleaned.join(",") : null;
}

function goalEmojiFromId(goalId) {
  const o = GOAL_OPTIONS.find((g) => g.id === goalId);
  if (!o) return null;
  const i = o.label.indexOf(" ");
  return i > 0 ? o.label.slice(0, i).trim() : o.label;
}

const DOB_YEAR_MIN = 1924;
const DOB_YEAR_MAX = 2006;

/** @param {unknown} iso */
function splitYmdParts(iso) {
  if (!iso || typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) {
    return { m: "", d: "", y: "" };
  }
  const [y, mo, da] = iso.trim().split("-");
  return { y, m: String(Number(mo)), d: String(Number(da)) };
}

/**
 * @param {string} mStr
 * @param {string} dStr
 * @param {string} yStr
 * @returns {string | null | undefined} null = clear; string = YYYY-MM-DD; undefined = incomplete/invalid
 */
function assembleDob(mStr, dStr, yStr) {
  const m = String(mStr ?? "").trim();
  const d = String(dStr ?? "").trim();
  const y = String(yStr ?? "").trim();
  if (m === "" && d === "" && y === "") return null;
  const mi = parseInt(m, 10);
  const di = parseInt(d, 10);
  const yi = parseInt(y, 10);
  if (!Number.isFinite(mi) || !Number.isFinite(di) || !Number.isFinite(yi)) return undefined;
  if (mi < 1 || mi > 12 || di < 1 || di > 31 || yi < DOB_YEAR_MIN || yi > DOB_YEAR_MAX) return undefined;
  const t = new Date(yi, mi - 1, di);
  if (t.getFullYear() !== yi || t.getMonth() !== mi - 1 || t.getDate() !== di) return undefined;
  return `${String(yi).padStart(4, "0")}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`;
}

function tierPillStyle(plan) {
  return {
    background:
      plan === "goat"
        ? "var(--tier-goat-dim)"
        : plan === "elite"
          ? "var(--tier-elite-dim)"
          : plan === "pro"
            ? "var(--tier-pro-dim)"
            : "var(--tier-entry-dim)",
    color: plan === "goat" ? "var(--tier-goat)" : plan === "elite" ? "var(--tier-elite)" : plan === "pro" ? "var(--tier-pro)" : "var(--tier-entry)",
    border: `1px solid ${
      plan === "goat"
        ? "var(--tier-goat-border)"
        : plan === "elite"
          ? "var(--tier-elite-border)"
          : plan === "pro"
            ? "var(--tier-pro-border)"
            : "var(--tier-entry-border)"
    }`,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 8,
    fontWeight: 600,
    display: "inline-block",
  };
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function pepguideIqScoreParts(stats) {
  if (!stats) return null;
  const doses = typeof stats.doseCount === "number" ? stats.doseCount : 0;
  const compounds = typeof stats.peptideDistinct === "number" ? stats.peptideDistinct : 0;
  const vials = typeof stats.activeVials === "number" ? stats.activeVials : 0;
  const days = typeof stats.daysTracked === "number" ? stats.daysTracked : 0;
  const score = doses * 2 + compounds * 3 + vials * 1 + days * 1;
  return { doses, compounds, vials, days, score };
}

function pepguideIqTierLabel(score) {
  if (score >= 500) return "🐐 pepguideIQ GOAT";
  if (score >= 300) return "🧬 Stack Architect";
  if (score >= 150) return "⚡ Protocol Pro";
  if (score >= 75) return "🔬 Serious Researcher";
  if (score >= 25) return "💊 Building Habits";
  return "🌱 Just Getting Started";
}

function pepguideIqScoreBreakdownLine(parts) {
  if (!parts) return "";
  return [
    `${parts.doses} dose${parts.doses === 1 ? "" : "s"} × 2 = ${parts.doses * 2}`,
    `${parts.compounds} compound${parts.compounds === 1 ? "" : "s"} × 3 = ${parts.compounds * 3}`,
    `${parts.vials} vial${parts.vials === 1 ? "" : "s"} × 1 = ${parts.vials}`,
    `${parts.days} day${parts.days === 1 ? "" : "s"} × 1 = ${parts.days}`,
  ].join(" | ");
}

function PepguideStatsStrip({ stats, tutorialHighlightProps: tutHighlightProps, tutorialHighlighted }) {
  const parts = pepguideIqScoreParts(stats);
  const breakdown = pepguideIqScoreBreakdownLine(parts);
  const formulaTitle = parts
    ? `doses ×2 + compounds ×3 + vials ×1 + days ×1 — ${breakdown}`
    : "doses ×2 + compounds ×3 + vials ×1 + days ×1";

  const valueStyle = { fontSize: 16, fontWeight: 700, color: "var(--color-accent)", lineHeight: 1.2 };
  const labelStyle = {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    marginTop: 4,
    lineHeight: 1.25,
    fontFamily: "'JetBrains Mono', monospace",
  };
  const cell = {
    flex: "1 1 0",
    minWidth: 0,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 12,
    paddingRight: 12,
  };
  const firstCell = { ...cell, paddingLeft: 0 };
  const lastCell = { ...cell, paddingRight: 0 };
  const divider = (
    <div
      aria-hidden
      style={{
        width: 1,
        flexShrink: 0,
        alignSelf: "stretch",
        minHeight: 40,
        background: "var(--color-border-hairline)",
      }}
    />
  );

  const fmt = (n) => (typeof n === "number" ? n : "—");

  return (
    <div
      data-tutorial-target={TUTORIAL_TARGET.profile_score}
      {...tutHighlightProps(Boolean(tutorialHighlighted))}
      style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 20,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        flexWrap: "nowrap",
        fontFamily: "'Outfit', sans-serif",
        overflowX: "auto",
      }}
    >
      <div style={firstCell}>
        <div style={valueStyle}>{fmt(stats?.doseCount)}</div>
        <div className="mono" style={labelStyle}>
          Doses Logged
        </div>
      </div>
      {divider}
      <div style={cell}>
        <div style={valueStyle}>{fmt(stats?.peptideDistinct)}</div>
        <div className="mono" style={labelStyle}>
          Compounds
        </div>
      </div>
      {divider}
      <div style={cell}>
        <div style={valueStyle}>{fmt(stats?.activeVials)}</div>
        <div className="mono" style={labelStyle}>
          Active Vials
        </div>
      </div>
      {divider}
      <div style={cell}>
        <div style={valueStyle}>{fmt(stats?.daysTracked)}</div>
        <div className="mono" style={labelStyle}>
          Days Tracked
        </div>
      </div>
      {divider}
      <div style={lastCell} title={formulaTitle}>
        <div style={valueStyle}>{parts ? parts.score : "—"}</div>
        <div className="mono" style={labelStyle}>
          pepguideIQ
        </div>
      </div>
    </div>
  );
}

function PepguideStatsSectionHeading({ stats }) {
  const parts = pepguideIqScoreParts(stats);
  const tierStyle = {
    fontSize: 11,
    color: "var(--color-text-muted)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontFamily: "'JetBrains Mono', monospace",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        columnGap: 8,
        rowGap: 6,
        marginBottom: 12,
      }}
    >
      <div style={{ ...SECTION, marginBottom: 0 }}>PepGuide stats</div>
      {parts ? (
        <>
          <span aria-hidden style={{ ...tierStyle, userSelect: "none" }}>
            ·
          </span>
          <span className="mono" style={tierStyle}>
            {pepguideIqTierLabel(parts.score)}
          </span>
        </>
      ) : null}
    </div>
  );
}

function avatarInitialLetter(displayName, name, email) {
  const s = String(displayName || name || "").trim();
  if (s) return s[0].toUpperCase();
  const e = String(email || "").trim();
  return e ? e[0].toUpperCase() : "?";
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function snapToStep(val, min, step) {
  const k = Math.round((val - min) / step);
  const out = min + k * step;
  const dec = (() => {
    const s = String(step);
    const i = s.indexOf(".");
    if (i < 0) return 0;
    return Math.min(4, s.length - i - 1);
  })();
  return Number(out.toFixed(dec));
}

const LBS_TO_KG = 2.20462;
const PROFILE_WEIGHT_LBS_MIN = 50;
const PROFILE_WEIGHT_LBS_MAX = 500;
const PROFILE_WEIGHT_LBS_STEP = 0.1;
const PROFILE_WEIGHT_KG_MIN = PROFILE_WEIGHT_LBS_MIN / LBS_TO_KG;
const PROFILE_WEIGHT_KG_MAX = PROFILE_WEIGHT_LBS_MAX / LBS_TO_KG;
const PROFILE_WEIGHT_KG_STEP = 0.1;

const PROFILE_HEIGHT_IN_MIN = 36;
const PROFILE_HEIGHT_IN_MAX = 96;
const PROFILE_HEIGHT_IN_STEP = 0.25;

/** Fast-entry sliders (full stepper min/max unchanged). */
const PROFILE_WEIGHT_SLIDER_LBS_MIN = 50;
const PROFILE_WEIGHT_SLIDER_LBS_MAX = 400;
const PROFILE_WEIGHT_SLIDER_LBS_STEP = 1;
const PROFILE_WEIGHT_SLIDER_KG_MIN = 20;
const PROFILE_WEIGHT_SLIDER_KG_MAX = 200;
const PROFILE_WEIGHT_SLIDER_KG_STEP = 1;
const PROFILE_HEIGHT_SLIDER_IN_MIN = 48;
const PROFILE_HEIGHT_SLIDER_IN_MAX = 96;
const PROFILE_HEIGHT_SLIDER_IN_STEP = 1;
const PROFILE_HEIGHT_SLIDER_CM_MIN = Math.round(48 * 2.54);
const PROFILE_HEIGHT_SLIDER_CM_MAX = Math.round(96 * 2.54);
const PROFILE_HEIGHT_SLIDER_CM_STEP = 1;

const PROFILE_BODY_FAT_MIN = 1;
const PROFILE_BODY_FAT_MAX = 70;
const PROFILE_BODY_FAT_STEP = 0.1;
const PROFILE_BODY_FAT_SLIDER_MIN = 3;
const PROFILE_BODY_FAT_SLIDER_MAX = 60;
const PROFILE_BODY_FAT_SLIDER_STEP = 0.5;

/** Lock / unlock control for body metric sliders (Goals section). */
const METRIC_LOCK_BTN = {
  fontSize: 18,
  lineHeight: 1,
  padding: "2px 10px",
  borderRadius: 8,
  border: "1px solid var(--color-border-emphasis)",
  background: "rgba(0,0,0,0.2)",
  cursor: "pointer",
  color: "var(--color-text-secondary)",
};

const AVATAR_CROP_VIEW = 240;
const AVATAR_CROP_OUT = 512;

/**
 * Circular crop preview with drag to reposition; exports a JPEG blob.
 * @param {{ open: boolean, imageUrl: string | null, busy: boolean, onCancel: () => void, onConfirm: (blob: Blob) => void | Promise<void> }} p
 */
function AvatarCropModal({ open, imageUrl, busy, onCancel, onConfirm }) {
  const [nw, setNw] = useState(1);
  const [nh, setNh] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragRef = useRef(/** @type {{ sx: number, sy: number, px: number, py: number } | null} */ (null));

  useEffect(() => {
    if (!open || !imageUrl) return;
    setNw(1);
    setNh(1);
    setPanX(0);
    setPanY(0);
    setImgLoaded(false);
  }, [open, imageUrl]);

  const V = AVATAR_CROP_VIEW;
  const scale = nw > 0 && nh > 0 ? Math.max(V / nw, V / nh) : 1;
  const dw = nw * scale;
  const dh = nh * scale;
  const maxPanX = Math.max(0, (dw - V) / 2);
  const maxPanY = Math.max(0, (dh - V) / 2);

  const clampPans = useCallback(
    (x, y) => ({
      x: clamp(x, -maxPanX, maxPanX),
      y: clamp(y, -maxPanY, maxPanY),
    }),
    [maxPanX, maxPanY]
  );

  if (!open || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adjust profile photo"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(5,8,12,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 16,
          padding: 20,
          maxWidth: 360,
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>Adjust photo</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14, lineHeight: 1.45 }}>
          Drag to reposition the photo inside the circle.
        </div>
        <div
          style={{
            width: V,
            height: V,
            margin: "0 auto 16px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid var(--color-accent-nav-border)",
            touchAction: "none",
            position: "relative",
            background: "var(--color-bg-input)",
          }}
        >
          <img
            alt=""
            src={imageUrl}
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNw(el.naturalWidth || 1);
              setNh(el.naturalHeight || 1);
              setPanX(0);
              setPanY(0);
              setImgLoaded(true);
            }}
            onPointerDown={(e) => {
              if (busy || !imgLoaded) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY };
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const nx = d.px + e.clientX - d.sx;
              const ny = d.py + e.clientY - d.sy;
              const c = clampPans(nx, ny);
              setPanX(c.x);
              setPanY(c.y);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
              }
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            style={{
              position: "absolute",
              width: dw,
              height: dh,
              left: (V - dw) / 2 + panX,
              top: (V - dh) / 2 + panY,
              userSelect: "none",
              pointerEvents: busy ? "none" : "auto",
              cursor: busy ? "default" : "grab",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-teal"
            style={{ opacity: 0.85, fontSize: 13 }}
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-teal"
            style={{ fontSize: 13 }}
            disabled={busy || !imgLoaded}
            onClick={() => {
              void (async () => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                await new Promise((resolve, reject) => {
                  img.onload = () => resolve(undefined);
                  img.onerror = () => reject(new Error("Could not read image"));
                  img.src = imageUrl;
                });
                const OUT = AVATAR_CROP_OUT;
                const s = OUT / V;
                const canvas = document.createElement("canvas");
                canvas.width = OUT;
                canvas.height = OUT;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
                ctx.clip();
                const left = ((V - dw) / 2 + panX) * s;
                const top = ((V - dh) / 2 + panY) * s;
                ctx.drawImage(img, 0, 0, nw, nh, left, top, dw * s, dh * s);
                await new Promise((resolve) => {
                  canvas.toBlob(
                    (blob) => {
                      if (blob) void onConfirm(blob);
                      resolve(undefined);
                    },
                    "image/jpeg",
                    0.92
                  );
                });
              })();
            }}
          >
            {busy ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

const GEAR_BTN = {
  minWidth: 44,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid var(--color-accent-nav-border)",
  background: "var(--color-accent-dim)",
  color: "var(--color-accent)",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
  flexShrink: 0,
  boxSizing: "border-box",
};

function usePrivateStackPhotoUrl(r2Key, workerConfigured, fetchBustMs = 0) {
  const [objectUrl, setObjectUrl] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let revoke = null;
    async function run() {
      if (!r2Key || !workerConfigured) {
        setObjectUrl(null);
        return;
      }
      const token = await getSessionAccessToken();
      if (!token || cancelled) {
        setObjectUrl(null);
        return;
      }
      try {
        const base = `${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(r2Key)}`;
        const res = await fetch(appendImageCacheBustParam(base, fetchBustMs), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) {
          setObjectUrl(null);
          return;
        }
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        revoke = u;
        if (!cancelled) setObjectUrl(u);
      } catch {
        if (!cancelled) setObjectUrl(null);
      }
    }
    void run();
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [r2Key, workerConfigured, fetchBustMs]);
  return objectUrl;
}

/** @param {{ r2Key: string | null | undefined, workerOk: boolean }} props */
function ProgressArchiveThumb({ r2Key, workerOk }) {
  const k = typeof r2Key === "string" ? r2Key.trim() : "";
  const imgUrl = usePrivateStackPhotoUrl(k, workerOk, 0);
  return (
    <div
      style={{
        flex: "1 1 72px",
        minWidth: 56,
        maxWidth: 120,
        aspectRatio: "3 / 4",
        borderRadius: 8,
        border: "1px solid var(--color-border-emphasis)",
        background: k && imgUrl ? `url(${imgUrl}) center/cover no-repeat, var(--color-bg-input)` : "var(--color-bg-input)",
      }}
    />
  );
}

/** @param {{ entry: Record<string, unknown>, workerOk: boolean }} props */
function ArchivedProgressSetRow({ entry, workerOk }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "stretch",
        marginBottom: 10,
      }}
    >
      <ProgressArchiveThumb r2Key={entry.progress_photo_front_r2_key} workerOk={workerOk} />
      <ProgressArchiveThumb r2Key={entry.progress_photo_side_r2_key} workerOk={workerOk} />
      <ProgressArchiveThumb r2Key={entry.progress_photo_back_r2_key} workerOk={workerOk} />
    </div>
  );
}

function formatProfilePhotoTimestamp(iso) {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * @param {{ label: string, kind: string, memberProfileId: string, r2Key: string | null | undefined, uploadedAt?: string | null, canMutate: boolean, onUpgrade: () => void, onUploaded: () => Promise<void> | void, workerOk: boolean }} props
 */
function ProfilePrivatePhotoSlot({
  label,
  kind,
  memberProfileId,
  r2Key,
  uploadedAt,
  canMutate,
  onUpgrade,
  onUploaded,
  workerOk,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [slotErr, setSlotErr] = useState(null);
  const [fetchBustMs, setFetchBustMs] = useState(0);
  const prevR2KeyRef = useRef(typeof r2Key === "string" ? r2Key.trim() : "");
  const imgUrl = usePrivateStackPhotoUrl(r2Key ?? "", workerOk, fetchBustMs);
  const uploadedLabel = formatProfilePhotoTimestamp(uploadedAt);

  useEffect(() => {
    const next = typeof r2Key === "string" ? r2Key.trim() : "";
    const prev = prevR2KeyRef.current;
    prevR2KeyRef.current = next;
    if (shouldResetImageUploadFetchBust(prev, next)) setFetchBustMs(0);
  }, [r2Key]);

  async function onInputChange(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!canMutate) {
      onUpgrade();
      return;
    }
    if (!workerOk) {
      setSlotErr("Configure VITE_API_WORKER_URL");
      return;
    }
    if (!memberProfileId) {
      setSlotErr("No profile");
      return;
    }
    if (!R2_UPLOAD_ALLOWED_TYPES.has(f.type) || f.size > R2_UPLOAD_MAX_BYTES) {
      setSlotErr("JPEG/PNG/WebP/GIF, max 10MB");
      return;
    }
    setSlotErr(null);
    setUploading(true);
    const result = await uploadImageToR2({
      path: "/stack-photo",
      file: f,
      fields: { kind, member_profile_id: memberProfileId },
    });
    setUploading(false);
    if (!result.ok) {
      setSlotErr(result.error);
      return;
    }
    setFetchBustMs(Date.now());
    await onUploaded();
  }

  return (
    <div style={{ flex: "1 1 120px", minWidth: 100, maxWidth: 200 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 6, letterSpacing: "0.08em" }}>
        {label}
      </div>
      <button
        type="button"
        onClick={() => {
          if (!canMutate) {
            onUpgrade();
            return;
          }
          inputRef.current?.click();
        }}
        disabled={uploading}
        style={{
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 10,
          border: "1px dashed var(--color-border-emphasis)",
          background: r2Key && imgUrl ? `url(${imgUrl}) center/cover no-repeat, var(--color-bg-input)` : "var(--color-bg-input)",
          cursor: canMutate ? "pointer" : "not-allowed",
          opacity: uploading ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          fontSize: 12,
          padding: 8,
          textAlign: "center",
        }}
      >
        {!r2Key || !imgUrl ? (uploading ? "…" : "+") : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={R2_UPLOAD_ACCEPT_ATTR}
        hidden
        onChange={(e) => void onInputChange(e)}
      />
      {slotErr ? (
        <div className="mono" style={{ fontSize: 10, color: "var(--color-warning)", marginTop: 4 }}>
          {slotErr}
        </div>
      ) : null}
      {uploadedLabel ? (
        <div className="mono" style={{ fontSize: 9, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.3 }}>
          {uploadedLabel}
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ user: object, setUser: (u: object | null) => void, onOpenUpgrade: () => void, onSignOut: () => Promise<void>, canUseProgressPhotos?: boolean, savedStackPeptides?: { id: string, name: string, stackDose?: string, stackFrequency?: string }[], onGuideDeepAnalysisToGuide?: (prompt: string) => void }} props */
export function ProfileTab({
  user,
  setUser,
  onOpenUpgrade,
  onSignOut,
  canUseProgressPhotos = false,
  savedStackPeptides = [],
  onGuideDeepAnalysisToGuide,
}) {
  const fmtFeetInches = (inches) => {
    const ft = Math.floor(inches / 12);
    let ins = Math.round((inches % 12) * 4) / 4;
    if (ins >= 12) {
      return `${ft + 1}'0"`;
    }
    return `${ft}'${ins}"`;
  };

  const noopRefreshMemberProfiles = useCallback(async () => {}, []);
  const noopPatchMemberProfileLocal = useCallback(() => {}, []);
  const profileCtx = useContext(ProfileCtx);
  const activeProfileId = profileCtx?.activeProfileId ?? null;
  const activeProfile = profileCtx?.activeProfile ?? null;
  const memberProfilesVersion = profileCtx?.memberProfilesVersion ?? 0;
  const refreshMemberProfiles = profileCtx?.refreshMemberProfiles ?? noopRefreshMemberProfiles;
  const patchMemberProfileLocal = profileCtx?.patchMemberProfileLocal ?? noopPatchMemberProfileLocal;
  const tutorial = useTutorialOptional();
  const fileRef = useRef(null);
  const workerOk = isApiWorkerConfigured();
  const [subView, setSubView] = useState(/** @type {"profile" | "settings"} */ ("profile"));
  const [goalIds, setGoalIds] = useState(/** @type {string[]} */ ([]));
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [heightUnit, setHeightUnit] = useState(() => {
    try {
      return localStorage.getItem(`pepguideiq.heightUnit.${user.id}`) === "metric" ? "metric" : "imperial";
    } catch {
      return "imperial";
    }
  });
  const [weightSlider, setWeightSlider] = useState(200);
  const [heightInchesSlider, setHeightInchesSlider] = useState(68);
  const [bodyFatSlider, setBodyFatSlider] = useState(20);
  const [weightMetricsLocked, setWeightMetricsLocked] = useState(true);
  const [heightMetricsLocked, setHeightMetricsLocked] = useState(true);
  const [bodyFatMetricsLocked, setBodyFatMetricsLocked] = useState(true);
  const [stats, setStats] = useState(null);
  const [clientStreakFallback, setClientStreakFallback] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarCrop, setAvatarCrop] = useState(/** @type {{ url: string, revoke: () => void } | null} */ (null));
  const [archiveProgressBusy, setArchiveProgressBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedFlashTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [bodyMetricsRow, setBodyMetricsRow] = useState(null);
  const [healthSubview, setHealthSubview] = useState(/** @type {null | "bodyScan"} */ (null));

  useEffect(() => {
    if (!tutorial) return;
    const t = tutorial.highlightTarget;
    const fk = tutorial.flowKey;

    if (t === TUTORIAL_TARGET.settings_wake && fk === "core") {
      setSubView("settings");
      return;
    }
    if (t === TUTORIAL_TARGET.profile_handle && fk === "profile") {
      setSubView("profile");
      return;
    }
    if (t === TUTORIAL_TARGET.body_scan_section) {
      setSubView("profile");
      setHealthSubview(null);
      return;
    }
    if (
      t === TUTORIAL_TARGET.inbody_upload ||
      t === TUTORIAL_TARGET.atlas_scan_interpret ||
      t === TUTORIAL_TARGET.atlas_scan_upload
    ) {
      setSubView("profile");
      setHealthSubview("bodyScan");
    }
  }, [tutorial, tutorial?.highlightTarget, tutorial?.flowKey]);

  useEffect(() => {
    const onOpenSettings = () => {
      setSubView("settings");
      setHealthSubview(null);
    };
    window.addEventListener("pepguide:open-settings", onOpenSettings);
    return () => window.removeEventListener("pepguide:open-settings", onOpenSettings);
  }, []);

  const [latestInbodyRow, setLatestInbodyRow] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [handleDraft, setHandleDraft] = useState("@");
  const [handleHint, setHandleHint] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [socialDrafts, setSocialDrafts] = useState(() =>
    Object.fromEntries(SOCIAL_EDIT_FIELDS.map(({ key }) => [key, ""]))
  );
  /** Local copies of `profiles` fields so App.jsx auth refresh cannot wipe pill/input UI mid-session. */
  const [bioSex, setBioSex] = useState(() => user?.biological_sex ?? null);
  const [trainingExp, setTrainingExp] = useState(() => user?.training_experience ?? null);
  const initDob = splitYmdParts(user?.date_of_birth ?? null);
  const [dobMonth, setDobMonth] = useState(initDob.m);
  const [dobDay, setDobDay] = useState(initDob.d);
  const [dobYear, setDobYear] = useState(initDob.y);
  const lastCommittedDobRef = useRef(/** @type {string | null} */ (user?.date_of_birth ?? null));

  const fieldAnchorRefs = useRef(/** @type {Record<string, HTMLElement | null>} */ ({}));
  /** While > 0, skip syncing these fields from global `user` (avoids stale auth payload overwriting locals). */
  const profilesSaveInFlightRef = useRef(0);
  /** Monotonic counter: bumped before each profiles save so earlier saves don't overwrite later optimistic state. */
  const profilesSaveSeqRef = useRef(0);

  const setFieldRef = useCallback((id) => {
    return (el) => {
      fieldAnchorRefs.current[id] = el;
    };
  }, []);

  const showSavedBriefly = useCallback(() => {
    setSavedFlash(true);
    if (savedFlashTimerRef.current) window.clearTimeout(savedFlashTimerRef.current);
    savedFlashTimerRef.current = window.setTimeout(() => {
      setSavedFlash(false);
      savedFlashTimerRef.current = null;
    }, 2200);
  }, []);

  /** Hydrate locals from global `user` when it updates from server — not while a profiles save is in flight. */
  useEffect(() => {
    if (!user?.id) {
      setBioSex(null);
      setTrainingExp(null);
      setDobMonth("");
      setDobDay("");
      setDobYear("");
      lastCommittedDobRef.current = null;
      return;
    }
    if (profilesSaveInFlightRef.current > 0) return;
    setBioSex(user.biological_sex ?? null);
    setTrainingExp(user.training_experience ?? null);
    const p = splitYmdParts(user.date_of_birth);
    setDobMonth(p.m);
    setDobDay(p.d);
    setDobYear(p.y);
    lastCommittedDobRef.current = user.date_of_birth ?? null;
  }, [user?.id, user?.biological_sex, user?.training_experience, user?.date_of_birth]);

  const applyFreshUserToLocalProfileFields = useCallback((fresh) => {
    if (!fresh) return;
    setBioSex(fresh.biological_sex ?? null);
    setTrainingExp(fresh.training_experience ?? null);
    const p = splitYmdParts(fresh.date_of_birth);
    setDobMonth(p.m);
    setDobDay(p.d);
    setDobYear(p.y);
    lastCommittedDobRef.current = fresh.date_of_birth ?? null;
  }, []);

  const setBiologicalSex = useCallback(
    async (value) => {
      if (!user?.id) return;
      if (!["male", "female", "prefer_not_to_say"].includes(value)) return;
      profilesSaveInFlightRef.current += 1;
      setErr(null);
      const prev = bioSex;
      const seq = ++profilesSaveSeqRef.current;
      setBioSex(value);
      try {
        const { error } = await updateUserProfile({ biological_sex: value });
        if (error) {
          setBioSex(prev);
          setErr(error.message);
          return;
        }
        showSavedBriefly();
        const fresh = await getCurrentUser();
        if (fresh) {
          setUser(fresh);
          if (seq === profilesSaveSeqRef.current) {
            applyFreshUserToLocalProfileFields(fresh);
          }
        }
      } finally {
        profilesSaveInFlightRef.current -= 1;
      }
    },
    [user?.id, bioSex, setUser, showSavedBriefly, applyFreshUserToLocalProfileFields]
  );

  const setCycleTrackingConsent = useCallback(
    async (enabled) => {
      if (!user?.id) return;
      profilesSaveInFlightRef.current += 1;
      setErr(null);
      const prev = user.cycle_tracking_enabled ?? null;
      const seq = ++profilesSaveSeqRef.current;
      setUser((u) => (u ? { ...u, cycle_tracking_enabled: enabled } : u));
      try {
        const { error } = await updateUserProfile({ cycle_tracking_enabled: enabled });
        if (error) {
          setUser((u) => (u ? { ...u, cycle_tracking_enabled: prev } : u));
          setErr(error.message);
          return;
        }
        showSavedBriefly();
        const fresh = await getCurrentUser();
        if (fresh) {
          setUser(fresh);
          if (seq === profilesSaveSeqRef.current) {
            applyFreshUserToLocalProfileFields(fresh);
          }
        }
      } finally {
        profilesSaveInFlightRef.current -= 1;
      }
    },
    [user?.id, user?.cycle_tracking_enabled, setUser, showSavedBriefly, applyFreshUserToLocalProfileFields]
  );

  const tryCommitDateOfBirth = useCallback(async () => {
    if (!user?.id) return;
    const normalized = assembleDob(dobMonth, dobDay, dobYear);
    if (normalized === undefined) return;
    if (normalized === lastCommittedDobRef.current) return;
    profilesSaveInFlightRef.current += 1;
    setErr(null);
    const seq = ++profilesSaveSeqRef.current;
    try {
      const { error } = await updateUserProfile({ date_of_birth: normalized });
      if (error) {
        setErr(error.message);
        const p = splitYmdParts(lastCommittedDobRef.current ?? null);
        setDobMonth(p.m);
        setDobDay(p.d);
        setDobYear(p.y);
        return;
      }
      showSavedBriefly();
      const fresh = await getCurrentUser();
      if (fresh) {
        setUser(fresh);
        if (seq === profilesSaveSeqRef.current) {
          applyFreshUserToLocalProfileFields(fresh);
        }
      }
    } finally {
      profilesSaveInFlightRef.current -= 1;
    }
  }, [user?.id, dobMonth, dobDay, dobYear, setUser, showSavedBriefly, applyFreshUserToLocalProfileFields]);

  useEffect(() => {
    return () => {
      if (savedFlashTimerRef.current) window.clearTimeout(savedFlashTimerRef.current);
    };
  }, []);

  const progressArchivedSets = useMemo(() => {
    const raw = activeProfile?.progress_photo_sets;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (x) =>
        x &&
        typeof x === "object" &&
        typeof x.progress_photo_front_r2_key === "string" &&
        x.progress_photo_front_r2_key.trim() &&
        typeof x.progress_photo_side_r2_key === "string" &&
        x.progress_photo_side_r2_key.trim() &&
        typeof x.progress_photo_back_r2_key === "string" &&
        x.progress_photo_back_r2_key.trim()
    );
  }, [activeProfile?.progress_photo_sets]);

  const displayNameShown =
    activeProfile && typeof activeProfile.display_name === "string" ? activeProfile.display_name.trim() : "";

  const memberAvatarSrc = useMemberAvatarSrc(
    user.id,
    activeProfile?.avatar_r2_key,
    activeProfile?.avatar_url,
    workerOk
  );

  const streakCount =
    activeProfile != null && typeof activeProfile.current_streak === "number"
      ? activeProfile.current_streak
      : clientStreakFallback;

  useEffect(() => {
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) {
      setGoalIds([]);
      setWeightUnit("lbs");
      setWeightSlider(200);
      setHeightInchesSlider(68);
      setBodyFatSlider(20);
      return;
    }
    let ignore = false;
    fetchBodyMetrics(activeProfileId).then(({ row, error }) => {
      if (ignore) return;
      if (error) {
        setErr(error.message);
        setBodyMetricsRow(null);
        return;
      }
      setErr(null);
      setBodyMetricsRow(row ?? null);
      const wu = row && row.weight_unit === "kg" ? "kg" : "lbs";
      setWeightUnit(wu);
      setGoalIds(parseGoalsFromStorage(row?.goal));
      const wMin = wu === "kg" ? PROFILE_WEIGHT_KG_MIN : PROFILE_WEIGHT_LBS_MIN;
      const wMax = wu === "kg" ? PROFILE_WEIGHT_KG_MAX : PROFILE_WEIGHT_LBS_MAX;
      const wStep = wu === "kg" ? PROFILE_WEIGHT_KG_STEP : PROFILE_WEIGHT_LBS_STEP;
      const wl = row?.weight_lbs;
      if (wl != null && Number.isFinite(Number(wl))) {
        const lbs = Number(wl);
        const disp = wu === "kg" ? lbs / LBS_TO_KG : lbs;
        setWeightSlider(snapToStep(clamp(disp, wMin, wMax), wMin, wStep));
      } else {
        setWeightSlider(wu === "kg" ? 80 / LBS_TO_KG : 200);
      }
      const hi = row?.height_in;
      if (hi != null && Number.isFinite(Number(hi))) {
        setHeightInchesSlider(
          snapToStep(clamp(Number(hi), PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_MAX), PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_STEP)
        );
      } else {
        setHeightInchesSlider(68);
      }
      const bf = row?.body_fat_pct;
      if (bf != null && Number.isFinite(Number(bf))) {
        setBodyFatSlider(
          snapToStep(clamp(Number(bf), PROFILE_BODY_FAT_MIN, PROFILE_BODY_FAT_MAX), PROFILE_BODY_FAT_MIN, PROFILE_BODY_FAT_STEP)
        );
      } else {
        setBodyFatSlider(20);
      }
    });
    return () => {
      ignore = true;
    };
  }, [user.id, activeProfileId]);

  useEffect(() => {
    if (!activeProfileId || !isSupabaseConfigured()) {
      setLatestInbodyRow(null);
      return;
    }
    let ignore = false;
    void fetchLatestInbodyScanHistory(activeProfileId).then(({ row }) => {
      if (!ignore) setLatestInbodyRow(row ?? null);
    });
    return () => {
      ignore = true;
    };
  }, [activeProfileId, healthSubview, memberProfilesVersion]);

  useEffect(() => {
    if (!activeProfile) return;
    setDisplayNameDraft(String(activeProfile.display_name ?? "").trim());
    const show =
      typeof activeProfile.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : typeof activeProfile.handle === "string"
          ? activeProfile.handle.trim()
          : "";
    setHandleDraft(show ? `@${stripHandleAtPrefix(show)}` : "@");
    setBioDraft(typeof activeProfile.bio === "string" ? activeProfile.bio : "");
    setSocialDrafts(
      Object.fromEntries(
        SOCIAL_EDIT_FIELDS.map(({ key }) => [
          key,
          typeof activeProfile[key] === "string" ? activeProfile[key] : "",
        ])
      )
    );
  }, [activeProfile, activeProfileId, memberProfilesVersion]);

  useEffect(() => {
    if (!workerOk || !activeProfileId) {
      setHandleHint("");
      return;
    }
    const raw = stripHandleAtPrefix(handleDraft);
    if (raw.length === 0) {
      setHandleHint("");
      return;
    }
    if (raw.length < 3) {
      setHandleHint("At least 3 characters");
      return;
    }
    if (!isValidMemberHandleFormat(raw)) {
      setHandleHint("Letters, numbers, _, ., or - (3–32) — no .. or . at start/end");
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        const { available, reason, error } = await checkMemberProfileHandleAvailable(handleDraft, activeProfileId);
        if (error) {
          setHandleHint("");
          return;
        }
        if (available) setHandleHint("Available");
        else if (reason === "taken") setHandleHint("Already taken");
        else setHandleHint("");
      })();
    }, 450);
    return () => window.clearTimeout(t);
  }, [handleDraft, activeProfileId, workerOk]);

  const saveProfilePatch = useCallback(
    async (patch) => {
      if (!activeProfileId) return false;
      try {
        if (workerOk) {
          const { error } = await patchMemberProfileViaWorker(activeProfileId, patch);
          if (error) {
            const msg = typeof error.message === "string" ? error.message : "Save failed";
            if ("handle" in patch && /already taken|duplicate|unique constraint/i.test(msg)) {
              setErr("This handle is already taken.");
            } else {
              setErr(msg);
            }
            return false;
          }
        } else {
          const { error } = await updateMemberProfile(activeProfileId, patch);
          if (error) {
            const msg = typeof error.message === "string" ? error.message : "Save failed";
            if ("handle" in patch && /already taken|duplicate|unique constraint/i.test(msg)) {
              setErr("This handle is already taken.");
            } else {
              setErr(msg);
            }
            return false;
          }
        }
        setErr(null);
        await refreshMemberProfiles();
        showSavedBriefly();
        return true;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
        return false;
      }
    },
    [activeProfileId, workerOk, refreshMemberProfiles, showSavedBriefly]
  );

  const completionFields = useMemo(() => {
    const handleSaved =
      typeof activeProfile?.handle === "string" && isValidMemberHandleFormat(activeProfile.handle.trim());
    return [
      {
        id: "avatar",
        done: Boolean(
          (activeProfile?.avatar_r2_key && String(activeProfile.avatar_r2_key).trim()) ||
            (activeProfile?.avatar_url && String(activeProfile.avatar_url).trim())
        ),
        label: "Photo",
      },
      {
        id: "display_name",
        done: Boolean(displayNameShown),
        label: "Name",
      },
      { id: "handle", done: handleSaved, label: "Handle" },
      {
        id: "bio",
        done: Boolean(typeof activeProfile?.bio === "string" && activeProfile.bio.trim()),
        label: "Bio",
      },
      {
        id: "goal",
        done: parseGoalsFromStorage(bodyMetricsRow?.goal).length > 0,
        label: "Goals",
      },
      {
        id: "weight",
        done: bodyMetricsRow != null && bodyMetricsRow.weight_lbs != null && Number.isFinite(Number(bodyMetricsRow.weight_lbs)),
        label: "Weight",
      },
      {
        id: "height",
        done: bodyMetricsRow != null && bodyMetricsRow.height_in != null && Number.isFinite(Number(bodyMetricsRow.height_in)),
        label: "Height",
      },
      {
        id: "training_experience",
        done: Boolean(
          trainingExp && EXPERIENCE_OPTIONS.some((o) => o.id === String(trainingExp).toLowerCase())
        ),
        label: "Level",
      },
      {
        id: "active_stack",
        done: savedStackPeptides.length > 0,
        label: "Stack",
      },
    ];
  }, [activeProfile, bodyMetricsRow, displayNameShown, savedStackPeptides, trainingExp]);

  const completionPct = useMemo(() => {
    const n = completionFields.filter((f) => f.done).length;
    return Math.round((n / completionFields.length) * 100);
  }, [completionFields]);

  const firstIncompleteFieldId = useMemo(() => {
    const f = completionFields.find((x) => !x.done);
    return f?.id ?? null;
  }, [completionFields]);

  const scrollToField = useCallback((fieldId) => {
    const el = fieldAnchorRefs.current[fieldId];
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const progressPhotosHubSubLabel = useMemo(() => {
    const ap = activeProfile;
    if (!ap) return "Add photos";
    const raw = [ap.progress_photo_front_at, ap.progress_photo_side_at, ap.progress_photo_back_at];
    const times = raw
      .map((x) => (typeof x === "string" && String(x).trim() ? Date.parse(String(x).trim()) : NaN))
      .filter((n) => Number.isFinite(n));
    if (!times.length) return "Add photos";
    const latest = Math.max(...times);
    try {
      return `Last photo ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(latest)}`;
    } catch {
      return "Add photos";
    }
  }, [activeProfile, memberProfilesVersion]);

  const commitDisplayName = useCallback(async () => {
    if (!activeProfileId) return;
    const t = displayNameDraft.trim();
    if (t === displayNameShown) return;
    if (!t) {
      setErr("Display name cannot be empty");
      setDisplayNameDraft(String(activeProfile?.display_name ?? "").trim());
      return;
    }
    await saveProfilePatch({ display_name: t });
  }, [activeProfileId, displayNameDraft, displayNameShown, activeProfile?.display_name, saveProfilePatch]);

  const commitHandle = useCallback(async () => {
    if (!activeProfileId) return;
    const rawTyped = stripHandleAtPrefix(handleDraft);
    const prevLower = normalizeHandleInput(activeProfile?.handle ?? "");
    const prevShow =
      typeof activeProfile?.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : String(activeProfile?.handle ?? "").trim();
    if (normalizeHandleInput(rawTyped) === prevLower && rawTyped === stripHandleAtPrefix(prevShow)) return;
    if (rawTyped.length === 0) {
      if (workerOk) await saveProfilePatch({ handle: null });
      else await saveProfilePatch({ handle: null, display_handle: null });
      return;
    }
    if (rawTyped.length < 3) {
      setErr("Handle must be at least 3 characters");
      return;
    }
    if (!isValidMemberHandleFormat(rawTyped)) {
      setErr("Handle: 3–32 chars; letters, numbers, _, ., or -; no .. or . at start/end");
      return;
    }
    if (workerOk) {
      const { available, reason, error } = await checkMemberProfileHandleAvailable(rawTyped, activeProfileId);
      if (error) {
        setErr(error.message);
        return;
      }
      if (!available || reason === "taken") {
        setErr("This handle is already taken.");
        return;
      }
    }
    if (workerOk) {
      await saveProfilePatch({ handle: rawTyped });
    } else {
      await saveProfilePatch({
        handle: rawTyped.toLowerCase(),
        display_handle: rawTyped,
      });
    }
  }, [activeProfileId, handleDraft, activeProfile?.handle, activeProfile?.display_handle, saveProfilePatch, workerOk]);

  const commitBio = useCallback(async () => {
    if (!activeProfileId) return;
    const t = bioDraft.slice(0, 500).trim();
    const saved = typeof activeProfile?.bio === "string" ? activeProfile.bio.trim() : "";
    if (t === saved) return;
    await saveProfilePatch({ bio: t || null });
  }, [activeProfileId, bioDraft, activeProfile?.bio, saveProfilePatch]);

  const commitSocialField = useCallback(
    async (key) => {
      if (!activeProfileId) return;
      const normalized = normalizeSocialHandleForColumn(key, socialDrafts[key] ?? "");
      const saved = storedSocialHandleString(activeProfile?.[key]);
      if (normalized === saved) return;
      await saveProfilePatch({ [key]: normalized || null });
    },
    [activeProfileId, socialDrafts, activeProfile, saveProfilePatch]
  );

  const setTrainingExperience = useCallback(
    async (value) => {
      if (!user?.id) return;
      if (!["beginner", "intermediate", "advanced", "elite"].includes(value)) return;
      profilesSaveInFlightRef.current += 1;
      setErr(null);
      const prev = trainingExp;
      const seq = ++profilesSaveSeqRef.current;
      setTrainingExp(value);
      try {
        const { error } = await updateUserProfile({ training_experience: value });
        if (error) {
          setTrainingExp(prev);
          setErr(error.message);
          return;
        }
        showSavedBriefly();
        const fresh = await getCurrentUser();
        if (fresh) {
          setUser(fresh);
          if (seq === profilesSaveSeqRef.current) {
            applyFreshUserToLocalProfileFields(fresh);
          }
        }
      } finally {
        profilesSaveInFlightRef.current -= 1;
      }
    },
    [user?.id, trainingExp, setUser, showSavedBriefly, applyFreshUserToLocalProfileFields]
  );

  useEffect(() => {
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) return;
    let ignore = false;
    fetchUserProfileStats(activeProfileId).then((s) => {
      if (!ignore) setStats(s);
    });
    return () => {
      ignore = true;
    };
  }, [user.id, activeProfileId]);

  useEffect(() => {
    setWeightMetricsLocked(true);
    setHeightMetricsLocked(true);
    setBodyFatMetricsLocked(true);
  }, [activeProfileId]);

  /** Prefer `member_profiles.current_streak` (DB active-streak triggers); client calc only if column missing (older API). */
  useEffect(() => {
    if (activeProfile != null && typeof activeProfile.current_streak === "number") {
      return;
    }
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) return;
    let ignore = false;
    listRecentDosedAtDates(user.id, activeProfileId).then(({ dates }) => {
      if (!ignore) setClientStreakFallback(calculateStreak(dates ?? []));
    });
    return () => {
      ignore = true;
    };
  }, [user.id, activeProfileId, activeProfile?.current_streak, memberProfilesVersion]);

  const refreshBodyMetricsRow = useCallback(async () => {
    if (!activeProfileId) return;
    const { row } = await fetchBodyMetrics(activeProfileId);
    setBodyMetricsRow(row ?? null);
  }, [activeProfileId]);

  const persistHeightInches = async (totalIn) => {
    if (!user?.id || !activeProfileId) return new Error("Missing profile");
    const v =
      totalIn != null && Number.isFinite(totalIn) && totalIn > 0
        ? snapToStep(clamp(totalIn, PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_MAX), PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_STEP)
        : null;
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, {
      height_in: v != null ? v : null,
    });
    if (error) {
      setErr(error.message);
      return error;
    }
    setErr(null);
    void refreshBodyMetricsRow();
    showSavedBriefly();
    return null;
  };

  const commitHeightInches = async (totalIn) => {
    const inches = snapToStep(
      clamp(totalIn, PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_MAX),
      PROFILE_HEIGHT_IN_MIN,
      PROFILE_HEIGHT_IN_STEP
    );
    return persistHeightInches(inches);
  };

  const commitWeightDisplay = async (disp) => {
    if (!user?.id || !activeProfileId) return new Error("Missing profile");
    const wMin = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MIN : PROFILE_WEIGHT_LBS_MIN;
    const wMax = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MAX : PROFILE_WEIGHT_LBS_MAX;
    const wStep = weightUnit === "kg" ? PROFILE_WEIGHT_KG_STEP : PROFILE_WEIGHT_LBS_STEP;
    const v = snapToStep(clamp(disp, wMin, wMax), wMin, wStep);
    const lbs = weightUnit === "kg" ? v * LBS_TO_KG : v;
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, {
      weight_lbs: lbs,
      weight_unit: weightUnit,
    });
    if (error) {
      setErr(error.message);
      return error;
    }
    setErr(null);
    void refreshBodyMetricsRow();
    showSavedBriefly();
    return null;
  };

  const commitBodyFat = async (pctVal) => {
    if (!user?.id || !activeProfileId) return new Error("Missing profile");
    const v = snapToStep(
      clamp(pctVal, PROFILE_BODY_FAT_MIN, PROFILE_BODY_FAT_MAX),
      PROFILE_BODY_FAT_MIN,
      PROFILE_BODY_FAT_STEP
    );
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { body_fat_pct: v });
    if (error) {
      setErr(error.message);
      return error;
    }
    setErr(null);
    void refreshBodyMetricsRow();
    showSavedBriefly();
    return null;
  };

  const onWeightUnitPick = (u) => {
    if (weightMetricsLocked) return;
    if (u === weightUnit) return;
    const currentLbs = weightUnit === "kg" ? weightSlider * LBS_TO_KG : weightSlider;
    setWeightUnit(u);
    if (u === "kg") {
      const disp = currentLbs / LBS_TO_KG;
      setWeightSlider(
        snapToStep(clamp(disp, PROFILE_WEIGHT_KG_MIN, PROFILE_WEIGHT_KG_MAX), PROFILE_WEIGHT_KG_MIN, PROFILE_WEIGHT_KG_STEP)
      );
    } else {
      setWeightSlider(
        snapToStep(clamp(currentLbs, PROFILE_WEIGHT_LBS_MIN, PROFILE_WEIGHT_LBS_MAX), PROFILE_WEIGHT_LBS_MIN, PROFILE_WEIGHT_LBS_STEP)
      );
    }
  };

  const saveAndLockWeight = async () => {
    if (weightMetricsLocked || !user?.id || !activeProfileId) return;
    const wMin = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MIN : PROFILE_WEIGHT_LBS_MIN;
    const wMax = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MAX : PROFILE_WEIGHT_LBS_MAX;
    const wStep = weightUnit === "kg" ? PROFILE_WEIGHT_KG_STEP : PROFILE_WEIGHT_LBS_STEP;
    const v = snapToStep(clamp(weightSlider, wMin, wMax), wMin, wStep);
    const lbs = weightUnit === "kg" ? v * LBS_TO_KG : v;
    const savedLbs =
      bodyMetricsRow?.weight_lbs != null && Number.isFinite(Number(bodyMetricsRow.weight_lbs))
        ? Number(bodyMetricsRow.weight_lbs)
        : null;
    const savedWu = bodyMetricsRow?.weight_unit === "kg" ? "kg" : "lbs";
    const dirty = savedLbs == null || Math.abs(savedLbs - lbs) > 1e-4 || weightUnit !== savedWu;
    if (!dirty) {
      setWeightMetricsLocked(true);
      return;
    }
    setWeightSlider(v);
    const err = await commitWeightDisplay(v);
    if (!err) setWeightMetricsLocked(true);
  };

  const saveAndLockHeight = async () => {
    if (heightMetricsLocked || !user?.id || !activeProfileId) return;
    const inches = snapToStep(
      clamp(heightInchesSlider, PROFILE_HEIGHT_IN_MIN, PROFILE_HEIGHT_IN_MAX),
      PROFILE_HEIGHT_IN_MIN,
      PROFILE_HEIGHT_IN_STEP
    );
    const saved =
      bodyMetricsRow?.height_in != null && Number.isFinite(Number(bodyMetricsRow.height_in))
        ? Number(bodyMetricsRow.height_in)
        : null;
    const dirty = saved == null || Math.abs(saved - inches) > 1e-6;
    if (!dirty) {
      setHeightMetricsLocked(true);
      return;
    }
    setHeightInchesSlider(inches);
    const err = await commitHeightInches(inches);
    if (!err) setHeightMetricsLocked(true);
  };

  const saveAndLockBodyFat = async () => {
    if (bodyFatMetricsLocked || !user?.id || !activeProfileId) return;
    const v = snapToStep(
      clamp(bodyFatSlider, PROFILE_BODY_FAT_MIN, PROFILE_BODY_FAT_MAX),
      PROFILE_BODY_FAT_MIN,
      PROFILE_BODY_FAT_STEP
    );
    const saved =
      bodyMetricsRow?.body_fat_pct != null && Number.isFinite(Number(bodyMetricsRow.body_fat_pct))
        ? Number(bodyMetricsRow.body_fat_pct)
        : null;
    const dirty = saved == null || Math.abs(saved - v) > 1e-6;
    if (!dirty) {
      setBodyFatMetricsLocked(true);
      return;
    }
    setBodyFatSlider(v);
    const err = await commitBodyFat(v);
    if (!err) setBodyFatMetricsLocked(true);
  };

  const toggleGoalId = async (id) => {
    if (!GOAL_IDS.has(id)) return;
    if (!user?.id || !activeProfileId) return;
    const has = goalIds.includes(id);
    const next = has ? goalIds.filter((x) => x !== id) : [...goalIds, id];
    if (!has && next.length > GOAL_PICK_MAX) {
      setErr(`Pick at most ${GOAL_PICK_MAX} goals`);
      return;
    }
    setErr(null);
    const prev = goalIds;
    setGoalIds(next);
    const csv = serializeGoals(next);
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { goal: csv });
    if (error) {
      setErr(error.message);
      setGoalIds(prev);
      return;
    }
    void refreshBodyMetricsRow();
    if (workerOk) {
      const { error: syncErr } = await patchMemberProfileViaWorker(activeProfileId, { goals: csv });
      if (syncErr) setErr(syncErr.message ?? "Could not sync goals to profile.");
    } else if (isSupabaseConfigured()) {
      const { error: syncErr } = await updateMemberProfile(activeProfileId, { goals: csv });
      if (syncErr) setErr(syncErr.message ?? "Could not sync goals to profile.");
    }
    void refreshMemberProfiles();
    showSavedBriefly();
  };

  const onAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!workerOk) {
      setErr("Configure VITE_API_WORKER_URL to upload a photo.");
      return;
    }
    if (avatarBusy) return;
    if (!activeProfileId) {
      setErr("No active profile");
      return;
    }
    if (!R2_UPLOAD_ALLOWED_TYPES.has(file.type) || file.size > R2_UPLOAD_MAX_BYTES) {
      setErr("JPEG/PNG/WebP/GIF, max 10MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarCrop({
      url,
      revoke: () => URL.revokeObjectURL(url),
    });
  };

  const cancelAvatarCrop = () => {
    avatarCrop?.revoke();
    setAvatarCrop(null);
  };

  const confirmAvatarCrop = async (blob) => {
    if (!activeProfileId || !blob) return;
    setAvatarBusy(true);
    setErr(null);
    setMsg(null);
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const result = await uploadImageToR2({
      path: "/avatars",
      file,
      fields: { kind: "avatar", member_profile_id: activeProfileId },
      onState: (state) => {
        if (state === "retrying") setMsg("Retrying…");
      },
    });
    setMsg(null);
    if (!result.ok) {
      setErr(result.error);
      setAvatarBusy(false);
      return;
    }
    // Optimistic local update — bridges the window between POST resolving
    // and refreshMemberProfiles() completing. Prevents the "D" flash.
    if (typeof result.key === "string" && result.key.trim()) {
      patchMemberProfileLocal(activeProfileId, { avatar_r2_key: result.key.trim() });
    }
    cancelAvatarCrop();
    await refreshMemberProfiles();
    setAvatarBusy(false);
    showSavedBriefly();
  };

  const toggleHeightUnit = (u) => {
    setHeightUnit(u);
    try {
      localStorage.setItem(`pepguideiq.heightUnit.${user.id}`, u === "metric" ? "metric" : "imperial");
    } catch {
      /* ignore */
    }
  };

  if (!profileCtx) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: 24 }}>
        Loading profile…
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
        Supabase is not configured.
      </div>
    );
  }

  if (subView === "settings") {
    return (
      <SettingsTab
        user={user}
        setUser={setUser}
        onOpenUpgrade={onOpenUpgrade}
        onSignOut={onSignOut}
        onBack={() => setSubView("profile")}
      />
    );
  }

  const wMin = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MIN : PROFILE_WEIGHT_LBS_MIN;
  const wMax = weightUnit === "kg" ? PROFILE_WEIGHT_KG_MAX : PROFILE_WEIGHT_LBS_MAX;
  const wStep = weightUnit === "kg" ? PROFILE_WEIGHT_KG_STEP : PROFILE_WEIGHT_LBS_STEP;
  const weightDisplayStr =
    weightUnit === "kg" ? `${weightSlider.toFixed(1)} kg` : `${weightSlider.toFixed(1)} lbs`;
  const heightDisplayStrImperial = fmtFeetInches(heightInchesSlider);
  const heightDisplayStrMetric = `${(heightInchesSlider * 2.54).toFixed(1)} cm`;
  const bodyFatDisplayStr = `${bodyFatSlider.toFixed(1)}%`;

  if (healthSubview === "bodyScan" && user?.id && activeProfileId) {
    const handleShown =
      typeof activeProfile?.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : String(activeProfile?.handle ?? "").trim();
    return (
      <div className="pepv-profile-tab" style={{ maxWidth: 640, margin: "0 auto" }}>
        {err && (
          <div className="mono" style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 12 }}>
            {err}
          </div>
        )}
        {savedFlash ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10, letterSpacing: "0.04em" }}>
            Saved ✓
          </div>
        ) : null}
        <BodyScanView
          profileId={activeProfileId}
          userId={user.id}
          tier={user.plan ?? "entry"}
          handle={handleShown}
          onBack={() => setHealthSubview(null)}
          onOpenUpgrade={onOpenUpgrade}
          onErrorMessage={(m) => setErr(typeof m === "string" ? m : "")}
          onSavedBriefly={showSavedBriefly}
          workerOk={workerOk}
          activeStack={savedStackPeptides}
          onGuideDeepAnalysis={onGuideDeepAnalysisToGuide}
        />
      </div>
    );
  }

  return (
    <div
      className="pepv-profile-tab"
      style={{
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="brand" style={{ fontSize: 17, fontWeight: 700 }}>
          Profile
        </div>
        <button
          type="button"
          style={GEAR_BTN}
          onClick={() => setSubView("settings")}
          aria-label="Open settings"
        >
          <span className="pepv-emoji" aria-hidden>
            ⚙️
          </span>
        </button>
      </div>

      {err && (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 12 }}>
          {err}
        </div>
      )}
      {msg && (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 12 }}>
          {msg}
        </div>
      )}
      {savedFlash ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10, letterSpacing: "0.04em" }}>
          Saved ✓
        </div>
      ) : null}

      <AvatarCropModal
        open={Boolean(avatarCrop?.url)}
        imageUrl={avatarCrop?.url ?? null}
        busy={avatarBusy}
        onCancel={() => {
          if (avatarBusy) return;
          cancelAvatarCrop();
        }}
        onConfirm={(blob) => void confirmAvatarCrop(blob)}
      />

      <button
        type="button"
        onClick={() => {
          if (firstIncompleteFieldId) scrollToField(firstIncompleteFieldId);
        }}
        style={{
          width: "100%",
          textAlign: "left",
          marginBottom: 20,
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--color-border-default)",
          background: "var(--color-bg-elevated)",
          cursor: firstIncompleteFieldId ? "pointer" : "default",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-primary)",
            marginBottom: 8,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
          }}
        >
          Profile {completionPct}% complete
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--color-bg-input)", overflow: "hidden" }}>
          <div
            style={{
              width: `${completionPct}%`,
              height: "100%",
              background: "var(--color-accent)",
              transition: "width 0.25s ease",
              borderRadius: 4,
            }}
          />
        </div>
      </button>

      <div style={SECTION}>User</div>
      <Card>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            width: "100%",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div ref={setFieldRef("avatar")} className="pepv-profile-user-avatar-wrap" style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                data-tutorial-target={TUTORIAL_TARGET.profile_avatar}
                {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_avatar)))}
                style={{
                  width: 112,
                  height: 112,
                  minWidth: 112,
                  minHeight: 112,
                  borderRadius: "50%",
                  border: "2px solid var(--color-border-emphasis)",
                  overflow: "hidden",
                  padding: 0,
                  cursor: avatarBusy ? "wait" : "pointer",
                  background: "var(--color-bg-input)",
                  flexShrink: 0,
                  opacity: avatarBusy ? 0.85 : 1,
                }}
                aria-label="Upload or replace profile photo"
              >
                {memberAvatarSrc ? (
                  <img
                    src={memberAvatarSrc}
                    alt=""
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      fontFamily: "'Outfit', sans-serif",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    {avatarInitialLetter(displayNameShown, user.name, user.email)}
                  </div>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              style={{
                position: "absolute",
                left: "calc(50% + 56px + 12px)",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 12,
                border: "1px solid var(--color-accent-subtle-50)",
                background: "var(--color-accent-subtle-0e)",
                color: "var(--color-accent)",
                cursor: "pointer",
                minHeight: 44,
                fontSize: 16,
                lineHeight: 1,
              }}
              aria-label="Create a post"
            >
              <span className="pepv-emoji" aria-hidden>
                📸
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-secondary)",
                }}
              >
                Post It
              </span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept={R2_UPLOAD_ACCEPT_ATTR} hidden onChange={(e) => void onAvatarPick(e)} />
          <div className="pepv-profile-user-fields" style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
            <div ref={setFieldRef("display_name")} style={{ marginBottom: 10, width: "100%" }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                DISPLAY NAME
              </div>
              <input
                className="form-input"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  width: "100%",
                  boxSizing: "border-box",
                  minWidth: 0,
                  fontFamily: "'Outfit', sans-serif",
                }}
                value={displayNameDraft}
                onChange={(e) => setDisplayNameDraft(e.target.value.slice(0, 120))}
                onBlur={() => void commitDisplayName()}
                placeholder="Your display name"
                aria-label="Display name"
              />
              {goalIds.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, alignItems: "center" }}>
                  {goalIds.slice(0, 6).map((gid) => (
                    <span
                      key={gid}
                      className="pepv-emoji"
                      style={{ fontSize: 20, lineHeight: 1 }}
                      aria-hidden
                      title={GOAL_OPTIONS.find((g) => g.id === gid)?.label ?? ""}
                    >
                      {goalEmojiFromId(gid)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginBottom: 12,
                lineHeight: 1.35,
                wordBreak: "break-all",
              }}
            >
              {user.email}
            </div>
            <div ref={setFieldRef("handle")} style={{ marginBottom: 14 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                HANDLE
              </div>
              <input
                className="form-input"
                data-tutorial-target={TUTORIAL_TARGET.profile_handle}
                {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_handle)))}
                style={{ fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace" }}
                value={handleDraft}
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith("@")) v = `@${v.replace(/^@+/, "")}`;
                  const rest = v.slice(1).replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32);
                  setHandleDraft(`@${rest}`);
                }}
                onBlur={() => void commitHandle()}
                placeholder="@yourhandle"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Handle"
              />
              {handleHint ? (
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: handleHint === "Available" ? "var(--color-accent)" : "var(--color-text-secondary)",
                    marginTop: 4,
                  }}
                >
                  {handleHint}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div style={SECTION}>Measurement hub</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          data-tutorial-target={TUTORIAL_TARGET.body_scan_section}
          {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.body_scan_section)))}
          onClick={() => {
            if (user?.id && activeProfileId) setHealthSubview("bodyScan");
          }}
          disabled={!user?.id || !activeProfileId}
          style={{
            textAlign: "left",
            padding: 14,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-card)",
            cursor: user?.id && activeProfileId ? "pointer" : "not-allowed",
            opacity: user?.id && activeProfileId ? 1 : 0.55,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 120,
            color: "var(--color-text-primary)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Body Scan</div>
            <span style={{ fontSize: 18, color: "var(--color-text-muted)" }} aria-hidden>
              ›
            </span>
          </div>
          {latestInbodyRow?.id ? (
            <>
              <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                {formatInbodyScanDateOnly(latestInbodyRow.scan_date ?? null, "medium") ?? "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InbodyScoreRing size={44} score={inbodyToNum(latestInbodyRow.inbody_score ?? null)} />
                <div style={{ display: "flex", flex: 1, gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-text-secondary)" }}>
                  <span>W {latestInbodyRow.weight_lbs != null ? `${Number(latestInbodyRow.weight_lbs).toFixed(0)}` : "—"}</span>
                  <span>·</span>
                  <span>SMM {latestInbodyRow.smm_lbs != null ? `${Number(latestInbodyRow.smm_lbs).toFixed(0)}` : "—"}</span>
                  <span>·</span>
                  <span>BF {latestInbodyRow.pbf_pct != null ? `${Number(latestInbodyRow.pbf_pct).toFixed(0)}%` : "—"}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              No scans yet
            </div>
          )}
        </button>
        <button
          type="button"
          onClick={() => void scrollToField("progress_photos")}
          style={{
            textAlign: "left",
            padding: 14,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 120,
            color: "var(--color-text-primary)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Progress Photos</div>
            <span style={{ fontSize: 18, color: "var(--color-text-muted)" }} aria-hidden>
              ›
            </span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {progressPhotosHubSubLabel}
          </div>
        </button>
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-card)",
            opacity: 0.5,
            minHeight: 120,
            pointerEvents: "none",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Lab Biomarkers</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Coming soon
          </div>
        </div>
        <button
          type="button"
          onClick={() => void scrollToField("weight")}
          style={{
            textAlign: "left",
            padding: 14,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-card)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 120,
            color: "var(--color-text-primary)",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Body Metrics</div>
            <span style={{ fontSize: 18, color: "var(--color-text-muted)" }} aria-hidden>
              ›
            </span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {bodyMetricsRow?.updated_at && typeof bodyMetricsRow.updated_at === "string"
              ? (() => {
                  const t = Date.parse(bodyMetricsRow.updated_at);
                  if (!Number.isFinite(t)) return "Weight, height & body fat %";
                  try {
                    return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(t)}`;
                  } catch {
                    return "Weight, height & body fat %";
                  }
                })()
              : "Weight, height & body fat %"}
          </div>
        </button>
      </div>

      <PepguideStatsSectionHeading stats={stats} />
      <PepguideStatsStrip
        stats={stats}
        tutorialHighlightProps={tutorialHighlightProps}
        tutorialHighlighted={Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_score))}
      />

      <div style={SECTION}>Account</div>
      <Card>
        <div ref={setFieldRef("bio")} style={{ marginBottom: 14 }}>
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 6, letterSpacing: "0.08em" }}
          >
            BIO
          </div>
          <textarea
            className="form-input"
            style={{
              fontSize: 13,
              width: "100%",
              boxSizing: "border-box",
              minHeight: 72,
              resize: "vertical",
              lineHeight: 1.45,
            }}
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value.slice(0, 500))}
            onBlur={() => void commitBio()}
            placeholder="Tell the community about your protocol..."
            maxLength={500}
            rows={3}
            aria-label="Bio"
          />
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, textAlign: "right" }}>
            {bioDraft.length}/500
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div
            className="mono"
            style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 6, letterSpacing: "0.08em" }}
          >
            SOCIAL LINKS
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 10, lineHeight: 1.45 }}>
            Optional — username or handle only (links are built on your public profile). Paste a profile URL if
            easier; we keep the handle.
          </div>
          {SOCIAL_EDIT_FIELDS.map((field) => (
            <div key={field.key} style={{ marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                {field.label.toUpperCase()}
              </div>
              <input
                className="form-input"
                style={{
                  fontSize: 13,
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                value={socialDrafts[field.key] ?? ""}
                onChange={(e) =>
                  setSocialDrafts((prev) => ({
                    ...prev,
                    [field.key]: e.target.value.slice(0, Math.max(200, SOCIAL_HANDLE_MAX_LEN * 3)),
                  }))
                }
                onBlur={() => void commitSocialField(field.key)}
                placeholder={field.placeholder}
                maxLength={200}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={field.label}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="pill" style={tierPillStyle(user.plan)}>
            {user.plan === "entry" ? "Free" : formatPlan(user.plan)}
          </span>
          <span
            style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.4 }}
            title="Consecutive days with any dose, post, metric, fast, scan, or stack edit — in your local time."
          >
            {streakCount <= 0
              ? "Beginner — log activity to start your active streak"
              : `🔥 ${streakCount} day${streakCount === 1 ? "" : "s"} active streak`}
          </span>
        </div>
      </Card>

      <div style={SECTION}>Body metrics</div>
      <Card>
        <div
          data-tutorial-target={TUTORIAL_TARGET.profile_body_metrics}
          {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_body_metrics)))}
        >
          <div ref={setFieldRef("goal")}>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 6, letterSpacing: "0.08em" }}>
              GOALS
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 10, lineHeight: 1.45 }}>
              Tap to select multiple (up to {GOAL_PICK_MAX}).
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {GOAL_OPTIONS.map((g) => {
                const sel = goalIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => void toggleGoalId(g.id)}
                    style={{
                      fontSize: 13,
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: sel ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                      background: sel ? "var(--color-accent-nav-fill)" : "transparent",
                      color: sel ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={setFieldRef("weight")}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
                WEIGHT
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["lbs", "kg"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      disabled={weightMetricsLocked}
                      onClick={() => onWeightUnitPick(u)}
                      style={{
                        fontSize: 13,
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: weightUnit === u ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                        background: weightUnit === u ? "var(--color-accent-nav-fill)" : "transparent",
                        color: weightUnit === u ? "var(--color-accent)" : "var(--color-text-secondary)",
                        cursor: weightMetricsLocked ? "not-allowed" : "pointer",
                        opacity: weightMetricsLocked ? 0.45 : 1,
                        pointerEvents: weightMetricsLocked ? "none" : "auto",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  style={METRIC_LOCK_BTN}
                  aria-label={weightMetricsLocked ? "Unlock weight to edit" : "Save weight and lock"}
                  title={weightMetricsLocked ? "Unlock" : "Save and lock"}
                  onClick={() => {
                    if (weightMetricsLocked) setWeightMetricsLocked(false);
                    else void saveAndLockWeight();
                  }}
                >
                  {weightMetricsLocked ? "🔒" : "🔓"}
                </button>
                {!weightMetricsLocked ? (
                  <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "5px 14px" }} onClick={() => void saveAndLockWeight()}>
                    Save
                  </button>
                ) : null}
              </div>
            </div>
            <BodyMetricStepper
                locked={weightMetricsLocked}
                value={weightSlider}
                min={wMin}
                max={wMax}
                step={wStep}
                displayText={weightDisplayStr}
                fastRange={
                  weightUnit === "kg"
                    ? {
                        min: PROFILE_WEIGHT_SLIDER_KG_MIN,
                        max: PROFILE_WEIGHT_SLIDER_KG_MAX,
                        step: PROFILE_WEIGHT_SLIDER_KG_STEP,
                      }
                    : {
                        min: PROFILE_WEIGHT_SLIDER_LBS_MIN,
                        max: PROFILE_WEIGHT_SLIDER_LBS_MAX,
                        step: PROFILE_WEIGHT_SLIDER_LBS_STEP,
                      }
                }
                onCommitValue={(v) => {
                  setWeightSlider(v);
                }}
            />
          </div>

          <div ref={setFieldRef("height")}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
                HEIGHT
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    disabled={heightMetricsLocked}
                    onClick={() => toggleHeightUnit("imperial")}
                    style={{
                      fontSize: 13,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: heightUnit === "imperial" ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                      background: heightUnit === "imperial" ? "var(--color-accent-nav-fill)" : "transparent",
                      color: heightUnit === "imperial" ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: heightMetricsLocked ? "not-allowed" : "pointer",
                      opacity: heightMetricsLocked ? 0.45 : 1,
                      pointerEvents: heightMetricsLocked ? "none" : "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    FT + IN
                  </button>
                  <button
                    type="button"
                    disabled={heightMetricsLocked}
                    onClick={() => toggleHeightUnit("metric")}
                    style={{
                      fontSize: 13,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: heightUnit === "metric" ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                      background: heightUnit === "metric" ? "var(--color-accent-nav-fill)" : "transparent",
                      color: heightUnit === "metric" ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: heightMetricsLocked ? "not-allowed" : "pointer",
                      opacity: heightMetricsLocked ? 0.45 : 1,
                      pointerEvents: heightMetricsLocked ? "none" : "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    CM
                  </button>
                </div>
                <button
                  type="button"
                  style={METRIC_LOCK_BTN}
                  aria-label={heightMetricsLocked ? "Unlock height to edit" : "Save height and lock"}
                  title={heightMetricsLocked ? "Unlock" : "Save and lock"}
                  onClick={() => {
                    if (heightMetricsLocked) setHeightMetricsLocked(false);
                    else void saveAndLockHeight();
                  }}
                >
                  {heightMetricsLocked ? "🔒" : "🔓"}
                </button>
                {!heightMetricsLocked ? (
                  <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "5px 14px" }} onClick={() => void saveAndLockHeight()}>
                    Save
                  </button>
                ) : null}
              </div>
            </div>
            <BodyMetricStepper
                locked={heightMetricsLocked}
                value={heightInchesSlider}
                min={PROFILE_HEIGHT_IN_MIN}
                max={PROFILE_HEIGHT_IN_MAX}
                step={PROFILE_HEIGHT_IN_STEP}
                displayText={heightUnit === "imperial" ? heightDisplayStrImperial : heightDisplayStrMetric}
                fastRange={
                  heightUnit === "imperial"
                    ? {
                        min: PROFILE_HEIGHT_SLIDER_IN_MIN,
                        max: PROFILE_HEIGHT_SLIDER_IN_MAX,
                        step: PROFILE_HEIGHT_SLIDER_IN_STEP,
                      }
                    : {
                        min: PROFILE_HEIGHT_SLIDER_CM_MIN,
                        max: PROFILE_HEIGHT_SLIDER_CM_MAX,
                        step: PROFILE_HEIGHT_SLIDER_CM_STEP,
                        valueToSlider: (inches) => Math.round(inches * 2.54),
                        sliderToValue: (cm) => cm / 2.54,
                      }
                }
                onCommitValue={(v) => {
                  setHeightInchesSlider(v);
                }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
              BODY FAT % <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={METRIC_LOCK_BTN}
                aria-label={bodyFatMetricsLocked ? "Unlock body fat % to edit" : "Save body fat % and lock"}
                title={bodyFatMetricsLocked ? "Unlock" : "Save and lock"}
                onClick={() => {
                  if (bodyFatMetricsLocked) setBodyFatMetricsLocked(false);
                  else void saveAndLockBodyFat();
                }}
              >
                {bodyFatMetricsLocked ? "🔒" : "🔓"}
              </button>
              {!bodyFatMetricsLocked ? (
                <button type="button" className="btn-teal" style={{ fontSize: 12, padding: "5px 14px" }} onClick={() => void saveAndLockBodyFat()}>
                  Save
                </button>
              ) : null}
            </div>
          </div>
          <BodyMetricStepper
            locked={bodyFatMetricsLocked}
            value={bodyFatSlider}
            min={PROFILE_BODY_FAT_MIN}
            max={PROFILE_BODY_FAT_MAX}
            step={PROFILE_BODY_FAT_STEP}
            displayText={bodyFatDisplayStr}
            fastRange={{
              min: PROFILE_BODY_FAT_SLIDER_MIN,
              max: PROFILE_BODY_FAT_SLIDER_MAX,
              step: PROFILE_BODY_FAT_SLIDER_STEP,
            }}
            onCommitValue={(v) => {
              setBodyFatSlider(v);
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: 14,
              isolation: "isolate",
            }}
          >
          <div ref={setFieldRef("dateOfBirth")} style={{ marginTop: 0 }}>
            <span className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              DATE OF BIRTH
            </span>
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 8 }}>
              Used for age-appropriate dosing guidance. Month 1–12, day 1–31, year {DOB_YEAR_MIN}–{DOB_YEAR_MAX}. Tab out or blur
              to save.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, letterSpacing: "0.06em" }}>
                  MONTH
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={12}
                  placeholder="1–12"
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  onBlur={() => void tryCommitDateOfBirth()}
                  className="form-input"
                  style={{
                    width: 72,
                    fontSize: 13,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border-emphasis)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-primary)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  aria-label="Birth month"
                />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, letterSpacing: "0.06em" }}>
                  DAY
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  placeholder="1–31"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  onBlur={() => void tryCommitDateOfBirth()}
                  className="form-input"
                  style={{
                    width: 72,
                    fontSize: 13,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border-emphasis)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-primary)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  aria-label="Birth day"
                />
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4, letterSpacing: "0.06em" }}>
                  YEAR
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  min={DOB_YEAR_MIN}
                  max={DOB_YEAR_MAX}
                  placeholder={`${DOB_YEAR_MIN}–${DOB_YEAR_MAX}`}
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onBlur={() => void tryCommitDateOfBirth()}
                  className="form-input"
                  style={{
                    width: 88,
                    fontSize: 13,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border-emphasis)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-primary)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  aria-label="Birth year"
                />
              </div>
            </div>
          </div>

          <div ref={setFieldRef("training_experience")} style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
                TRAINING EXPERIENCE
              </span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 8 }}>
              For protocol and AI safety context.
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EXPERIENCE_OPTIONS.map((o) => {
                const sel = String(trainingExp ?? "").toLowerCase() === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => void setTrainingExperience(o.id)}
                    style={{
                      fontSize: 13,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: sel ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                      background: sel ? "var(--color-accent-nav-fill)" : "transparent",
                      color: sel ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={setFieldRef("gender")} style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
                GENDER
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "male", label: "♂️ Male" },
                { id: "female", label: "♀️ Female" },
                { id: "prefer_not_to_say", label: "Prefer not to say" },
              ].map(({ id, label }) => {
                const sel = String(bioSex ?? "").toLowerCase() === id;
                return (
                <button
                  key={id}
                  type="button"
                  onClick={() => void setBiologicalSex(id)}
                  style={{
                    fontSize: 13,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border:
                      sel ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                    background: sel ? "var(--color-accent-nav-fill)" : "transparent",
                    color: sel ? "var(--color-accent)" : "var(--color-text-secondary)",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                </button>
              );
              })}
            </div>
            {String(bioSex ?? "").toLowerCase() === "female" && (user?.cycle_tracking_enabled ?? null) === null ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border-default)",
                  background: "var(--color-bg-elevated)",
                }}
              >
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.45, marginBottom: 10 }}>
                  Track menstrual cycle for protocol optimization?
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-teal"
                    style={{ fontSize: 12, padding: "5px 14px" }}
                    onClick={() => void setCycleTrackingConsent(true)}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    style={{
                      fontSize: 12,
                      padding: "5px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-emphasis)",
                      background: "transparent",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    onClick={() => void setCycleTrackingConsent(false)}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          </div>

        </div>
      </Card>

      <div ref={setFieldRef("progress_photos")} style={SECTION}>
        Progress photos
      </div>
      <Card style={{ paddingBottom: 12 }}>
        {canUseProgressPhotos && activeProfileId ? (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
              <ProfilePrivatePhotoSlot
                label="FRONT"
                kind="progress_front"
                memberProfileId={activeProfileId}
                r2Key={activeProfile?.progress_photo_front_r2_key}
                uploadedAt={activeProfile?.progress_photo_front_at}
                canMutate={canUseProgressPhotos}
                onUpgrade={onOpenUpgrade}
                onUploaded={() => {
                  void refreshMemberProfiles();
                  showSavedBriefly();
                }}
                workerOk={workerOk}
              />
              <ProfilePrivatePhotoSlot
                label="SIDE"
                kind="progress_side"
                memberProfileId={activeProfileId}
                r2Key={activeProfile?.progress_photo_side_r2_key}
                uploadedAt={activeProfile?.progress_photo_side_at}
                canMutate={canUseProgressPhotos}
                onUpgrade={onOpenUpgrade}
                onUploaded={() => {
                  void refreshMemberProfiles();
                  showSavedBriefly();
                }}
                workerOk={workerOk}
              />
              <ProfilePrivatePhotoSlot
                label="BACK"
                kind="progress_back"
                memberProfileId={activeProfileId}
                r2Key={activeProfile?.progress_photo_back_r2_key}
                uploadedAt={activeProfile?.progress_photo_back_at}
                canMutate={canUseProgressPhotos}
                onUpgrade={onOpenUpgrade}
                onUploaded={() => {
                  void refreshMemberProfiles();
                  showSavedBriefly();
                }}
                workerOk={workerOk}
              />
            </div>
            {progressArchivedSets.length > 0 ? (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border-emphasis)" }}>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 10, letterSpacing: "0.08em" }}
                >
                  PREVIOUS SETS
                </div>
                {progressArchivedSets.map((entry, idx) => (
                  <ArchivedProgressSetRow key={idx} entry={entry} workerOk={workerOk} />
                ))}
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <button
                type="button"
                className="btn-teal"
                style={{
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  opacity:
                    archiveProgressBusy ||
                    !workerOk ||
                    !String(activeProfile?.progress_photo_front_r2_key ?? "").trim() ||
                    !String(activeProfile?.progress_photo_side_r2_key ?? "").trim() ||
                    !String(activeProfile?.progress_photo_back_r2_key ?? "").trim()
                      ? 0.55
                      : 1,
                }}
                disabled={
                  archiveProgressBusy ||
                  !workerOk ||
                  !String(activeProfile?.progress_photo_front_r2_key ?? "").trim() ||
                  !String(activeProfile?.progress_photo_side_r2_key ?? "").trim() ||
                  !String(activeProfile?.progress_photo_back_r2_key ?? "").trim()
                }
                onClick={() => {
                  void (async () => {
                    setArchiveProgressBusy(true);
                    setErr(null);
                    const { error } = await archiveProgressPhotoSetViaWorker(activeProfileId);
                    if (error) setErr(error.message);
                    else {
                      await refreshMemberProfiles();
                      showSavedBriefly();
                    }
                    setArchiveProgressBusy(false);
                  })();
                }}
              >
                <span className="pepv-emoji" aria-hidden style={{ fontSize: 14 }}>
                  ↓
                </span>
                {archiveProgressBusy ? "Saving…" : "+ Add 3 More"}
              </button>
            </div>
            <div
              className="mono"
              style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8, textAlign: "center", lineHeight: 1.45 }}
            >
              Saves this front/side/back trio and clears slots for your next check-in.
            </div>
          </>
        ) : (
          <>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              Front, side, and back progress photos — included with Pro and above.
            </div>
            <button type="button" className="btn-teal" style={{ fontSize: 13 }} onClick={onOpenUpgrade}>
              Upgrade to unlock
            </button>
          </>
        )}
      </Card>

      <div style={SECTION}>Fasting</div>
      <FastingTrackerSection
        userId={user.id}
        activeProfileId={activeProfileId}
        setErr={setErr}
        showSavedBriefly={showSavedBriefly}
      />

      <div style={SECTION}>Labs</div>
      <Card>
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
          Coming soon — upload labs and track biomarkers over time.
        </div>
      </Card>

      <div style={SECTION}>Active stack</div>
      <Card>
        <div ref={setFieldRef("active_stack")}>
          <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 10, letterSpacing: "0.08em" }}>
            ACTIVE STACK
          </div>
          {savedStackPeptides.length === 0 ? (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              No active stack saved yet
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {savedStackPeptides.map((p) => (
                <span
                  key={p.id}
                  className="pill"
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    background: "var(--color-accent-subtle-10)",
                    border: "1px solid var(--color-accent-subtle-30)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <PostItComposer
        open={composerOpen}
        activeProfileId={activeProfileId ?? ""}
        displayName={displayNameShown}
        onClose={() => setComposerOpen(false)}
        onPosted={() => setComposerOpen(false)}
      />
    </div>
  );
}
