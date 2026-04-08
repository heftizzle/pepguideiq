import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCategoryCssVars } from "../data/catalog.js";
// Worker: set `VITE_API_WORKER_URL` (e.g. https://pepguideiq-api-proxy.pepguideiq.workers.dev).
import { API_WORKER_URL, isApiWorkerConfigured } from "../lib/config.js";
import { hasAccess } from "../lib/tiers.js";
import { LibrarySearchInput } from "./LibrarySearchInput.jsx";
import { DEFAULT_STACK_SESSIONS } from "./SavedStackEntryRow.jsx";

const MAX_ADVISOR_CATALOG = 153;

/** @param {{ mechanism?: string, typicalDose?: string }} p */
function oneSentenceBrief(p) {
  const m = typeof p.mechanism === "string" ? p.mechanism.trim() : "";
  if (m) {
    const first = m.split(/(?<=[.!?])\s+/)[0]?.trim() || m;
    return first.length > 160 ? `${first.slice(0, 157)}…` : first;
  }
  const t = typeof p.typicalDose === "string" ? p.typicalDose.trim() : "";
  return t.length > 120 ? `${t.slice(0, 117)}…` : t || "Research peptide.";
}

/**
 * @param {object[]} catalog
 * @param {(p: object) => string} primaryCategoryFn
 */
function buildAdvisorCatalogPayload(catalog, primaryCategoryFn) {
  return catalog.slice(0, MAX_ADVISOR_CATALOG).map((p) => ({
    id: p.id,
    name: p.name,
    category: primaryCategoryFn(p),
    brief: oneSentenceBrief(p),
  }));
}

const FREQ_OPTIONS = [
  { id: "daily", label: "Daily" },
  { id: "eod", label: "EOD" },
  { id: "3x", label: "3x/week" },
  { id: "2x", label: "2x/week" },
  { id: "weekly", label: "Weekly" },
  { id: "custom", label: "Custom" },
];

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

function parseFreqFromStack(stackFrequency) {
  const s = String(stackFrequency || "").trim().toLowerCase();
  if (!s) return { freqKey: "daily", customPerWeek: "" };
  const cm = s.match(/^(\d+(?:\.\d+)?)\s*x\/?\s*week/i);
  if (cm) return { freqKey: "custom", customPerWeek: cm[1] };
  if (/eod|every other/.test(s)) return { freqKey: "eod", customPerWeek: "" };
  if (/3\s*x|three times/.test(s)) return { freqKey: "3x", customPerWeek: "" };
  if (/2\s*x|twice/.test(s)) return { freqKey: "2x", customPerWeek: "" };
  if (/weekly|once a week/.test(s)) return { freqKey: "weekly", customPerWeek: "" };
  if (/daily|every day|qd\b/.test(s)) return { freqKey: "daily", customPerWeek: "" };
  return { freqKey: "daily", customPerWeek: "" };
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
  savedStackLimit,
  onUpgrade,
  primaryCategory,
  userPlan = "entry",
}) {
  const wide = useWideLayout();
  const [calcOpen, setCalcOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchInputKey, setSearchInputKey] = useState(0);
  const [localName, setLocalName] = useState(stackName);
  const [rows, setRows] = useState([]);
  const [vialOverrides, setVialOverrides] = useState(/** @type {Record<string, string>} */ ({}));
  const [cycleWeeks, setCycleWeeks] = useState(8);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const savedResetTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const copiedResetTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const prevTabRef = useRef(activeTab);

  const [advisorData, setAdvisorData] = useState(
    /** @type {{ insight: string, recommendations: { catalogId: string, name: string, rationale: string }[] } | null} */ (null)
  );
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const advisorDebounce = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const advisorFetchGen = useRef(0);

  const advisorRecsUnlocked = hasAccess(userPlan, "pro");

  useEffect(() => {
    return () => {
      if (savedResetTimerRef.current != null) clearTimeout(savedResetTimerRef.current);
      if (copiedResetTimerRef.current != null) clearTimeout(copiedResetTimerRef.current);
    };
  }, []);

  const catalogById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  useEffect(() => {
    if (rows.length === 0) {
      setAdvisorData(null);
      setAdvisorLoading(false);
      if (advisorDebounce.current != null) {
        window.clearTimeout(advisorDebounce.current);
        advisorDebounce.current = null;
      }
      return;
    }
    if (!isApiWorkerConfigured()) {
      setAdvisorData(null);
      setAdvisorLoading(false);
      return;
    }

    const myId = ++advisorFetchGen.current;
    setAdvisorLoading(true);

    if (advisorDebounce.current != null) window.clearTimeout(advisorDebounce.current);
    advisorDebounce.current = window.setTimeout(() => {
      void (async () => {
        try {
          const currentStack = rows
            .map((row) => {
              const p = catalogById.get(row.peptideId);
              return p ? { id: p.id, name: p.name, category: primaryCategory(p) } : null;
            })
            .filter(Boolean);
          const compactCatalog = buildAdvisorCatalogPayload(catalog, primaryCategory);

          const res = await fetch(`${API_WORKER_URL}/ai-stack-advisor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentStack, catalog: compactCatalog }),
          });

          if (myId !== advisorFetchGen.current) return;

          const data = await res.json().catch(() => ({}));
          if (myId !== advisorFetchGen.current) return;

          if (!data || typeof data !== "object") {
            setAdvisorData(null);
            return;
          }
          const insightRaw = typeof data.insight === "string" ? data.insight : "";
          const rowIds = new Set(rows.map((r) => r.peptideId));
          let recs = Array.isArray(data.recommendations) ? data.recommendations : [];
          recs = recs.filter(
            (r) =>
              r &&
              typeof r.catalogId === "string" &&
              !rowIds.has(r.catalogId.trim()) &&
              catalogById.has(r.catalogId.trim())
          );
          recs = recs.slice(0, 3).map((r) => ({
            catalogId: String(r.catalogId).trim(),
            name: typeof r.name === "string" ? r.name.trim() : String(r.catalogId).trim(),
            rationale: typeof r.rationale === "string" ? r.rationale.trim() : "",
          }));
          const insightTrim = insightRaw.trim();
          if (insightTrim || recs.length) {
            setAdvisorData({ insight: insightTrim, recommendations: recs });
          } else {
            setAdvisorData(null);
          }
        } catch {
          if (myId === advisorFetchGen.current) setAdvisorData(null);
        } finally {
          if (myId === advisorFetchGen.current) setAdvisorLoading(false);
        }
      })();
    }, 900);

    return () => {
      if (advisorDebounce.current != null) {
        window.clearTimeout(advisorDebounce.current);
        advisorDebounce.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce keyed on `rows` only per spec; catalogById/catalog read from latest closure
  }, [rows]);

  useEffect(() => {
    if (activeTab === "build" && prevTabRef.current !== "build") {
      setLocalName(stackName);
      setRows(
        myStack.map((item) => {
          const freq = parseFreqFromStack(item.stackFrequency);
          return {
            key: item.stackRowKey ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random())),
            peptideId: item.id,
            dose: item.stackDose ?? item.startDose ?? "",
            freqKey: freq.freqKey,
            customPerWeek: freq.customPerWeek,
            addedDate: item.addedDate,
          };
        })
      );
      setVialOverrides({});
    }
    prevTabRef.current = activeTab;
  }, [activeTab, myStack, stackName]);

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
      if (rows.length >= savedStackLimit) {
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
      setSearchQ("");
      setSearchInputKey((k) => k + 1);
    },
    [rows, savedStackLimit, onUpgrade]
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
    if (rows.length > savedStackLimit) {
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
      const doseMg = parseDoseToMg(row.dose);
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
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
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
    border: "1px solid #1e2a38",
    borderRadius: 12,
    background: "rgba(14, 21, 32, 0.55)",
    padding: 16,
  };

  const builder = (
    <div style={sectionCard}>
      <div className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: "0.1em", marginBottom: 12 }}>
        COMPOUND BUILDER
      </div>
      <div className="mono" style={{ fontSize: 12, color: "#8fa5bf", marginBottom: 6 }}>
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
      <div className="mono" style={{ fontSize: 12, color: "#8fa5bf", marginBottom: 6 }}>
        ADD COMPOUND
      </div>
      <LibrarySearchInput
        key={searchInputKey}
        placeholder="Search catalog…"
        onDebouncedChange={setSearchQ}
        style={{ width: "100%", marginBottom: 10 }}
      />
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
                  border: "1px solid #14202e",
                  background: "rgba(7, 9, 14, 0.6)",
                  ...getCategoryCssVars(cat0),
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="brand" style={{ fontWeight: 600, fontSize: 13, color: "#dde4ef" }}>
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
          <div className="mono" style={{ color: "#5c6d82", fontSize: 13, padding: "12px 0" }}>
            // Add compounds from search above
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
                  border: "1px solid #14202e",
                  borderRadius: 10,
                  padding: 12,
                  background: "rgba(7, 9, 14, 0.45)",
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
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
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
                      style={{ padding: "4px 10px", fontSize: 13 }}
                      aria-label="Remove"
                      onClick={() => removeRow(row.key)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="mono" style={{ fontSize: 11, color: "#00d4aa", marginBottom: 4 }}>
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
                  <div className="mono" style={{ fontSize: 11, color: "#00d4aa", marginBottom: 4 }}>
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

      {rows.length > 0 && isApiWorkerConfigured() && (advisorLoading || advisorData) && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(0, 255, 200, 0.22)",
            borderRadius: 12,
            background: "rgba(7, 9, 14, 0.78)",
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
                color: "#00ffc8",
                letterSpacing: "0.04em",
              }}
            >
              <span className="pepv-emoji" aria-hidden>
                🤖{" "}
              </span>
              AI STACK ADVISOR
            </div>
            <span className="mono" style={{ fontSize: 10, color: "#5c6d82", letterSpacing: "0.12em" }}>
              BETA
            </span>
          </div>
          <div style={{ height: 1, background: "rgba(0, 255, 200, 0.15)", marginBottom: 12 }} />
          {advisorLoading ? (
            <>
              <div className="pepv-advisor-skeleton" style={{ height: 40, marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
                <div className="pepv-advisor-skeleton" style={{ minHeight: 88 }} />
              </div>
            </>
          ) : advisorData ? (
            <>
              <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.55, margin: "0 0 14px" }}>
                {advisorData.insight}
              </p>
              {advisorData.recommendations.length > 0 ? (
                <>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "#00ffc8",
                      marginBottom: 10,
                      letterSpacing: "0.1em",
                    }}
                  >
                    CONSIDER ADDING
                  </div>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
                    {advisorData.recommendations.map((rec) => {
                      const p = catalogById.get(rec.catalogId);
                      if (!p) return null;
                      const cat0 = primaryCategory(p);
                      return (
                        <div
                          key={rec.catalogId}
                          className="build-tab-compound-meta"
                          style={{
                            border: "1px solid #14202e",
                            borderRadius: 10,
                            padding: 12,
                            background: "rgba(7, 9, 14, 0.5)",
                            ...getCategoryCssVars(cat0),
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div className="brand" style={{ fontWeight: 700, fontSize: 14, color: "#dde4ef" }}>
                                {p.name}
                              </div>
                              <span className="pill pill--category">{cat0}</span>
                            </div>
                            {advisorRecsUnlocked ? (
                              <button
                                type="button"
                                className="btn-teal"
                                style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }}
                                onClick={() => addCompound(p)}
                              >
                                + Add
                              </button>
                            ) : null}
                          </div>
                          {rec.rationale ? (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#8fa5bf",
                                lineHeight: 1.5,
                                marginTop: 8,
                              }}
                            >
                              {rec.rationale}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {!advisorRecsUnlocked ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 10,
                          background: "rgba(7, 9, 14, 0.42)",
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
        style={{ width: "100%", marginTop: 16, fontSize: 13 }}
        onClick={handleSaveStack}
      >
        {saved ? "✓ Stack Saved!" : "Save Stack"}
      </button>
    </div>
  );

  const calculatorInner = (
    <>
      <div className="mono" style={{ fontSize: 13, color: "#00d4aa", letterSpacing: "0.08em", marginBottom: 12 }}>
        HOW MUCH DO I NEED?
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 11, color: "#8fa5bf", marginBottom: 4 }}>
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
          <div className="mono" style={{ color: "#5c6d82", fontSize: 13 }}>// Add compounds to calculate</div>
        ) : (
          cycleLines.map((L) => (
            <div
              key={L.key}
              style={{
                border: "1px solid #14202e",
                borderRadius: 8,
                padding: 10,
                fontSize: 13,
                color: "#cbd5e1",
                lineHeight: 1.5,
              }}
            >
              <div className="brand" style={{ fontWeight: 600, marginBottom: 6 }}>
                {L.name}
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ display: "block" }}>
                  <span className="mono" style={{ fontSize: 10, color: "#6b7c8f" }}>
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
                  <span className="mono" style={{ fontSize: 10, color: "#6b7c8f" }}>Frequency</span>
                  <div style={{ marginTop: 4 }}>{L.freqLabel}</div>
                </div>
                <label style={{ display: "block" }}>
                  <span className="mono" style={{ fontSize: 10, color: "#6b7c8f" }}>
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
                <div className="mono" style={{ fontSize: 12, color: "#8fa5bf" }}>
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
            borderTop: "1px solid #1e2a38",
            fontSize: 13,
            color: "#dde4ef",
          }}
        >
          <div className="mono" style={{ fontSize: 11, color: "#00d4aa", marginBottom: 8 }}>
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
      <div className="mono" style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 18, maxWidth: 560, lineHeight: 1.45 }}>
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
                color: "#00d4aa",
                border: "1px solid #243040",
                background: "rgba(0, 212, 170, 0.08)",
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
