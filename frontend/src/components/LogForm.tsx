"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLogForm, LogFormFields } from "@/hooks/useLogForm";
import { createLog, updateLog, LogRecord } from "@/lib/api";

type Props = {
  existingLog?: LogRecord;
};

const MOOD_OPTIONS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
const FATIGUE_OPTIONS = [1, 2, 3, 4, 5];

function toNullableStr(v: string): string | null {
  return v.trim() === "" ? null : v.trim();
}

export function LogForm({ existingLog }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial: Partial<LogFormFields> | undefined = existingLog
    ? {
        date: existingLog.date,
        is_holiday: existingLog.is_holiday,
        mood_morning: existingLog.mood_morning,
        mood_after_work: existingLog.mood_after_work,
        fatigue: existingLog.fatigue,
        comment: existingLog.comment ?? "",
        work_content: existingLog.work_content ?? "",
        work_start: existingLog.work_start ?? "",
        work_end: existingLog.work_end ?? "",
        gym: existingLog.gym,
      }
    : undefined;

  const { fields, setField, overtimePreview } = useLogForm(initial);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        date: fields.date,
        is_holiday: fields.is_holiday,
        mood_morning: fields.mood_morning,
        mood_after_work: fields.is_holiday ? null : fields.mood_after_work,
        fatigue: fields.fatigue,
        comment: toNullableStr(fields.comment),
        work_content: fields.is_holiday ? null : toNullableStr(fields.work_content),
        work_start: fields.is_holiday ? null : toNullableStr(fields.work_start),
        work_end: fields.is_holiday ? null : toNullableStr(fields.work_end),
        gym: fields.gym,
      };

      if (existingLog) {
        await updateLog(existingLog.id, payload);
      } else {
        await createLog(payload);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1 style={styles.heading}>
        {existingLog ? "ログを編集" : "新しいログを記録"}
      </h1>

      {error && <p style={styles.error}>{error}</p>}

      {/* 日付 */}
      <div style={styles.field}>
        <label style={styles.label}>日付</label>
        <input
          type="date"
          value={fields.date}
          onChange={(e) => setField("date", e.target.value)}
          required
          style={styles.input}
        />
      </div>

      {/* 休日フラグ */}
      <div style={{ ...styles.field, flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input
          id="is_holiday"
          type="checkbox"
          checked={fields.is_holiday}
          onChange={(e) => setField("is_holiday", e.target.checked)}
        />
        <label htmlFor="is_holiday" style={styles.label}>
          休日
        </label>
      </div>

      {/* 朝の気分 */}
      <div style={styles.field}>
        <label style={styles.label}>朝の気分 ({fields.mood_morning})</label>
        <input
          type="range"
          min={-5}
          max={5}
          step={1}
          value={fields.mood_morning}
          onChange={(e) => setField("mood_morning", Number(e.target.value))}
          list="mood-marks"
          style={styles.range}
        />
        <datalist id="mood-marks">
          {MOOD_OPTIONS.map((v) => (
            <option key={v} value={v} label={String(v)} />
          ))}
        </datalist>
        <div style={styles.rangeLabels}>
          <span>-5</span>
          <span>0</span>
          <span>+5</span>
        </div>
      </div>

      {/* 勤務日フィールド */}
      {!fields.is_holiday && (
        <>
          {/* 仕事終わりの気分 */}
          <div style={styles.field}>
            <label style={styles.label}>
              仕事終わりの気分 ({fields.mood_after_work ?? 0})
            </label>
            <input
              type="range"
              min={-5}
              max={5}
              step={1}
              value={fields.mood_after_work ?? 0}
              onChange={(e) =>
                setField("mood_after_work", Number(e.target.value))
              }
              style={styles.range}
            />
            <div style={styles.rangeLabels}>
              <span>-5</span>
              <span>0</span>
              <span>+5</span>
            </div>
          </div>

          {/* 勤務時間 */}
          <div style={styles.field}>
            <label style={styles.label}>勤務時間</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="time"
                value={fields.work_start}
                onChange={(e) => setField("work_start", e.target.value)}
                required={!fields.is_holiday}
                style={styles.input}
              />
              <span>〜</span>
              <input
                type="time"
                value={fields.work_end}
                onChange={(e) => setField("work_end", e.target.value)}
                required={!fields.is_holiday}
                style={styles.input}
              />
            </div>
            {overtimePreview && (
              <p style={styles.overtime}>
                残業：{overtimePreview.minutes} 分 →{" "}
                <strong>スコア {overtimePreview.score}</strong>
              </p>
            )}
          </div>

          {/* 仕事内容 */}
          <div style={styles.field}>
            <label style={styles.label}>仕事内容</label>
            <textarea
              value={fields.work_content}
              onChange={(e) => setField("work_content", e.target.value)}
              rows={2}
              style={styles.textarea}
            />
          </div>
        </>
      )}

      {/* 疲れ度 */}
      <div style={styles.field}>
        <label style={styles.label}>疲れ度</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {FATIGUE_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setField("fatigue", v)}
              style={{
                ...styles.fatigueBtn,
                background: fields.fatigue === v ? "#333" : "#eee",
                color: fields.fatigue === v ? "#fff" : "#333",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ジム */}
      <div style={{ ...styles.field, flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input
          id="gym"
          type="checkbox"
          checked={fields.gym}
          onChange={(e) => setField("gym", e.target.checked)}
        />
        <label htmlFor="gym" style={styles.label}>
          ジムに行った
        </label>
      </div>

      {/* コメント */}
      <div style={styles.field}>
        <label style={styles.label}>コメント</label>
        <textarea
          value={fields.comment}
          onChange={(e) => setField("comment", e.target.value)}
          rows={3}
          placeholder="今日の振り返りなど..."
          style={styles.textarea}
        />
      </div>

      {/* 送信 */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={styles.cancelBtn}
        >
          キャンセル
        </button>
        <button type="submit" disabled={submitting} style={styles.submitBtn}>
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    maxWidth: "480px",
    margin: "2rem auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  heading: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  error: {
    color: "#c00",
    fontSize: "0.875rem",
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  input: {
    padding: "0.375rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  range: {
    width: "100%",
    cursor: "pointer",
  },
  rangeLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: "#666",
  },
  textarea: {
    padding: "0.375rem 0.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
    resize: "vertical" as const,
  },
  overtime: {
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    color: "#555",
  },
  fatigueBtn: {
    width: "2.5rem",
    height: "2.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  submitBtn: {
    flex: 1,
    padding: "0.625rem",
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "0.625rem 1rem",
    background: "#eee",
    color: "#333",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
};
