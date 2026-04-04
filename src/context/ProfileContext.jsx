import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "../lib/config.js";
import { getMemberProfileSlotLimit } from "../lib/tiers.js";
import { listMemberProfiles } from "../lib/supabase.js";

const LS_KEY = (userId) => `pepguideiq.active_profile_id.${userId}`;

const ProfileCtx = createContext(null);

/**
 * @param {{ userId: string, plan: string, children: import("react").ReactNode }} props
 */
export function ProfileProvider({ userId, plan, children }) {
  const [ready, setReady] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [activeProfileId, setActiveProfileIdState] = useState(null);
  /** Bumps when `refresh()` completes so avatar blob URLs refetch (same R2 key after re-upload). */
  const [memberProfilesVersion, setMemberProfilesVersion] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      setMemberProfiles([]);
      setActiveProfileIdState(null);
      setReady(true);
      return;
    }
    const { profiles, error } = await listMemberProfiles(userId);
    if (error) {
      setMemberProfiles([]);
      setActiveProfileIdState(null);
      setReady(true);
      return;
    }
    setMemberProfiles(profiles);
    let next = null;
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY(userId)) : null;
      if (raw && profiles.some((p) => p.id === raw)) next = raw;
    } catch {
      /* ignore */
    }
    if (!next) {
      const def = profiles.find((p) => p.is_default) ?? profiles[0];
      next = def?.id ?? null;
    }
    setActiveProfileIdState(next);
    if (next && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(LS_KEY(userId), next);
      } catch {
        /* ignore */
      }
    }
    setMemberProfilesVersion((v) => v + 1);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  const setActiveProfileId = useCallback(
    (id) => {
      if (!id || !memberProfiles.some((p) => p.id === id)) return;
      setActiveProfileIdState(id);
      try {
        if (typeof localStorage !== "undefined" && userId) {
          localStorage.setItem(LS_KEY(userId), id);
        }
      } catch {
        /* ignore */
      }
    },
    [memberProfiles, userId]
  );

  const switchProfile = useCallback((id) => {
    setActiveProfileId(id);
    if (typeof window !== "undefined") window.location.reload();
  }, [setActiveProfileId]);

  const slotLimit = useMemo(() => getMemberProfileSlotLimit(plan), [plan]);
  const canAddProfile = memberProfiles.length < slotLimit;

  const activeProfile = useMemo(
    () => memberProfiles.find((p) => p.id === activeProfileId) ?? null,
    [memberProfiles, activeProfileId]
  );

  const value = useMemo(
    () => ({
      ready,
      activeProfileId,
      activeProfile,
      memberProfiles,
      memberProfilesVersion,
      refreshMemberProfiles: refresh,
      setActiveProfileId,
      switchProfile,
      slotLimit,
      canAddProfile,
    }),
    [
      ready,
      activeProfileId,
      activeProfile,
      memberProfiles,
      memberProfilesVersion,
      refresh,
      setActiveProfileId,
      switchProfile,
      slotLimit,
      canAddProfile,
    ]
  );

  if (!ready) {
    return (
      <div
        className="mono"
        style={{
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7c8f",
          fontSize: 13,
          background: "#07090e",
        }}
      >
        Loading profiles…
      </div>
    );
  }

  if (memberProfiles.length === 0) {
    return (
      <div className="mono" style={{ padding: 24, color: "#f59e0b", fontSize: 13, background: "#07090e" }}>
        No member profiles found. Apply migration 013_member_profiles.sql (backfill) or sign in again.
      </div>
    );
  }

  if (!activeProfileId) {
    return (
      <div className="mono" style={{ padding: 24, color: "#f59e0b", fontSize: 13, background: "#07090e" }}>
        Could not resolve an active profile. Check localStorage or pick a profile after refresh.
      </div>
    );
  }

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useActiveProfile() {
  const v = useContext(ProfileCtx);
  if (!v) throw new Error("useActiveProfile must be used within ProfileProvider");
  return v;
}
