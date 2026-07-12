"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GraphPoint } from "@/lib/graph";

const tooltipStyle = {
  background: "var(--color-surface-1)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--color-text-primary)",
};

const commonAxisProps = {
  stroke: "var(--color-border-strong)",
  tick: { fill: "var(--color-text-muted)", fontSize: 10 },
  tickLine: false,
} as const;

/** 気分・疲れ度・残業スコアの3チャートをまとめて描画する */
export function LogTrendCharts({ points }: { points: GraphPoint[] }) {
  return (
    <>
      <MoodChart points={points} />
      <FatigueChart points={points} />
      <OvertimeChart points={points} />
    </>
  );
}

function ChartCard({ title, legend, children }: {
  title: string;
  legend?: { color: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {legend && (
          <div className="flex items-center gap-3">
            {legend.map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs text-fg-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="h-[180px] w-full">{children}</div>
    </div>
  );
}

function MoodChart({ points }: { points: GraphPoint[] }) {
  return (
    <ChartCard
      title="気分"
      legend={[
        { color: "var(--color-primary)", label: "朝" },
        { color: "var(--color-secondary)", label: "仕事終わり" },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
          <YAxis domain={[-5, 5]} ticks={[-5, 0, 5]} {...commonAxisProps} />
          <ReferenceLine y={0} stroke="var(--color-border-strong)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="mood_morning"
            name="朝"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="mood_after_work"
            name="仕事終わり"
            stroke="var(--color-secondary)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function FatigueChart({ points }: { points: GraphPoint[] }) {
  return (
    <ChartCard title="疲れ度">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
          <YAxis domain={[1, 5]} ticks={[1, 3, 5]} {...commonAxisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="fatigue"
            name="疲れ度"
            stroke="var(--color-fatigue-4)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function OvertimeChart({ points }: { points: GraphPoint[] }) {
  return (
    <ChartCard title="残業スコア">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
          <YAxis domain={[0, 5]} ticks={[0, 5]} {...commonAxisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-2)" }} />
          <Bar dataKey="overtime_score" name="残業スコア" fill="var(--color-danger)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
