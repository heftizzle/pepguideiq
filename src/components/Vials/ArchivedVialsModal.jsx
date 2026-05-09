import { useEffect, useMemo, useState } from "react";
import { PEPTIDES } from "../../data/catalog.js";
import { deleteUserVial, fetchArchivedVialsForProfile, updateUserVial } from "../../lib/supabase.js";
import { formatRelativeTime } from "../../lib/formatTime.js";
import { Modal } from "../Modal.jsx";

/** @param {unknown} pid */
function compoundLabel(pid) {
  const id = typeof pid === "string" ? pid.trim() : "";
  const p = PEPTIDES.find((x) => x && x.id === id);
  const name = typeof p?.name === "string" ? p.name.trim() : "";
  return name || id || "Unknown compound";
}

/** @param {unknown} iso */
function formatDay(iso) {
  if (typeof iso !== "string" || !iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return "—";
  }
}

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   userId: string,
 *   profileId: string,
 *   onChanged?: () => void,
 * }} props
 */
export function ArchivedVialsModal({ isOpen, onClose, userId, profileId, onChanged }) {
  const [rows, setRows] = useState(/** @type {object[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState(/** @type {"newest" | "oldest" | "compound"} */ ("newest"));
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    if (isOpen) setExpanded(new Set());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId || !profileId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchArchivedVialsForProfile(userId, profileId).then(({ vials, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        setError(typeof err.message === "string" ? err.message : "Could not load.");
        setRows([]);
        return;
      }
      setRows(vials ?? []);
      setError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, profileId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const pid = typeof r.peptide_id === "string" ? r.peptide_id : "";
      const lab = typeof r.label === "string" ? r.label : "";
      const cname = compoundLabel(pid).toLowerCase();
      return cname.includes(q) || lab.toLowerCase().includes(q) || pid.toLowerCase().includes(q);
    });
  }, [rows, search]);

  const grouped = useMemo(() => {
    /** @type {Map<string, object[]>} */
    const map = new Map();
    for (const r of filtered) {
      const pid = typeof r.peptide_id === "string" ? r.peptide_id : "";
      const key = pid || "_unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(r);
    }
    const cmpArchived = (a, b) => {
      const ai = typeof a.archived_at === "string" ? Date.parse(a.archived_at) : 0;
      const bi = typeof b.archived_at === "string" ? Date.parse(b.archived_at) : 0;
      const asc = sortMode === "oldest";
      return asc ? ai - bi : bi - ai;
    };
    for (const arr of map.values()) {
      arr.sort(cmpArchived);
    }
    let keys = [...map.keys()];
    if (sortMode === "compound" || sortMode === "newest" || sortMode === "oldest") {
      keys.sort((a, b) => compoundLabel(a).localeCompare(compoundLabel(b), undefined, { sensitivity: "base" }));
    }
    return { map, keys };
  }, [filtered, sortMode]);

  function toggleGroup(peptideKey) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(peptideKey)) next.delete(peptideKey);
      else next.add(peptideKey);
      return next;
    });
  }

  async function unarchive(vialId) {
    const id = typeof vialId === "string" ? vialId.trim() : "";
    if (!id) return;
    const { error: err } = await updateUserVial(id, userId, profileId, { archived_at: null });
    if (err) {
      window.alert(typeof err.message === "string" ? err.message : "Could not unarchive.");
      return;
    }
    setRows((prev) => prev.filter((x) => x?.id !== id));
    onChanged?.();
  }

  async function deleteForever(vialId) {
    const id = typeof vialId === "string" ? vialId.trim() : "";
    if (!id) return;
    if (
      !window.confirm(
        "Permanently delete this vial? Dose history will remain in the calendar but the vial record is gone."
      )
    ) {
      return;
    }
    const { error: err } = await deleteUserVial(id, userId, profileId);
    if (err) {
      window.alert(typeof err.message === "string" ? err.message : "Could not delete.");
      return;
    }
    setRows((prev) => prev.filter((x) => x?.id !== id));
    onChanged?.();
  }

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} label="Archived Vials" maxWidth={640}>
      <div className="brand" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 16 }}>
        Archived Vials
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <input
          type="search"
          className="form-input"
          placeholder="Search compound or label…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px",
            minWidth: 160,
            fontSize: 14,
            background: "var(--color-bg-hover)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-default)",
          }}
        />
        <label className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
          Sort
          <select
            className="form-input"
            value={sortMode}
            onChange={(e) => setSortMode(/** @type {'newest'|'oldest'|'compound'} */ (e.target.value))}
            style={{ fontSize: 13, background: "var(--color-bg-hover)", color: "var(--color-text-primary)", border: "1px solid var(--color-border-default)" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="compound">By compound</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Loading…
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: "var(--color-danger)" }}>{error}</div>
      ) : grouped.keys.length === 0 ? (
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", padding: "12px 0" }}>No archived vials.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "62vh", overflowY: "auto" }}>
          {grouped.keys.map((pk) => {
            const list = grouped.map.get(pk) ?? [];
            const open = expanded.has(pk);
            const title = compoundLabel(pk);
            return (
              <div
                key={pk}
                style={{
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--color-bg-page)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(pk)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "10px 12px",
                    border: "none",
                    background: "var(--color-bg-hover)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>{title}</span>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    ({list.length}) {open ? "▼" : "▶"}
                  </span>
                </button>
                {open ? (
                  <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {list.map((v) => {
                      const id = typeof v.id === "string" ? v.id : "";
                      const lab = typeof v.label === "string" ? v.label : "Vial";
                      const arch = typeof v.archived_at === "string" ? v.archived_at : "";
                      const recon = typeof v.reconstituted_at === "string" ? v.reconstituted_at : "";
                      const st = typeof v.status === "string" ? v.status : "";
                      return (
                        <div
                          key={id || `${pk}-${lab}`}
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            border: "1px solid var(--color-border-default)",
                            background: "var(--color-bg-card)",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{lab}</div>
                          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6, lineHeight: 1.45 }}>
                            Archived {arch ? formatRelativeTime(arch) : "—"}
                          </div>
                          <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 10 }}>
                            Reconstituted {formatDay(recon)} · {st ? String(st) : "—"}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <button
                              type="button"
                              title="Unarchive returns this vial to your active list. It will not be reshared to Network — you can share it again from the Vial Tracker."
                              onClick={() => void unarchive(id)}
                              style={{
                                fontSize: 12,
                                padding: "6px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--color-border-default)",
                                background: "transparent",
                                color: "var(--color-text-primary)",
                                cursor: "pointer",
                              }}
                            >
                              Unarchive
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteForever(id)}
                              style={{
                                fontSize: 12,
                                padding: "6px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--color-danger)",
                                background: "var(--color-danger-soft-bg)",
                                color: "var(--color-danger)",
                                cursor: "pointer",
                              }}
                            >
                              Delete permanently
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
