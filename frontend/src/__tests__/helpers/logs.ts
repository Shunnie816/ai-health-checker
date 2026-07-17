import type { LogRecord } from "@/lib/api";

/** テスト用の平日ログレコードを最小限の指定で生成する */
export function makeLogRecord(
  date: string,
  overrides: Partial<LogRecord> = {}
): LogRecord {
  return {
    id: `log-${date}`,
    user_id: "user-1",
    date,
    is_holiday: false,
    mood_morning: 2,
    mood_after_work: 1,
    fatigue: 3,
    comment: null,
    work_content: "APIの実装",
    work_start: "09:00",
    work_end: "18:00",
    gym: false,
    overtime_minutes: 0,
    overtime_score: 0,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}
