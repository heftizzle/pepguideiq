import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal.jsx";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import { formatPlan } from "../lib/tiers.js";
import { calculateStreak } from "../lib/streakUtils.js";
import {
  deleteAccountViaWorker,
  deleteMemberProfileViaWorker,
  fetchBodyMetrics,
  fetchUserProfileStats,
  getCurrentUser,
  getSessionAccessToken,
  listRecentDosedAtDates,
  patchMemberProfileViaWorker,
  sendPasswordResetEmail,
  updateAuthEmail,
  updateUserProfile,
  upsertBodyMetrics,
} from "../lib/supabase.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { getCountriesForProfileForm } from "../data/countries.js";
import { formatLanguageOptionLabel, PROFILE_LANGUAGE_OPTIONS } from "../data/profileLanguages.js";
import { useMemberAvatarSrc } from "../hooks/useMemberAvatarSrc.js";

const SECTION = {
  fontSize: 13,
  color: "#00d4aa",
  letterSpacing: "0.12em",
  marginBottom: 12,
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
};

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

const SESSION_OPTIONS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

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

/** @param {{ doseCount: number, peptideDistinct: number, activeVials: number, daysTracked: number } | null | undefined} stats */
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

/** Single initial: first letter of display name, else email, else "?". */
function avatarInitialLetter(displayName, name, email) {
  const s = String(displayName || name || "").trim();
  if (s) return s[0].toUpperCase();
  const e = String(email || "").trim();
  return e ? e[0].toUpperCase() : "?";
}

function hasProvider(identities, provider) {
  return identities.some((i) => i && typeof i.provider === "string" && i.provider === provider);
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

/**
 * Range slider + bubble label; `--fill-pct` drives teal fill (webkit) / moz progress.
 * @param {{ min: number, max: number, step: number, value: number, bubble: string, onLive: (n: number) => void, onCommit: (n: number) => void }} props
 */
function ProfileBodyRangeSlider({ min, max, step, value, bubble, onLive, onCommit }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="pepv-profile-slider-wrap" style={{ "--fill-pct": `${pct}%` }}>
      <div
        className="pepv-profile-slider-bubble mono"
        style={{ left: `${pct}%` }}
        aria-hidden
      >
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

/** @param {{ user: object, setUser: (u: object | null) => void, onOpenUpgrade: () => void, onSignOut: () => Promise<void> }} props */
export function ProfileTab({ user, setUser, onOpenUpgrade, onSignOut }) {
  const {
    activeProfileId,
    activeProfile,
    memberProfiles,
    memberProfilesVersion,
    refreshMemberProfiles,
    switchProfile,
  } = useActiveProfile();
  const fileRef = useRef(null);
  const workerOk = isApiWorkerConfigured();

  const [displayName, setDisplayName] = useState("");
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
  const [defaultSession, setDefaultSession] = useState(user.defaultSession ?? "morning");
  const [stats, setStats] = useState(null);
  const [iqScoreExpanded, setIqScoreExpanded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [pwdResetSent, setPwdResetSent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [deleteProfileBusy, setDeleteProfileBusy] = useState(false);
  const [renameProfileBusy, setRenameProfileBusy] = useState(false);
  const [avatarImageNonce, setAvatarImageNonce] = useState(0);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [localeCity, setLocaleCity] = useState("");
  const [localeState, setLocaleState] = useState("");
  const [localeCountryCode, setLocaleCountryCode] = useState("");
  const [localeLanguageTag, setLocaleLanguageTag] = useState("en");
  const [countryQuery, setCountryQuery] = useState("");
  const [localeBusy, setLocaleBusy] = useState(false);

  const sortedCountries = useMemo(() => getCountriesForProfileForm(), []);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return sortedCountries;
    return sortedCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [sortedCountries, countryQuery]);

  const memberAvatarSrc = useMemberAvatarSrc(
    user.id,
    activeProfile?.avatar_url,
    avatarImageNonce + memberProfilesVersion,
    workerOk
  );

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    if (u) setUser(u);
  }, [setUser]);

  useEffect(() => {
    setDefaultSession(user.defaultSession ?? "morning");
  }, [user.id, user.defaultSession]);

  useEffect(() => {
    const n = activeProfile && typeof activeProfile.display_name === "string" ? activeProfile.display_name : "";
    setDisplayName(n);
  }, [activeProfile?.id, activeProfile?.display_name]);

  useEffect(() => {
    const p = activeProfile;
    if (!p) return;
    setLocaleCity(typeof p.city === "string" ? p.city : "");
    setLocaleState(typeof p.state === "string" ? p.state : "");
    const co = p.country;
    setLocaleCountryCode(typeof co === "string" && /^[A-Za-z]{2}$/.test(co.trim()) ? co.trim().toUpperCase() : "");
    const lang = p.language;
    setLocaleLanguageTag(
      typeof lang === "string" && PROFILE_LANGUAGE_OPTIONS.some((o) => o.tag === lang) ? lang : "en"
    );
    setCountryQuery("");
  }, [activeProfile?.id, activeProfile?.city, activeProfile?.state, activeProfile?.country, activeProfile?.language]);

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
        return;
      }
      setErr(null);
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
    if (!user?.id || !activeProfileId || !isSupabaseConfigured()) return;
    let ignore = false;
    listRecentDosedAtDates(user.id, activeProfileId).then(({ dates }) => {
      if (!ignore) setStreak(calculateStreak(dates ?? []));
    });
    fetchUserProfileStats(activeProfileId).then((s) => {
      if (!ignore) setStats(s);
    });
    return () => {
      ignore = true;
    };
  }, [user.id, activeProfileId]);

  useEffect(() => {
    setIqScoreExpanded(false);
  }, [user.id]);

  const persistHeightInches = async (totalIn) => {
    if (!user?.id || !activeProfileId) return;
    const v = totalIn != null && Number.isFinite(totalIn) && totalIn > 0 ? totalIn : null;
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, {
      height_in: v != null ? Math.round(clamp(v, 48, 96)) : null,
    });
    if (error) setErr(error.message);
    else setErr(null);
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
    else setErr(null);
  };

  const commitBodyFat = async (pctVal) => {
    if (!user?.id || !activeProfileId) return;
    const v = snapToStep(clamp(pctVal, 3, 60), 3, 0.5);
    if (v <= 3) {
      const { error } = await upsertBodyMetrics(user.id, activeProfileId, { body_fat_pct: null });
      if (error) setErr(error.message);
      else setErr(null);
      return;
    }
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { body_fat_pct: v });
    if (error) setErr(error.message);
    else setErr(null);
  };

  const saveDisplayName = async () => {
    if (!activeProfileId) {
      if (import.meta.env.DEV) console.warn("[ProfileTab] rename skipped: activeProfileId is missing");
      return;
    }
    const v = displayName.trim();
    if (!v) {
      setErr("Display name is required.");
      return;
    }
    if (!workerOk) {
      setErr("Configure VITE_API_WORKER_URL to rename this profile.");
      return;
    }
    if (import.meta.env.DEV) {
      console.log("[ProfileTab] rename: before patchMemberProfileViaWorker", {
        profileId: activeProfileId,
        display_name: v,
      });
    }
    setRenameProfileBusy(true);
    setErr(null);
    try {
      const { error } = await patchMemberProfileViaWorker(activeProfileId, { display_name: v });
      if (import.meta.env.DEV) {
        console.log("[ProfileTab] rename: after patchMemberProfileViaWorker", { error: error?.message ?? null });
      }
      if (error) setErr(error.message);
      else await refreshMemberProfiles();
    } catch (e) {
      if (import.meta.env.DEV) console.error("[ProfileTab] rename: patch threw", e);
      setErr(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setRenameProfileBusy(false);
    }
  };

  const saveLocale = async () => {
    if (!activeProfileId) return;
    if (!workerOk) {
      setErr("Configure VITE_API_WORKER_URL to save locale.");
      return;
    }
    setLocaleBusy(true);
    setErr(null);
    try {
      const { error } = await patchMemberProfileViaWorker(activeProfileId, {
        city: localeCity.trim() || null,
        state: localeState.trim() || null,
        country: localeCountryCode.trim() ? localeCountryCode.trim().toUpperCase() : null,
        language: localeLanguageTag || "en",
      });
      if (error) setErr(error.message);
      else await refreshMemberProfiles();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save locale");
    } finally {
      setLocaleBusy(false);
    }
  };

  const onConfirmDeleteProfile = async () => {
    if (!activeProfileId || activeProfile?.is_default) return;
    const def = memberProfiles.find((p) => p.is_default);
    if (!def?.id) {
      setErr("No default profile to switch to.");
      return;
    }
    if (!workerOk) {
      setErr("Configure VITE_API_WORKER_URL to delete a profile.");
      return;
    }
    setDeleteProfileBusy(true);
    setErr(null);
    const { error } = await deleteMemberProfileViaWorker(activeProfileId);
    setDeleteProfileBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setShowDeleteProfile(false);
    switchProfile(def.id);
  };

  const saveGoal = async (g) => {
    if (!user?.id || !activeProfileId) return;
    setGoal(g);
    const { error } = await upsertBodyMetrics(user.id, activeProfileId, { goal: g || null });
    if (error) setErr(error.message);
    else setErr(null);
  };

  const saveDefaultSession = async (sid) => {
    setDefaultSession(sid);
    const { error } = await updateUserProfile({ default_session: sid });
    if (error) setErr(error.message);
    else {
      setErr(null);
      await refreshUser();
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
    setAvatarBusy(true);
    setErr(null);
    try {
      const token = await getSessionAccessToken();
      if (!token) throw new Error("Not signed in");
      if (!activeProfileId) throw new Error("No active profile");
      const fd = new FormData();
      fd.append("kind", "avatar");
      fd.append("member_profile_id", activeProfileId);
      fd.append("file", file);
      const res = await fetch(`${API_WORKER_URL}/stack-photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Upload failed");
      }
      await refreshMemberProfiles();
      setAvatarImageNonce((n) => n + 1);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Upload failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  const onChangeEmail = async () => {
    const em = newEmail.trim();
    if (!em) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { error } = await updateAuthEmail(em);
    setBusy(false);
    if (error) setErr(error.message);
    else {
      setMsg("Check your new inbox to confirm the email change.");
      setNewEmail("");
      await refreshUser();
    }
  };

  const onSendPasswordReset = async () => {
    setBusy(true);
    setErr(null);
    setPwdResetSent(false);
    const { error } = await sendPasswordResetEmail(user.email);
    setBusy(false);
    if (error) setErr(error.message);
    else setPwdResetSent(true);
  };

  const onConfirmDelete = async () => {
    setDeleteBusy(true);
    setErr(null);
    const { error } = await deleteAccountViaWorker();
    setDeleteBusy(false);
    if (error) {
      setErr(error.message);
      setShowDelete(false);
      return;
    }
    setShowDelete(false);
    await onSignOut();
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
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
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

      <div style={SECTION}>User</div>
      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              width: 88,
              height: 88,
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
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#00d4aa",
                  fontFamily: "'Outfit', sans-serif",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {avatarInitialLetter(displayName, "", "")}
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void onAvatarPick(e)} />
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
              DISPLAY NAME
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#dde4ef", marginBottom: 12, lineHeight: 1.35 }}>
              {displayName.trim() || "—"}
            </div>
            <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 6, letterSpacing: "0.08em" }}>
              EMAIL
            </div>
            <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 12 }}>{user.email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="pill" style={tierPillStyle(user.plan)}>
                {user.plan === "entry" ? "Free" : formatPlan(user.plan)}
              </span>
              <span style={{ fontSize: 13, color: "#dde4ef" }}>
                🔥 {streak} day{streak === 1 ? "" : "s"} streak
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
        <PepguideIqScoreTile
          stats={stats}
          expanded={iqScoreExpanded}
          onToggle={() => setIqScoreExpanded((v) => !v)}
        />
      </Card>

      <div style={SECTION}>Body metrics</div>
      <Card>
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
                    else setErr(null);
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
      </Card>

      <div style={SECTION}>Settings</div>
      <Card>
        <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginBottom: 10, letterSpacing: "0.08em" }}>
          DEFAULT SESSION
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SESSION_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void saveDefaultSession(s.id)}
              style={{
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 12,
                border:
                  defaultSession === s.id ? "1px solid rgba(0,212,170,0.55)" : "1px solid #243040",
                background: defaultSession === s.id ? "rgba(0,212,170,0.14)" : "rgba(255,255,255,0.03)",
                color: defaultSession === s.id ? "#00d4aa" : "#8fa5bf",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 0",
            borderTop: "1px solid #14202e",
          }}
        >
          <span style={{ fontSize: 13, color: "#dde4ef" }}>Push notifications</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              COMING SOON
            </span>
            <button
              type="button"
              disabled
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                border: "1px solid #243040",
                background: "#1a1f28",
                opacity: 0.5,
                cursor: "not-allowed",
              }}
              aria-label="Push notifications unavailable"
            />
          </div>
        </div>

        {user.plan !== "goat" && (
          <button type="button" className="btn-teal" style={{ fontSize: 13, marginTop: 12, width: "100%" }} onClick={onOpenUpgrade}>
            Upgrade plan
          </button>
        )}
      </Card>

      <div style={SECTION}>Account & membership</div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Current plan</div>
            <span className="pill" style={tierPillStyle(user.plan)}>
              {user.plan === "entry" ? "Free" : formatPlan(user.plan)}
            </span>
          </div>
          <button
            type="button"
            className="btn-teal"
            style={{ fontSize: 13 }}
            onClick={() => console.log("[Manage Billing] Stripe customer portal — coming post-launch")}
          >
            Manage Billing
          </button>
        </div>

        <div
          className="mono"
          style={{ fontSize: 13, color: "#00d4aa", marginTop: 20, marginBottom: 10, letterSpacing: "0.08em" }}
        >
          CONNECTED ACCOUNTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "google", label: "Google" },
            { id: "apple", label: "Apple" },
          ].map(({ id, label }) => {
            const on = hasProvider(user.identities, id);
            return (
              <div
                key={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #243040",
                  background: "#07090e",
                }}
              >
                <span style={{ fontSize: 13, color: "#dde4ef" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 6,
                      color: on ? "#00d4aa" : "#6b7c8f",
                      border: `1px solid ${on ? "rgba(0,212,170,0.35)" : "#243040"}`,
                    }}
                  >
                    {on ? "Connected" : "Disconnected"}
                  </span>
                  <button
                    type="button"
                    className="btn-teal"
                    style={{ fontSize: 13, padding: "4px 10px", opacity: 0.45 }}
                    disabled
                  >
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mono"
          style={{ fontSize: 13, color: "#00d4aa", marginTop: 20, marginBottom: 10, letterSpacing: "0.08em" }}
        >
          PROFILE MANAGEMENT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Profile display name</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="form-input"
                style={{ fontSize: 13, flex: "1 1 200px", minWidth: 0 }}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={renameProfileBusy}
              />
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13 }}
                disabled={renameProfileBusy || !workerOk}
                onClick={() => void saveDisplayName()}
              >
                {renameProfileBusy ? "…" : "Rename Profile"}
              </button>
            </div>
          </div>

          <div
            className="mono"
            style={{ fontSize: 12, color: "#6b7c8f", marginTop: 16, marginBottom: 8, letterSpacing: "0.06em" }}
          >
            Locale (stored on this profile)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>City</div>
              <input
                className="form-input"
                style={{ fontSize: 13, width: "100%", maxWidth: 420, boxSizing: "border-box" }}
                value={localeCity}
                onChange={(e) => setLocaleCity(e.target.value)}
                disabled={localeBusy}
                placeholder="City"
                autoComplete="address-level2"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>State / region</div>
              <input
                className="form-input"
                style={{ fontSize: 13, width: "100%", maxWidth: 420, boxSizing: "border-box" }}
                value={localeState}
                onChange={(e) => setLocaleState(e.target.value)}
                disabled={localeBusy}
                placeholder="State or region"
                autoComplete="address-level1"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Country (ISO alpha-2)</div>
              <input
                className="form-input"
                style={{ fontSize: 13, width: "100%", maxWidth: 420, boxSizing: "border-box", marginBottom: 8 }}
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                disabled={localeBusy}
                placeholder="Filter by name or code (e.g. US)…"
              />
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  borderRadius: 10,
                  border: "1px solid #243040",
                  background: "#07090e",
                }}
              >
                {filteredCountries.length === 0 ? (
                  <div className="mono" style={{ fontSize: 12, color: "#6b7c8f", padding: "10px 12px" }}>
                    No matches
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const sel = c.code === localeCountryCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setLocaleCountryCode(c.code);
                          setCountryQuery("");
                        }}
                        disabled={localeBusy}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          fontSize: 13,
                          padding: "8px 12px",
                          border: "none",
                          borderBottom: "1px solid #1a2430",
                          background: sel ? "rgba(0,212,170,0.1)" : "transparent",
                          color: sel ? "#00d4aa" : "#dde4ef",
                          cursor: localeBusy ? "default" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {c.name} ({c.code})
                      </button>
                    );
                  })
                )}
              </div>
              {localeCountryCode ? (
                <div className="mono" style={{ fontSize: 12, color: "#6b7c8f", marginTop: 6 }}>
                  Selected: {localeCountryCode}
                  <button
                    type="button"
                    onClick={() => setLocaleCountryCode("")}
                    disabled={localeBusy}
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      color: "#8fa5bf",
                      background: "none",
                      border: "none",
                      cursor: localeBusy ? "default" : "pointer",
                      textDecoration: "underline",
                      padding: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Language preference</div>
              <select
                className="form-input"
                style={{ fontSize: 13, width: "100%", maxWidth: 420, boxSizing: "border-box" }}
                value={localeLanguageTag}
                onChange={(e) => setLocaleLanguageTag(e.target.value)}
                disabled={localeBusy}
              >
                {PROFILE_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.tag} value={o.tag}>
                    {formatLanguageOptionLabel(o)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, alignSelf: "flex-start" }}
              disabled={localeBusy || !workerOk}
              onClick={() => void saveLocale()}
            >
              {localeBusy ? "…" : "Save locale"}
            </button>
          </div>

          {!activeProfile?.is_default && (
            <button
              type="button"
              style={{
                fontSize: 13,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(249, 115, 22, 0.55)",
                background: "rgba(249, 115, 22, 0.12)",
                color: "#fb923c",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                alignSelf: "flex-start",
              }}
              onClick={() => setShowDeleteProfile(true)}
            >
              Delete Profile
            </button>
          )}
        </div>

        <div
          className="mono"
          style={{ fontSize: 13, color: "#00d4aa", marginTop: 20, marginBottom: 10, letterSpacing: "0.08em" }}
        >
          ACCOUNT MANAGEMENT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Change email</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="form-input"
                type="email"
                style={{ fontSize: 13, flex: "1 1 180px", minWidth: 0 }}
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button type="button" className="btn-teal" style={{ fontSize: 13 }} disabled={busy} onClick={() => void onChangeEmail()}>
                Update email
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#8fa5bf", marginBottom: 6 }}>Change password</div>
            <button type="button" className="btn-teal" style={{ fontSize: 13 }} disabled={busy} onClick={() => void onSendPasswordReset()}>
              Send password reset email
            </button>
            {pwdResetSent && (
              <div className="mono" style={{ fontSize: 13, color: "#00d4aa", marginTop: 8 }}>
                If an account exists, a reset link was sent to {user.email}.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ ...SECTION, color: "#f87171" }}>Danger zone</div>
      <Card
        style={{
          border: "1px solid rgba(248, 113, 113, 0.45)",
          background: "rgba(127, 29, 29, 0.14)",
        }}
      >
        <button type="button" className="btn-red" style={{ fontSize: 13, width: "100%" }} onClick={() => setShowDelete(true)}>
          Delete Account
        </button>
      </Card>

      {showDeleteProfile && (
        <Modal onClose={() => setShowDeleteProfile(false)} maxWidth={420} label="Delete profile">
          <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55, marginBottom: 20 }}>
            Delete <strong style={{ color: "#dde4ef" }}>{activeProfile?.display_name ?? "this profile"}</strong>? This
            removes its stack, vials, dose logs, and body metrics tied to this profile. Your account and other profiles
            stay intact.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, flex: "1 1 120px" }}
              disabled={deleteProfileBusy}
              onClick={() => setShowDeleteProfile(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-red"
              style={{ fontSize: 13, flex: "1 1 120px" }}
              disabled={deleteProfileBusy}
              onClick={() => void onConfirmDeleteProfile()}
            >
              {deleteProfileBusy ? "…" : "Delete profile"}
            </button>
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal onClose={() => setShowDelete(false)} maxWidth={420} label="Delete account">
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 12px", color: "#fde68a", lineHeight: 1.35 }}>
            Sad to see you go, but love to watch ya leave. 🙂
          </h2>
          <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55, marginBottom: 20, whiteSpace: "pre-line" }}>
            {`This permanently deletes your account, stack, vials, and dose history. There is no undo.

Just kidding about the notarized, certified USPS letter via Pony Express. We're not like your gym.`}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" className="btn-teal" style={{ fontSize: 13, flex: "1 1 120px" }} onClick={() => setShowDelete(false)}>
              Never mind
            </button>
            <button
              type="button"
              className="btn-red"
              style={{ fontSize: 13, flex: "1 1 120px" }}
              disabled={deleteBusy}
              onClick={() => void onConfirmDelete()}
            >
              {deleteBusy ? "…" : "Yes, delete everything"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
