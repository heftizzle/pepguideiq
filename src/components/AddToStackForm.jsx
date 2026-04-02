import { useEffect, useState } from "react";

export function AddToStackForm({ peptide, onCancel, onSave }) {
  const [dose, setDose] = useState(() => peptide.startDose ?? "");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setDose(peptide.startDose ?? "");
    setFrequency("");
    setNotes("");
  }, [peptide.id]);

  return (
    <>
      <div className="brand" style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Add to Saved Stack</div>
      <div className="mono" style={{ fontSize: 10, color: "#a0a0b0", marginBottom: 18 }}>{peptide.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>DOSE</div>
          <input className="form-input" value={dose} placeholder={peptide.startDose} onChange={(e) => setDose(e.target.value)} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>FREQUENCY</div>
          <input
            className="form-input"
            value={frequency}
            placeholder="e.g. Daily, 2x/week, Pre-sleep"
            onChange={(e) => setFrequency(e.target.value)}
          />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 9, color: "#00d4aa", marginBottom: 5, letterSpacing: ".12em" }}>NOTES</div>
          <input className="form-input" value={notes} placeholder="Optional notes…" onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn-red" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-teal" onClick={() => onSave({ dose, frequency, notes })}>Save to Stack</button>
      </div>
    </>
  );
}
