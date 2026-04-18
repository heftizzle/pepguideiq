import { INBODY_SCORE_RING_C, inbodyScoreProgressDash, INBODY_EM } from "../lib/inbodyScanDisplay.js";

/**
 * @param {{ size: number, score: number | null }} props
 */
export function InbodyScoreRing({ size, score }) {
  const c = INBODY_SCORE_RING_C;
  const dash = inbodyScoreProgressDash(score, c);
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden>
        <circle
          cx={36}
          cy={36}
          r={30}
          fill="none"
          stroke="#B5D4F4"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          transform="rotate(-90 36 36)"
        />
        <circle
          cx={36}
          cy={36}
          r={30}
          fill="none"
          stroke="#378ADD"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size <= 38 ? 10 : size <= 48 ? 12 : 14,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--color-text-primary)",
          pointerEvents: "none",
        }}
      >
        {score == null ? INBODY_EM : Math.round(score)}
      </div>
    </div>
  );
}
