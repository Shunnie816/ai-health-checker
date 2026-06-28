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
      <div className="relative flex h-9 items-center">
        <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div style={{ width: pct, background: color }} className="absolute left-0 h-full" />
        </div>
        <div
          className="pointer-events-none absolute z-10 h-[22px] w-[22px] rounded-full border-[2.5px] border-white shadow-md"
          style={{ left: pct, transform: "translateX(-50%)", background: color }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {(minLabel !== undefined || maxLabel !== undefined) && (
        <div className="mt-1.5 flex justify-between">
          <span className="text-[11px] text-[var(--color-text-muted)]">{minLabel}</span>
          {midLabel !== undefined && (
            <span className="text-[11px] text-[var(--color-text-muted)]">{midLabel}</span>
          )}
          <span className="text-[11px] text-[var(--color-text-muted)]">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
