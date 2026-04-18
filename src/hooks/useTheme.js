import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";

const STORAGE_KEY = "pgi-theme";
const VALID_THEMES = /** @type {const} */ (["dark", "light"]);

/** @returns {"dark" | "light"} */
function readStoredTheme() {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return VALID_THEMES.includes(/** @type {any} */ (stored)) ? stored : "dark";
  } catch {
    return "dark";
  }
}

/**
 * @param {string} theme
 * @param {string} expectedUserId
 */
async function persistThemePreference(theme, expectedUserId) {
  if (!supabase || !expectedUserId) return;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id || data.user.id !== expectedUserId) return;
    await supabase.auth.updateUser({ data: { theme_preference: theme } });
  } catch {
    /* preference still in localStorage + DOM */
  }
}

/**
 * Theme state with `data-theme` on `<html>`, `localStorage`, and optional Supabase
 * `user_metadata.theme_preference` when the user is signed in.
 *
 * Uses the shared browser `supabase` client from `src/lib/supabase.js` (no new client).
 *
 * @param {{ user?: import("@supabase/supabase-js").User | null }} [options]
 * @returns {{
 *   theme: "dark" | "light",
 *   setTheme: (t: string) => void,
 *   toggle: () => void,
 *   isDark: boolean,
 *   isLight: boolean,
 * }}
 */
export function useTheme(options = {}) {
  const { user = null } = options;
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [theme, setThemeState] = useState(readStoredTheme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // When session appears, adopt server preference if valid (cross-device).
  useEffect(() => {
    const remote = user?.user_metadata?.theme_preference;
    if (!userId || !VALID_THEMES.includes(remote)) return;
    setThemeState(remote);
  }, [userId, user?.user_metadata?.theme_preference]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (!VALID_THEMES.includes(t)) return;
    setThemeState(t);
    void persistThemePreference(t, userIdRef.current);
  }, []);

  const toggle = useCallback(() => {
    const next = themeRef.current === "dark" ? "light" : "dark";
    void persistThemePreference(next, userIdRef.current);
    setThemeState(next);
  }, []);

  return {
    theme,
    setTheme,
    toggle,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}
