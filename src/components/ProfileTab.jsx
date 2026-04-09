import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SettingsTab } from "./SettingsTab.jsx";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import { formatPlan, getTier } from "../lib/tiers.js";
import { calculateStreak } from "../lib/streakUtils.js";
import {
  checkMemberProfileHandleAvailable,
  fetchBodyMetrics,
  fetchUserProfileStats,
  getSessionAccessToken,
  listRecentDosedAtDates,
  patchMemberProfileViaWorker,
  upsertBodyMetrics,
  updateMemberProfile,
} from "../lib/supabase.js";
import {
  R2_UPLOAD_ACCEPT_ATTR,
  R2_UPLOAD_ALLOWED_TYPES,
  R2_UPLOAD_MAX_BYTES,
  uploadImageToR2,
} from "../lib/r2Upload.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { DEMO_TARGET, demoHighlightProps, useDemoTourOptional } from "../context/DemoTourContext.jsx";
import { useMemberAvatarSrc } from "../hooks/useMemberAvatarSrc.js";

const SECTION = {
  fontSize: 13,
  color: "#00d4aa",
  letterSpacing: "0.12em",
  marginBottom: 12,
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
};

const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "elite", label: "Elite" },
];

const GOAL_OPTIONS = [
  { id: "shred", label: "🔥 Shred" },
  { id: "bulk", label: "💪 Bulk" },
  { id: "recomp", label: "⚖️ Recomp" },
  { id: "longevity", label: "🧬 Longevity" },
  { id: "performance", label: "🏆 Performance" },
  { id: "optimize", label: "🎯 Optimize" },
  { id: "mental_elevate", label: "🧠 Mental Elevate" },
  { id: "general_health", label: "💚 General Health" },
];

function goalEmojiFromId(goalId) {
  const o = GOAL_OPTIONS.find((g) => g.id === goalId);
  if (!o) return null;
  const i = o.label.indexOf(" ");
  return i > 0 ? o.label.slice(0, i).trim() : o.label;
}

function tierPillStyle(plan) {
  return {
    background:
      plan === "goat" ? "#a855f720" : plan === "elite" ? "#f59e0b20" : plan === "pro" ? "#00d4aa20" : "#14202e",
    color: plan === "goat" ? "#a855f7" : plan === "elite" ? "#f59e0b" : plan === "pro" ? "#00d4aa" : "#4a6080",
    border: `1px solid ${
      plan === "goat" ? "#a855f730" : plan === "elite" ? "#f59e0b30" : plan === "pro" ? "#00d4aa30" : "#14202e"
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
        background: "#0b0f17",
        border: "1px solid #1e2a38",
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

function StatTile({ value, label }) {
  return (
    <div
      style={{
        background: "#07090e",
        border: "1px solid #14202e",
        borderRadius: 12,
        padding: 14,
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color: "#dde4ef", lineHeight: 1.2 }}>{value}</div>
      <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", marginTop: 8, lineHeight: 1.35 }}>
        {label}
      </div>
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

function PepguideIqScoreTile({ stats, expanded, onToggle }) {
  const parts = pepguideIqScoreParts(stats);
  const breakdown =
    parts &&
    [
      `${parts.doses} dose${parts.doses === 1 ? "" : "s"} × 2 = ${parts.doses * 2}`,
      `${parts.compounds} compound${parts.compounds === 1 ? "" : "s"} × 3 = ${parts.compounds * 3}`,
      `${parts.vials} vial${parts.vials === 1 ? "" : "s"} × 1 = ${parts.vials}`,
      `${parts.days} day${parts.days === 1 ? "" : "s"} × 1 = ${parts.days}`,
    ].join(" | ");

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!parts}
      aria-expanded={parts ? expanded : undefined}
      style={{
        width: "100%",
        marginTop: 12,
        textAlign: "left",
        cursor: parts ? "pointer" : "default",
        background: "#07090e",
        border: "1px solid #14202e",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 6,
        opacity: parts ? 1 : 0.85,
        fontFamily: "'Outfit', sans-serif",
        color: "#dde4ef",
      }}
    >
      <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", letterSpacing: "0.06em" }}>
        pepguideIQ Score
      </div>
      {parts ? (
        <>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#00d4aa",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textShadow: "0 0 24px rgba(0, 212, 170, 0.22)",
            }}
          >
            {parts.score}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#8fa5bf", lineHeight: 1.4 }}>{pepguideIqTierLabel(parts.score)}</div>
          <div className="mono" style={{ fontSize: 11, color: "#4a5a6e", lineHeight: 1.45 }}>
            doses ×2 + compounds ×3 + vials ×1 + days ×1
          </div>
          {expanded && (
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "#6b7c8f",
                lineHeight: 1.5,
                marginTop: 4,
                paddingTop: 10,
                borderTop: "1px solid #1a2632",
              }}
            >
              {breakdown}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 28, fontWeight: 700, color: "#4a6080" }}>—</div>
      )}
    </button>
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
  return min + k * step;
}

function fmtFeetInches(totalIn) {
  const fi = Math.round(totalIn);
  const f = Math.floor(fi / 12);
  const inch = fi - f * 12;
  return `${f}'${inch}"`;
}

function ProfileBodyRangeSlider({ min, max, step, value, bubble, onLive, onCommit }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="pepv-profile-slider-wrap" style={{ "--fill-pct": `${pct}%` }}>
      <div className="pepv-profile-slider-bubble mono" style={{ left: `${pct}%` }} aria-hidden>
        {bubble}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onLive(Number(e.currentTarget.value))}
        onPointerUp={(e) => onCommit(Number(e.currentTarget.value))}
        onKeyUp={(e) => {
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown" ||
            e.key === "Home" ||
            e.key === "End" ||
            e.key === "PageUp" ||
            e.key === "PageDown"
          ) {
            onCommit(Number(e.currentTarget.value));
          }
        }}
      />
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
  border: "1px solid rgba(0, 212, 170, 0.55)",
  background: "rgba(0, 212, 170, 0.1)",
  color: "#00d4aa",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
  flexShrink: 0,
  boxSizing: "border-box",
};

function usePrivateStackPhotoUrl(r2Key, workerConfigured) {
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
        const res = await fetch(`${API_WORKER_URL}/stack-photo?key=${encodeURIComponent(r2Key)}`, {
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
  }, [r2Key, workerConfigured]);
  return objectUrl;
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
  const imgUrl = usePrivateStackPhotoUrl(r2Key ?? "", workerOk);
  const uploadedLabel = formatProfilePhotoTimestamp(uploadedAt);

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
    await onUploaded();
  }

  return (
    <div style={{ flex: "1 1 120px", minWidth: 100, maxWidth: 200 }}>
      <div className="mono" style={{ fontSize: 10, color: "#6b7c8f", marginBottom: 6, letterSpacing: "0.08em" }}>
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
          border: "1px dashed #243040",
          background: r2Key && imgUrl ? `url(${imgUrl}) center/cover no-repeat, #07090e` : "#07090e",
          cursor: canMutate ? "pointer" : "not-allowed",
          opacity: uploading ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4a6080",
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
        <div className="mono" style={{ fontSize: 10, color: "#f59e0b", marginTop: 4 }}>
          {slotErr}
        </div>
      ) : null}
      {uploadedLabel ? (
        <div className="mono" style={{ fontSize: 9, color: "#4a6080", marginTop: 4, lineHeight: 1.3 }}>
          {uploadedLabel}
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ user: object, setUser: (u: object | null) => void, onOpenUpgrade: () => void, onSignOut: () => Promise<void>, canUseProgressPhotos?: boolean, savedStackPeptides?: { id: string, name: string }[] }} props */
export function ProfileTab({
  user,
  setUser,
  onOpenUpgrade,
  onSignOut,
  canUseProgressPhotos = false,
  savedStackPeptides = [],
}) {
  const { activeProfileId, activeProfile, memberProfilesVersion, refreshMemberProfiles } = useActiveProfile();
  const demo = useDemoTourOptional();
  const fileRef = useRef(null);
  const workerOk = isApiWorkerConfigured();
  const canUploadBodyScan = Boolean(getTier(user?.plan ?? "entry").inbody_dexa_upload);

  const [subView, setSubView] = useState(/** @type {"profile" | "settings"} */ ("profile"));
  const [goal, setGoal] = useState("");
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
  const [bodyFatSlider, setBodyFatSlider] = useState(3);
  const [stats, setStats] = useState(null);
  const [iqScoreExpanded, setIqScoreExpanded] = useState(false);
  const [clientStreakFallback, setClientStreakFallback] = useState(0);
  const [avatarImageNonce, setAvatarImageNonce] = useState(0);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [bodyMetricsRow, setBodyMetricsRow] = useState(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [handleDraft, setHandleDraft] = useState("@");
  const [handleHint, setHandleHint] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const scanFileRef = useRef(null);
  const fieldAnchorRefs = useRef(/** @type {Record<string, HTMLElement | null>} */ ({}));

  const setFieldRef = useCallback((id) => {
    return (el) => {
      fieldAnchorRefs.current[id] = el;
    };
  }, []);

  const displayNameShown =
    activeProfile && typeof activeProfile.display_name === "string" ? activeProfile.display_name.trim() : "";

  const memberAvatarSrc = useMemberAvatarSrc(
    user.id,
    activeProfile?.avatar_url,
    avatarImageNonce + memberProfilesVersion,
    workerOk
  );

  const streakCount =
    activeProfile != null && typeof activeProfile.current_streak === "number"
      ? activeProfile.current_streak
      : clientStreakFallback;

  useEffect(() => {
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) {
      setGoal("");
      setWeightUnit("lbs");
      setWeightSlider(200);
      setHeightInchesSlider(68);
      setBodyFatSlider(3);
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
      setGoal(row && typeof row.goal === "string" ? row.goal : "");
      const wMin = wu === "kg" ? 36 : 80;
      const wMax = wu === "kg" ? 180 : 400;
      const wStep = wu === "kg" ? 0.5 : 1;
      const wl = row?.weight_lbs;
      if (wl != null && Number.isFinite(Number(wl))) {
        const lbs = Number(wl);
        const disp = wu === "kg" ? lbs / 2.20462 : lbs;
        setWeightSlider(snapToStep(clamp(disp, wMin, wMax), wMin, wStep));
      } else {
        setWeightSlider(wu === "kg" ? 80 : 200);
      }
      const hi = row?.height_in;
      if (hi != null && Number.isFinite(Number(hi))) {
        setHeightInchesSlider(Math.round(clamp(Number(hi), 48, 96)));
      } else {
        setHeightInchesSlider(68);
      }
      const bf = row?.body_fat_pct;
      if (bf != null && Number.isFinite(Number(bf)) && Number(bf) > 3) {
        setBodyFatSlider(snapToStep(clamp(Number(bf), 3, 60), 3, 0.5));
      } else {
        setBodyFatSlider(3);
      }
    });
    return () => {
      ignore = true;
    };
  }, [user.id, activeProfileId]);

  useEffect(() => {
    if (!activeProfile) return;
    setDisplayNameDraft(String(activeProfile.display_name ?? "").trim());
    const h = activeProfile.handle;
    setHandleDraft(h ? `@${String(h).replace(/^@/, "")}` : "@");
    setBioDraft(typeof activeProfile.bio === "string" ? activeProfile.bio : "");
  }, [activeProfile, activeProfileId, memberProfilesVersion]);

  useEffect(() => {
    if (!workerOk || !activeProfileId) {
      setHandleHint("");
      return;
    }
    const raw = handleDraft.replace(/^@/, "").trim().toLowerCase();
    if (raw.length === 0) {
      setHandleHint("");
      return;
    }
    if (raw.length < 3) {
      setHandleHint("At least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(raw)) {
      setHandleHint("Letters, numbers, underscores only");
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
            setErr(error.message);
            return false;
          }
        } else {
          const { error } = await updateMemberProfile(activeProfileId, patch);
          if (error) {
            setErr(error.message);
            return false;
          }
        }
        setErr(null);
        await refreshMemberProfiles();
        return true;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
        return false;
      }
    },
    [activeProfileId, workerOk, refreshMemberProfiles]
  );

  const completionFields = useMemo(() => {
    const handleSaved =
      typeof activeProfile?.handle === "string" && /^[a-z0-9_]{3,20}$/.test(activeProfile.handle.trim());
    return [
      {
        id: "avatar",
        done: Boolean(activeProfile?.avatar_url && String(activeProfile.avatar_url).trim()),
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
        done: Boolean(bodyMetricsRow && typeof bodyMetricsRow.goal === "string" && bodyMetricsRow.goal.trim()),
        label: "Goal",
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
        id: "experience_level",
        done: Boolean(
          activeProfile?.experience_level &&
            EXPERIENCE_OPTIONS.some((o) => o.id === String(activeProfile.experience_level).toLowerCase())
        ),
        label: "Level",
      },
      {
        id: "active_stack",
        done: savedStackPeptides.length > 0,
        label: "Stack",
      },
    ];
  }, [activeProfile, bodyMetricsRow, displayNameShown, savedStackPeptides]);

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
    const raw = handleDraft.replace(/^@/, "").trim().toLowerCase();
    const saved = String(activeProfile?.handle || "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");
    if (raw === saved) return;
    if (raw.length === 0) {
      await saveProfilePatch({ handle: null });
      return;
    }
    if (raw.length < 3) {
      setErr("Handle must be at least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(raw)) {
      setErr("Handle: use letters, numbers, and underscores only");
      return;
    }
    await saveProfilePatch({ handle: raw });
  }, [activeProfileId, handleDraft, activeProfile?.handle, saveProfilePatch]);

  const commitBio = useCallback(async () => {
    if (!activeProfileId) return;
    const t = bioDraft.slice(0, 160).trim();
    const saved = typeof activeProfile?.bio === "string" ? activeProfile.bio.trim() : "";
    if (t === saved) return;
    await saveProfilePatch({ bio: t || null });
  }, [activeProfileId, bioDraft, activeProfile?.bio, saveProfilePatch]);

  const pickExperienceLevel = useCallback(
    async (id) => {
      if (String(activeProfile?.experience_level || "").toLowerCase() === id) return;
      await saveProfilePatch({ experience_level: id });
    },
    [activeProfile?.experience_level, saveProfilePatch]
  );

  const onBodyScanPick = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!canUploadBodyScan) {
        onOpenUpgrade();
        return;
      }
      if (!workerOk) {
        setErr("Configure VITE_API_WORKER_URL to upload.");
        return;
      }
      if (!activeProfileId) {
        setErr("No active profile");
        return;
      }
      if (!R2_UPLOAD_ALLOWED_TYPES.has(file.type) || file.size > R2_UPLOAD_MAX_BYTES) {
        setErr("JPEG/PNG/WebP/GIF, max 10MB");
        return;
      }
      setScanBusy(true);
      setErr(null);
      const result = await uploadImageToR2({
        path: "/stack-photo",
        file,
        fields: { kind: "body_scan", member_profile_id: activeProfileId },
      });
      setScanBusy(false);
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      await refreshMemberProfiles();
    },
    [activeProfileId, canUploadBodyScan, onOpenUpgrade, workerOk, refreshMemberProfiles]
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

  /** Prefer `member_profiles.current_streak` (DB trigger on dose_logs); client calc only if column missing (older API). */
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

  useEffect(() => {
    setIqScoreExpanded(false);
  }, [user.id]);

  const refreshBodyMetricsRow = useCallback(async () => {
    if (!activeProfileId) return;
    const { row } = await fetchBodyMetrics(activeProfileId);
    setBodyMetricsRow(row ?? null);
  }, [activeProfileId]);

  const persistHeightInches = async (totalIn) => {
    if (!user?.id || !activeProfileId) return;
    const v = totalIn != null && Number.isFinite(totalIn) && totalIn > 0 ? totalIn : null;
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, {
      height_in: v != null ? Math.round(clamp(v, 48, 96)) : null,
    });
    if (error) setErr(error.message);
    else {
      setErr(null);
      void refreshBodyMetricsRow();
    }
  };

  const commitHeightInches = async (totalIn) => {
    const inches = Math.round(totalIn);
    await persistHeightInches(clamp(inches, 48, 96));
  };

  const commitWeightDisplay = async (disp) => {
    if (!user?.id || !activeProfileId) return;
    const wMin = weightUnit === "kg" ? 36 : 80;
    const wMax = weightUnit === "kg" ? 180 : 400;
    const wStep = weightUnit === "kg" ? 0.5 : 1;
    const v = snapToStep(clamp(disp, wMin, wMax), wMin, wStep);
    const lbs = weightUnit === "kg" ? v * 2.20462 : v;
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, {
      weight_lbs: lbs,
      weight_unit: weightUnit,
    });
    if (error) setErr(error.message);
    else {
      setErr(null);
      void refreshBodyMetricsRow();
    }
  };

  const commitBodyFat = async (pctVal) => {
    if (!user?.id || !activeProfileId) return;
    const v = snapToStep(clamp(pctVal, 3, 60), 3, 0.5);
    if (v <= 3) {
      const { error } = await upsertBodyMetrics(user.id, activeProfileId, { body_fat_pct: null });
      if (error) setErr(error.message);
      else {
        setErr(null);
        void refreshBodyMetricsRow();
      }
      return;
    }
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { body_fat_pct: v });
    if (error) setErr(error.message);
    else {
      setErr(null);
      void refreshBodyMetricsRow();
    }
  };

  const saveGoal = async (g) => {
    if (!user?.id || !activeProfileId) return;
    setGoal(g);
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { goal: g || null });
    if (error) setErr(error.message);
    else {
      setErr(null);
      void refreshBodyMetricsRow();
    }
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
    setAvatarBusy(true);
    setErr(null);
    setMsg(null);
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
    // Worker has already persisted member_profiles.avatar_url with the full URL.
    // Refresh so any other consumer (header, ProfileSwitcher) sees the new value.
    await refreshMemberProfiles();
    setAvatarImageNonce((n) => n + 1);
    setAvatarBusy(false);
  };

  const toggleHeightUnit = (u) => {
    setHeightUnit(u);
    try {
      localStorage.setItem(`pepguideiq.heightUnit.${user.id}`, u === "metric" ? "metric" : "imperial");
    } catch {
      /* ignore */
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "#a0a0b0" }}>
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

  const wMin = weightUnit === "kg" ? 36 : 80;
  const wMax = weightUnit === "kg" ? 180 : 400;
  const wStep = weightUnit === "kg" ? 0.5 : 1;
  const weightBubble =
    weightUnit === "kg"
      ? `${Number.isInteger(weightSlider * 2) ? weightSlider : weightSlider.toFixed(1)} kg`
      : `${Math.round(weightSlider)} lbs`;

  const heightCmRounded = Math.round(heightInchesSlider * 2.54);
  const heightMinCm = 120;
  const heightMaxCm = 245;
  const heightBubble =
    heightUnit === "imperial" ? fmtFeetInches(heightInchesSlider) : `${heightCmRounded} cm`;

  const bodyFatBubble =
    bodyFatSlider <= 3
      ? "Not set"
      : `${bodyFatSlider % 1 === 0 ? bodyFatSlider : bodyFatSlider.toFixed(1)}%`;

  return (
    <div
      className="pepv-profile-tab"
      style={{
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <style>{`
        .pepv-profile-slider-wrap {
          --fill-pct: 50%;
          position: relative;
          width: 100%;
          padding-top: 30px;
          margin-bottom: 14px;
          box-sizing: border-box;
        }
        .pepv-profile-slider-bubble {
          position: absolute;
          top: 0;
          transform: translateX(-50%);
          padding: 4px 10px;
          border-radius: 10px;
          border: 1px solid #1e2a38;
          background: rgba(10, 14, 22, 0.95);
          color: #dde4ef;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.04em;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          z-index: 2;
        }
        .pepv-profile-slider-wrap input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 28px;
          margin: 0;
          background: transparent;
          cursor: pointer;
        }
        .pepv-profile-slider-wrap input[type="range"]:focus {
          outline: none;
        }
        .pepv-profile-slider-wrap input[type="range"]::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            #00d4aa 0%,
            #00d4aa var(--fill-pct),
            #1e2a38 var(--fill-pct),
            #1e2a38 100%
          );
        }
        .pepv-profile-slider-wrap input[type="range"]::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: #1e2a38;
        }
        .pepv-profile-slider-wrap input[type="range"]::-moz-range-progress {
          height: 6px;
          border-radius: 3px;
          background: #00d4aa;
        }
        .pepv-profile-slider-wrap input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #00d4aa;
          border: 2px solid #07090e;
          margin-top: -8px;
          box-shadow: 0 0 0 1px rgba(0, 212, 170, 0.25);
        }
        .pepv-profile-slider-wrap input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #00d4aa;
          border: 2px solid #07090e;
          box-shadow: 0 0 0 1px rgba(0, 212, 170, 0.25);
        }
      `}</style>

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
        <div className="mono" style={{ fontSize: 13, color: "#f59e0b", marginBottom: 12 }}>
          {err}
        </div>
      )}
      {msg && (
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 12 }}>
          {msg}
        </div>
      )}

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
          border: "1px solid #1e2a38",
          background: "#0b0f17",
          cursor: firstIncompleteFieldId ? "pointer" : "default",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#dde4ef",
            marginBottom: 8,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
          }}
        >
          Profile {completionPct}% complete
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#1e2a38", overflow: "hidden" }}>
          <div
            style={{
              width: `${completionPct}%`,
              height: "100%",
              background: "#00d4aa",
              transition: "width 0.25s ease",
              borderRadius: 4,
            }}
          />
        </div>
      </button>

      <div style={SECTION}>User</div>
      <Card>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div ref={setFieldRef("avatar")}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-demo-target={DEMO_TARGET.profile_avatar}
              {...demoHighlightProps(Boolean(demo?.isHighlighted(DEMO_TARGET.profile_avatar)))}
              style={{
                width: 112,
                height: 112,
                minWidth: 112,
                minHeight: 112,
                borderRadius: "50%",
                border: "2px solid #243040",
                overflow: "hidden",
                padding: 0,
                cursor: avatarBusy ? "wait" : "pointer",
                background: "#07090e",
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
                    color: "#00d4aa",
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
          <input ref={fileRef} type="file" accept={R2_UPLOAD_ACCEPT_ATTR} hidden onChange={(e) => void onAvatarPick(e)} />
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <div ref={setFieldRef("display_name")} style={{ marginBottom: 10 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                DISPLAY NAME
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <input
                  className="form-input"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    flex: "1 1 200px",
                    minWidth: 0,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  value={displayNameDraft}
                  onChange={(e) => setDisplayNameDraft(e.target.value.slice(0, 120))}
                  onBlur={() => void commitDisplayName()}
                  placeholder="Your display name"
                  aria-label="Display name"
                />
                {goalEmojiFromId(goal) ? (
                  <span
                    className="pepv-emoji"
                    style={{ fontSize: 20, lineHeight: 1 }}
                    aria-hidden
                    title={GOAL_OPTIONS.find((g) => g.id === goal)?.label ?? ""}
                  >
                    {goalEmojiFromId(goal)}
                  </span>
                ) : null}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7c8f",
                marginBottom: 12,
                lineHeight: 1.35,
                wordBreak: "break-word",
              }}
            >
              {user.email}
            </div>
            <div ref={setFieldRef("handle")} style={{ marginBottom: 14 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                HANDLE
              </div>
              <input
                className="form-input"
                style={{ fontSize: 13, width: "100%", fontFamily: "'JetBrains Mono', monospace" }}
                value={handleDraft}
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith("@")) v = `@${v.replace(/^@+/, "")}`;
                  const rest = v
                    .slice(1)
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 20);
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
                    color: handleHint === "Available" ? "#00d4aa" : "#6b7c8f",
                    marginTop: 4,
                  }}
                >
                  {handleHint}
                </div>
              ) : null}
            </div>
            <div ref={setFieldRef("bio")} style={{ marginBottom: 14 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                BIO
              </div>
              <textarea
                className="form-input"
                style={{ fontSize: 13, width: "100%", minHeight: 72, resize: "vertical", lineHeight: 1.45 }}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value.slice(0, 160))}
                onBlur={() => void commitBio()}
                placeholder="Tell the community about your protocol..."
                maxLength={160}
                rows={3}
                aria-label="Bio"
              />
              <div className="mono" style={{ fontSize: 11, color: "#4a6080", marginTop: 4, textAlign: "right" }}>
                {bioDraft.length}/160
              </div>
            </div>
            <div ref={setFieldRef("experience_level")} style={{ marginBottom: 14 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: "#00d4aa", marginBottom: 8, letterSpacing: "0.08em" }}
              >
                EXPERIENCE LEVEL
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EXPERIENCE_OPTIONS.map((o) => {
                  const sel = String(activeProfile?.experience_level || "").toLowerCase() === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => void pickExperienceLevel(o.id)}
                      style={{
                        fontSize: 13,
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: sel ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
                        background: sel ? "rgba(0,212,170,0.12)" : "transparent",
                        color: sel ? "#00d4aa" : "#6b7c8f",
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="pill" style={tierPillStyle(user.plan)}>
                {user.plan === "entry" ? "Free" : formatPlan(user.plan)}
              </span>
              <span className="pepv-emoji" style={{ fontSize: 13, color: "#dde4ef" }}>
                {streakCount <= 0 ? "🔥 Start your streak!" : `🔥 ${streakCount} day${streakCount === 1 ? "" : "s"} streak`}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div style={SECTION}>My stats</div>
      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <StatTile value={stats?.doseCount ?? "—"} label="Total doses logged" />
          <StatTile value={stats?.peptideDistinct ?? "—"} label="Compounds tracked" />
          <StatTile value={stats?.activeVials ?? "—"} label="Active vials" />
          <StatTile value={stats?.daysTracked ?? "—"} label="Days tracked" />
        </div>
        <div
          data-demo-target={DEMO_TARGET.profile_score}
          {...demoHighlightProps(Boolean(demo?.isHighlighted(DEMO_TARGET.profile_score)))}
        >
          <PepguideIqScoreTile
            stats={stats}
            expanded={iqScoreExpanded}
            onToggle={() => setIqScoreExpanded((v) => !v)}
          />
        </div>
      </Card>

      <div style={SECTION}>Body metrics</div>
      <Card>
        <div
          data-demo-target={DEMO_TARGET.profile_body_metrics}
          {...demoHighlightProps(Boolean(demo?.isHighlighted(DEMO_TARGET.profile_body_metrics)))}
        >
          <div ref={setFieldRef("goal")}>
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
              GOAL
            </div>
            <select
              className="form-input"
              style={{ fontSize: 13, width: "100%", marginBottom: 14, cursor: "pointer" }}
              value={goal}
              onChange={(e) => void saveGoal(e.target.value)}
            >
              <option value="">Select…</option>
              {GOAL_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div ref={setFieldRef("weight")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: "0.08em" }}>
              WEIGHT
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {["lbs", "kg"].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setWeightUnit(u);
                    void (async () => {
                      if (!user?.id || !activeProfileId) return;
                      const { error } = await upsertBodyMetrics(user.id, activeProfileId, { weight_unit: u });
                      if (error) setErr(error.message);
                      else {
                        setErr(null);
                        void refreshBodyMetricsRow();
                      }
                    })();
                  }}
                  style={{
                    fontSize: 13,
                    padding: "4px 10px",
                    borderRadius: 8,
                    border: weightUnit === u ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
                    background: weightUnit === u ? "rgba(0,212,170,0.12)" : "transparent",
                    color: weightUnit === u ? "#00d4aa" : "#6b7c8f",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <ProfileBodyRangeSlider
            min={wMin}
            max={wMax}
            step={wStep}
            value={weightSlider}
            bubble={weightBubble}
            onLive={setWeightSlider}
            onCommit={(v) => void commitWeightDisplay(v)}
          />
          </div>

          <div ref={setFieldRef("height")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: "0.08em" }}>
              HEIGHT
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => toggleHeightUnit("imperial")}
                style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: heightUnit === "imperial" ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
                  background: heightUnit === "imperial" ? "rgba(0,212,170,0.12)" : "transparent",
                  color: heightUnit === "imperial" ? "#00d4aa" : "#6b7c8f",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                FT + IN
              </button>
              <button
                type="button"
                onClick={() => toggleHeightUnit("metric")}
                style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: heightUnit === "metric" ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
                  background: heightUnit === "metric" ? "rgba(0,212,170,0.12)" : "transparent",
                  color: heightUnit === "metric" ? "#00d4aa" : "#6b7c8f",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                CM
              </button>
            </div>
          </div>
          {heightUnit === "imperial" ? (
            <ProfileBodyRangeSlider
              min={48}
              max={96}
              step={1}
              value={Math.round(heightInchesSlider)}
              bubble={heightBubble}
              onLive={(v) => setHeightInchesSlider(v)}
              onCommit={(v) => void commitHeightInches(v)}
            />
          ) : (
            <ProfileBodyRangeSlider
              min={heightMinCm}
              max={heightMaxCm}
              step={1}
              value={heightCmRounded}
              bubble={heightBubble}
              onLive={(cm) => setHeightInchesSlider(cm / 2.54)}
              onCommit={(cm) => void commitHeightInches(cm / 2.54)}
            />
          )}
          </div>

          <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
            BODY FAT % <span style={{ color: "#6b7c8f", fontWeight: 400 }}>(optional)</span>
          </div>
          <ProfileBodyRangeSlider
            min={3}
            max={60}
            step={0.5}
            value={bodyFatSlider}
            bubble={bodyFatBubble}
            onLive={setBodyFatSlider}
            onCommit={(v) => void commitBodyFat(v)}
          />

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e2a38" }}>
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
              BODY COMPOSITION SCAN
            </div>
            <div className="mono" style={{ fontSize: 11, color: "#6b7c8f", lineHeight: 1.45, marginBottom: 10 }}>
              InBody, DEXA, or any body comp scan
              <br />
              — auto-populates metrics (Pro+)
            </div>
            <input
              ref={scanFileRef}
              type="file"
              accept={R2_UPLOAD_ACCEPT_ATTR}
              hidden
              onChange={(e) => void onBodyScanPick(e)}
            />
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, opacity: scanBusy ? 0.75 : 1 }}
              disabled={scanBusy || !activeProfileId}
              onClick={() => {
                if (!canUploadBodyScan) {
                  onOpenUpgrade();
                  return;
                }
                scanFileRef.current?.click();
              }}
            >
              {scanBusy ? "Uploading…" : activeProfile?.body_scan_r2_key ? "Replace scan" : "Upload scan"}
            </button>
          </div>
        </div>
      </Card>

      <div style={SECTION}>Progress photos</div>
      <Card style={{ paddingBottom: 12 }}>
        {canUseProgressPhotos && activeProfileId ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
            <ProfilePrivatePhotoSlot
              label="FRONT"
              kind="progress_front"
              memberProfileId={activeProfileId}
              r2Key={activeProfile?.progress_photo_front_r2_key}
              uploadedAt={activeProfile?.progress_photo_front_at}
              canMutate={canUseProgressPhotos}
              onUpgrade={onOpenUpgrade}
              onUploaded={() => refreshMemberProfiles()}
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
              onUploaded={() => refreshMemberProfiles()}
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
              onUploaded={() => refreshMemberProfiles()}
              workerOk={workerOk}
            />
          </div>
        ) : (
          <>
            <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", lineHeight: 1.5, marginBottom: 12 }}>
              Front, side, and back progress photos — included with Pro and above.
            </div>
            <button type="button" className="btn-teal" style={{ fontSize: 13 }} onClick={onOpenUpgrade}>
              Upgrade to unlock
            </button>
          </>
        )}
      </Card>

      <div style={SECTION}>Labs</div>
      <Card>
        <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", lineHeight: 1.55 }}>
          // Coming soon — upload labs and track biomarkers over time.
        </div>
      </Card>

      <div style={SECTION}>Active stack</div>
      <Card>
        <div ref={setFieldRef("active_stack")}>
          <div className="mono" style={{ fontSize: 11, color: "#00d4aa", marginBottom: 10, letterSpacing: "0.08em" }}>
            ACTIVE STACK
          </div>
          {savedStackPeptides.length === 0 ? (
            <div className="mono" style={{ fontSize: 13, color: "#6b7c8f", lineHeight: 1.5 }}>
              // No active stack saved yet
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
                    background: "rgba(0,212,170,0.08)",
                    border: "1px solid rgba(0,212,170,0.25)",
                    color: "#94a3b8",
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
