import { useRef } from "react";

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

/**
 * Ruler ticks + scrub value on drag. When `onScrubModel` is set, pointer drag maps x → viz domain → model (snap).
 * @param {{
 *   vizMin: number,
 *   vizMax: number,
 *   vizStep: number,
 *   modelMin: number,
 *   modelMax: number,
 *   modelStep: number,
 *   value: number,
 *   valueToSlider?: ((v: number) => number) | null,
 *   sliderToValue?: ((n: number) => number) | null,
 *   onScrubModel?: ((model: number) => void) | null,
 * }} p
 */
function MetricRuler({
  vizMin,
  vizMax,
  vizStep,
  modelMin,
  modelMax,
  modelStep,
  value,
  valueToSlider = null,
  sliderToValue = null,
  onScrubModel = null,
}) {
  const svgRef = useRef(null);
  const draggingRef = useRef(false);

  const w = 200;
  const h = onScrubModel ? 22 : 16;
  const rng = vizMax - vizMin || 1;

  const rawVizForIndicator =
    valueToSlider != null ? valueToSlider(value) : clamp(Number(value), vizMin, vizMax);
  const pos = ((clamp(Number(rawVizForIndicator), vizMin, vizMax) - vizMin) / rng) * w;

  const approxSteps = Math.max(1, Math.round(rng / vizStep));
  let stride = 1;
  while (approxSteps / stride > 100) stride += 1;
  const ticks = [];
  for (let k = 0; ; k++) {
    const t = vizMin + k * vizStep * stride;
    if (t > vizMax + vizStep * 1e-6) break;
    ticks.push({ x: ((clamp(t, vizMin, vizMax) - vizMin) / rng) * w, major: k % 5 === 0 });
  }

  const vizToModel = (vizVal) => {
    let m = sliderToValue != null ? sliderToValue(vizVal) : vizVal;
    m = clamp(m, modelMin, modelMax);
    return snapToStep(m, modelMin, modelStep);
  };

  const clientXToViz = (clientX) => {
    const el = svgRef.current;
    if (!el) return vizMin;
    const r = el.getBoundingClientRect();
    const t = clamp((clientX - r.left) / Math.max(r.width, 1e-6), 0, 1);
    return vizMin + t * (vizMax - vizMin);
  };

  const commitScrub = (clientX) => {
    if (!onScrubModel) return;
    const vizRaw = clientXToViz(clientX);
    const vizSnapped = snapToStep(clamp(vizRaw, vizMin, vizMax), vizMin, vizStep);
    onScrubModel(vizToModel(vizSnapped));
  };

  const interactive = Boolean(onScrubModel);
  /** Dial sits on the tick baseline (ticks use y1 = h); center = baseline minus radius. */
  const THUMB_R = 5;
  const thumbCy = h - THUMB_R;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{
        display: "block",
        marginTop: 2,
        touchAction: interactive ? "none" : undefined,
        cursor: interactive ? "ew-resize" : "default",
      }}
      role={interactive ? "slider" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-hidden={!interactive}
      aria-label={interactive ? "Adjust value along ruler" : undefined}
      aria-valuemin={interactive ? vizMin : undefined}
      aria-valuemax={interactive ? vizMax : undefined}
      aria-valuenow={interactive ? clamp(Number(rawVizForIndicator), vizMin, vizMax) : undefined}
      onPointerDown={
        interactive
          ? (e) => {
              draggingRef.current = true;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* ignore */
              }
              commitScrub(e.clientX);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (!draggingRef.current) return;
              commitScrub(e.clientX);
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (e) => {
              draggingRef.current = false;
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* ignore */
              }
            }
          : undefined
      }
      onPointerCancel={
        interactive
          ? () => {
              draggingRef.current = false;
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              const delta =
                e.key === "ArrowLeft" || e.key === "ArrowDown"
                  ? -vizStep
                  : e.key === "ArrowRight" || e.key === "ArrowUp"
                    ? vizStep
                    : 0;
              if (!delta) return;
              e.preventDefault();
              const curViz = snapToStep(
                clamp(valueToSlider != null ? valueToSlider(value) : Number(value), vizMin, vizMax),
                vizMin,
                vizStep
              );
              const nextViz = clamp(curViz + delta, vizMin, vizMax);
              const nextSnapped = snapToStep(nextViz, vizMin, vizStep);
              onScrubModel(vizToModel(nextSnapped));
            }
          : undefined
      }
    >
      <line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke="#14202e" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {ticks.map((tk, i) => (
        <line
          key={i}
          x1={tk.x}
          y1={h}
          x2={tk.x}
          y2={tk.major ? 2 : h - 6}
          stroke="var(--color-accent)"
          strokeOpacity={0.2}
          strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
      ))}
      <line
        x1={pos}
        y1={0}
        x2={pos}
        y2={interactive ? thumbCy : h}
        stroke="var(--color-accent)"
        strokeOpacity={1}
        strokeWidth={1.5}
        style={{ pointerEvents: "none" }}
      />
      {interactive ? (
        <circle
          cx={pos}
          cy={thumbCy}
          r={THUMB_R}
          fill="var(--color-accent)"
          stroke="#00b894"
          strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
      ) : null}
    </svg>
  );
}

/**
 * Optional fast scrub band on the ruler (same viz bounds as previous fastRange).
 * @typedef {{ min: number, max: number, step: number, valueToSlider?: (value: number) => number, sliderToValue?: (sliderN: number) => number }} FastRangeConfig
 */

/**
 * @param {{ value: number, min: number, max: number, step: number, displayText: string, onCommitValue: (n: number) => void, fastRange?: FastRangeConfig | null, locked?: boolean }} p
 */
export function BodyMetricStepper({ value, min, max, step, displayText, onCommitValue, fastRange = null, locked = false }) {
  const atMin = value <= min + 1e-8;
  const atMax = value >= max - 1e-8;

  const vizMin = fastRange ? fastRange.min : min;
  const vizMax = fastRange ? fastRange.max : max;
  const vizStep = fastRange ? fastRange.step : step;

  return (
    <div style={{ width: "100%", marginBottom: 8, position: "relative" }}>
      <div style={{ opacity: locked ? 0.55 : 1 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 10, width: "100%" }}>
        <button
          type="button"
          className="pepv-header-action-btn pepv-header-action-btn--icon"
          aria-label="Decrease"
          disabled={atMin || locked}
          onClick={() => onCommitValue(snapToStep(clamp(value - step, min, max), min, step))}
        >
          ◀
        </button>
        <div
          className="mono"
          style={{
            flex: 1,
            textAlign: "center",
            color: "var(--color-accent)",
            fontSize: 15,
            fontWeight: 600,
            userSelect: "none",
            lineHeight: "32px",
            minWidth: 0,
          }}
        >
          {displayText}
        </div>
        <button
          type="button"
          className="pepv-header-action-btn pepv-header-action-btn--icon"
          aria-label="Increase"
          disabled={atMax || locked}
          onClick={() => onCommitValue(snapToStep(clamp(value + step, min, max), min, step))}
        >
          ▶
        </button>
      </div>
      <MetricRuler
        vizMin={vizMin}
        vizMax={vizMax}
        vizStep={vizStep}
        modelMin={min}
        modelMax={max}
        modelStep={step}
        value={value}
        valueToSlider={fastRange?.valueToSlider ?? null}
        sliderToValue={fastRange?.sliderToValue ?? null}
        onScrubModel={fastRange && !locked ? onCommitValue : null}
      />
      </div>
      {locked ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 4,
            cursor: "not-allowed",
            touchAction: "none",
            background: "transparent",
          }}
        />
      ) : null}
    </div>
  );
}
