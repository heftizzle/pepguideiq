import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal.jsx";
import { API_WORKER_URL, isApiWorkerConfigured, isSupabaseConfigured } from "../lib/config.js";
import {
  cancelStripeSubscriptionAtPeriodEnd,
  createStripePortalSession,
  fetchStripeSubscription,
  reactivateStripeSubscription,
} from "../lib/stripeSubscription.js";
import { formatPlan, getTier, TIERS, TIER_RANK } from "../lib/tiers.js";
import {
  deleteAccountViaWorker,
  deleteMemberProfileViaWorker,
  getCurrentUser,
  checkMemberProfileHandleAvailable,
  patchMemberProfileViaWorker,
  resetMemberProfileDemoSessions,
  sendPasswordResetEmail,
  updateAuthEmail,
  updateMemberProfile,
  updateUserProfile,
} from "../lib/supabase.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";
import { getCountriesForProfileForm } from "../data/countries.js";
import { formatLanguageOptionLabel, PROFILE_LANGUAGE_OPTIONS } from "../data/profileLanguages.js";
import { getProtocolSessionsOrdered } from "../data/protocolSessions.js";
import {
  formatHandleDisplay,
  isValidMemberHandleFormat,
  normalizeHandleInput,
  stripHandleAtPrefix,
} from "../lib/memberProfileHandle.js";
import {
  formatMemberProfileLocation,
  formatShiftScheduleLabel,
  formatWakeTimeLabel,
} from "../lib/memberProfileMeta.js";
import { wakeTimeFromInputToApi, wakeTimeToInputValue } from "../lib/sessionSchedule.js";

const SECTION = {
  fontSize: 13,
  color: "var(--color-accent)",
  letterSpacing: "0.12em",
  marginBottom: 12,
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
};

function formatSubscriptionPeriodEndDisplay(unixSec) {
  const n = typeof unixSec === "number" ? unixSec : Number(unixSec);
  if (!Number.isFinite(n) || n <= 0) return "—";
  try {
    return new Date(n * 1000).toLocaleDateString(undefined, { dateStyle: "long" });
  } catch {
    return "—";
  }
}

const SHIFT_SCHEDULE_OPTIONS = [
  { id: "days", label: "Days" },
  { id: "swings", label: "Swings" },
  { id: "mids", label: "Mids" },
  { id: "nights", label: "Nights" },
  { id: "rotating", label: "Rotating" },
];

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
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-tab)",
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

function hasProvider(identities, provider) {
  return identities.some((i) => i && typeof i.provider === "string" && i.provider === provider);
}

/** @param {{ user: object, setUser: (u: object | null) => void, onOpenUpgrade: () => void, onSignOut: () => Promise<void>, onBack: () => void }} props */
export function SettingsTab({ user, setUser, onOpenUpgrade, onSignOut, onBack }) {
  const scheduleUnlocked = Boolean(getTier(user?.plan ?? "entry").shift_schedule);
  const {
    activeProfileId,
    activeProfile,
    memberProfiles,
    refreshMemberProfiles,
    switchProfile,
  } = useActiveProfile();
  const tutorial = useTutorialOptional();
  const workerOk = isApiWorkerConfigured();

  const [displayName, setDisplayName] = useState("");
  const [defaultSession, setDefaultSession] = useState(user.defaultSession ?? "morning");
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pwdResetSent, setPwdResetSent] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  /** Inline error inside delete-account modal only (global `err` is not used for this flow). */
  const [deleteAccountErr, setDeleteAccountErr] = useState(/** @type {string | null} */ (null));
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [deleteProfileBusy, setDeleteProfileBusy] = useState(false);
  const [demoResetBusy, setDemoResetBusy] = useState(false);
  const [renameProfileBusy, setRenameProfileBusy] = useState(false);
  const [localeCity, setLocaleCity] = useState("");
  const [localeState, setLocaleState] = useState("");
  const [localeCountryCode, setLocaleCountryCode] = useState("");
  const [localeLanguageTag, setLocaleLanguageTag] = useState("en");
  const [countryQuery, setCountryQuery] = useState("");
  const [localeBusy, setLocaleBusy] = useState(false);
  const [scheduleShift, setScheduleShift] = useState("days");
  const [wakeTimeInput, setWakeTimeInput] = useState("");
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [handleInput, setHandleInput] = useState("");
  /** @type {"idle" | "checking" | "available" | "taken" | "invalid" | "short"} */
  const [handleAvailability, setHandleAvailability] = useState("idle");
  const [handleSaveBusy, setHandleSaveBusy] = useState(false);
  const [handleSaveInlineErr, setHandleSaveInlineErr] = useState(/** @type {string | null} */ (null));
  const [handleSaveSuccess, setHandleSaveSuccess] = useState(false);
  const handleSaveSuccessTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalErr, setPortalErr] = useState(/** @type {string | null} */ (null));

  /** @type {import("../lib/stripeSubscription.js").StripeSubscriptionInfo | null} */
  const [stripeSub, setStripeSub] = useState(null);
  const [stripeSubLoading, setStripeSubLoading] = useState(false);
  const [stripeSubErr, setStripeSubErr] = useState(/** @type {string | null} */ (null));

  const [showCancelSubModal, setShowCancelSubModal] = useState(false);
  /** @type {"confirm" | "success"} */
  const [cancelSubPhase, setCancelSubPhase] = useState("confirm");
  const [cancelSubBusy, setCancelSubBusy] = useState(false);
  const [cancelSubModalErr, setCancelSubModalErr] = useState(/** @type {string | null} */ (null));

  const isPaidSubscriber = useMemo(() => TIER_RANK[user?.plan ?? "entry"] >= TIER_RANK.pro, [user?.plan]);

  const sortedCountries = useMemo(() => getCountriesForProfileForm(), []);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return sortedCountries;
    return sortedCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [sortedCountries, countryQuery]);

  const handleNormalized = useMemo(() => normalizeHandleInput(handleInput), [handleInput]);
  const localeSummary = useMemo(
    () => formatMemberProfileLocation({ city: localeCity, state: localeState, country: localeCountryCode }),
    [localeCity, localeState, localeCountryCode]
  );
  const scheduleSummary = useMemo(() => {
    const shift = formatShiftScheduleLabel(scheduleShift);
    const wake = formatWakeTimeLabel(wakeTimeFromInputToApi(wakeTimeInput));
    return [shift, wake ? `Wake ${wake}` : ""].filter(Boolean).join(" · ");
  }, [scheduleShift, wakeTimeInput]);
  const handleSaveDisabled = useMemo(() => {
    const norm = normalizeHandleInput(handleInput);
    const raw = stripHandleAtPrefix(handleInput);
    const stored = typeof activeProfile?.handle === "string" ? activeProfile.handle : "";
    const prevDisp =
      typeof activeProfile?.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : stored;
    const unchanged = norm === stored && stripHandleAtPrefix(raw) === stripHandleAtPrefix(prevDisp);
    if (handleSaveBusy || !isSupabaseConfigured()) return true;
    if (unchanged) return false;
    if (norm && norm !== stored && handleAvailability !== "available") return true;
    if (norm && !isValidMemberHandleFormat(handleInput)) return true;
    return false;
  }, [
    handleInput,
    activeProfile?.handle,
    activeProfile?.display_handle,
    handleSaveBusy,
    handleAvailability,
  ]);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    if (u) setUser(u);
  }, [setUser]);

  useEffect(() => {
    if (!workerOk || !isPaidSubscriber) {
      setStripeSub(null);
      setStripeSubErr(null);
      setStripeSubLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setStripeSubLoading(true);
      setStripeSubErr(null);
      const { data, error } = await fetchStripeSubscription();
      if (cancelled) return;
      setStripeSubLoading(false);
      if (error) {
        setStripeSubErr(error.message);
        setStripeSub(null);
      } else {
        setStripeSub(data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workerOk, isPaidSubscriber, user.id]);

  const openCancelSubModal = useCallback(() => {
    setCancelSubModalErr(null);
    setCancelSubPhase("confirm");
    setShowCancelSubModal(true);
    void (async () => {
      const { data, error } = await fetchStripeSubscription();
      if (error) setCancelSubModalErr(error.message);
      else if (data) setStripeSub(data);
    })();
  }, []);

  const closeCancelSubModal = useCallback(() => {
    if (cancelSubBusy) return;
    setShowCancelSubModal(false);
    setCancelSubPhase("confirm");
    setCancelSubModalErr(null);
  }, [cancelSubBusy]);

  const onConfirmCancelSubscription = useCallback(async () => {
    setCancelSubModalErr(null);
    setCancelSubBusy(true);
    const result = await cancelStripeSubscriptionAtPeriodEnd();
    setCancelSubBusy(false);
    if (!result.ok || result.error) {
      setCancelSubModalErr(result.error?.message ?? "Could not cancel subscription.");
      return;
    }
    const periodEnd = result.current_period_end ?? stripeSub?.current_period_end ?? 0;
    const planKey =
      result.plan && ["pro", "elite", "goat"].includes(result.plan) ? result.plan : user.plan ?? "pro";
    setStripeSub((prev) =>
      prev
        ? {
            ...prev,
            cancel_at_period_end: true,
            current_period_end: periodEnd || prev.current_period_end,
            plan: planKey,
          }
        : {
            current_period_end: periodEnd,
            cancel_at_period_end: true,
            status: "active",
            plan: planKey,
            pending_plan: null,
          }
    );
    setCancelSubPhase("success");
  }, [stripeSub?.current_period_end, user.plan]);

  const onReactivateSubscription = useCallback(async () => {
    setMsg(null);
    setErr(null);
    setCancelSubBusy(true);
    const result = await reactivateStripeSubscription();
    setCancelSubBusy(false);
    if (!result.ok || result.error) {
      setErr(result.error?.message ?? "Could not reactivate subscription.");
      return;
    }
    setStripeSub((prev) => (prev ? { ...prev, cancel_at_period_end: false } : prev));
    setMsg("Subscription reactivated — billing continues at the next renewal.");
  }, []);

  const openBillingPortal = useCallback(async () => {
    setPortalErr(null);
    if (!workerOk) return;
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : "https://pepguideiq.com/";
    setPortalBusy(true);
    const { url, error } = await createStripePortalSession(returnUrl);
    setPortalBusy(false);
    if (error) {
      setPortalErr(error.message);
      return;
    }
    if (url) window.location.assign(url);
  }, [workerOk]);

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
    const p = activeProfile;
    if (!p) return;
    const sh = p.shift_schedule;
    const ok = typeof sh === "string" && SHIFT_SCHEDULE_OPTIONS.some((o) => o.id === sh);
    setScheduleShift(ok ? sh : "days");
    setWakeTimeInput(wakeTimeToInputValue(p.wake_time));
  }, [activeProfile?.id, activeProfile?.shift_schedule, activeProfile?.wake_time]);

  useEffect(() => {
    const p = activeProfile;
    if (!p) return;
    const h =
      typeof p.display_handle === "string" && p.display_handle.trim()
        ? p.display_handle.trim()
        : typeof p.handle === "string"
          ? p.handle
          : "";
    setHandleInput(h);
    setHandleAvailability("idle");
    setHandleSaveInlineErr(null);
    setHandleSaveSuccess(false);
    if (handleSaveSuccessTimerRef.current) {
      clearTimeout(handleSaveSuccessTimerRef.current);
      handleSaveSuccessTimerRef.current = null;
    }
  }, [activeProfile?.id, activeProfile?.handle, activeProfile?.display_handle]);

  useEffect(() => {
    return () => {
      if (handleSaveSuccessTimerRef.current) clearTimeout(handleSaveSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    const reset = async () => {
      if (!activeProfileId) return { ok: false, error: "No active profile" };
      const { error } = await resetMemberProfileDemoSessions(activeProfileId);
      if (error) return { ok: false, error: error.message ?? String(error) };
      await refreshMemberProfiles();
      return { ok: true };
    };
    const prev = typeof window.pepguideIQ === "object" && window.pepguideIQ != null ? window.pepguideIQ : {};
    window.pepguideIQ = { ...prev, resetDemoSessions: reset };
    return () => {
      const cur = window.pepguideIQ;
      if (cur && cur.resetDemoSessions === reset) {
        const { resetDemoSessions: _drop, ...rest } = cur;
        window.pepguideIQ = Object.keys(rest).length ? rest : undefined;
      }
    };
  }, [activeProfileId, refreshMemberProfiles]);

  const onResetDemoSessions = async () => {
    if (!activeProfileId || demoResetBusy) return;
    if (!isSupabaseConfigured()) {
      setErr("Configure Supabase to reset the demo counter.");
      return;
    }
    setDemoResetBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const { error } = await resetMemberProfileDemoSessions(activeProfileId);
      if (error) {
        setErr(error.message ?? "Could not reset demo counter");
        return;
      }
      await refreshMemberProfiles();
      setMsg("Demo session counter reset to 0.");
    } finally {
      setDemoResetBusy(false);
    }
  };

  const saveDisplayName = async () => {
    if (!activeProfileId) {
      if (import.meta.env.DEV) console.warn("[SettingsTab] rename skipped: activeProfileId is missing");
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
    setRenameProfileBusy(true);
    setErr(null);
    try {
      const { error } = await patchMemberProfileViaWorker(activeProfileId, { display_name: v });
      if (error) setErr(error.message);
      else await refreshMemberProfiles();
    } catch (e) {
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
      else {
        await refreshMemberProfiles();
        setMsg("Locale saved.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save locale");
    } finally {
      setLocaleBusy(false);
    }
  };

  const saveSchedule = async () => {
    if (!activeProfileId) return;
    if (!workerOk) {
      setErr("Configure VITE_API_WORKER_URL to save schedule.");
      return;
    }
    const wt = wakeTimeFromInputToApi(wakeTimeInput);
    if (String(wakeTimeInput ?? "").trim() && !wt) {
      setErr("Enter a valid wake time, or clear the field.");
      return;
    }
    setScheduleBusy(true);
    setErr(null);
    try {
      const { error } = await patchMemberProfileViaWorker(activeProfileId, {
        shift_schedule: scheduleShift,
        wake_time: wt,
      });
      if (error) setErr(error.message);
      else {
        await refreshMemberProfiles();
        setMsg("Schedule saved.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save schedule");
    } finally {
      setScheduleBusy(false);
    }
  };

  const onHandleInputChange = (e) => {
    const v = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32);
    setHandleInput(v);
    setHandleAvailability("idle");
    setHandleSaveInlineErr(null);
    setHandleSaveSuccess(false);
    if (handleSaveSuccessTimerRef.current) {
      clearTimeout(handleSaveSuccessTimerRef.current);
      handleSaveSuccessTimerRef.current = null;
    }
  };

  const onHandleBlur = async () => {
    const raw = stripHandleAtPrefix(handleInput);
    setHandleInput(raw);
    setHandleSaveInlineErr(null);
    if (!raw) {
      setHandleAvailability("idle");
      return;
    }
    if (raw.length < 3) {
      setHandleAvailability("short");
      return;
    }
    if (!isValidMemberHandleFormat(raw)) {
      setHandleAvailability("invalid");
      return;
    }
    const norm = normalizeHandleInput(raw);
    const prevShow =
      typeof activeProfile?.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : typeof activeProfile?.handle === "string"
          ? activeProfile.handle
          : "";
    if (
      activeProfile &&
      typeof activeProfile.handle === "string" &&
      activeProfile.handle === norm &&
      stripHandleAtPrefix(raw) === stripHandleAtPrefix(prevShow)
    ) {
      setHandleAvailability("available");
      return;
    }
    if (!isApiWorkerConfigured()) {
      setHandleAvailability("available");
      return;
    }
    setHandleAvailability("checking");
    const { available, error, reason } = await checkMemberProfileHandleAvailable(raw, activeProfileId);
    if (error) {
      setHandleAvailability("idle");
      setHandleSaveInlineErr(error.message);
      return;
    }
    if (!available || reason === "taken") setHandleAvailability("taken");
    else setHandleAvailability("available");
  };

  const saveHandle = async () => {
    if (!activeProfileId) return;
    if (!isSupabaseConfigured()) {
      setHandleSaveInlineErr("Configure Supabase to save your handle.");
      return;
    }
    const raw = stripHandleAtPrefix(handleInput);
    const normalized = raw.toLowerCase();
    const prev = typeof activeProfile?.handle === "string" ? activeProfile.handle : "";
    const prevShow =
      typeof activeProfile?.display_handle === "string" && activeProfile.display_handle.trim()
        ? activeProfile.display_handle.trim()
        : prev;
    if (normalized === prev && stripHandleAtPrefix(raw) === stripHandleAtPrefix(prevShow)) {
      return;
    }
    if (normalized !== prev) {
      if (normalized && !isValidMemberHandleFormat(raw)) {
        setHandleSaveInlineErr(
          "Handle must be 3–32 characters: letters, numbers, underscore, period, or hyphen; no ..; cannot start or end with ."
        );
        return;
      }
      if (normalized && handleAvailability !== "available") {
        if (!workerOk) {
          setHandleSaveInlineErr("Fix handle errors before saving.");
          return;
        }
        setHandleAvailability("checking");
        const { available, error, reason } = await checkMemberProfileHandleAvailable(raw, activeProfileId);
        if (error) {
          setHandleAvailability("idle");
          setHandleSaveInlineErr(error.message);
          return;
        }
        if (!available || reason === "taken") {
          setHandleAvailability("taken");
          setHandleSaveInlineErr("This handle is already taken.");
          return;
        }
        setHandleAvailability("available");
      }
    }
    setHandleSaveBusy(true);
    setHandleSaveInlineErr(null);
    setHandleSaveSuccess(false);
    if (handleSaveSuccessTimerRef.current) {
      clearTimeout(handleSaveSuccessTimerRef.current);
      handleSaveSuccessTimerRef.current = null;
    }
    setErr(null);
    try {
      let error = null;
      if (workerOk) {
        const r = await patchMemberProfileViaWorker(activeProfileId, { handle: raw || null });
        error = r.error;
      } else {
        const r = await updateMemberProfile(activeProfileId, {
          handle: normalized || null,
          display_handle: raw || null,
        });
        error = r.error;
      }
      if (error) {
        const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
        const msg0 = error instanceof Error ? error.message : String(error);
        if (code === "23505" || /duplicate|unique constraint|already exists/i.test(msg0)) {
          setHandleAvailability("taken");
          setHandleSaveInlineErr("This handle is already taken.");
        } else {
          setHandleSaveInlineErr(msg0 || "Could not save handle.");
        }
        return;
      }
      await refreshMemberProfiles();
      setHandleSaveSuccess(true);
      handleSaveSuccessTimerRef.current = setTimeout(() => {
        setHandleSaveSuccess(false);
        handleSaveSuccessTimerRef.current = null;
      }, 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save handle";
      if (/already taken|duplicate|unique constraint/i.test(msg)) {
        setHandleAvailability("taken");
        setHandleSaveInlineErr("This handle is already taken.");
      } else {
        setHandleSaveInlineErr(msg);
      }
    } finally {
      setHandleSaveBusy(false);
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

  const saveDefaultSession = async (sid) => {
    setDefaultSession(sid);
    const { error } = await updateUserProfile({ default_session: sid });
    if (error) setErr(error.message);
    else {
      setErr(null);
      await refreshUser();
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
    setDeleteAccountErr(null);
    const { error } = await deleteAccountViaWorker();
    setDeleteBusy(false);
    if (error) {
      setDeleteAccountErr(error.message);
      return;
    }
    setDeleteAccountErr(null);
    setShowDelete(false);
    await onSignOut();
    if (typeof window !== "undefined") {
      window.location.replace(`${window.location.origin}/`);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)" }}>
        Supabase is not configured.
      </div>
    );
  }

  const BACK_BTN = {
    minWidth: 44,
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid var(--color-bell-border-unread)",
    background: "var(--color-guide-toggle-bg)",
    color: "var(--color-accent)",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  };

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
          gap: 12,
          marginBottom: 18,
        }}
      >
        <button type="button" style={BACK_BTN} onClick={onBack} aria-label="Back to profile">
          ←
        </button>
        <div className="brand" style={{ fontSize: 17, fontWeight: 700 }}>
          Settings
        </div>
        <div style={{ flex: 1, minWidth: 0 }} />
        <ThemeToggle />
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

      <div style={SECTION}>Default session</div>
      <Card>
        <div
          data-tutorial-target={TUTORIAL_TARGET.profile_default_session}
          {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_default_session)))}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 0 }}
        >
          <div
            data-tutorial-target={TUTORIAL_TARGET.settings_wake}
            {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.settings_wake)))}
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {getProtocolSessionsOrdered().map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => void saveDefaultSession(s.id)}
                style={{
                  fontSize: 13,
                  padding: "6px 12px",
                  borderRadius: 12,
                  border:
                    defaultSession === s.id ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                  background: defaultSession === s.id ? "var(--color-accent-nav-fill)" : "var(--color-bg-hover)",
                  color: defaultSession === s.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span className="pepv-emoji" style={{ fontSize: 15, lineHeight: 1 }} aria-hidden>
                  {s.emoji}
                </span>
                {s.pillLabel}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div style={SECTION}>Schedule</div>
      <Card>
        {scheduleUnlocked ? (
          <div
            data-tutorial-target={TUTORIAL_TARGET.profile_shift_schedule}
            {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_shift_schedule)))}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Shift schedule</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SHIFT_SCHEDULE_OPTIONS.map((opt) => {
                  const on = scheduleShift === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setScheduleShift(opt.id)}
                      disabled={scheduleBusy}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: on ? "1px solid var(--color-accent-nav-border)" : "1px solid var(--color-border-emphasis)",
                        background: on ? "var(--color-accent-nav-fill)" : "var(--color-bg-hover)",
                        color: on ? "var(--color-accent)" : "var(--color-text-secondary)",
                        fontSize: 12,
                        cursor: scheduleBusy ? "default" : "pointer",
                        fontFamily: "'JetBrains Mono', monospace",
                        flex: "1 1 auto",
                        minWidth: 72,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Wake time</div>
              <input
                className="form-input"
                type="time"
                style={{ fontSize: 13, width: "100%", maxWidth: 200, boxSizing: "border-box" }}
                value={wakeTimeInput}
                onChange={(e) => setWakeTimeInput(e.target.value)}
                disabled={scheduleBusy}
              />
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 8, lineHeight: 1.45, maxWidth: 420 }}>
                Your wake time personalizes dose reminders and protocol guardrails to your schedule.
              </div>
              {scheduleSummary ? (
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 8 }}>
                  Current: {scheduleSummary}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, alignSelf: "flex-start" }}
              disabled={scheduleBusy || !workerOk}
              onClick={() => void saveSchedule()}
            >
              {scheduleBusy ? "…" : "Save schedule"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
              Shift schedule and wake time are included with Elite and GOAT — personalize protocol timing for shift work.
            </div>
            <button type="button" className="btn-teal" style={{ fontSize: 13, alignSelf: "flex-start" }} onClick={onOpenUpgrade}>
              View plans
            </button>
          </div>
        )}
      </Card>

      <div style={SECTION}>Notifications</div>
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "4px 0",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>Push notifications</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--color-warning)",
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
                border: "1px solid var(--color-border-emphasis)",
                background: "var(--color-bg-elevated)",
                opacity: 0.5,
                cursor: "not-allowed",
              }}
              aria-label="Push notifications unavailable"
            />
          </div>
        </div>
      </Card>

      <div style={SECTION}>Locale</div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>City</div>
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
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>State / region</div>
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
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Country (ISO alpha-2)</div>
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
                border: "1px solid var(--color-border-emphasis)",
                background: "var(--color-bg-page)",
              }}
            >
              {filteredCountries.length === 0 ? (
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", padding: "10px 12px" }}>
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
                        borderBottom: "1px solid var(--color-border-strong)",
                        background: sel ? "var(--color-accent-dim)" : "transparent",
                        color: sel ? "var(--color-accent)" : "var(--color-text-primary)",
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
              <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
                Selected: {localeCountryCode}
                <button
                  type="button"
                  onClick={() => setLocaleCountryCode("")}
                  disabled={localeBusy}
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
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
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Language preference</div>
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
          {localeSummary ? (
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              Current: {localeSummary}
            </div>
          ) : null}
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
      </Card>

      <div
        style={{
          marginTop: 4,
          marginBottom: 6,
          textAlign: "center",
          fontSize: 12,
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        <a href="/legal#privacy" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Privacy Policy
        </a>
        <span aria-hidden> · </span>
        <a href="/legal#terms" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Terms of Service
        </a>
        <span aria-hidden> · </span>
        <a href="/legal#waiver" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Research Waiver
        </a>
      </div>

      <div style={SECTION}>Account & membership</div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Current plan</div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <span className="pill" style={tierPillStyle(user.plan)}>
                {user.plan === "entry" ? "Free" : formatPlan(user.plan)}
              </span>
              {isPaidSubscriber && stripeSub?.cancel_at_period_end ? (
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    padding: "4px 8px",
                    borderRadius: 6,
                    color: "var(--color-warning)",
                    border: "1px solid rgba(245, 158, 11, 0.45)",
                    background: "rgba(245, 158, 11, 0.12)",
                  }}
                >
                  Cancellation Scheduled
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="btn-teal"
            style={{ fontSize: 13 }}
            disabled={!workerOk || portalBusy}
            onClick={() => void openBillingPortal()}
          >
            {portalBusy ? "…" : "Manage Billing"}
          </button>
        </div>
        {isPaidSubscriber && workerOk && stripeSubLoading ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 10 }}>
            Loading billing status…
          </div>
        ) : null}
        {isPaidSubscriber && workerOk && stripeSubErr ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginTop: 10, lineHeight: 1.45 }}>
            {stripeSubErr}
          </div>
        ) : null}
        {portalErr ? (
          <div className="mono" style={{ fontSize: 12, color: "var(--color-warning)", marginTop: 10, lineHeight: 1.45 }}>
            {portalErr}
          </div>
        ) : null}

        {isPaidSubscriber && workerOk && stripeSub?.cancel_at_period_end ? (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 10,
              border: "1px solid var(--color-border-tab)",
              background: "var(--color-bg-page)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 12 }}>
              Cancellation scheduled until{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                {formatSubscriptionPeriodEndDisplay(stripeSub.current_period_end)}
              </strong>
              . You keep full {formatPlan(stripeSub.plan && stripeSub.plan !== "entry" ? stripeSub.plan : user.plan)} access
              until then.
            </div>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13 }}
              disabled={cancelSubBusy}
              onClick={() => void onReactivateSubscription()}
            >
              {cancelSubBusy ? "…" : "Reactivate subscription"}
            </button>
          </div>
        ) : null}

        {isPaidSubscriber && workerOk && stripeSub && !stripeSub.cancel_at_period_end && !stripeSubLoading ? (
          <button
            type="button"
            style={{
              fontSize: 13,
              marginTop: 14,
              width: "100%",
              minHeight: 44,
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: "transparent",
              border: "1px solid rgba(248, 113, 113, 0.55)",
              color: "var(--color-danger)",
            }}
            onClick={() => openCancelSubModal()}
          >
            Cancel subscription
          </button>
        ) : null}

        {user.plan !== "goat" && (
          <button type="button" className="btn-teal" style={{ fontSize: 13, marginTop: 12, width: "100%" }} onClick={onOpenUpgrade}>
            Upgrade plan
          </button>
        )}
      </Card>

      <div style={SECTION}>Connected accounts</div>
      <Card>
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
                  border: "1px solid var(--color-border-emphasis)",
                  background: "var(--color-bg-page)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 6,
                      color: on ? "var(--color-accent)" : "var(--color-text-secondary)",
                      border: `1px solid ${on ? "var(--color-accent-subtle-50)" : "var(--color-border-emphasis)"}`,
                    }}
                  >
                    {on ? "Connected" : "Disconnected"}
                  </span>
                  <button type="button" className="btn-teal" style={{ fontSize: 13, padding: "4px 10px", opacity: 0.45 }} disabled>
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={SECTION}>Profile management</div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Profile display name</div>
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

          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Public handle</div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: "1 1 220px",
                  minWidth: 0,
                  maxWidth: 360,
                  borderRadius: 5,
                  border: "1px solid var(--color-border-default)",
                  background: "var(--color-bg-page)",
                  padding: "0 10px",
                }}
              >
                <span className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0, userSelect: "none" }}>
                  @
                </span>
                <input
                  className="form-input"
                  data-tutorial-target={TUTORIAL_TARGET.profile_handle}
                  {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.profile_handle)))}
                  style={{
                    fontSize: 13,
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    background: "transparent",
                    paddingLeft: 4,
                  }}
                  value={handleInput}
                  onChange={onHandleInputChange}
                  onBlur={() => void onHandleBlur()}
                  disabled={handleSaveBusy}
                  placeholder="your_handle"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Profile handle without at sign"
                />
              </div>
              {handleAvailability === "checking" ? (
                <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  …
                </span>
              ) : null}
              {handleAvailability === "available" ? (
                <span className="pepv-emoji" style={{ fontSize: 16, color: "var(--color-success)" }} aria-label="Available">
                  ✅
                </span>
              ) : null}
              {handleAvailability === "taken" ? (
                <span style={{ fontSize: 13, color: "var(--color-danger)" }}>✗ This handle is already taken</span>
              ) : null}
              {handleAvailability === "short" ? (
                <span style={{ fontSize: 13, color: "var(--color-warning)" }}>At least 3 characters</span>
              ) : null}
              {handleAvailability === "invalid" ? (
                <span style={{ fontSize: 13, color: "var(--color-warning)" }}>
                  Letters, numbers, underscore, period, or hyphen (3–32); no ..; cannot start or end with .
                </span>
              ) : null}
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13 }}
                disabled={handleSaveDisabled}
                onClick={() => void saveHandle()}
              >
                {handleSaveBusy ? "…" : "Save handle"}
              </button>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 6 }}>
              {handleInput.length}/32 · min 3 characters · shown as{" "}
              {handleNormalized.length >= 3 && isValidMemberHandleFormat(handleInput)
                ? formatHandleDisplay(handleInput)
                : "@handle"}
            </div>
            {handleSaveInlineErr ? (
              <div style={{ fontSize: 13, color: "var(--color-danger)", marginTop: 8 }}>{handleSaveInlineErr}</div>
            ) : null}
            {handleSaveSuccess ? (
              <div style={{ fontSize: 13, color: "var(--color-success)", marginTop: 8 }}>Handle saved.</div>
            ) : null}
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
                color: "var(--color-warning)",
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
      </Card>

      <div style={SECTION}>Account management</div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Change email</div>
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
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Change password</div>
            <button type="button" className="btn-teal" style={{ fontSize: 13 }} disabled={busy} onClick={() => void onSendPasswordReset()}>
              Send password reset email
            </button>
            {pwdResetSent && (
              <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", marginTop: 8 }}>
                If that email is registered, a reset link is on the way.
              </div>
            )}
          </div>
        </div>
      </Card>

      {import.meta.env.DEV && (
        <Card
          style={{
            marginTop: 0,
            marginBottom: 8,
            border: "1px dashed rgba(100, 116, 139, 0.55)",
            background: "rgba(15, 23, 42, 0.35)",
          }}
        >
          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10, letterSpacing: "0.06em" }}>
            DEVELOPMENT — Demo tour
          </div>
          <button
            type="button"
            className="btn-teal"
            style={{ fontSize: 13 }}
            disabled={demoResetBusy || !activeProfileId || !isSupabaseConfigured()}
            onClick={() => void onResetDemoSessions()}
          >
            {demoResetBusy ? "…" : "Reset demo session counter (→ 0)"}
          </button>
          <div className="mono" style={{ fontSize: 11, color: "var(--tier-entry)", marginTop: 10, lineHeight: 1.5 }}>
            Console: <code style={{ color: "var(--color-text-secondary)" }}>await window.pepguideIQ?.resetDemoSessions()</code>
          </div>
        </Card>
      )}

      <div style={{ ...SECTION, color: "var(--color-danger)" }}>Danger Zone</div>
      <Card
        style={{
          border: "1px solid rgba(248, 113, 113, 0.5)",
          background: "rgba(69, 10, 10, 0.35)",
        }}
      >
        <button
          type="button"
          className="btn-red"
          style={{
            fontSize: 14,
            fontWeight: 600,
            width: "100%",
            minHeight: 48,
            boxSizing: "border-box",
          }}
          onClick={() => {
            setDeleteAccountErr(null);
            setShowDelete(true);
          }}
        >
          Delete My Account
        </button>
      </Card>

      {showCancelSubModal && (
        <Modal onClose={closeCancelSubModal} maxWidth={480} label="Cancel subscription">
          {cancelSubPhase === "success" ? (
            <>
              <p style={{ fontSize: 15, color: "var(--color-text-primary)", lineHeight: 1.55, marginBottom: 20 }}>
                Your{" "}
                <strong>
                  {formatPlan(stripeSub?.plan && stripeSub.plan !== "entry" ? stripeSub.plan : user.plan)}
                </strong>{" "}
                access continues until{" "}
                <strong>{formatSubscriptionPeriodEndDisplay(stripeSub?.current_period_end)}</strong>. No further charges.
              </p>
              <button
                type="button"
                className="btn-teal"
                style={{ fontSize: 13, width: "100%", minHeight: 44 }}
                onClick={closeCancelSubModal}
              >
                Done
              </button>
            </>
          ) : (
            (() => {
              const cancelModalPlanKey =
                stripeSub?.plan && stripeSub.plan !== "entry" ? stripeSub.plan : user.plan;
              const cancelModalPlanLabel = formatPlan(cancelModalPlanKey);
              const cancelModalPeriodEnd = formatSubscriptionPeriodEndDisplay(stripeSub?.current_period_end);
              return (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <p style={{ fontSize: 36, lineHeight: 1.2, margin: "0 0 10px" }} aria-hidden>
                      🥺
                    </p>
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        margin: "0 0 12px",
                        color: "var(--color-text-primary)",
                        lineHeight: 1.35,
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Awww... but we like money.
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      Your{" "}
                      <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{cancelModalPlanLabel}</strong>{" "}
                      access runs through{" "}
                      <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{cancelModalPeriodEnd}</strong>.
                      After that you drop to the free Entry tier — your data and logs stay forever though.
                    </p>
                  </div>
                  {cancelSubModalErr ? (
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-danger)", marginBottom: 14, lineHeight: 1.45 }}>
                      {cancelSubModalErr}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      type="button"
                      className="btn-red"
                      style={{ fontSize: 13, width: "100%", minHeight: 44, fontWeight: 600, boxSizing: "border-box" }}
                      disabled={cancelSubBusy}
                      onClick={() => void onConfirmCancelSubscription()}
                    >
                      {cancelSubBusy ? "Processing..." : "Yeah, cancel it"}
                    </button>
                    <button
                      type="button"
                      className="btn-teal"
                      style={{ fontSize: 13, width: "100%", minHeight: 44, boxSizing: "border-box" }}
                      disabled={cancelSubBusy}
                      onClick={closeCancelSubModal}
                    >
                      {`Never mind, keep my ${cancelModalPlanLabel}`}
                    </button>
                  </div>
                </>
              );
            })()
          )}
        </Modal>
      )}

      {showDeleteProfile && (
        <Modal onClose={() => setShowDeleteProfile(false)} maxWidth={420} label="Delete profile">
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 20 }}>
            Delete <strong style={{ color: "var(--color-text-primary)" }}>{activeProfile?.display_name ?? "this profile"}</strong>? This removes its
            stack, vials, dose logs, and body metrics tied to this profile. Your account and other profiles stay intact.
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
        <Modal
          onClose={() => {
            if (deleteBusy) return;
            setShowDelete(false);
            setDeleteAccountErr(null);
          }}
          maxWidth={420}
          label="Delete account"
        >
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 12px", color: "var(--tier-goat-border)", lineHeight: 1.35 }}>
            Sad to see you go, but love to watch ya leave. 🙂
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
            This permanently deletes your account, stack, vials, and dose history. There is no undo.
          </p>
          {deleteAccountErr ? (
            <div className="mono" style={{ fontSize: 13, color: "var(--color-danger)", marginBottom: 16, lineHeight: 1.45 }}>
              {deleteAccountErr}
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              className="btn-teal"
              style={{ fontSize: 13, width: "100%", minHeight: 44 }}
              disabled={deleteBusy}
              onClick={() => {
                setShowDelete(false);
                setDeleteAccountErr(null);
              }}
            >
              Never mind
            </button>
            <button
              type="button"
              className="btn-red"
              style={{ fontSize: 14, fontWeight: 600, width: "100%", minHeight: 48 }}
              disabled={deleteBusy}
              onClick={() => void onConfirmDelete()}
            >
              {deleteBusy ? "Deleting…" : "Yes, delete everything"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
