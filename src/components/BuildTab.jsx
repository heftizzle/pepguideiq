import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getCategoryCssVars } from "../data/catalog.js";
import { useActiveProfile } from "../context/ProfileContext.jsx";
// Worker: set `VITE_API_WORKER_URL` (e.g. https://pepguideiq-api-proxy.pepguideiq.workers.dev).
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { getSessionAccessToken, supabase } from "../lib/supabase.js";
import { buildAtfehCatalogPayload } from "../lib/atfehCatalogPayload.js";
import { LibrarySearchInput } from "./LibrarySearchInput.jsx";
import { DEFAULT_STACK_SESSIONS } from "./SavedStackEntryRow.jsx";
import { CLOSE_SIZES } from "../lib/closeButtonSizes.js";
import { canAddStackRow } from "../lib/tiers.js";
import { TUTORIAL_TARGET, tutorialHighlightProps, useTutorialOptional } from "../context/TutorialContext.jsx";

const FREQ_OPTIONS = [
  { id: "daily", label: "Daily" },
  { id: "eod", label: "EOD" },
  { id: "3x", label: "3x/week" },
  { id: "2x", label: "2x/week" },
  { id: "weekly", label: "Weekly" },
  { id: "custom", label: "Custom" },
];

const STACK_TIER_KEYS = new Set(["must_have", "nice_to_have", "not_necessary", "redundant"]);

/** @param {unknown} t */
function normalizeStackTier(t) {
  if (typeof t !== "string") return undefined;
  const k = t.trim().toLowerCase().replace(/-/g, "_");
  return STACK_TIER_KEYS.has(k) ? k : undefined;
}

/** localStorage key prefix for stack picks result cache (kept as "advisor" for back-compat with existing user caches). */
const ADVISOR_CACHE_KEY_PREFIX = "pepguideiq.advisor_cache.v1.";

/** Stack picks cache TTL: 24 hours. Long enough to survive multiple sessions; short enough that catalog updates eventually flush. */
const STACK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Read a cached stack picks result for the given fingerprint.
 * Returns null if missing, expired, or unparseable.
 * @param {string} fingerprint
 * @returns {{ insight: string, recommendations: Array<{peptideId: string, name: string, rationale: string, tier?: string}> } | null}
 */
function readStackCache(fingerprint) {
  if (!fingerprint || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADVISOR_CACHE_KEY_PREFIX + fingerprint);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > STACK_CACHE_TTL_MS) {
      try {
        localStorage.removeItem(ADVISOR_CACHE_KEY_PREFIX + fingerprint);
      } catch {
        /* ignore */
      }
      return null;
    }
    const data = parsed.data;
    if (!data || typeof data !== "object") return null;
    if (typeof data.insight !== "string") return null;
    if (!Array.isArray(data.recommendations)) return null;
    return { insight: data.insight, recommendations: data.recommendations };
  } catch {
    return null;
  }
}

/**
 * Persist a stack picks result for the given fingerprint.
 * Best-effort; silently fails on quota/serialization errors.
 * @param {string} fingerprint
 * @param {{ insight: string, recommendations: Array<{peptideId: string, name: string, rationale: string, tier?: string}> }} data
 */
function writeStackCache(fingerprint, data) {
  if (!fingerprint || !data || typeof localStorage === "undefined") return;
  try {
    const payload = JSON.stringify({ cachedAt: Date.now(), data });
    localStorage.setItem(ADVISOR_CACHE_KEY_PREFIX + fingerprint, payload);
  } catch {
    /* quota exceeded or storage disabled — skip cache */
  }
}

const STACK_TIER_BADGE_STYLES = {
  must_have: {
    emoji: "🟢",
    label: "Must Have",
    border: "1px solid rgba(34, 197, 94, 0.55)",
    background: "rgba(34, 197, 94, 0.16)",
    color: "#4ade80",
  },
  nice_to_have: {
    emoji: "🟡",
    label: "Nice to Have",
    border: "1px solid rgba(234, 179, 8, 0.55)",
    background: "rgba(234, 179, 8, 0.14)",
    color: "#facc15",
  },
  not_necessary: {
    emoji: "🟠",
    label: "Not Necessary",
    border: "1px solid rgba(249, 115, 22, 0.55)",
    background: "rgba(249, 115, 22, 0.14)",
    color: "#fb923c",
  },
  redundant: {
    emoji: "🔴",
    label: "Redundant",
    border: "1px solid rgba(239, 68, 68, 0.55)",
    background: "rgba(239, 68, 68, 0.14)",
    color: "#f87171",
  },
};

/** @param {{ tier?: string }} props */
function StackTierBadge({ tier }) {
  const key = normalizeStackTier(tier);
  if (!key) return null;
  const cfg = STACK_TIER_BADGE_STYLES[key];
  return (
    <span
      className="mono"
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
        maxWidth: "min(200px, calc(100% - 20px))",
        overflow: "hidden",
        textOverflow: "ellipsis",
        border: cfg.border,
        background: cfg.background,
        color: cfg.color,
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.2)",
      }}
      title={cfg.label}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}

function parseDoseToMg(input) {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/,/g, "");
  if (!s) return null;
  const m = s.match(/^([\d.]+)\s*(mcg|µg|ug|mg|g)\b/i);
  if (m) {
    const v = parseFloat(m[1]);
    if (!Number.isFinite(v)) return null;
    const u = m[2].toLowerCase();
    if (u === "mg") return v;
    if (u === "mcg" || u === "µg" || u === "ug") return v / 1000;
    if (u === "g") return v * 1000;
    return null;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function isBlendLike(peptide, doseInput) {
  const dose = String(doseInput ?? "");
  if (dose.includes("/")) return true;
  if (peptide?.compound_type === "blend") return true;
  if (Array.isArray(peptide?.components) && peptide.components.length > 1) return true;
  if (Array.isArray(peptide?.tags) && peptide.tags.some((t) => String(t).toLowerCase() === "blend")) return true;
  return false;
}

function resolveDosePerInjectionMg(peptide, doseInput, freqKey, customPerWeek) {
  const blendLike = isBlendLike(peptide, doseInput);
  if (blendLike) {
    const explicitPerInjectionMg = Number(peptide?.dose_per_injection_mg);
    if (Number.isFinite(explicitPerInjectionMg) && explicitPerInjectionMg > 0) return explicitPerInjectionMg;

    const doseText = String(doseInput ?? "");
    if (doseText.includes("/")) {
      const weeklyPart = doseText.split("/")[1]?.trim() ?? "";
      const weeklyMg = parseDoseToMg(weeklyPart);
      const inj = injectionsPerWeek(freqKey, customPerWeek);
      if (weeklyMg != null && inj > 0) return weeklyMg / inj;
    }
  }
  return parseDoseToMg(doseInput);
}

function defaultVialSizeMg(peptide) {
  const opts = peptide?.vialSizeOptions;
  if (Array.isArray(opts) && opts.length > 0) {
    const t = Number(opts[0]?.totalMg);
    if (Number.isFinite(t) && t > 0) return t;
  }
  const r = peptide?.reconstitution;
  if (typeof r === "string") {
    const m = r.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
    if (m) {
      const v = parseFloat(m[1]);
      if (Number.isFinite(v) && v > 0) return v;
    }
  }
  return 5;
}

function injectionsPerWeek(freqKey, customPerWeek) {
  switch (freqKey) {
    case "daily":
      return 7;
    case "eod":
      return 3.5;
    case "3x":
      return 3;
    case "2x":
      return 2;
    case "weekly":
      return 1;
    case "custom": {
      const n = parseFloat(String(customPerWeek ?? "").replace(/,/g, ""));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    default:
      return 0;
  }
}

function formatFrequencyLabel(freqKey, customPerWeek) {
  switch (freqKey) {
    case "daily":
      return "Daily";
    case "eod":
      return "EOD";
    case "3x":
      return "3x/week";
    case "2x":
      return "2x/week";
    case "weekly":
      return "Weekly";
    case "custom":
      return customPerWeek ? `${String(customPerWeek).trim()}x/week` : "Custom";
    default:
      return "";
  }
}

function useWideLayout() {
  const [wide, setWide] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 900px)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const fn = () => setWide(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return wide;
}

export function BuildTab({
  activeTab,
  catalog,
  myStack,
  stackName,
  setStackName,
  setMyStack,
  rows,
  setRows,
  localName,
  setLocalName,
  vialOverrides,
  setVialOverrides,
  cycleWeeks,
  setCycleWeeks,
  savedStackLimit,
  stackListReady = true,
  onUpgrade,
  primaryCategory,
  user = null,
  plan = "entry",
}) {
  const tutorial = useTutorialOptional();
  const { activeProfileId } = useActiveProfile();
  const wide = useWideLayout();
  const [calcOpen, setCalcOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedResetTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const copiedResetTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const [stackPicksData, setStackPicksData] = useState(
    /** @type {{ insight: string, recommendations: { peptideId: string, name: string, rationale: string, tier?: string }[] } | null} */ (
      null
    )
  );
  const [stackPicksLoading, setStackPicksLoading] = useState(false);
  /** Set when the last stack picks request failed (non-2xx / network); cleared on new attempt. */
  const [stackPicksError, setStackPicksError] = useState(/** @type {string | null} */ (null));
  const stackPicksDebounce = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const stackPicksFetchGen = useRef(0);
  /** Fingerprint of the stack we last successfully loaded recommendations for (includes plan/user so tier changes refetch). */
  const lastStackPicksFingerprint = useRef("");

  const stackPicksFingerprint = useMemo(() => {
    if (rows.length === 0) return "";
    const ids = rows.map((r) => r.peptideId).sort().join(",");
    return `${user?.id ?? "anon"}:${plan ?? "entry"}:${ids}`;
  }, [rows, user?.id, plan]);

  const [shoppingHistory, setShoppingHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const stackPicksUnlocked = true;

  useEffect(() => {
    return () => {
      if (savedResetTimerRef.current != null) clearTimeout(savedResetTimerRef.current);
      if (copiedResetTimerRef.current != null) clearTimeout(copiedResetTimerRef.current);
    };
  }, []);

  const catalogById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  /** Show loading skeleton on the first paint whenever we will fetch (effect runs after paint). */
  useLayoutEffect(() => {
    if (!stackPicksFingerprint || !isApiWorkerConfigured()) return;
    setStackPicksLoading(true);
  }, [stackPicksFingerprint]);

  useEffect(() => {
    if (rows.length === 0) {
      lastStackPicksFingerprint.current = "";
      setStackPicksData(null);
      setStackPicksError(null);
      setStackPicksLoading(false);
      if (stackPicksDebounce.current != null) {
        window.clearTimeout(stackPicksDebounce.current);
        stackPicksDebounce.current = null;
      }
      return;
    }
    if (!isApiWorkerConfigured()) {
      setStackPicksData(null);
      setStackPicksError(null);
      setStackPicksLoading(false);
      return;
    }

    // CACHE HYDRATION — check localStorage for a prior result matching this fingerprint.
    // If found, render it immediately and skip the network fetch entirely.
    // This makes Stack Builder cold-open instant when the stack hasn't changed.
    const cached = readStackCache(stackPicksFingerprint);
    if (cached) {
      lastStackPicksFingerprint.current = stackPicksFingerprint;
      setStackPicksData(cached);
      setStackPicksError(null);
      setStackPicksLoading(false);
      return;
    }

    // VISIBILITY GATE — only fetch if the user is actually looking at the Stack Builder tab.
    // If the user landed on a different tab (sessionStorage may have last set it to stackBuilder
    // but they tapped away during boot), don't burn an Anthropic round trip they won't see.
    // When they switch back to stackBuilder, this effect will rerun (activeTab is in the dep array)
    // and the fetch will fire then.
    if (activeTab !== "stackBuilder") {
      setStackPicksLoading(false);
      return;
    }

    const myId = ++stackPicksFetchGen.current;
    setStackPicksLoading(true);
    setStackPicksError(null);

    if (stackPicksDebounce.current != null) window.clearTimeout(stackPicksDebounce.current);
    stackPicksDebounce.current = window.setTimeout(() => {
      void (async () => {
        try {
          if (stackPicksFingerprint === lastStackPicksFingerprint.current) {
            if (myId === stackPicksFetchGen.current) setStackPicksLoading(false);
            return;
          }

          const currentStack = rows
            .map((row) => {
              const p = catalogById.get(row.peptideId);
              return p ? { id: p.id, name: p.name, category: primaryCategory(p) } : null;
            })
            .filter(Boolean);
          if (currentStack.length === 0) {
            if (myId === stackPicksFetchGen.current) {
              setStackPicksData(null);
              setStackPicksError(
                "Stack rows do not match the catalog, so AI Atfeh has nothing to analyze. Add compounds from search above."
              );
            }
            return;
          }

          const compactCatalog = buildAtfehCatalogPayload(catalog, primaryCategory);

          const accessToken = await getSessionAccessToken();
          if (!accessToken) {
            if (myId === stackPicksFetchGen.current) {
              setStackPicksData(null);
              setStackPicksError("Sign in to use AI Atfeh.");
            }
            return;
          }

          const res = await fetch(`${API_WORKER_URL}/atfeh/stack-recommendations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ currentStack, catalog: compactCatalog }),
          });

          if (myId !== stackPicksFetchGen.current) return;

          if (res.status === 401) {
            if (myId === stackPicksFetchGen.current) {
              setStackPicksData(null);
              setStackPicksError("Session expired or not signed in. Sign in again to use AI Atfeh.");
            }
            return;
          }

          if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            if (myId !== stackPicksFetchGen.current) return;
            setStackPicksData({
              insight:
                typeof data.limitMessage === "string" && data.limitMessage.trim()
                  ? data.limitMessage.trim()
                  : "Daily AI Atfeh limit reached. Upgrade for more.",
              recommendations: [],
            });
            setStackPicksError(null);
            lastStackPicksFingerprint.current = stackPicksFingerprint;
            setStackPicksLoading(false);
            return;
          }

          if (!res.ok) {
            if (myId === stackPicksFetchGen.current) {
              setStackPicksData(null);
              setStackPicksError(`AI Atfeh request failed (${res.status}). Check that the Worker exposes POST /atfeh/stack-recommendations.`);
            }
            return;
          }

          const data = await res.json().catch(() => ({}));
          if (myId !== stackPicksFetchGen.current) return;

          if (!data || typeof data !== "object") {
            setStackPicksData(null);
            setStackPicksError("Invalid response from AI Atfeh.");
            return;
          }
          const insightRaw = typeof data.insight === "string" ? data.insight : "";
          const rowIds = new Set(rows.map((r) => r.peptideId));
          let recs = Array.isArray(data.recommendations) ? data.recommendations : [];
          recs = recs
            .map((r) => {
              if (!r || typeof r !== "object") return null;
              const pid =
                typeof r.peptideId === "string"
                  ? r.peptideId.trim()
                  : typeof r.catalogId === "string"
                    ? r.catalogId.trim()
                    : "";
              if (!pid || rowIds.has(pid) || !catalogById.has(pid)) return null;
              const reason =
                typeof r.reason === "string"
                  ? r.reason.trim()
                  : typeof r.rationale === "string"
                    ? r.rationale.trim()
                    : "";
              const tier = normalizeStackTier(r.tier);
              return {
                peptideId: pid,
                name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : pid,
                rationale: reason,
                ...(tier ? { tier } : {}),
              };
            })
            .filter(Boolean)
            .slice(0, 4);
          const insightTrim = insightRaw.trim();
          setStackPicksError(null);
          if (insightTrim || recs.length) {
            lastStackPicksFingerprint.current = stackPicksFingerprint;
            const newData = { insight: insightTrim, recommendations: recs };
            setStackPicksData(newData);
            writeStackCache(stackPicksFingerprint, newData);
          } else {
            lastStackPicksFingerprint.current = "";
            setStackPicksData(null);
            setStackPicksError("No recommendations returned. Try again after changing your stack.");
          }
        } catch {
          if (myId === stackPicksFetchGen.current) {
            setStackPicksData(null);
            setStackPicksError("Could not reach AI Atfeh. Check your network and API worker URL.");
          }
        } finally {
          if (myId === stackPicksFetchGen.current) setStackPicksLoading(false);
        }
      })();
    }, 2500);

    return () => {
      if (stackPicksDebounce.current != null) {
        window.clearTimeout(stackPicksDebounce.current);
        stackPicksDebounce.current = null;
      }
    };
  }, [stackPicksFingerprint, activeTab]);

  useEffect(() => {
    if (activeTab !== "stackBuilder") return;
    if (!user?.id || !activeProfileId || !supabase) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from("shopping_lists")
          .select("id, stack_name, cycle_weeks, items, created_at")
          .eq("user_id", user.id)
          .eq("profile_id", activeProfileId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data) setShoppingHistory(data);
      } catch {
        /* silent */
      } finally {
        setHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [activeTab, user?.id, activeProfileId]);

  const filteredSearch = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((p) => {
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.aliases?.some((a) => String(a).toLowerCase().includes(q))) return true;
        if (p.tags?.some((t) => String(t).toLowerCase().includes(q))) return true;
        return false;
      })
      .slice(0, 24);
  }, [catalog, searchQ]);

  const addCompound = useCallback(
    (p) => {
      if (rows.some((r) => r.peptideId === p.id)) return;
      if (!canAddStackRow(plan, rows.length)) {
        onUpgrade();
        return;
      }
      const key = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now());
      setRows((prev) => [
        ...prev,
        {
          key,
          peptideId: p.id,
          dose: p.startDose ?? "",
          freqKey: "daily",
          customPerWeek: "",
          addedDate: new Date().toLocaleDateString(),
        },
      ]);
    },
    [rows, plan, onUpgrade]
  );

  const moveRow = (idx, dir) => {
    setRows((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const removeRow = (key) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setVialOverrides((o) => {
      const n = { ...o };
      delete n[key];
      return n;
    });
  };

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const saveStack = () => {
    if (!stackListReady) return;
    if (Number.isFinite(savedStackLimit) && rows.length > savedStackLimit) {
      onUpgrade();
      return;
    }
    if (rows.length === 0) {
      setStackName(localName.trim());
      setMyStack([]);
      return;
    }
    const built = rows
      .map((row) => {
        const p = catalogById.get(row.peptideId);
        if (!p) return null;
        return {
          ...p,
          stackRowKey: row.key,
          stackDose: row.dose,
          stackFrequency: formatFrequencyLabel(row.freqKey, row.customPerWeek),
          stackNotes: "",
          sessions: [...DEFAULT_STACK_SESSIONS],
          addedDate: row.addedDate ?? new Date().toLocaleDateString(),
        };
      })
      .filter(Boolean);
    setStackName(localName.trim());
    setMyStack(built);
  };

  const handleSaveStack = () => {
    saveStack();
    if (savedResetTimerRef.current != null) window.clearTimeout(savedResetTimerRef.current);
    setSaved(true);
    savedResetTimerRef.current = window.setTimeout(() => {
      setSaved(false);
      savedResetTimerRef.current = null;
    }, 1800);
  };

  const cycleLines = useMemo(() => {
    const w = Math.max(1, Number(cycleWeeks) || 1);
    return rows.map((row) => {
      const p = catalogById.get(row.peptideId);
      const name = p?.name ?? row.peptideId;
      const doseMg = resolveDosePerInjectionMg(p, row.dose, row.freqKey, row.customPerWeek);
      const inj = injectionsPerWeek(row.freqKey, row.customPerWeek);
      const totalMg = doseMg != null && inj > 0 ? doseMg * inj * w : null;
      const defVial = p ? defaultVialSizeMg(p) : 5;
      const vialStr = vialOverrides[row.key];
      const vialMg = parseFloat(String(vialStr ?? "").replace(/,/g, ""));
      const vialSize = Number.isFinite(vialMg) && vialMg > 0 ? vialMg : defVial;
      const vials =
        totalMg != null && vialSize > 0 ? Math.ceil(totalMg / vialSize) : null;
      return {
        key: row.key,
        name,
        dose: row.dose,
        freqLabel: formatFrequencyLabel(row.freqKey, row.customPerWeek),
        doseMg,
        totalMg,
        vialSize,
        vials,
        defVial,
      };
    });
  }, [rows, catalogById, cycleWeeks, vialOverrides]);

  const copyShoppingList = async () => {
    const w = Math.max(1, Number(cycleWeeks) || 1);
    const lines = [
      `pepguideIQ — cycle shopping list (${w} week${w !== 1 ? "s" : ""})`,
      "",
      ...cycleLines.map((L) => {
        if (L.totalMg == null || L.vials == null) {
          return `${L.name}: (set parseable dose, e.g. 250mcg or 5mg)`;
        }
        const mgRounded = Math.round(L.totalMg * 1000) / 1000;
        return `${L.name} · ${L.dose} · ${L.freqLabel} · ~${mgRounded}mg total · ${L.vials}× ${L.vialSize}mg vials`;
      }),
      "",
      "Estimates only — verify with your supplier and clinician.",
    ];
    const text = lines.join("\n");

    let copiedOk = false;
    try {
      await navigator.clipboard.writeText(text);
      copiedOk = true;
    } catch {
      /* ignore */
    }

    if (user?.id && activeProfileId && cycleLines.length > 0 && supabase) {
      const items = cycleLines
        .filter((L) => L.totalMg != null && L.vials != null)
        .map((L) => ({
          name: L.name,
          dose: L.dose,
          frequency: L.freqLabel,
          totalMg: Math.round(L.totalMg * 1000) / 1000,
          vials: L.vials,
          vialSize: L.vialSize,
        }));

      try {
        const { data: inserted } = await supabase
          .from("shopping_lists")
          .insert({
            user_id: user.id,
            profile_id: activeProfileId,
            stack_name: localName.trim() || stackName || "My Stack",
            cycle_weeks: w,
            items,
          })
          .select("id, stack_name, cycle_weeks, items, created_at")
          .maybeSingle();

        if (inserted) {
          setShoppingHistory((prev) => [inserted, ...prev].slice(0, 10));

          const { data: all } = await supabase
            .from("shopping_lists")
            .select("id, created_at")
            .eq("user_id", user.id)
            .eq("profile_id", activeProfileId)
            .order("created_at", { ascending: false });

          if (all && all.length > 10) {
            const toDelete = all.slice(10).map((r) => r.id);
            await supabase.from("shopping_lists").delete().in("id", toDelete);
          }
        }
      } catch {
        /* silent — copy already succeeded */
      }
    }

    return copiedOk;
  };

  const handleCopyShoppingList = async () => {
    const ok = await copyShoppingList();
    if (!ok) return;
    if (copiedResetTimerRef.current != null) window.clearTimeout(copiedResetTimerRef.current);
    setCopied(true);
    copiedResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copiedResetTimerRef.current = null;
    }, 1800);
  };

  const sectionCard = {
    border: "1px solid var(--color-border-default)",
    borderRadius: 12,
    background: "var(--color-bg-elevated)",
    padding: 16,
  };

  const builder = (
    <div style={sectionCard}>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.1em", marginBottom: 12 }}>
        COMPOUND BUILDER
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
        STACK NAME
      </div>
      <input
        className="form-input"
        style={{ width: "100%", marginBottom: 14, fontSize: 13 }}
        placeholder="Name your protocol..."
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        aria-label="Stack name"
      />
      <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
        ADD COMPOUND
      </div>
      <div data-tutorial-target={TUTORIAL_TARGET.build_catalog_search}>
        <LibrarySearchInput
          initialValue={searchQ}
          placeholder="Search catalog…"
          onDebouncedChange={setSearchQ}
          style={{ width: "100%", marginBottom: 10 }}
        />
      </div>
      {filteredSearch.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 14,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {filteredSearch.map((p) => {
            const cat0 = primaryCategory(p);
            const inList = rows.some((r) => r.peptideId === p.id);
            return (
              <div
                key={p.id}
                className="build-tab-compound-meta"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border-default)",
                  background: "rgba(7, 9, 14, 0.6)",
                  ...getCategoryCssVars(cat0),
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="brand" style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                    {p.name}
                  </div>
                  <span className="pill pill--category">{cat0}</span>
                </div>
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0, opacity: inList ? 0.45 : 1 }}
                  disabled={inList}
                  onClick={() => addCompound(p)}
                >
                  {inList ? "Added" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.length === 0 ? (
          <div className="mono" style={{ color: "var(--color-text-secondary)", fontSize: 13, padding: "12px 0" }}>
            Add compounds from search above
          </div>
        ) : (
          rows.map((row, idx) => {
            const p = catalogById.get(row.peptideId);
            if (!p) return null;
            const cat0 = primaryCategory(p);
            return (
              <div
                key={row.key}
                className="build-tab-compound-meta"
                style={{
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 10,
                  padding: 12,
                  background: "var(--color-bg-card)",
                  ...getCategoryCssVars(cat0),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="brand" style={{ fontWeight: 700, fontSize: 14 }}>
                      {p.name}
                    </div>
                    <span className="pill pill--category">{cat0}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                    <button
                      type="button"
                      className="form-input"
                      style={{ padding: "4px 8px", fontSize: 12, cursor: "pointer", minWidth: 36 }}
                      aria-label="Move up"
                      onClick={() => moveRow(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="form-input"
                      style={{ padding: "4px 8px", fontSize: 12, cursor: "pointer", minWidth: 36 }}
                      aria-label="Move down"
                      onClick={() => moveRow(idx, 1)}
                      disabled={idx === rows.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn-red"
                      style={{
                        width: CLOSE_SIZES.danger,
                        height: CLOSE_SIZES.danger,
                        minWidth: CLOSE_SIZES.danger,
                        minHeight: CLOSE_SIZES.danger,
                        borderRadius: 6,
                        boxSizing: "border-box",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        fontSize: 16,
                        alignSelf: "center",
                        cursor: "pointer",
                      }}
                      aria-label="Remove"
                      onClick={() => removeRow(row.key)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 4 }}>
                    DOSE
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%", fontSize: 13 }}
                    placeholder="e.g. 250mcg"
                    value={row.dose}
                    onChange={(e) => updateRow(row.key, { dose: e.target.value })}
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 4 }}>
                    FREQUENCY
                  </div>
                  <select
                    className="form-input"
                    style={{ width: "100%", fontSize: 13, cursor: "pointer" }}
                    value={row.freqKey}
                    onChange={(e) => updateRow(row.key, { freqKey: e.target.value })}
                  >
                    {FREQ_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {row.freqKey === "custom" && (
                    <input
                      className="form-input"
                      style={{ width: "100%", fontSize: 13, marginTop: 8 }}
                      placeholder="Injections per week (e.g. 5)"
                      value={row.customPerWeek}
                      onChange={(e) => updateRow(row.key, { customPerWeek: e.target.value })}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isApiWorkerConfigured() && (
        <div
          data-tutorial-target={TUTORIAL_TARGET.atfeh_build_panel}
          {...tutorialHighlightProps(Boolean(tutorial?.isHighlighted(TUTORIAL_TARGET.atfeh_build_panel)))}
          style={{
            marginTop: 16,
            border: "1px solid var(--color-border-emphasis)",
            borderRadius: 12,
            background: "var(--color-bg-elevated)",
            padding: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              gap: 8,
            }}
          >
            <div
              className="brand"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-accent)",
                letterSpacing: "0.04em",
              }}
            >
              <span className="pepv-emoji" aria-hidden>
                🧙{" "}
              </span>
              AI Atfeh
            </div>
            <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)", letterSpacing: "0.12em" }}>
              Pep Guide
            </span>
          </div>
          <div style={{ height: 1, background: "var(--color-accent-subtle-30)", marginBottom: 12 }} />
          {rows.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0 }}>
              Add compounds above to unlock AI Atfeh stack analysis.
            </p>
          ) : stackPicksLoading ? (
            <>
              <div className="pepv-advisor-skeleton" style={{ height: 40, marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
              </div>
            </>
          ) : stackPicksError && !stackPicksData ? (
            <p style={{ fontSize: 13, color: "var(--color-danger)", lineHeight: 1.55, margin: 0 }}>
              {stackPicksError}
            </p>
          ) : stackPicksData ? (
            <>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.55, margin: "0 0 14px" }}>
                {stackPicksData.insight}
              </p>
              {stackPicksData.recommendations.length > 0 ? (
                <>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--color-accent)",
                      marginBottom: 10,
                      letterSpacing: "0.1em",
                    }}
                  >
                    CONSIDER ADDING
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
                    {stackPicksData.recommendations.map((rec) => {
                      const p = catalogById.get(rec.peptideId);
                      if (!p) return null;
                      const cat0 = primaryCategory(p);
                      const tierNorm = normalizeStackTier(rec.tier);
                      return (
                        <div
                          key={rec.peptideId}
                          className="build-tab-compound-meta"
                          style={{
                            position: "relative",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: 10,
                            padding: 12,
                            paddingTop: tierNorm ? 40 : 12,
                            background: "var(--color-bg-card)",
                            ...getCategoryCssVars(cat0),
                          }}
                        >
                          <StackTierBadge tier={rec.tier} />
                          <div style={{ minWidth: 0, paddingRight: tierNorm ? 8 : 0 }}>
                            <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
                              {p.name}
                            </div>
                            <span className="pill pill--category">{cat0}</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                              gap: 12,
                              marginTop: 8,
                            }}
                          >
                            {rec.rationale ? (
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--color-text-secondary)",
                                  lineHeight: 1.5,
                                  flex: "1 1 auto",
                                  minWidth: 0,
                                }}
                              >
                                {rec.rationale}
                              </div>
                            ) : (
                              <div style={{ flex: "1 1 auto" }} />
                            )}
                            {stackPicksUnlocked ? (
                              <button
                                type="button"
                                className="btn-teal"
                                style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0, alignSelf: "flex-end" }}
                                onClick={() => addCompound(p)}
                              >
                                + Add
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {!stackPicksUnlocked ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 10,
                          background: "var(--color-modal-scrim)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 16,
                        }}
                      >
                        <button
                          type="button"
                          className="btn-teal"
                          style={{ fontSize: 13, maxWidth: 300, textAlign: "center" }}
                          onClick={onUpgrade}
                        >
                          Upgrade to Pro for AI recommendations
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      <button
        type="button"
        className={saved ? "btn-teal btn-saved" : "btn-teal"}
        data-tutorial-target={TUTORIAL_TARGET.build_save_stack}
        style={{ width: "100%", marginTop: 16, fontSize: 13, opacity: stackListReady ? 1 : 0.55 }}
        disabled={!stackListReady}
        title={!stackListReady ? "Loading your stack…" : undefined}
        onClick={handleSaveStack}
      >
        {saved ? "✓ Stack Saved!" : "Save Stack"}
      </button>
    </div>
  );

  const calculatorInner = (
    <>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: "0.08em", marginBottom: 12 }}>
        HOW MUCH DO I NEED?
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          CYCLE LENGTH (WEEKS)
        </div>
        <input
          className="form-input"
          type="number"
          min={1}
          step={1}
          style={{ width: "100%", fontSize: 13 }}
          value={cycleWeeks}
          onChange={(e) => setCycleWeeks(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.length === 0 ? (
          <div className="mono" style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Add compounds to calculate</div>
        ) : (
          cycleLines.map((L) => (
            <div
              key={L.key}
              style={{
                border: "1px solid var(--color-border-default)",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <div className="brand" style={{ fontWeight: 600, marginBottom: 6 }}>
                {L.name}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ display: "block" }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>
                    Dose (builder)
                  </span>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4, fontSize: 12 }}
                    value={rows.find((r) => r.key === L.key)?.dose ?? ""}
                    onChange={(e) => updateRow(L.key, { dose: e.target.value })}
                  />
                </label>
                <div>
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>Frequency</span>
                  <div style={{ marginTop: 4 }}>{L.freqLabel}</div>
                </div>
                <label style={{ display: "block" }}>
                  <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>
                    Vial size (mg)
                  </span>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4, fontSize: 12 }}
                    placeholder={`default ${L.defVial}`}
                    value={vialOverrides[L.key] ?? ""}
                    onChange={(e) =>
                      setVialOverrides((o) => ({
                        ...o,
                        [L.key]: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {L.totalMg != null ? (
                    <>
                      ~{Math.round(L.totalMg * 1000) / 1000}mg for cycle
                      {L.vials != null ? (
                        <>
                          {" "}
                          · {L.vials}× {L.vialSize}mg vials
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>Enter a dose with units (e.g. 250mcg, 5mg)</>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {rows.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--color-border-tab)",
            fontSize: 13,
            color: "var(--color-text-primary)",
          }}
        >
          <div className="mono" style={{ fontSize: 11, color: "var(--color-accent)", marginBottom: 8 }}>
            TOTALS
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.55 }}>
            {cycleLines.map((L) => (
              <li key={L.key}>
                {L.name}
                {L.totalMg != null && L.vials != null
                  ? ` · ~${Math.round(L.totalMg * 1000) / 1000}mg · ${L.vials}× ${L.vialSize}mg vials`
                  : " · —"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        className="btn-teal"
        style={{ width: "100%", marginTop: 14, fontSize: 13 }}
        onClick={() => void handleCopyShoppingList()}
        disabled={rows.length === 0}
      >
        {copied ? "✓ Copied!" : "Copy Shopping List"}
      </button>

      {/* ── ORDER HISTORY ────────────────────────────────── */}
      {(shoppingHistory.length > 0 || historyLoading) && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--color-border-tab)", paddingTop: 12 }}>
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "2px 0",
              marginBottom: historyOpen ? 10 : 0,
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
              📋 ORDER HISTORY ({shoppingHistory.length})
            </span>
            <span className="mono" style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>
              {historyOpen ? "▲" : "▼"}
            </span>
          </button>

          {historyOpen &&
            (historyLoading ? (
              <div
                className="pulse"
                style={{ height: 52, borderRadius: 8, background: "rgba(255,255,255,0.04)" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {shoppingHistory.map((entry) => {
                  const date = new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const listText = [
                    `pepguideIQ — cycle shopping list (${entry.cycle_weeks} week${entry.cycle_weeks !== 1 ? "s" : ""})`,
                    "",
                    ...(entry.items ?? []).map(
                      (item) =>
                        `${item.name} · ${item.dose} · ${item.frequency} · ~${item.totalMg}mg total · ${item.vials}× ${item.vialSize}mg vials`
                    ),
                    "",
                    "Estimates only — verify with your supplier and clinician.",
                  ].join("\n");

                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--color-border-tab)",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <span className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {date} · {entry.cycle_weeks}wk
                        </span>
                        <span className="brand" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {entry.stack_name}
                        </span>
                      </div>

                      <ul style={{ margin: "0 0 8px 0", paddingLeft: 14, lineHeight: 1.6 }}>
                        {(entry.items ?? []).map((item, i) => (
                          <li key={i} className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                            {item.name} · {item.vials}× {item.vialSize}mg
                          </li>
                        ))}
                      </ul>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-teal"
                          style={{ fontSize: 11, padding: "4px 10px", minHeight: "unset" }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(listText);
                            } catch {
                              /* ignore */
                            }
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1800);
                          }}
                        >
                          Re-copy
                        </button>

                        {typeof navigator.share === "function" && (
                          <button
                            type="button"
                            className="btn-teal"
                            style={{ fontSize: 11, padding: "4px 10px", minHeight: "unset" }}
                            onClick={() =>
                              navigator
                                .share({ title: `${entry.stack_name} order list`, text: listText })
                                .catch(() => {})
                            }
                          >
                            Share
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-teal"
                          style={{ fontSize: 11, padding: "4px 10px", minHeight: "unset" }}
                          onClick={() => {
                            (entry.items ?? []).forEach((item) => {
                              const compound = catalog.find(
                                (c) => c.name.toLowerCase() === String(item.name ?? "").toLowerCase()
                              );
                              if (compound) addCompound(compound);
                            });
                            document.querySelector(".pepv-main-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          → Load into Builder
                        </button>

                        <button
                          type="button"
                          className="btn-red"
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            minHeight: "unset",
                            marginLeft: "auto",
                          }}
                          onClick={async () => {
                            setShoppingHistory((prev) => prev.filter((e) => e.id !== entry.id));
                            if (supabase) await supabase.from("shopping_lists").delete().eq("id", entry.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </>
  );

  const calculator = wide ? (
    <div style={{ ...sectionCard, position: wide ? "sticky" : undefined, top: wide ? 12 : undefined, alignSelf: "start" }}>
      {calculatorInner}
    </div>
  ) : (
    <div style={sectionCard}>{calculatorInner}</div>
  );

  return (
    <div>
      <div className="brand" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
        BUILD A STACK
      </div>
      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 18, maxWidth: 560, lineHeight: 1.45 }}>
        Plan compounds, dosing, and frequency — then estimate vials for your cycle length.
      </div>

      {wide ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {builder}
          {calculator}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {builder}
          <div>
            <button
              type="button"
              className="form-input"
              onClick={() => setCalcOpen((o) => !o)}
              style={{
                width: "100%",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Outfit', sans-serif",
                color: "var(--color-accent)",
                border: "1px solid var(--color-border-emphasis)",
                background: "var(--color-accent-subtle-10)",
                padding: "12px 14px",
                borderRadius: 10,
                textAlign: "left",
              }}
            >
              <span className="pepv-emoji" aria-hidden>
                📦{" "}
              </span>
              Calculate How Much I Need {calcOpen ? "▼" : "→"}
            </button>
            {calcOpen && <div style={{ marginTop: 12 }}>{calculator}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
