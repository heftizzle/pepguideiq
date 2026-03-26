/** @type {string} */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";

/** @type {string} */
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Base URL for API worker (no trailing slash). */
export const API_WORKER_URL = String(import.meta.env.VITE_API_WORKER_URL ?? "").replace(/\/$/, "");

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isApiWorkerConfigured() {
  return Boolean(API_WORKER_URL);
}
