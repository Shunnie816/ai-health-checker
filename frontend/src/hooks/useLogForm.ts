"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { todayString } from "@/lib/format";
import { logFormSchema, LogFormValues } from "@/lib/schemas/logSchema";

export type { LogFormValues };

const STANDARD_WORK_MINUTES = 9 * 60;

export type OvertimePreview = {
  minutes: number;
  score: number;
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function calcOvertimeMinutes(work_start: string, work_end: string): number {
  return Math.max(0, toMinutes(work_end) - toMinutes(work_start) - STANDARD_WORK_MINUTES);
}

export function calcOvertimeScore(overtime_minutes: number): number {
  if (overtime_minutes === 0) return 0;
  if (overtime_minutes <= 30) return 1;
  if (overtime_minutes <= 60) return 2;
  if (overtime_minutes <= 90) return 3;
  if (overtime_minutes <= 120) return 4;
  return 5;
}

export function calcOvertime(work_start: string, work_end: string): OvertimePreview | null {
  if (!work_start || !work_end) return null;
  const minutes = calcOvertimeMinutes(work_start, work_end);
  return { minutes, score: calcOvertimeScore(minutes) };
}

const DEFAULT_VALUES: LogFormValues = {
  date: todayString(),
  is_holiday: false,
  morning_only: false,
  mood_morning: 0,
  mood_after_work: 0,
  fatigue: 3,
  comment: "",
  work_content: "",
  work_start: "",
  work_end: "",
  gym: false,
};

export function useLogForm(initial?: Partial<LogFormValues>) {
  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initial },
  });

  const { setValue, watch } = form;
  const fields = watch();
  const { is_holiday, work_start, work_end } = fields;

  function setField<K extends keyof LogFormValues>(key: K, value: LogFormValues[K]) {
    if (key === "is_holiday") {
      if (value === true) {
        setValue("work_start", "");
        setValue("work_end", "");
        setValue("mood_after_work", null);
        setValue("work_content", "");
      } else {
        if (form.getValues("mood_after_work") === null) {
          setValue("mood_after_work", 0);
        }
      }
    }
    // 朝のみ→1日分へ切り替えたとき、未入力の夕方項目にデフォルト値を補う
    if (key === "morning_only" && value === false) {
      if (!form.getValues("is_holiday") && form.getValues("mood_after_work") === null) {
        setValue("mood_after_work", 0);
      }
    }
    setValue(key, value as never);
  }

  const overtimePreview =
    !is_holiday && work_start && work_end
      ? calcOvertime(work_start, work_end)
      : null;

  return { form, fields, setField, overtimePreview };
}
