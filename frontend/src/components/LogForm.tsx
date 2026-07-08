"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogForm, LogFormValues } from "@/hooks/useLogForm";
import { createLog, updateLog, deleteLog, LogRecord } from "@/lib/api";
import { ColoredSlider } from "@/components/ui/colored-slider";
import { Card } from "@/components/ui/card";
import { FormRow, Divider } from "@/components/ui/form-row";
import { Toggle } from "@/components/ui/toggle";
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initial: Partial<LogFormValues> | undefined = existingLog
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

  const { form, fields, setField, overtimePreview } = useLogForm(initial);
  const { formState: { errors } } = form;

  const moodColor = getEmotionColor(fields.mood_morning);
  const wemColor = getEmotionColor(fields.mood_after_work ?? 0);
  const fatigueColor = getFatigueColor(fields.fatigue);
  const overtimeColor = getOvertimeColor(overtimePreview?.score ?? null);

  async function onValid(data: LogFormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        date: data.date,
        is_holiday: data.is_holiday,
        mood_morning: data.mood_morning,
        mood_after_work: data.is_holiday ? null : (data.mood_after_work ?? 0),
        fatigue: data.fatigue,
        comment: toNullableStr(data.comment),
        work_content: data.is_holiday ? null : toNullableStr(data.work_content),
        work_start: data.is_holiday ? null : toNullableStr(data.work_start),
        work_end: data.is_holiday ? null : toNullableStr(data.work_end),
        gym: data.gym,
      };
      if (existingLog) {
        await updateLog(existingLog.id, payload);
      } else {
        await createLog(payload);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "エラーが発生しました");
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
      setApiError(err instanceof Error ? err.message : "削除に失敗しました");
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-bg)]">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-5 pb-3 pt-3.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 p-0 text-[15px] font-medium text-[var(--color-primary)] focus:outline-none"
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path d="M7 1.5L1.5 6.5L7 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          戻る
        </button>
        <span className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          {existingLog ? "詳細・編集" : "新規記録"}
        </span>
        {existingLog && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto p-0 text-sm font-medium text-[var(--color-danger)] focus:outline-none"
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            削除
          </button>
        )}
      </div>

      {/* Form body */}
      <form onSubmit={form.handleSubmit(onValid)} className="flex flex-col gap-2.5 px-4 pb-10 pt-3.5">

        {apiError && (
          <p className="rounded-xl bg-[var(--color-danger-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {apiError}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p className="rounded-xl bg-[var(--color-danger-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
            {Object.values(errors)[0]?.message ?? "入力内容を確認してください"}
          </p>
        )}

        {/* Date + Holiday */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <FormRow label="日付">
            <input
              type="date"
              value={fields.date}
              onChange={(e) => setField("date", e.target.value)}
              required
              className="cursor-pointer bg-transparent py-3.5 text-right text-sm text-[var(--color-text-primary)] outline-none"
              style={{ border: "none", fontFamily: "inherit" }}
            />
          </FormRow>
          <Divider />
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">休日</span>
            <Toggle checked={fields.is_holiday} onChange={(v) => setField("is_holiday", v)} />
          </div>
        </Card>

        {/* Morning mood */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">朝の気分</span>
            <span className="text-[22px] font-semibold tracking-tight" style={{ color: moodColor }}>
              {formatMood(fields.mood_morning)}
            </span>
          </div>
          <ColoredSlider min={-5} max={5} value={fields.mood_morning} onChange={(v) => setField("mood_morning", v)} color={moodColor} minLabel="−5" maxLabel="+5" midLabel="0" />
        </Card>

        {/* Work fields */}
        {!fields.is_holiday && (
          <>
            <Card className="flex flex-col gap-0 p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">開始</span>
                <input type="time" value={fields.work_start} onChange={(e) => setField("work_start", e.target.value)} required={!fields.is_holiday} className="cursor-pointer bg-transparent text-right text-sm text-[var(--color-text-primary)] outline-none" style={{ border: "none", fontFamily: "inherit" }} />
              </div>
              <Divider />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">終了</span>
                <input type="time" value={fields.work_end} onChange={(e) => setField("work_end", e.target.value)} required={!fields.is_holiday} className="cursor-pointer bg-transparent text-right text-sm text-[var(--color-text-primary)] outline-none" style={{ border: "none", fontFamily: "inherit" }} />
              </div>
              <Divider />
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">残業スコア</span>
                <div className="flex items-center gap-2">
                  <span className="text-[19px] font-semibold tracking-tight" style={{ color: overtimeColor }}>
                    {overtimePreview ? overtimePreview.score : "—"}
                  </span>
                  <span className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                    自動
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Fatigue */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">疲れ度</span>
            <span className="text-[22px] font-semibold" style={{ color: fatigueColor }}>
              {fields.fatigue}
            </span>
          </div>
          <ColoredSlider min={1} max={5} value={fields.fatigue} onChange={(v) => setField("fatigue", v)} color={fatigueColor} minLabel="1 快適" maxLabel="5 疲弊" />
        </Card>

        {/* Work-end mood + work content */}
        {!fields.is_holiday && (
          <>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">仕事終わりの気分</span>
                <span className="text-[22px] font-semibold tracking-tight" style={{ color: wemColor }}>
                  {formatMood(fields.mood_after_work ?? 0)}
                </span>
              </div>
              <ColoredSlider min={-5} max={5} value={fields.mood_after_work ?? 0} onChange={(v) => setField("mood_after_work", v)} color={wemColor} minLabel="−5" maxLabel="+5" midLabel="0" />
            </Card>

            <Card>
              <label className="mb-2.5 block text-sm font-medium text-[var(--color-text-secondary)]">仕事内容</label>
              <textarea
                value={fields.work_content}
                onChange={(e) => setField("work_content", e.target.value)}
                placeholder="今日の業務内容…"
                className="min-h-[72px] w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                style={{ border: "none", fontFamily: "inherit" }}
              />
            </Card>
          </>
        )}

        {/* Gym */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">ジムに行った</span>
            <Toggle checked={fields.gym} onChange={(v) => setField("gym", v)} />
          </div>
        </Card>

        {/* Comment */}
        <Card>
          <label className="mb-2.5 block text-sm font-medium text-[var(--color-text-secondary)]">コメント</label>
          <textarea
            value={fields.comment}
            onChange={(e) => setField("comment", e.target.value)}
            placeholder="今日のメモ…"
            className="min-h-[72px] w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            style={{ border: "none", fontFamily: "inherit" }}
          />
        </Card>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-xl py-[15px] text-base font-semibold text-white transition-opacity disabled:opacity-50"
          style={{
            background: "var(--color-primary)",
            border: "none", cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "inherit", letterSpacing: "0.1px",
          }}
        >
          {submitting ? "保存中..." : existingLog ? "保存する" : "記録する"}
        </button>
      </form>

      {/* Delete confirmation bottom sheet */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-20 flex items-end" style={{ background: "rgba(0,0,0,0.42)" }}>
          <div className="w-full rounded-t-[20px] bg-[var(--color-bg)] px-5 pb-10 pt-3">
            <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-[var(--color-border)]" />
            <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-text-primary)]">
              記録を削除しますか？
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
              この操作は取り消せません。
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full rounded-xl py-[15px] text-base font-semibold text-white"
                style={{ background: "var(--color-danger)", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] py-[15px] text-base font-medium text-[var(--color-text-primary)]"
                style={{ cursor: "pointer", fontFamily: "inherit" }}
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
