import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isApiWorkerConfigured } from "../lib/config.js";
import { uploadImageToR2, R2_UPLOAD_ALLOWED_TYPES, R2_UPLOAD_MAX_BYTES } from "../lib/r2Upload.js";
import { patchMemberProfileViaWorker, updateMemberProfile } from "../lib/supabase.js";
import { resolveMemberAvatarDisplayUrlFromKey } from "../lib/memberAvatarUrl.js";

/** Worker `MEMBER_EXPERIENCE_LEVELS` — UI label "Researcher" maps to `elite` (API has no separate researcher value). */
const EXPERIENCE_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "Researcher", value: "elite" },
];

/** Single primary goal → `member_profiles.goals` string; Muscle aligns with catalog GOALS. */
const PRIMARY_GOAL_PILLS = [
  { label: "Fat Loss", stored: "Fat Loss" },
  { label: "Muscle", stored: "Muscle Building" },
  { label: "Recovery", stored: "Recovery" },
  { label: "Longevity", stored: "Longevity" },
  { label: "Performance", stored: "Performance" },
];

const touchMin = { minHeight: 44, minWidth: 44 };

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onSkip — no network writes; parent sets session + navigates
 * @param {() => void | Promise<void>} props.onComplete — after successful PATCH (or empty save); parent closes flow + tab + toast
 * @param {Record<string, unknown> | null} props.activeProfile
 * @param {string | null} props.activeProfileId
 * @param {(profileId: string, patch: Record<string, unknown>) => void} props.patchMemberProfileLocal
 * @param {() => Promise<void>} props.refreshMemberProfiles
 */
export function PostTutorialProfileModal({
  open,
  onSkip,
  onComplete,
  activeProfile,
  activeProfileId,
  patchMemberProfileLocal,
  refreshMemberProfiles,
}) {
  const idPrefix = useId();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(/** @type {string} */ (""));
  const [primaryGoalStored, setPrimaryGoalStored] = useState(/** @type {string | null} */ (null));
  const [avatarBusy, setAvatarBusy] = useState(false);
  /** R2 key after optional upload in this modal (also optimistic on profile). */
  const [sessionAvatarKey, setSessionAvatarKey] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !activeProfile) return;
    setErr("");
    setDisplayName(typeof activeProfile.display_name === "string" ? activeProfile.display_name : "");
    setBio(typeof activeProfile.bio === "string" ? activeProfile.bio : "");
    setExperienceLevel(
      typeof activeProfile.experience_level === "string" ? activeProfile.experience_level : ""
    );
    const g = typeof activeProfile.goals === "string" ? activeProfile.goals.trim() : "";
    const first = g.split(",")[0]?.trim() ?? "";
    setPrimaryGoalStored(first || null);
    setSessionAvatarKey(null);
  }, [open, activeProfile]);

  const workerOk = isApiWorkerConfigured();

  const onAvatarPick = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeProfileId) return;
      if (!workerOk) {
        setErr("Configure VITE_API_WORKER_URL to upload a photo.");
        return;
      }
      if (avatarBusy) return;
      if (!R2_UPLOAD_ALLOWED_TYPES.has(file.type) || file.size > R2_UPLOAD_MAX_BYTES) {
        setErr("JPEG/PNG/WebP/GIF, max 10MB");
        return;
      }
      setAvatarBusy(true);
      setErr("");
      const result = await uploadImageToR2({
        path: "/avatars",
        file,
        fields: { kind: "avatar", member_profile_id: activeProfileId },
      });
      setAvatarBusy(false);
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      const key = typeof result.key === "string" ? result.key.trim() : "";
      if (key) {
        setSessionAvatarKey(key);
        patchMemberProfileLocal(activeProfileId, { avatar_r2_key: key });
        void refreshMemberProfiles();
      }
    },
    [activeProfileId, avatarBusy, patchMemberProfileLocal, refreshMemberProfiles, workerOk]
  );

  const handleSave = async () => {
    if (!activeProfileId || busy) return;
    setBusy(true);
    setErr("");
    const patch = /** @type {Record<string, unknown>} */ ({});
    const dn = displayName.trim();
    const prevName =
      typeof activeProfile?.display_name === "string" ? activeProfile.display_name.trim() : "";
    if (dn && dn !== prevName) patch.display_name = dn;
    const b = bio.trim().slice(0, 500);
    const prevBio = typeof activeProfile?.bio === "string" ? activeProfile.bio.trim() : "";
    if (b !== prevBio) patch.bio = b || null;
    if (experienceLevel) {
      const prevEl =
        typeof activeProfile?.experience_level === "string" ? activeProfile.experience_level : "";
      if (experienceLevel !== prevEl) patch.experience_level = experienceLevel;
    }
    if (primaryGoalStored) {
      const prevG = typeof activeProfile?.goals === "string" ? activeProfile.goals.trim() : "";
      if (primaryGoalStored !== prevG) patch.goals = primaryGoalStored;
    }
    if (sessionAvatarKey) {
      const prevKey =
        typeof activeProfile?.avatar_r2_key === "string" ? activeProfile.avatar_r2_key.trim() : "";
      if (sessionAvatarKey !== prevKey) patch.avatar_r2_key = sessionAvatarKey;
    }

    if (Object.keys(patch).length === 0) {
      setBusy(false);
      await Promise.resolve(onComplete?.());
      return;
    }

    const res = workerOk
      ? await patchMemberProfileViaWorker(activeProfileId, patch)
      : await updateMemberProfile(activeProfileId, patch);
    if (res.error) {
      setErr(res.error.message ?? "Could not save profile.");
      setBusy(false);
      return;
    }
    patchMemberProfileLocal(activeProfileId, patch);
    void refreshMemberProfiles();
    setBusy(false);
    await Promise.resolve(onComplete?.());
  };

  if (!open) return null;

  const avatarKey =
    sessionAvatarKey ||
    (typeof activeProfile?.avatar_r2_key === "string" ? activeProfile.avatar_r2_key.trim() : "") ||
    "";

  // FIX: build a displayable URL from the key so the button renders the actual image.
  // Previously only showed "Photo added ✓" text — image never appeared until re-login.
  const avatarSrc = avatarKey ? resolveMemberAvatarDisplayUrlFromKey(avatarKey) : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${idPrefix}-title`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--color-bg-page)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <h1
          id={`${idPrefix}-title`}
          className="brand"
          style={{
            margin: "0 0 8px 0",
            fontSize: "clamp(22px, 5vw, 28px)",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Complete your profile
        </h1>
        <p className="mono" style={{ margin: "0 0 24px 0", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Help the community recognize you — you can change this anytime in Profile.
        </p>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={(e) => void onAvatarPick(e)} />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy || !workerOk}
            style={{
              ...touchMin,
              width: 112,
              height: 112,
              borderRadius: "50%",
              border: avatarSrc
                ? "2px solid var(--color-accent)"
                : "2px dashed var(--color-border-default)",
              background: "var(--color-bg-sunken)",
              cursor: workerOk && !avatarBusy ? "pointer" : "not-allowed",
              padding: 0,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "var(--color-accent)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {avatarBusy ? (
              "…"
            ) : avatarSrc ? (
              // FIX: was <span>Photo added ✓</span> — no image ever rendered.
              // Now shows the actual uploaded photo immediately after upload.
              <img
                src={avatarSrc}
                alt="Your avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  display: "block",
                }}
              />
            ) : (
              "Tap to add photo"
            )}
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 6, letterSpacing: ".12em" }}>
            DISPLAY NAME
          </div>
          <input
            className="form-input"
            style={{ width: "100%", boxSizing: "border-box", ...touchMin }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoComplete="nickname"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 6, letterSpacing: ".12em" }}>
            BIO
          </div>
          <textarea
            className="form-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              minHeight: 88,
              resize: "vertical",
              fontFamily: "'Outfit', sans-serif",
            }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community about your research"
            maxLength={500}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor={`${idPrefix}-exp`} className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 6, letterSpacing: ".12em", display: "block" }}>
            EXPERIENCE LEVEL
          </label>
          <select
            id={`${idPrefix}-exp`}
            className="form-input"
            style={{ width: "100%", boxSizing: "border-box", ...touchMin }}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            <option value="">Select…</option>
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginBottom: 8, letterSpacing: ".12em" }}>
            PRIMARY GOAL
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRIMARY_GOAL_PILLS.map((p) => {
              const on = primaryGoalStored === p.stored;
              return (
                <button
                  key={p.stored}
                  type="button"
                  onClick={() => setPrimaryGoalStored((prev) => (prev === p.stored ? null : p.stored))}
                  style={{
                    ...touchMin,
                    padding: "0 14px",
                    borderRadius: 999,
                    border: on ? "1px solid var(--color-accent)" : "1px solid var(--color-border-default)",
                    background: on ? "var(--color-accent-subtle-10)" : "var(--color-bg-sunken)",
                    color: on ? "var(--color-accent)" : "var(--color-text-secondary)",
                    fontSize: 13,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {err ? (
          <div className="mono" style={{ fontSize: 13, color: "var(--color-danger)", marginBottom: 12 }}>
            {err}
          </div>
        ) : null}

        <button
          type="button"
          className="btn-teal"
          disabled={busy}
          onClick={() => void handleSave()}
          style={{ width: "100%", ...touchMin, fontSize: 15, fontWeight: 700, marginBottom: 16 }}
        >
          {busy ? "…" : "Save & Build My Stack →"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          style={{
            ...touchMin,
            width: "100%",
            marginTop: "auto",
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            fontSize: 14,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
