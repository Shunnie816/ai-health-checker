const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** 気分値を符号付き文字列にする（例: 3 → "+3", -2 → "-2"） */
export function formatMood(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

/** ISO日付（YYYY-MM-DD）を "YYYY/MM/DD 曜" 形式にする */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${mm}/${dd} ${DAY_LABELS[d.getDay()]}`;
}

/** ローカルタイムの今日を ISO日付（YYYY-MM-DD）で返す */
export function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
