"use client";

type Props = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  color: string;
  minLabel?: string;
  maxLabel?: string;
  midLabel?: string;
};

export function ColoredSlider({ min, max, value, onChange, color, minLabel, maxLabel, midLabel }: Props) {
  const pct = `${((value - min) / (max - min)) * 100}%`;

  return (
    <div>
      <div style={{ position: "relative", height: "36px", display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "4px",
          background: "var(--color-surface-2)", borderRadius: "999px", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", left: 0, width: pct, height: "100%", background: color }} />
        </div>
        <div style={{
          position: "absolute", left: pct, transform: "translateX(-50%)",
          top: "50%", marginTop: "-11px",
          width: "22px", height: "22px",
          background: color, borderRadius: "50%",
          boxShadow: "0 1px 6px rgba(0,0,0,0.28)",
          pointerEvents: "none", zIndex: 1,
          border: "2.5px solid white",
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "36px",
            opacity: 0, cursor: "pointer", zIndex: 2,
          }}
        />
      </div>
      {(minLabel !== undefined || maxLabel !== undefined) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{minLabel}</span>
          {midLabel !== undefined && (
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{midLabel}</span>
          )}
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
