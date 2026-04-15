import { useEffect, useState } from "react";
import { fastTypeLabel } from "../data/fastTypes.js";
import {
  computeFastProgressState,
  formatElapsedDuration,
  formatTargetSummary,
} from "../lib/memberFasts.js";

/**
 * Live-updating public view of an active fast (only rendered when API includes `public_fast`).
 * @param {{ publicFast: { fast_type: string, started_at: string, target_hours: number } }} props
 */
export function PublicProfileFastingBlock({ publicFast }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!publicFast || typeof publicFast.started_at !== "string") return null;

  void tick;
  const prog = computeFastProgressState(publicFast.started_at, publicFast.target_hours, Date.now());

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 14,
        borderRadius: 12,
        border: "1px solid #243040",
        background: "rgba(0,212,170,0.06)",
      }}
    >
      <div className="mono" style={{ fontSize: 10, color: "#00d4aa", marginBottom: 8, letterSpacing: "0.1em" }}>
        ACTIVE FAST
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>
        {fastTypeLabel(publicFast.fast_type)}
      </div>
      <div className="mono" style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
        Elapsed <span style={{ color: "#00d4aa" }}>{formatElapsedDuration(prog.elapsedMs)}</span>
        <span style={{ color: "#5c6d82" }}> · </span>
        Target {formatTargetSummary(publicFast.target_hours)}
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "#1e2a38", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${prog.progressPct}%`,
            borderRadius: 999,
            background: prog.overTarget ? "#f59e0b" : "#00d4aa",
            transition: "width 0.35s ease",
          }}
        />
      </div>
      <div className="mono" style={{ fontSize: 10, color: "#6b7c8f", marginTop: 6 }}>
        {prog.progressPct.toFixed(1)}% of goal
        {prog.overTarget ? " · past target" : ""}
      </div>
    </div>
  );
}
