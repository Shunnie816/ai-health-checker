export type GraphSourceLog = {
  date: string;
  mood_morning: number;
  mood_after_work: number | null;
  fatigue: number | null;
  overtime_score: number | null;
};

export type GraphPoint = GraphSourceLog & {
  /** X軸表示用ラベル (M/D) */
  label: string;
};

export type Period = "30d" | "90d" | "all";

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "30d", label: "30日" },
  { value: "90d", label: "90日" },
  { value: "all", label: "全期間" },
];

const PERIOD_DAYS: Record<Exclude<Period, "all">, number> = {
  "30d": 30,
  "90d": 90,
};

function cutoffDate(period: Exclude<Period, "all">, today: string): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - (PERIOD_DAYS[period] - 1));
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function toLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * ログを日付昇順のグラフ用データに変換する。
 * period が "30d"/"90d" の場合は today を含む直近N日分に絞り込む。
 */
export function toGraphPoints(
  logs: GraphSourceLog[],
  period: Period,
  today: string
): GraphPoint[] {
  const filtered =
    period === "all"
      ? logs
      : logs.filter((log) => log.date >= cutoffDate(period, today));
  return [...filtered]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({ ...log, label: toLabel(log.date) }));
}
