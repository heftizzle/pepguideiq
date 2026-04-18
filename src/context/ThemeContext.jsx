import { createContext, useContext } from "react";
import { useTheme } from "../hooks/useTheme.js";

const ThemeCtx = createContext(null);

/**
 * @param {{ user?: import("@supabase/supabase-js").User | null, children: import("react").ReactNode }} props
 */
export function ThemeProvider({ user, children }) {
  const value = useTheme({ user });
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** @returns {ReturnType<typeof useTheme>} */
export function useThemeContext() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useThemeContext must be used within ThemeProvider");
  return v;
}
