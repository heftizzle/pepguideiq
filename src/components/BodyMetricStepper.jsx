function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function snapToStep(val, min, step) {
  const k = Math.round((val - min) / step);
  const out = min + k * step;
  const dec = (() => {
    const s = String(step);
    const i = s.indexOf(".");
    if (i < 0) return 0;
    return Math.min(4, s.length - i - 1);
  })();
  return Number(out.toFixed(dec));
}

/** Ruler: ticks along range; subsamples when (max-min)/step would exceed ~100 marks. */
function MetricRuler({ min, max, step, value }) {
  const w = 200;
  const h = 16;
  const rng = max - min || 1;
  const v = clamp(Number(value), min, max);
  const pos = ((v - min) / rng) * w;
  const approxSteps = Math.max(1, Math.round(rng / step));
  let stride = 1;
  while (approxSteps / stride > 100) stride += 1;
  const ticks = [];
  for (let k = 0; ; k++) {
    const t = min + k * step * stride;
    if (t > max + step * 1e-6) break;
    ticks.push({ x: ((clamp(t, min, max) - min) / rng) * w, major: k % 5 === 0 });
  }
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: "block", marginTop: 8 }}
      aria-hidden
    >
      {ticks.map((tk, i) => (
        <line
          key={i}
          x1={tk.x}
          y1={h}
          x2={tk.x}
          y2={tk.major ? 2 : h - 6}
          stroke="#00d4aa"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
      ))}
      <line x1={pos} y1={0} x2={pos} y2={h} stroke="#00d4aa" strokeOpacity={1} strokeWidth={1.5} />
    </svg>
  );
}

/**
 * @param {{ value: number, min: number, max: number, step: number, displayText: string, onCommitValue: (n: number) => void }} p
 */
export function BodyMetricStepper({ value, min, max, step, displayText, onCommitValue }) {
  const atMin = value <= min + 1e-8;
  const atMax = value >= max - 1e-8;
  return (
    <div style={{ width: "100%", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, width: "100%" }}>
        <button
          type="button"
          className="pepv-header-action-btn pepv-header-action-btn--icon"
          aria-label="Decrease"
          disabled={atMin}
          onClick={() => onCommitValue(snapToStep(clamp(value - step, min, max), min, step))}
        >
          ◀
        </button>
        <div
          className="mono"
          style={{
            flex: 1,
            textAlign: "center",
            color: "#00d4aa",
            fontSize: 15,
            fontWeight: 600,
            userSelect: "none",
            lineHeight: "36px",
            minWidth: 0,
          }}
        >
          {displayText}
        </div>
        <button
          type="button"
          className="pepv-header-action-btn pepv-header-action-btn--icon"
          aria-label="Increase"
          disabled={atMax}
          onClick={() => onCommitValue(snapToStep(clamp(value + step, min, max), min, step))}
        >
          ▶
        </button>
      </div>
      <MetricRuler min={min} max={max} step={step} value={value} />
    </div>
  );
}
