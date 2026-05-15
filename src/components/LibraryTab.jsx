import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PEPTIDES, getCategoryCssVars } from "../data/catalog.js";
import {
  matchesCategory,
  primaryCategory,
  peptideMatchesRouteFilter,
} from "../lib/catalogHelpers.js";
import {
  BIOAVAILABILITY_WARN_TOOLTIP,
  resolvePeptideBioavailability,
  shouldShowBioavailabilityOnLibraryCard,
} from "../lib/peptideBioavailability.js";
import { normalizeFinnrickProductUrl } from "../lib/finnrickUrl.js";
import { formatLibraryCardHalfLifeDisplay } from "../lib/libraryCardHalfLifeDisplay.js";
import { Modal } from "./Modal.jsx";
import { AddToStackForm } from "./AddToStackForm.jsx";
import { TUTORIAL_TARGET, tutorialHighlightProps } from "../context/TutorialContext.jsx";

const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "category", label: "Category" },
];

/** Route-of-administration filter keys; one active at a time, stacks with category + search. */
const ROUTE_FILTERS = [
  { id: "injectable", label: "💉 Injectable" },
  { id: "intranasal", label: "👃 Intranasal" },
  { id: "oral", label: "💊 Oral" },
  { id: "topical", label: "🧴 Topical" },
];

/** Library filter pills — chrome matches bottom nav buttons (App.jsx nav: inactive / active). */
const LIBRARY_FILTER_PILL_BASE = {
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  borderRadius: 12,
  border: "1px solid var(--color-border-default)",
  background: "var(--color-bg-hover)",
  boxShadow: "none",
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 500,
  letterSpacing: "0.06em",
  lineHeight: 1.15,
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
};

const LIBRARY_FILTER_PILL_ACTIVE = {
  border: "1px solid var(--color-accent-nav-border)",
  background: "var(--color-accent-nav-fill)",
  boxShadow: "0 0 0 1px var(--color-accent-nav-ring), 0 0 10px color-mix(in srgb, var(--color-accent) 20%, transparent)",
  color: "var(--color-accent)",
};

/** Display-only short names on filter pills + pcard badges; filter `selCat` / CSS still use full data strings. */
const CATEGORY_SHORT = {
  "Khavinson Bioregulators": "Bioregulators",
  "Anabolics / HRT": "HRT / TRT",
  "GLP / Metabolic": "GLP",
  "Diabetes Management": "Diabetes",
  "Healing / Recovery": "Healing",
  "Anti-Inflammatory": "Anti-Inflam",
  "Skin / Hair / Nails": "Skin",
  Bronchodilator: "Broncho",
  "Testosterone Support": "Test Support",
};

/** @param {string | { label: string; value: string }} cat */
function libraryCategoryEntry(cat) {
  const value = typeof cat === "string" ? cat : cat.value;
  const label = CATEGORY_SHORT[value] ?? (typeof cat === "object" && cat.label ? cat.label : value);
  return { label, value };
}

/** Library category pills — two horizontal scroll rows (order is intentional). */
const LIBRARY_CATEGORY_ROW_1 = [
  "All",
  "Foundational",
  "Anabolics / HRT",
  "Sexual Health",
  "GH Peptides",
  "Sleep",
  "Healing",
  "Cardiovascular",
  "Longevity",
  "Nootropic",
  "Immune",
  "Adaptogen",
  "Performance",
];

const LIBRARY_CATEGORY_ROW_2 = [
  "GLP / Metabolic",
  { label: "Diabetes", value: "Diabetes Management" },
  "Skin / Hair / Nails",
  "Mitochondrial",
  "Estrogen Control",
  "Testosterone Support",
  "Thyroid Support",
  "SARMs",
  "Khavinson Bioregulators",
  "Vitamin",
];

const LIBRARY_CAT_SCROLL_OUTER = {
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  touchAction: "pan-x",
  overscrollBehaviorX: "contain",
};

const LIBRARY_CAT_SCROLL_INNER = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  alignItems: "center",
  gap: 6,
  width: "max-content",
};

const LIBRARY_CAT_CHEV_BTN = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.6)",
  color: "var(--color-accent)",
  fontSize: 16,
  lineHeight: 1,
  cursor: "pointer",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

/**
 * @param {{ cats: (string | { label: string; value: string })[]; selCat: string; onSelect: (cat: string) => void; marginBottom: number }} props
 */
function LibraryCategoryPillScrollRow({ cats, selCat, onSelect, marginBottom }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateChevrons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 2);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useLayoutEffect(() => {
    updateChevrons();
  }, [updateChevrons, cats]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateChevrons();
    const onScroll = () => updateChevrons();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateChevrons);
    const ro = new ResizeObserver(updateChevrons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateChevrons);
      ro.disconnect();
    };
  }, [updateChevrons]);

  return (
    <div style={{ position: "relative", marginBottom, width: "100%", minWidth: 0 }}>
      <div
        ref={scrollRef}
        className="pepv-library-cat-scroll"
        style={{ ...LIBRARY_CAT_SCROLL_OUTER, marginBottom: 0 }}
      >
        <div style={LIBRARY_CAT_SCROLL_INNER}>
          {cats.map((cat) => {
            const { label, value } = libraryCategoryEntry(cat);
            return (
              <button
                type="button"
                key={value}
                onClick={() => onSelect(value)}
                style={{
                  ...LIBRARY_FILTER_PILL_BASE,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  ...(selCat === value ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      {showLeft ? (
        <button
          type="button"
          className="pepv-library-cat-chev"
          aria-label="Scroll categories left"
          onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
          style={{ ...LIBRARY_CAT_CHEV_BTN, left: 0 }}
        >
          ‹
        </button>
      ) : null}
      {showRight ? (
        <button
          type="button"
          className="pepv-library-cat-chev"
          aria-label="Scroll categories right"
          onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
          style={{ ...LIBRARY_CAT_CHEV_BTN, right: 0 }}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}

/** Parent row for a variant (`variantOf` id), if present in the catalog. */
function getVariantParent(peptide) {
  if (!peptide?.variantOf) return null;
  return PEPTIDES.find((q) => q.id === peptide.variantOf) ?? null;
}

/**
 * @param {object} props
 * @param {boolean} props.showLibraryGrid — when false, only compound / add modals render (chunk stays loaded).
 */
export default function LibraryTab({
  showLibraryGrid,
  selCat,
  onCategorySelect,
  routeFilter,
  setRouteFilter,
  sortMode,
  setSortMode,
  search,
  selPeptide,
  setSelPeptide,
  showAdd,
  setShowAdd,
  addTarget,
  setAddTarget,
  openAdd,
  confirmAdd,
  myStack,
  stackListReady,
  openUpgradeModal,
  canAI,
  setActiveTab,
  setAiInput,
  variantNoteExpandedById,
  setVariantNoteExpandedById,
  isHighlighted,
}) {
  const filtered = useMemo(
    () =>
      PEPTIDES.filter((p) => {
        const mc = matchesCategory(p, selCat);
        const mr = peptideMatchesRouteFilter(p, routeFilter);
        const ms =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
          p.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
        return mc && mr && ms;
      }),
    [selCat, routeFilter, search]
  );

  const sortedPeptides = useMemo(() => {
    const base = [...filtered];
    const rankOf = (p) =>
      typeof p.popularityRank === "number" && Number.isFinite(p.popularityRank) ? p.popularityRank : 999;
    switch (sortMode) {
      case "popular":
        return base.sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name));
      case "az":
        return base.sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return base.sort((a, b) => b.name.localeCompare(a.name));
      case "category":
        return base.sort((a, b) => {
          const catA = primaryCategory(a) || "";
          const catB = primaryCategory(b) || "";
          return catA.localeCompare(catB) || a.name.localeCompare(b.name);
        });
      default:
        return base.sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name));
    }
  }, [filtered, sortMode]);

  return (
    <>
      {showLibraryGrid ? (
        <div style={{ width: "100%", minWidth: 0 }}>
          <LibraryCategoryPillScrollRow
            cats={LIBRARY_CATEGORY_ROW_1}
            selCat={selCat}
            onSelect={onCategorySelect}
            marginBottom={6}
          />
          <LibraryCategoryPillScrollRow
            cats={LIBRARY_CATEGORY_ROW_2}
            selCat={selCat}
            onSelect={onCategorySelect}
            marginBottom={search.trim() !== "" ? 8 : 12}
          />
          {search.trim() !== "" && (
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--color-text-placeholder)",
                marginBottom: 12,
                letterSpacing: "0.04em",
              }}
            >
              Showing {sortedPeptides.length} results for &quot;{search.trim()}&quot;
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                color: "var(--color-text-inverse)",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                letterSpacing: "0.06em",
              }}
            >
              Sort
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortMode(opt.value)}
                  style={{
                    ...LIBRARY_FILTER_PILL_BASE,
                    ...(sortMode === opt.value ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {ROUTE_FILTERS.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRouteFilter((prev) => (prev === r.id ? null : r.id))}
                  style={{
                    ...LIBRARY_FILTER_PILL_BASE,
                    ...(routeFilter === r.id ? LIBRARY_FILTER_PILL_ACTIVE : {}),
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))",
              gap: 14,
              width: "100%",
              minWidth: 0,
            }}
          >
            {sortedPeptides.map((p, cardIdx) => {
              const cat0 = primaryCategory(p);
              const categoryBadgeLabel = CATEGORY_SHORT[cat0] ?? cat0;
              const inStack = myStack.some((s) => s.id === p.id);
              const finnrickHref = normalizeFinnrickProductUrl(p.finnrickUrl);
              const halfLifeDisplay = formatLibraryCardHalfLifeDisplay(p.halfLife);
              return (
                <div
                  key={p.id}
                  className="pcard pcard--library"
                  data-testid="compound-card"
                  style={getCategoryCssVars(cat0)}
                  onClick={() => setSelPeptide(p)}
                  onKeyDown={(e) => e.key === "Enter" && setSelPeptide(p)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 8,
                      minWidth: 0,
                    }}
                  >
                    <div className="pcard-head-main">
                      <div
                        className="brand"
                        style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}
                      >
                        {p.name}
                      </div>
                      {p.variantOf && (
                        <div>
                          <div
                            className="mono"
                            title={
                              typeof p.variantNote === "string" && p.variantNote.trim()
                                ? p.variantNote
                                : undefined
                            }
                            onClick={
                              typeof p.variantNote === "string" && p.variantNote.trim()
                                ? (e) => {
                                    e.stopPropagation();
                                    setVariantNoteExpandedById((prev) => ({
                                      ...prev,
                                      [p.id]: !prev[p.id],
                                    }));
                                  }
                                : undefined
                            }
                            style={{
                              fontSize: 13,
                              opacity: 0.65,
                              color: "var(--color-text-secondary)",
                              marginTop: 3,
                              lineHeight: 1.35,
                              fontWeight: 400,
                              WebkitTapHighlightColor: "transparent",
                              ...(typeof p.variantNote === "string" && p.variantNote.trim()
                                ? { cursor: "pointer" }
                                : {}),
                            }}
                          >
                            Variant of: {getVariantParent(p)?.name ?? p.variantOf}
                          </div>
                          {variantNoteExpandedById[p.id] &&
                            typeof p.variantNote === "string" &&
                            p.variantNote.trim() && (
                              <div
                                className="mono"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  fontSize: 13,
                                  opacity: 0.8,
                                  color: "var(--color-text-secondary)",
                                  marginTop: 4,
                                  lineHeight: 1.45,
                                }}
                              >
                                {p.variantNote}
                              </div>
                            )}
                        </div>
                      )}
                      {p.aliases[0] && (
                        <div
                          className="mono"
                          style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginTop: 1 }}
                        >
                          {p.aliases[0]}
                        </div>
                      )}
                    </div>
                    <span className="pill pill--category">{categoryBadgeLabel}</span>
                  </div>
                  <div
                    className="pcard-summary"
                    style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 8, lineHeight: 1.55 }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span>{children}</span> }}>
                      {p.mechanism}
                    </ReactMarkdown>
                  </div>
                  {shouldShowBioavailabilityOnLibraryCard(p) ? (
                    <>
                      {(() => {
                        const ba = resolvePeptideBioavailability(p);
                        if (!ba) return null;
                        return (
                          <div
                            className="mono pcard-bioavail"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: 13,
                              color: ba.warn ? "var(--color-warning)" : "var(--color-text-secondary)",
                              marginBottom: 8,
                              lineHeight: 1.45,
                            }}
                            title={ba.warn ? BIOAVAILABILITY_WARN_TOOLTIP : undefined}
                          >
                            {ba.warn ? <span className="pepv-emoji" aria-hidden>⚠ </span> : null}
                            <span
                              style={{
                                color: ba.warn ? "var(--color-warning)" : "var(--color-text-secondary)",
                              }}
                            >
                              Bioavailability:{" "}
                            </span>
                            {ba.text}
                          </div>
                        );
                      })()}
                      {typeof p.bioavailabilityNote === "string" && p.bioavailabilityNote.trim() !== "" && (
                        <div
                          className="mono pcard-bioavail-warn"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 8, lineHeight: 1.45 }}
                        >
                          ⚠ {p.bioavailabilityNote}
                        </div>
                      )}
                    </>
                  ) : null}
                  <div
                    className="pcard-footer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="mono pcard-halflife"
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        flex: "1 1 auto",
                        minWidth: 0,
                      }}
                    >
                      <span style={{ color: "color-mix(in srgb, var(--cc, var(--color-accent)) 50%, transparent)" }}>
                        Half-life:
                      </span>{" "}
                      {halfLifeDisplay ?? ""}
                    </div>
                    <button
                      type="button"
                      className={inStack ? "btn-green" : "btn-teal"}
                      style={{
                        padding: "5px 10px",
                        fontSize: 13,
                        opacity: inStack ? 1 : !stackListReady ? 0.55 : 1,
                        flexShrink: 0,
                      }}
                      data-tutorial-target={cardIdx === 0 ? TUTORIAL_TARGET.library_add_stack : undefined}
                      {...tutorialHighlightProps(cardIdx === 0 && isHighlighted(TUTORIAL_TARGET.library_add_stack))}
                      disabled={!inStack && !stackListReady}
                      title={!inStack && !stackListReady ? "Loading your stack…" : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!inStack && stackListReady) openAdd(p);
                      }}
                    >
                      {inStack ? "✓ Added to Stack" : "+ Add to Stack"}
                    </button>
                  </div>
                  {finnrickHref ? (
                    <a
                      href={finnrickHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      style={{
                        display: "block",
                        marginTop: 10,
                        fontSize: 12,
                        color: "var(--color-accent)",
                        textDecoration: "none",
                        letterSpacing: "0.02em",
                        lineHeight: 1.35,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Verified by Finnrick ↗
                    </a>
                  ) : null}
                </div>
              );
            })}
            {sortedPeptides.length === 0 && (
              <div
                className="mono"
                style={{ color: "var(--color-text-placeholder)", fontSize: 13, padding: "40px 0", gridColumn: "1/-1" }}
              >
                No results
              </div>
            )}
          </div>
        </div>
      ) : null}

      {selPeptide &&
        (() => {
          const p = selPeptide;
          const pCat = primaryCategory(p);
          const inStack = myStack.some((s) => s.id === p.id);
          const baDetail = resolvePeptideBioavailability(p);
          return (
            <Modal
              onClose={() => setSelPeptide(null)}
              label={p.name}
              header={
                <div
                  className="pepv-peptide-modal-head"
                  data-testid="compound-detail"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    ...getCategoryCssVars(pCat),
                  }}
                >
                  <div>
                    <div className="brand" style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)" }}>
                      {p.name}
                    </div>
                    {p.variantOf && (
                      <div
                        className="mono"
                        title={
                          typeof p.variantNote === "string" && p.variantNote.trim() ? p.variantNote : undefined
                        }
                        style={{
                          fontSize: 13,
                          opacity: 0.65,
                          color: "var(--color-text-secondary)",
                          marginTop: 4,
                          lineHeight: 1.4,
                          fontWeight: 400,
                          ...(p.variantNote ? { cursor: "help" } : {}),
                        }}
                      >
                        Variant of: {getVariantParent(p)?.name ?? p.variantOf}
                      </div>
                    )}
                    <div className="mono" style={{ fontSize: 13, color: "var(--color-text-placeholder)", marginTop: 3 }}>
                      {p.aliases.join(" · ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill pill--category">{pCat}</span>
                  </div>
                </div>
              }
            >
              {[
                ["Typical Dose", p.typicalDose],
                ["Start Dose", p.startDose],
                ["Titration", p.titrationNote],
                ["Half-life", p.halfLife],
                ...(typeof p.form === "string" && p.form.trim() ? [["Form", p.form.trim()]] : []),
                ...(typeof p.unit === "string" && p.unit.trim() ? [["Unit", p.unit.trim()]] : []),
                ["Route", p.route.join(", ")],
                ["Cycle", p.cycle],
                ["Storage", p.storage],
                ["Reconstitution", p.reconstitution],
              ].map(([l, v]) => (
                <div key={l} className="drow">
                  <span className="dlabel">{l}</span>
                  <span className="dval mono">{v}</span>
                </div>
              ))}
              {baDetail && (
                <div
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: baDetail.warn ? "var(--color-warning)" : "var(--color-text-secondary)",
                    marginTop: 12,
                    marginBottom: 12,
                    lineHeight: 1.45,
                  }}
                  title={baDetail.warn ? BIOAVAILABILITY_WARN_TOOLTIP : undefined}
                >
                  {baDetail.warn ? <span className="pepv-emoji" aria-hidden>⚠ </span> : null}
                  <span style={{ color: baDetail.warn ? "var(--color-warning)" : "var(--color-text-secondary)" }}>
                    Bioavailability:{" "}
                  </span>
                  {baDetail.text}
                </div>
              )}
              {typeof p.bioavailabilityNote === "string" && p.bioavailabilityNote.trim() !== "" && (
                <div
                  className="mono"
                  style={{ fontSize: 13, color: "var(--color-warning)", marginBottom: 12, lineHeight: 1.45 }}
                >
                  ⚠ {p.bioavailabilityNote}
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--color-accent)", letterSpacing: ".12em", marginBottom: 7 }}>
                  BENEFITS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {p.benefits.map((b) => (
                    <span
                      key={b}
                      className="pill"
                      style={{
                        padding: "1px 5px",
                        background: "var(--color-accent-subtle-0e)",
                        color: "var(--color-accent-subtle-50)",
                        border: "1px solid var(--color-accent-subtle-18)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 8,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderTop: "1px solid var(--color-border-hairline)",
                  borderBottom: "1px solid var(--color-border-hairline)",
                  background: "transparent",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  className="btn-teal"
                  style={{ fontSize: 13 }}
                  data-tutorial-target={TUTORIAL_TARGET.atfeh_compound_cta}
                  {...tutorialHighlightProps(isHighlighted(TUTORIAL_TARGET.atfeh_compound_cta))}
                  onClick={() => {
                    if (!canAI) {
                      openUpgradeModal("ai_guide");
                      return;
                    }
                    setSelPeptide(null);
                    setAiInput(`Deep dive on ${p.name}: optimal protocol, titration, stacking strategy, and advanced use cases`);
                    setActiveTab("guide");
                  }}
                >
                  Ask AI Atfeh →
                </button>
                <button
                  type="button"
                  className={inStack ? "btn-green" : "btn-teal"}
                  style={{ fontSize: 13, opacity: inStack ? 1 : !stackListReady ? 0.55 : 1 }}
                  disabled={!inStack && !stackListReady}
                  title={!inStack && !stackListReady ? "Loading your stack…" : undefined}
                  onClick={() => {
                    if (!inStack && stackListReady) {
                      openAdd(p);
                      setSelPeptide(null);
                    }
                  }}
                >
                  {inStack ? "✓ Saved" : "+ Add to Saved Stack"}
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--color-warning)", letterSpacing: ".12em", marginBottom: 7 }}>
                  SIDE EFFECTS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {p.sideEffects.map((s) => (
                    <span
                      key={s}
                      className="pill"
                      style={{ padding: "1px 5px", background: "#f59e0b0e", color: "#f59e0b70", border: "1px solid #f59e0b18" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {p.stacksWith.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="mono" style={{ fontSize: 13, color: "#8b5cf6", letterSpacing: ".12em", marginBottom: 7 }}>
                    STACKS WELL WITH
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {p.stacksWith.map((s) => (
                      <span
                        key={s}
                        className="pill"
                        style={{ padding: "1px 5px", background: "#8b5cf60e", color: "#8b5cf670", border: "1px solid #8b5cf618" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div
                style={{
                  ...getCategoryCssVars(pCat),
                  borderLeft: "3px solid var(--cc)",
                  paddingLeft: 12,
                  marginTop: 12,
                  marginBottom: 14,
                  fontSize: 13,
                  color: "var(--color-text-placeholder)",
                  lineHeight: 1.6,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span>{children}</span> }}>
                  {p.mechanism}
                </ReactMarkdown>
              </div>
              {p.notes && (
                <div
                  style={{
                    marginTop: 12,
                    background: "var(--color-bg-page)",
                    border: "1px solid var(--color-border-hairline)",
                    borderRadius: 6,
                    padding: 12,
                  }}
                >
                  <div className="mono" style={{ fontSize: 13, color: "#c8c8d4", marginBottom: 5, letterSpacing: ".15em" }}>
                    NOTES
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-placeholder)", lineHeight: 1.65 }}>{p.notes}</div>
                </div>
              )}
              {typeof p.sourcingNotes === "string" && p.sourcingNotes.trim() !== "" && (
                <div
                  style={{
                    marginTop: 12,
                    background: "var(--color-bg-page)",
                    border: "1px solid var(--color-border-hairline)",
                    borderRadius: 6,
                    padding: 12,
                  }}
                >
                  <div className="mono" style={{ fontSize: 13, color: "#c8c8d4", marginBottom: 5, letterSpacing: ".15em" }}>
                    SOURCING NOTES
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-placeholder)", lineHeight: 1.65 }}>{p.sourcingNotes}</div>
                </div>
              )}
            </Modal>
          );
        })()}

      {showAdd && addTarget && (
        <Modal
          onClose={() => {
            setShowAdd(false);
            setAddTarget(null);
          }}
          maxWidth={380}
          label="Add to Saved Stack"
        >
          <AddToStackForm
            peptide={addTarget}
            onCancel={() => {
              setShowAdd(false);
              setAddTarget(null);
            }}
            onSave={confirmAdd}
          />
        </Modal>
      )}
    </>
  );
}
