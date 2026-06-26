"use client";

import { useState } from "react";

const STANDARD_WORK_MINUTES = 9 * 60;

export type OvertimePreview = {
  minutes: number;
  score: number;
};

export type LogFormFields = {
  date: string;
  is_holiday: boolean;
  mood_morning: number;
  mood_after_work: number | null;
  fatigue: number;
  comment: string;
  work_content: string;
  work_start: string;
  work_end: string;
  gym: boolean;
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

export function calcOvertime(
  work_start: string,
  work_end: string
): OvertimePreview | null {
  if (!work_start || !work_end) return null;
  const minutes = calcOvertimeMinutes(work_start, work_end);
  return { minutes, score: calcOvertimeScore(minutes) };
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FIELDS: LogFormFields = {
  date: todayString(),
  is_holiday: false,
  mood_morning: 0,
  mood_after_work: null,
  fatigue: 3,
  comment: "",
  work_content: "",
  work_start: "",
  work_end: "",
  gym: false,
};

export function useLogForm(initial?: Partial<LogFormFields>) {
  const [fields, setFields] = useState<LogFormFields>({
    ...DEFAULT_FIELDS,
    ...initial,
  });

  function setField<K extends keyof LogFormFields>(
    key: K,
    value: LogFormFields[K]
  ) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "is_holiday" && value === true) {
        next.work_start = "";
        next.work_end = "";
        next.mood_after_work = null;
        next.work_content = "";
      }
      return next;
    });
  }

  const overtimePreview =
    !fields.is_holiday && fields.work_start && fields.work_end
      ? calcOvertime(fields.work_start, fields.work_end)
      : null;

  return { fields, setField, overtimePreview };
}
