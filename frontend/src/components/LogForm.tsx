"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLogForm, LogFormFields } from "@/hooks/useLogForm";
import { createLog, updateLog, deleteLog, LogRecord } from "@/lib/api";
import { ColoredSlider } from "@/components/ColoredSlider";
import { getEmotionColor, getFatigueColor, getOvertimeColor, formatMood } from "@/lib/colors";

type Props = {
  existingLog?: LogRecord;
};

function toNullableStr(v: string): string | null {
  return v.trim() === "" ? null : v.trim();
}

export function LogForm({ existingLog }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const moodColor = getEmotionColor(fields.mood_morning);
  const wemColor = getEmotionColor(fields.mood_after_work ?? 0);
  const fatigueColor = getFatigueColor(fields.fatigue);
  const overtimeColor = getOvertimeColor(overtimePreview?.score ?? null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        date: fields.date,
        is_holiday: fields.is_holiday,
        mood_morning: fields.mood_morning,
        mood_after_work: fields.is_holiday ? null : (fields.mood_after_work ?? 0),
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

  async function handleDelete() {
    if (!existingLog) return;
    try {
      await deleteLog(existingLog.id);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--color-bg)", position: "relative" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 1,
        background: "var(--color-bg)", padding: "14px 20px 12px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", gap: "10px", flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-primary)", fontSize: "15px", fontFamily: "inherit",
            padding: 0, display: "flex", alignItems: "center", gap: "3px", fontWeight: 500,
          }}
        >
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M7 1.5L1.5 6.5L7 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          戻る
        </button>
        <span style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {existingLog ? "詳細・編集" : "新規記録"}
        </span>
        {existingLog && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: "var(--color-danger)",
              fontSize: "14px", fontFamily: "inherit", fontWeight: 500, padding: 0,
            }}
          >
            削除
          </button>
        )}
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} style={{ padding: "14px 16px 40px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {error && (
          <p style={{ fontSize: "14px", color: "var(--color-danger)", padding: "10px 14px", background: "var(--color-danger-subtle)", borderRadius: "10px" }}>
            {error}
          </p>
        )}

        {/* Date + Holiday */}
        <Card>
          <Row label="日付">
            <input
              type="date"
              value={fields.date}
              onChange={(e) => setField("date", e.target.value)}
              required
              style={inputStyle}
            />
          </Row>
          <Divider />
          <Row label="休日">
            <Toggle checked={fields.is_holiday} onChange={(v) => setField("is_holiday", v)} />
          </Row>
        </Card>

        {/* Morning mood */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={labelStyle}>朝の気分</span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: moodColor, letterSpacing: "-0.5px" }}>
              {formatMood(fields.mood_morning)}
            </span>
          </div>
          <ColoredSlider min={-5} max={5} value={fields.mood_morning} onChange={(v) => setField("mood_morning", v)} color={moodColor} minLabel="−5" maxLabel="+5" midLabel="0" />
        </Card>

        {/* Work fields */}
        {!fields.is_holiday && (
          <>
            {/* Work time + overtime */}
            <Card>
              <Row label="開始">
                <input type="time" value={fields.work_start} onChange={(e) => setField("work_start", e.target.value)} required={!fields.is_holiday} style={inputStyle} />
              </Row>
              <Divider />
              <Row label="終了">
                <input type="time" value={fields.work_end} onChange={(e) => setField("work_end", e.target.value)} required={!fields.is_holiday} style={inputStyle} />
              </Row>
              <Divider />
              <Row label="残業スコア">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "19px", fontWeight: 600, color: overtimeColor, letterSpacing: "-0.4px" }}>
                    {overtimePreview ? overtimePreview.score : "—"}
                  </span>
                  <span style={{
                    fontSize: "10px", color: "var(--color-text-muted)",
                    background: "var(--color-surface-2)", padding: "2px 7px",
                    borderRadius: "999px", fontWeight: 500,
                  }}>
                    自動
                  </span>
                </div>
              </Row>
            </Card>
          </>
        )}

        {/* Fatigue */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={labelStyle}>疲れ度</span>
            <span style={{ fontSize: "22px", fontWeight: 600, color: fatigueColor }}>
              {fields.fatigue}
            </span>
          </div>
          <ColoredSlider min={1} max={5} value={fields.fatigue} onChange={(v) => setField("fatigue", v)} color={fatigueColor} minLabel="1 快適" maxLabel="5 疲弊" />
        </Card>

        {/* Work-end mood + work content */}
        {!fields.is_holiday && (
          <>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={labelStyle}>仕事終わりの気分</span>
                <span style={{ fontSize: "22px", fontWeight: 600, color: wemColor, letterSpacing: "-0.5px" }}>
                  {formatMood(fields.mood_after_work ?? 0)}
                </span>
              </div>
              <ColoredSlider min={-5} max={5} value={fields.mood_after_work ?? 0} onChange={(v) => setField("mood_after_work", v)} color={wemColor} minLabel="−5" maxLabel="+5" midLabel="0" />
            </Card>

            <Card>
              <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>仕事内容</label>
              <textarea
                value={fields.work_content}
                onChange={(e) => setField("work_content", e.target.value)}
                placeholder="今日の業務内容…"
                style={textareaStyle}
              />
            </Card>
          </>
        )}

        {/* Gym */}
        <Card>
          <Row label="ジムに行った">
            <Toggle checked={fields.gym} onChange={(v) => setField("gym", v)} />
          </Row>
        </Card>

        {/* Comment */}
        <Card>
          <label style={{ ...labelStyle, display: "block", marginBottom: "10px" }}>コメント</label>
          <textarea
            value={fields.comment}
            onChange={(e) => setField("comment", e.target.value)}
            placeholder="今日のメモ…"
            style={textareaStyle}
          />
        </Card>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%", padding: "15px",
            background: submitting ? "var(--color-border)" : "var(--color-primary)",
            color: "white", border: "none", borderRadius: "12px",
            fontSize: "16px", fontWeight: 600, fontFamily: "inherit",
            cursor: submitting ? "not-allowed" : "pointer", letterSpacing: "0.1px",
            marginTop: "4px",
          }}
        >
          {submitting ? "保存中..." : existingLog ? "保存する" : "記録する"}
        </button>
      </form>

      {/* Delete confirmation bottom sheet */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)",
          display: "flex", alignItems: "flex-end", zIndex: 20,
        }}>
          <div style={{
            width: "100%", background: "var(--color-bg)",
            borderRadius: "20px 20px 0 0", padding: "12px 20px 40px",
          }}>
            <div style={{ width: "36px", height: "4px", background: "var(--color-border)", borderRadius: "2px", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
              記録を削除しますか？
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "24px", lineHeight: 1.55 }}>
              この操作は取り消せません。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  width: "100%", padding: "15px",
                  background: "var(--color-danger)", color: "white",
                  border: "none", borderRadius: "12px",
                  fontSize: "16px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                }}
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  width: "100%", padding: "15px",
                  background: "var(--color-surface-1)", color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)", borderRadius: "12px",
                  fontSize: "16px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-surface-1)", borderRadius: "12px",
      border: "1px solid var(--color-border)", padding: "16px",
    }}>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--color-border)", margin: "0 -16px", marginTop: "14px", marginBottom: "14px" }} />;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "48px", height: "28px", borderRadius: "999px",
        background: checked ? "var(--color-primary)" : "var(--color-border)",
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: checked ? "23px" : "3px",
        width: "22px", height: "22px",
        background: "white", borderRadius: "50%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "left 0.18s",
      }} />
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────── */

const labelStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--color-text-secondary)",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--color-text-primary)",
  border: "none",
  background: "transparent",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "right",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  fontSize: "14px",
  color: "var(--color-text-primary)",
  border: "none",
  background: "transparent",
  fontFamily: "inherit",
  resize: "none",
  outline: "none",
  minHeight: "72px",
  lineHeight: 1.65,
};
