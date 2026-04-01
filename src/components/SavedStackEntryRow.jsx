import { useEffect, useState } from "react";

/** Stable list key for a saved stack row (uuid when present, else catalog id). */
export function getStackRowListKey(item) {
  return item.stackRowKey ?? item.id;
}

export function SavedStackEntryRow({ item, catColor, catLabel, onUpdate, onRemove }) {
  const rowKey = getStackRowListKey(item);
  const [dose, setDose] = useState(() => item.stackDose ?? item.startDose ?? "");
  const [frequency, setFrequency] = useState(() => item.stackFrequency ?? "");
  const [notes, setNotes] = useState(() => item.stackNotes ?? "");

  useEffect(() => {
    setDose(item.stackDose ?? item.startDose ?? "");
    setFrequency(item.stackFrequency ?? "");
    setNotes(item.stackNotes ?? "");
  }, [rowKey]);

  const cc = catColor;

  return (
    <div className="scard" style={{ alignItems: "stretch" }}>
      <div style={{ width: 3, minHeight: 44, background: cc, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
          <div>
            <div className="brand" style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
            <div className="mono" style={{ fontSize: 9, color: "#243040", marginTop: 2 }}>{catLabel} · added {item.addedDate}</div>
          </div>
          <button type="button" className="btn-red" onClick={() => onRemove(rowKey)}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <div>
            <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 4, letterSpacing: ".12em" }}>DOSE</div>
            <input
              className="form-input"
              style={{ fontSize: 12 }}
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackDose: dose })}
            />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 4, letterSpacing: ".12em" }}>FREQUENCY</div>
            <input
              className="form-input"
              style={{ fontSize: 12 }}
              value={frequency}
              placeholder="e.g. Daily, 2x/week"
              onChange={(e) => setFrequency(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackFrequency: frequency })}
            />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 4, letterSpacing: ".12em" }}>NOTES</div>
            <textarea
              className="form-input"
              style={{ fontSize: 12, minHeight: 56, resize: "vertical" }}
              value={notes}
              placeholder="Optional notes…"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdate(rowKey, { stackNotes: notes })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
