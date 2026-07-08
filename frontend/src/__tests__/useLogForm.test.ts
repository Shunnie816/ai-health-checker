import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  calcOvertime,
  calcOvertimeMinutes,
  calcOvertimeScore,
  useLogForm,
} from "@/hooks/useLogForm";
import { logFormSchema } from "@/lib/schemas/logSchema";

// ─── 残業計算ロジック ──────────────────────────────────────

describe("calcOvertimeMinutes", () => {
  it("should return 0 when work hours equal standard hours", () => {
    expect(calcOvertimeMinutes("09:00", "18:00")).toBe(0);
  });

  it("should return overtime minutes beyond 9 hours", () => {
    expect(calcOvertimeMinutes("09:00", "19:30")).toBe(90);
  });

  it("should clamp to 0 when work hours are less than standard", () => {
    expect(calcOvertimeMinutes("09:00", "17:00")).toBe(0);
  });
});

describe("calcOvertimeScore", () => {
  it.each([
    [0, 0],
    [30, 1],
    [60, 2],
    [90, 3],
    [120, 4],
    [121, 5],
  ])("should return score %i for %i overtime minutes", (minutes, expected) => {
    expect(calcOvertimeScore(minutes)).toBe(expected);
  });
});

describe("calcOvertime", () => {
  it("should return null when work_start is empty", () => {
    expect(calcOvertime("", "18:00")).toBeNull();
  });

  it("should return null when work_end is empty", () => {
    expect(calcOvertime("09:00", "")).toBeNull();
  });

  it("should return overtime preview with minutes and score", () => {
    const result = calcOvertime("09:00", "19:30");
    expect(result).toEqual({ minutes: 90, score: 3 });
  });
});

// ─── バリデーションスキーマ ────────────────────────────────

const validWeekdayBase = {
  date: "2026-06-26",
  is_holiday: false,
  mood_morning: 0,
  mood_after_work: 1,
  fatigue: 3,
  comment: "",
  work_content: "",
  work_start: "09:00",
  work_end: "18:00",
  gym: false,
};

const validHolidayBase = {
  ...validWeekdayBase,
  is_holiday: true,
  work_start: "",
  work_end: "",
  mood_after_work: null,
  work_content: "",
};

describe("logFormSchema — 平日バリデーション", () => {
  it("should pass validation for a valid weekday entry", () => {
    expect(logFormSchema.safeParse(validWeekdayBase).success).toBe(true);
  });

  it("should fail when work_start is missing on a weekday", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, work_start: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("work_start");
    }
  });

  it("should fail when work_end is missing on a weekday", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, work_end: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("work_end");
    }
  });

  it("should fail when mood_after_work is null on a weekday", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, mood_after_work: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("mood_after_work");
    }
  });

  it("should fail when date is empty", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, date: "" });
    expect(result.success).toBe(false);
  });

  it("should fail when mood_morning is out of range", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, mood_morning: 6 });
    expect(result.success).toBe(false);
  });

  it("should fail when fatigue is out of range", () => {
    const result = logFormSchema.safeParse({ ...validWeekdayBase, fatigue: 0 });
    expect(result.success).toBe(false);
  });
});

describe("logFormSchema — 休日バリデーション", () => {
  it("should pass validation for a valid holiday entry", () => {
    expect(logFormSchema.safeParse(validHolidayBase).success).toBe(true);
  });

  it("should pass validation on holiday even without work fields", () => {
    const result = logFormSchema.safeParse({ ...validHolidayBase, work_start: "", work_end: "" });
    expect(result.success).toBe(true);
  });
});

// ─── useLogForm フック挙動 ────────────────────────────────

describe("useLogForm", () => {
  it("should initialize with today's date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { result } = renderHook(() => useLogForm());
    expect(result.current.fields.date).toBe(today);
  });

  it("should compute overtime preview from work times", () => {
    const { result } = renderHook(() =>
      useLogForm({ work_start: "09:00", work_end: "19:30" })
    );
    expect(result.current.overtimePreview).toEqual({ minutes: 90, score: 3 });
  });

  it("should return null overtime preview when is_holiday is true", () => {
    const { result } = renderHook(() =>
      useLogForm({ is_holiday: true, work_start: "09:00", work_end: "19:30" })
    );
    expect(result.current.overtimePreview).toBeNull();
  });

  it("should clear work fields when switching to holiday mode", () => {
    const mockInitial = {
      is_holiday: false,
      work_start: "09:00",
      work_end: "18:00",
      mood_after_work: 2 as const,
      work_content: "設計作業",
    };
    const { result } = renderHook(() => useLogForm(mockInitial));

    act(() => {
      result.current.setField("is_holiday", true);
    });

    const { fields } = result.current;
    expect(fields.work_start).toBe("");
    expect(fields.work_end).toBe("");
    expect(fields.mood_after_work).toBeNull();
    expect(fields.work_content).toBe("");
  });

  it("should update field value via setField", () => {
    const { result } = renderHook(() => useLogForm());

    act(() => {
      result.current.setField("fatigue", 5);
    });

    expect(result.current.fields.fatigue).toBe(5);
  });
});
