const emotionMap: Record<number, string> = {
  [-5]: "var(--color-emotion-n5)",
  [-4]: "var(--color-emotion-n4)",
  [-3]: "var(--color-emotion-n3)",
  [-2]: "var(--color-emotion-n2)",
  [-1]: "var(--color-emotion-n1)",
  [0]:  "var(--color-emotion-0)",
  [1]:  "var(--color-emotion-p1)",
  [2]:  "var(--color-emotion-p2)",
  [3]:  "var(--color-emotion-p3)",
  [4]:  "var(--color-emotion-p4)",
  [5]:  "var(--color-emotion-p5)",
};

export function getEmotionColor(v: number): string {
  return emotionMap[v] ?? "var(--color-emotion-0)";
}

export function getFatigueColor(v: number): string {
  return `var(--color-fatigue-${Math.max(1, Math.min(5, v))})`;
}

export function getOvertimeColor(score: number | null): string {
  if (score === null) return "var(--color-text-muted)";
  if (score >= 3) return "var(--color-danger)";
  if (score >= 1) return "var(--color-emotion-n2)";
  return "var(--color-primary)";
}

export function formatMood(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${mm}/${dd} ${days[d.getDay()]}`;
}
